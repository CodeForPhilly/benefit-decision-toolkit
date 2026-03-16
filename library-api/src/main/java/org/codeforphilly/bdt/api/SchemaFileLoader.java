package org.codeforphilly.bdt.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.arc.Unremovable;

import javax.enterprise.context.ApplicationScoped;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.logging.Logger;

/**
 * Loads .schema.json files from the classpath and provides flattened schemas
 * for use in OpenAPI documentation.
 *
 * <p>Schema files are expected to be named {dmn-file-name}.schema.json and located
 * alongside their corresponding .dmn files. For example:
 * <ul>
 *   <li>checks/age/person-min-age.dmn</li>
 *   <li>checks/age/person-min-age.schema.json</li>
 * </ul>
 *
 * <p>These schema files use placeholder keys like {personId} which are transformed
 * using {@link SchemaTemplateTransformer#flattenTemplate(JsonNode)} to create
 * OpenAPI-compatible schemas with additionalProperties.
 */
@ApplicationScoped
@Unremovable
public class SchemaFileLoader {
    private static final Logger LOG = Logger.getLogger(SchemaFileLoader.class.getName());
    private static final ObjectMapper MAPPER = new ObjectMapper();

    // Cache of path -> flattened schema
    private final Map<String, JsonNode> flattenedSchemas = new HashMap<>();

    // Cache of path -> original schema (for example generation)
    private final Map<String, JsonNode> originalSchemas = new HashMap<>();

    /**
     * Load and flatten the schema.json file for a given DMN path.
     *
     * @param dmnPath the path to the DMN file (without .dmn extension), e.g., "checks/age/person-min-age"
     * @return the flattened schema, or null if no schema file exists
     */
    public JsonNode loadFlattenedSchema(String dmnPath) {
        // Check cache first
        if (flattenedSchemas.containsKey(dmnPath)) {
            return flattenedSchemas.get(dmnPath);
        }

        JsonNode originalSchema = loadOriginalSchema(dmnPath);
        if (originalSchema == null) {
            return null;
        }

        // Flatten the schema using SchemaTemplateTransformer
        JsonNode flattened = SchemaTemplateTransformer.flattenTemplate(originalSchema);
        flattenedSchemas.put(dmnPath, flattened);

        LOG.fine("Loaded and flattened schema for: " + dmnPath);
        return flattened;
    }

    /**
     * Load the original (non-flattened) schema.json file for a given DMN path.
     *
     * @param dmnPath the path to the DMN file (without .dmn extension)
     * @return the original schema with placeholders, or null if no schema file exists
     */
    public JsonNode loadOriginalSchema(String dmnPath) {
        // Check cache first
        if (originalSchemas.containsKey(dmnPath)) {
            return originalSchemas.get(dmnPath);
        }

        String schemaPath = dmnPath + ".schema.json";
        ClassLoader classLoader = Thread.currentThread().getContextClassLoader();

        try (InputStream is = classLoader.getResourceAsStream(schemaPath)) {
            if (is == null) {
                LOG.fine("No schema.json file found for: " + dmnPath);
                originalSchemas.put(dmnPath, null);
                return null;
            }

            JsonNode schema = MAPPER.readTree(is);
            originalSchemas.put(dmnPath, schema);
            LOG.fine("Loaded original schema for: " + dmnPath);
            return schema;
        } catch (IOException e) {
            LOG.warning("Failed to load schema.json for " + dmnPath + ": " + e.getMessage());
            originalSchemas.put(dmnPath, null);
            return null;
        }
    }

    /**
     * Check if a schema.json file exists for the given DMN path.
     *
     * @param dmnPath the path to the DMN file (without .dmn extension)
     * @return true if a schema file exists
     */
    public boolean hasSchemaFile(String dmnPath) {
        return loadOriginalSchema(dmnPath) != null;
    }

    /**
     * Generate an example request body from the flattened schema.
     *
     * <p>This walks the schema and generates realistic example values based on:
     * <ul>
     *   <li>Field types and formats (e.g., date format gets ISO date string)</li>
     *   <li>Field names (e.g., "personId" gets "person1")</li>
     *   <li>additionalProperties (generates example keys like "person1")</li>
     * </ul>
     *
     * @param dmnPath the path to the DMN file
     * @return an example object, or empty map if no schema exists
     */
    public Map<String, Object> generateExample(String dmnPath) {
        JsonNode flattened = loadFlattenedSchema(dmnPath);
        if (flattened == null) {
            return Collections.emptyMap();
        }

        return generateExampleFromNode(flattened, "");
    }

