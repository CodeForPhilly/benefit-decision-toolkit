package org.prestoncabe.api;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.eclipse.microprofile.openapi.OASFactory;
import org.eclipse.microprofile.openapi.OASFilter;
import org.eclipse.microprofile.openapi.models.OpenAPI;
import org.eclipse.microprofile.openapi.models.Operation;
import org.eclipse.microprofile.openapi.models.PathItem;
import org.eclipse.microprofile.openapi.models.examples.Example;
import org.eclipse.microprofile.openapi.models.media.Content;
import org.eclipse.microprofile.openapi.models.media.MediaType;
import org.eclipse.microprofile.openapi.models.media.Schema;
import org.eclipse.microprofile.openapi.models.parameters.RequestBody;
import org.eclipse.microprofile.openapi.models.responses.APIResponse;
import org.eclipse.microprofile.openapi.models.responses.APIResponses;

import javax.enterprise.inject.spi.CDI;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.logging.Logger;

/**
 * OpenAPI filter that dynamically generates individual endpoints for each DMN model.
 * This creates specific paths like /api/v1/checks/age/PersonMinAge instead of a single
 * parameterized path, making the API more discoverable and providing proper type examples.
 *
 * Note: This is registered via mp.openapi.filter in application.properties, not as a CDI bean.
 */
public class DynamicDMNOpenAPIFilter implements OASFilter {
    private static final Logger LOG = Logger.getLogger(DynamicDMNOpenAPIFilter.class.getName());
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private ModelRegistry modelRegistry;
    private DMNSchemaResolver schemaResolver;

    @Override
    public void filterOpenAPI(OpenAPI openAPI) {
        LOG.info("Filtering OpenAPI spec to add individual DMN decision service endpoints");

        // Get dependencies from CDI since this is not a CDI bean
        if (modelRegistry == null) {
            modelRegistry = CDI.current().select(ModelRegistry.class).get();
        }
        if (schemaResolver == null) {
            schemaResolver = CDI.current().select(DMNSchemaResolver.class).get();
        }

        // Ensure components exist
        if (openAPI.getComponents() == null) {
            openAPI.setComponents(OASFactory.createComponents());
        }

        // Get all discovered DMN models
        Map<String, ModelInfo> allModels = modelRegistry.getAllModels();
        LOG.info("Discovered " + allModels.size() + " DMN models");

        // Filter to only models that expose {ModelName}Service
        Map<String, ModelInfo> exposedModels = new java.util.LinkedHashMap<>();
        for (ModelInfo model : allModels.values()) {
            String expectedServiceName = model.getModelName() + "Service";
            if (model.getDecisionServices().contains(expectedServiceName)) {
                exposedModels.put(model.getModelName(), model);
            } else {
                LOG.fine("Skipping model " + model.getModelName() +
                        " - does not have expected service: " + expectedServiceName +
                        " (has: " + model.getDecisionServices() + ")");
            }
        }

        LOG.info("Generating OpenAPI paths for " + exposedModels.size() + " DMN models with {ModelName}Service");

        // Add all DMN schemas from dmnDefinitions.json to OpenAPI components (only for exposed models)
        addDMNSchemas(openAPI, exposedModels);

        // Remove the generic parameterized path if it exists
        if (openAPI.getPaths() != null) {
            openAPI.getPaths().removePathItem("/api/v1/{path}");
        }

        // Add individual paths for each exposed model
        for (ModelInfo model : exposedModels.values()) {
            addPathForModel(openAPI, model);
        }

        LOG.info("OpenAPI spec filtering complete. Total paths: " +
                 (openAPI.getPaths() != null ? openAPI.getPaths().getPathItems().size() : 0));
    }

    /**
     * Add only the DMN schemas that are actually used by the API endpoints.
     * This keeps the schema list clean by excluding internal wrapper types.
     */
    private void addDMNSchemas(OpenAPI openAPI, Map<String, ModelInfo> exposedModels) {
        Set<String> usedSchemas = new HashSet<>();

        // Collect all schema keys that will be referenced by endpoints
        for (ModelInfo model : exposedModels.values()) {
            // We know all exposed models have {ModelName}Service
            String serviceName = model.getModelName() + "Service";

            String inputRef = schemaResolver.findInputSchemaRef(model.getModelName(), serviceName);
            String outputRef = schemaResolver.findOutputSchemaRef(model.getModelName(), serviceName);

            if (inputRef != null) {
                collectReferencedSchemas(inputRef, usedSchemas);
            }
            if (outputRef != null) {
                collectReferencedSchemas(outputRef, usedSchemas);
            }
        }

        // Add all the used schemas (including wrapper types that are referenced)
        int addedCount = 0;
        for (String schemaKey : usedSchemas) {
            com.fasterxml.jackson.databind.JsonNode schemaNode = schemaResolver.getSchema(schemaKey);
            if (schemaNode != null) {
                Schema schema = convertJsonNodeToSchema(schemaNode);
                openAPI.getComponents().addSchema(schemaKey, schema);
                addedCount++;
            }
        }

        LOG.info("Added " + addedCount + " DMN schemas to OpenAPI components (only actually referenced schemas)");
    }

