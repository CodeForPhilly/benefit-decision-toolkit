package org.acme.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.enterprise.context.ApplicationScoped;

import org.acme.model.domain.Benefit;
import org.acme.model.domain.CheckConfig;
import org.acme.model.dto.FormPath;

import java.util.*;

/**
 * Service for transforming and extracting paths from JSON Schema input definitions.
 */
@ApplicationScoped
public class InputSchemaService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Extracts all unique input paths from all benefits in a screener.
     *
     * @param benefits List of benefits containing checks with inputDefinitions
     * @return Set of unique dot-separated paths (e.g., "people.applicant.dateOfBirth")
     */
    public Set<String> extractAllInputPaths(List<Benefit> benefits) {
        Set<String> pathSet = new HashSet<>();

        for (Benefit benefit : benefits) {
            List<CheckConfig> checks = benefit.getChecks();
            if (checks == null) continue;

            for (CheckConfig check : checks) {
                JsonNode transformedSchema = transformInputDefinitionSchema(check);
                List<String> paths = extractJsonSchemaPaths(transformedSchema);
                pathSet.addAll(paths);
            }
        }

        return pathSet;
    }

    /**
     * Extracts all unique input paths with their types from all benefits in a screener.
     *
     * @param benefits List of benefits containing checks with inputDefinitions
     * @return Map of unique dot-separated paths to their JSON Schema types
     */
    public Map<String, String> extractAllInputPathsWithTypes(List<Benefit> benefits) {
        Map<String, String> pathTypeMap = new HashMap<>();

        for (Benefit benefit : benefits) {
            List<CheckConfig> checks = benefit.getChecks();
            if (checks == null) continue;

            for (CheckConfig check : checks) {
                JsonNode transformedSchema = transformInputDefinitionSchema(check);
                List<FormPath> formPaths = extractJsonSchemaPathsWithTypes(transformedSchema);
                for (FormPath formPath : formPaths) {
                    // If the same path exists with different types, keep the first one found
                    pathTypeMap.putIfAbsent(formPath.getPath(), formPath.getType());
                }
            }
        }

        return pathTypeMap;
    }

    /**
     * Transforms a CheckConfig's inputDefinition JSON Schema by converting the `people`
     * array property into an object with personId-keyed properties nested under it.
     *
     * Example:
     *   Input:  { people: { type: "array", items: { properties: { dateOfBirth: ... } } } }
     *   Output: { people: { type: "object", properties: { [personId]: { properties: { dateOfBirth: ... } } } } }
     *
     * @param checkConfig The CheckConfig containing inputDefinition and parameters
     * @return A new JsonNode with `people` transformed to an object with personId-keyed properties
     */
    public JsonNode transformInputDefinitionSchema(CheckConfig checkConfig) {
        JsonNode inputDefinition = checkConfig.getInputDefinition();

        if (inputDefinition == null || !inputDefinition.has("properties")) {
            return inputDefinition != null ? inputDefinition.deepCopy() : objectMapper.createObjectNode();
        }

        JsonNode properties = inputDefinition.get("properties");
        JsonNode peopleProperty = properties.get("people");
        boolean hasPeopleProperty = peopleProperty != null;

        // Extract personId from parameters
        Map<String, Object> parameters = checkConfig.getParameters();
        String personId = parameters != null ? (String) parameters.get("personId") : null;

        // If people property exists but no personId, return original (can't transform)
        if (hasPeopleProperty && (personId == null || personId.isEmpty())) {
            return inputDefinition.deepCopy();
        }

        // If no people property, return a copy of the original schema
        if (!hasPeopleProperty) {
            return inputDefinition.deepCopy();
        }

        // Deep clone the schema to avoid mutations
        ObjectNode transformedSchema = inputDefinition.deepCopy();
        ObjectNode transformedProperties = (ObjectNode) transformedSchema.get("properties");

        // Get the items schema from the people array
        JsonNode itemsSchema = peopleProperty.get("items");

        // Transform people from array to object with personId as a nested property
        ObjectNode newPeopleSchema = objectMapper.createObjectNode();
        newPeopleSchema.put("type", "object");
        ObjectNode newPeopleProperties = objectMapper.createObjectNode();
        if (itemsSchema != null) {
            newPeopleProperties.set(personId, itemsSchema.deepCopy());
        }

        newPeopleSchema.set("properties", newPeopleProperties);
        transformedProperties.set("people", newPeopleSchema);
        return transformedSchema;
    }

    /**
     * Extracts all property paths from a JSON Schema inputDefinition.
     * Recursively traverses nested objects to build dot-separated paths.
     * Excludes the top-level "parameters" property and "id" properties.
     *
     * @param jsonSchema The JSON Schema to parse
     * @return List of dot-separated paths (e.g., ["people.applicant.dateOfBirth", "income"])
     */
    public List<String> extractJsonSchemaPaths(JsonNode jsonSchema) {
        if (jsonSchema == null || !jsonSchema.has("properties")) {
            return new ArrayList<>();
        }

        return traverseSchema(jsonSchema, "");
    }

    /**
     * Extracts all property paths with their types from a JSON Schema inputDefinition.
     * Recursively traverses nested objects to build dot-separated paths with type info.
     * Excludes the top-level "parameters" property and "id" properties.
     *
     * @param jsonSchema The JSON Schema to parse
     * @return List of FormPath objects containing path and type
     */
    public List<FormPath> extractJsonSchemaPathsWithTypes(JsonNode jsonSchema) {
        if (jsonSchema == null || !jsonSchema.has("properties")) {
            return new ArrayList<>();
        }

        return traverseSchemaWithTypes(jsonSchema, "");
    }

    private List<String> traverseSchema(JsonNode schema, String parentPath) {
        List<String> paths = new ArrayList<>();

        if (schema == null || !schema.has("properties")) {
            return paths;
        }

        JsonNode propertiesJsonNode = schema.get("properties");
        Iterator<Map.Entry<String, JsonNode>> nestedProperties = propertiesJsonNode.properties().iterator();

        while (nestedProperties.hasNext()) {
            Map.Entry<String, JsonNode> currentProperty = nestedProperties.next();
            String propKey = currentProperty.getKey();
            JsonNode propValue = currentProperty.getValue();

            // Skip top-level "parameters" property
            if (parentPath.isEmpty() && "parameters".equals(propKey)) {
                continue;
            }

            // Skip "id" properties
            if ("id".equals(propKey)) {
                continue;
            }

            String currentPath = parentPath.isEmpty() ? propKey : parentPath + "." + propKey;

            // If this property has nested properties, recurse into it
            if (propValue.has("properties")) {
                paths.addAll(traverseSchema(propValue, currentPath));
            } else if ("array".equals(getType(propValue)) && propValue.has("items")) {
                // Handle arrays - recurse into items schema with the current path
                JsonNode itemsSchema = propValue.get("items");
                if (itemsSchema.has("properties")) {
                    paths.addAll(traverseSchema(itemsSchema, currentPath));
                } else {
                    // Array of primitives - add the path
                    paths.add(currentPath);
                }
            } else {
                // Leaf property - add the path
                paths.add(currentPath);
            }
        }

        return paths;
    }

    private List<FormPath> traverseSchemaWithTypes(JsonNode schema, String parentPath) {
        List<FormPath> formPaths = new ArrayList<>();

        if (schema == null || !schema.has("properties")) {
            return formPaths;
        }

        JsonNode propertiesJsonNode = schema.get("properties");
        Iterator<Map.Entry<String, JsonNode>> nestedProperties = propertiesJsonNode.properties().iterator();

        while (nestedProperties.hasNext()) {
            Map.Entry<String, JsonNode> currentProperty = nestedProperties.next();
            String propKey = currentProperty.getKey();
            JsonNode propValue = currentProperty.getValue();

            // Skip top-level "parameters" property
            if (parentPath.isEmpty() && "parameters".equals(propKey)) {
                continue;
            }

            // Skip "id" properties
            if ("id".equals(propKey)) {
                continue;
            }

            String currentPath = parentPath.isEmpty() ? propKey : parentPath + "." + propKey;

            // If this property has nested properties, recurse into it
            if (propValue.has("properties")) {
                formPaths.addAll(traverseSchemaWithTypes(propValue, currentPath));
            } else if ("array".equals(getType(propValue)) && propValue.has("items")) {
                // Handle arrays - recurse into items schema with the current path
                JsonNode itemsSchema = propValue.get("items");
                if (itemsSchema.has("properties")) {
                    formPaths.addAll(traverseSchemaWithTypes(itemsSchema, currentPath));
                } else {
                    // Array of primitives - add the path with the items type
                    String itemType = getType(itemsSchema);
                    formPaths.add(new FormPath(currentPath, "array:" + (itemType != null ? itemType : "any")));
                }
            } else {
                // Leaf property - add the path with its type
                String type = getEffectiveType(propValue);
                formPaths.add(new FormPath(currentPath, type));
            }
        }

        return formPaths;
    }

    private String getType(JsonNode schema) {
        if (schema == null || !schema.has("type")) {
            return null;
        }
        return schema.get("type").asText();
    }

    /**
     * Determines the effective type of a JSON Schema property, considering format hints.
     * For example, a string with format "date" returns "date" instead of "string".
     */
    private String getEffectiveType(JsonNode schema) {
        if (schema == null) {
            return "any";
        }

        String type = getType(schema);
        if (type == null) {
            return "any";
        }

        // Check for format hints that provide more specific type info
        if ("string".equals(type) && schema.has("format")) {
            String format = schema.get("format").asText();
            // Common date/time formats
            if ("date".equals(format) || "date-time".equals(format) || "time".equals(format)) {
                return format;
            }
        }

        return type;
    }
}