    private Map<String, Object> generateExampleFromNode(JsonNode schema, String context) {
        Map<String, Object> example = new LinkedHashMap<>();

        if (!schema.has("properties") && !schema.has("additionalProperties")) {
            return example;
        }

        // Process defined properties
        if (schema.has("properties")) {
            JsonNode properties = schema.get("properties");
            properties.fields().forEachRemaining(entry -> {
                String fieldName = entry.getKey();
                JsonNode fieldSchema = entry.getValue();
                Object value = generateFieldExample(fieldName, fieldSchema, context);
                if (value != null) {
                    example.put(fieldName, value);
                }
            });
        }

        // Process additionalProperties (from flattened placeholders)
        if (schema.has("additionalProperties")) {
            JsonNode additionalProps = schema.get("additionalProperties");
            // Generate an example key based on the context
            String exampleKey = generateExampleKey(context);
            Object value = generateFieldExample(exampleKey, additionalProps, context + "." + exampleKey);
            if (value != null) {
                example.put(exampleKey, value);
            }
        }

        return example;
    }

    private Object generateFieldExample(String fieldName, JsonNode fieldSchema, String context) {
        String type = fieldSchema.has("type") ? fieldSchema.get("type").asText() : "object";
        String format = fieldSchema.has("format") ? fieldSchema.get("format").asText() : null;

        switch (type) {
            case "object":
                return generateExampleFromNode(fieldSchema, context + "." + fieldName);

            case "array":
                if (fieldSchema.has("items")) {
                    Object itemExample = generateFieldExample(fieldName + "_item", fieldSchema.get("items"), context);
                    return Collections.singletonList(itemExample);
                }
                return Collections.emptyList();

            case "string":
                return generateStringExample(fieldName, format);

            case "number":
            case "integer":
                return generateNumberExample(fieldName);

            case "boolean":
                return generateBooleanExample(fieldName);

            default:
                return null;
        }
    }

    private String generateExampleKey(String context) {
        // Generate contextual example keys
        if (context.contains("people")) {
            return "client";
        }
        return "example1";
    }

    private String generateStringExample(String fieldName, String format) {
        // Handle date format
        if ("date".equals(format)) {
            return "1960-05-15";
        }
        if ("date-time".equals(format)) {
            return "1960-05-15T00:00:00Z";
        }

        // Generate contextual examples based on field name
        String lowerName = fieldName.toLowerCase();

        if (lowerName.contains("personid") || lowerName.equals("id")) {
            return "client";
        }
        if (lowerName.contains("benefit")) {
            return "PhlHomesteadExemption";
        }

        return "example-" + fieldName;
    }

    private Object generateNumberExample(String fieldName) {
        String lowerName = fieldName.toLowerCase();

        if (lowerName.contains("age")) {
            return 65;
        }
        if (lowerName.contains("min")) {
            return 65;
        }
        if (lowerName.contains("max")) {
            return 100;
        }

        return 42;
    }

    private boolean generateBooleanExample(String fieldName) {
        // Fields containing "not" or negative prefixes should default to false
        String lowerName = fieldName.toLowerCase();
        if (lowerName.startsWith("not") || lowerName.contains("abatement")) {
            return false;
        }
        return true;
    }

    /**
     * Convert the flattened schema to OpenAPI Schema format.
     *
     * <p>This converts the JSON Schema to OpenAPI-compatible format by:
     * <ul>
     *   <li>Converting $ref from #/definitions/ to #/components/schemas/</li>
     *   <li>Preserving type, format, description, properties, additionalProperties</li>
     *   <li>Handling required arrays</li>
     * </ul>
     *
     * @param dmnPath the path to the DMN file
     * @return the schema as a JsonNode suitable for OpenAPI, or null if no schema exists
     */
    public JsonNode getOpenAPISchema(String dmnPath) {
        JsonNode flattened = loadFlattenedSchema(dmnPath);
        if (flattened == null) {
            return null;
        }

        // The flattened schema is already in a format close to OpenAPI
        // Just need to ensure proper structure
        return flattened;
    }

    /**
     * Clear cached schemas. Useful for testing.
     */
    public void clearCache() {
        flattenedSchemas.clear();
        originalSchemas.clear();
    }
}