    /**
     * Recursively collect all schemas referenced by the given schema.
     */
    private void collectReferencedSchemas(String schemaRef, Set<String> collectedSchemas) {
        if (schemaRef == null) {
            return;
        }

        // Extract schema key from reference
        String schemaKey = null;
        if (schemaRef.startsWith("#/components/schemas/")) {
            schemaKey = schemaRef.substring("#/components/schemas/".length());
        } else if (schemaRef.startsWith("#/definitions/")) {
            schemaKey = schemaRef.substring("#/definitions/".length());
        }

        if (schemaKey == null || collectedSchemas.contains(schemaKey)) {
            return; // Already processed or invalid
        }

        collectedSchemas.add(schemaKey);

        // Get the schema and find any nested references
        com.fasterxml.jackson.databind.JsonNode schemaNode = schemaResolver.getSchema(schemaKey);
        if (schemaNode != null) {
            collectReferencesFromNode(schemaNode, collectedSchemas);
        }
    }

    /**
     * Recursively find all $ref references in a JSON node.
     */
    private void collectReferencesFromNode(com.fasterxml.jackson.databind.JsonNode node, Set<String> collectedSchemas) {
        if (node.isObject()) {
            // Check for $ref
            if (node.has("$ref")) {
                String ref = node.get("$ref").asText();
                collectReferencedSchemas(ref, collectedSchemas);
            }

            // Recurse into all fields
            node.fields().forEachRemaining(entry -> {
                collectReferencesFromNode(entry.getValue(), collectedSchemas);
            });
        } else if (node.isArray()) {
            // Recurse into array elements
            node.forEach(element -> {
                collectReferencesFromNode(element, collectedSchemas);
            });
        }
    }

    /**
     * Convert a Jackson JsonNode to an OpenAPI Schema object.
     * This handles the basic schema properties we need for DMN types.
     */
    private Schema convertJsonNodeToSchema(com.fasterxml.jackson.databind.JsonNode node) {
        Schema schema = OASFactory.createSchema();

        // Handle type
        if (node.has("type")) {
            String type = node.get("type").asText();
            schema.type(Schema.SchemaType.valueOf(type.toUpperCase()));
        }

        // Handle format
        if (node.has("format")) {
            schema.format(node.get("format").asText());
        }

        // Handle description
        if (node.has("description")) {
            schema.description(node.get("description").asText());
        }

        // Handle $ref (update to use #/components/schemas/ instead of #/definitions/)
        if (node.has("$ref")) {
            String ref = node.get("$ref").asText();
            if (ref.startsWith("#/definitions/")) {
                ref = "#/components/schemas/" + ref.substring("#/definitions/".length());
            }
            schema.ref(ref);
        }

        // Handle properties
        if (node.has("properties")) {
            com.fasterxml.jackson.databind.JsonNode properties = node.get("properties");
            properties.fields().forEachRemaining(entry -> {
                Schema propSchema = convertJsonNodeToSchema(entry.getValue());
                schema.addProperty(entry.getKey(), propSchema);
            });
        }

        // Handle items (for arrays)
        if (node.has("items")) {
            schema.items(convertJsonNodeToSchema(node.get("items")));
        }

        // Handle required fields
        if (node.has("required")) {
            com.fasterxml.jackson.databind.JsonNode required = node.get("required");
            if (required.isArray()) {
                required.forEach(field -> schema.addRequired(field.asText()));
            }
        }

        // Handle enum values
        if (node.has("enum")) {
            com.fasterxml.jackson.databind.JsonNode enumNode = node.get("enum");
            if (enumNode.isArray()) {
                enumNode.forEach(value -> schema.addEnumeration(value.asText()));
            }
        }

        return schema;
    }

    private void addPathForModel(OpenAPI openAPI, ModelInfo model) {
        String path = "/api/v1/" + model.getPath();

        // Service name follows convention: {ModelName}Service
        String serviceName = model.getModelName() + "Service";

        // Find schema references
        String inputRef = schemaResolver.findInputSchemaRef(model.getModelName(), serviceName);
        String outputRef = schemaResolver.findOutputSchemaRef(model.getModelName(), serviceName);

        // Create the path item with POST operation
        PathItem pathItem = OASFactory.createPathItem();
        pathItem.POST(createPostOperation(model, serviceName, inputRef, outputRef));

        // Add to OpenAPI spec
        openAPI.getPaths().addPathItem(path, pathItem);

        LOG.fine("Added path: " + path + " (service: " + serviceName + ")");
    }

    private Operation createPostOperation(ModelInfo model, String serviceName,
                                         String inputRef, String outputRef) {
        Operation operation = OASFactory.createOperation();

        // Basic operation metadata
        operation.operationId(serviceName);
        operation.summary("Execute " + model.getModelName() + " decision");
        operation.description(model.getDescription());
        operation.addTag(model.getCategory());

        // Request body
        operation.requestBody(createRequestBody(model, serviceName, inputRef));

        // Responses
        operation.responses(createResponses(model, outputRef));

        return operation;
    }

    private RequestBody createRequestBody(ModelInfo model, String serviceName, String inputRef) {
        RequestBody requestBody = OASFactory.createRequestBody();
        requestBody.description("Input data for " + serviceName);
        requestBody.required(true);

        Content content = OASFactory.createContent();
        MediaType mediaType = OASFactory.createMediaType();

        // Set schema reference if available
        if (inputRef != null) {
            Schema schema = OASFactory.createSchema();
            schema.ref(inputRef);
            mediaType.schema(schema);

            // Generate example from schema
            Map<String, Object> exampleData = schemaResolver.generateExample(inputRef);
            if (!exampleData.isEmpty()) {
                Example example = OASFactory.createExample();
                example.value(convertToOpenAPIValue(exampleData));
                mediaType.addExample("Example request", example);
            }
        } else {
            // Fallback to generic schema
            mediaType.schema(createFallbackInputSchema());
            mediaType.addExample("Example request", createFallbackExample());
        }

        content.addMediaType("application/json", mediaType);
        requestBody.content(content);

        return requestBody;
    }

    private APIResponses createResponses(ModelInfo model, String outputRef) {
        APIResponses responses = OASFactory.createAPIResponses();

        // 200 Success response
        APIResponse successResponse = OASFactory.createAPIResponse();
        successResponse.description("Decision evaluated successfully");

        Content successContent = OASFactory.createContent();
        MediaType successMediaType = OASFactory.createMediaType();

        if (outputRef != null) {
            Schema schema = OASFactory.createSchema();
            schema.ref(outputRef);
            successMediaType.schema(schema);
        } else {
            successMediaType.schema(createFallbackOutputSchema());
        }

        successContent.addMediaType("application/json", successMediaType);
        successResponse.content(successContent);
        responses.addAPIResponse("200", successResponse);

        // 400 Bad Request
        APIResponse badRequestResponse = OASFactory.createAPIResponse();
        badRequestResponse.description("Invalid input or decision evaluation error");
        responses.addAPIResponse("400", badRequestResponse);

        // 404 Not Found
        APIResponse notFoundResponse = OASFactory.createAPIResponse();
        notFoundResponse.description("Model or decision service not found");
        responses.addAPIResponse("404", notFoundResponse);

        return responses;
    }

    private Schema createFallbackInputSchema() {
        Schema schema = OASFactory.createSchema();
        schema.type(Schema.SchemaType.OBJECT);
        schema.description("Generic DMN input");

        // Add situation property
        Schema situationSchema = OASFactory.createSchema();
        situationSchema.type(Schema.SchemaType.OBJECT);
        situationSchema.description("Situation context");
        schema.addProperty("situation", situationSchema);

        // Add parameters property
        Schema parametersSchema = OASFactory.createSchema();
        parametersSchema.type(Schema.SchemaType.OBJECT);
        parametersSchema.description("Decision parameters");
        schema.addProperty("parameters", parametersSchema);

        return schema;
    }

    private Schema createFallbackOutputSchema() {
        Schema schema = OASFactory.createSchema();
        schema.type(Schema.SchemaType.OBJECT);
        schema.description("Decision result");
        return schema;
    }

    private Example createFallbackExample() {
        Example example = OASFactory.createExample();
        Map<String, Object> exampleData = schemaResolver.generateExample(null);
        example.value(convertToOpenAPIValue(exampleData));
        return example;
    }

    /**
     * Convert a Map to a format suitable for OpenAPI example values.
     * The OpenAPI library expects examples as plain objects, but we need to ensure
     * proper serialization.
     */
    private Object convertToOpenAPIValue(Object value) {
        // The OpenAPI library accepts Map/List/primitives directly
        // Just ensure complex objects are properly structured
        if (value instanceof Map || value instanceof java.util.List ||
            value instanceof String || value instanceof Number ||
            value instanceof Boolean) {
            return value;
        }

        // For other types, try to convert via JSON
        try {
            String json = OBJECT_MAPPER.writeValueAsString(value);
            return OBJECT_MAPPER.readValue(json, Object.class);
        } catch (JsonProcessingException e) {
            LOG.warning("Failed to convert example value: " + e.getMessage());
            return value;
        }
    }
}
