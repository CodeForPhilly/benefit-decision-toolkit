package org.acme.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.enterprise.context.ApplicationScoped;

import org.acme.model.domain.Benefit;
import org.acme.model.domain.CheckConfig;

import java.util.*;

/**
 * Service for transforming and extracting paths from JSON Schema input definitions.
 *
 * This service provides the backend equivalent of the frontend's transformInputDefinitionSchema
 * and extractJsonSchemaPaths functions.
 */
@ApplicationScoped
public class InputSchemaService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Extracts all unique input paths from all benefits in a screener.
     * This is the backend equivalent of the frontend FormEditorView createEffect logic.
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
        List<String> paths = new ArrayList<>();

        if (jsonSchema == null || !jsonSchema.has("properties")) {
            return paths;
        }

        traverseSchema(jsonSchema, "", paths);
        return paths;
    }

    private void traverseSchema(JsonNode schema, String parentPath, List<String> paths) {
        if (schema == null || !schema.has("properties")) {
            return;
        }

        JsonNode properties = schema.get("properties");
        Iterator<Map.Entry<String, JsonNode>> fields = properties.fields();

        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> entry = fields.next();
            String key = entry.getKey();
            JsonNode value = entry.getValue();

            // Skip top-level "parameters" property
            if (parentPath.isEmpty() && "parameters".equals(key)) {
                continue;
            }

            // Skip "id" properties
            if ("id".equals(key)) {
                continue;
            }

            String currentPath = parentPath.isEmpty() ? key : parentPath + "." + key;

            // If this property has nested properties, recurse into it
            if (value.has("properties")) {
                traverseSchema(value, currentPath, paths);
            } else if ("array".equals(getType(value)) && value.has("items")) {
                // Handle arrays - recurse into items schema with the current path
                JsonNode itemsSchema = value.get("items");
                if (itemsSchema.has("properties")) {
                    traverseSchema(itemsSchema, currentPath, paths);
                } else {
                    // Array of primitives - add the path
                    paths.add(currentPath);
                }
            } else {
                // Leaf property - add the path
                paths.add(currentPath);
            }
        }
    }

    private String getType(JsonNode schema) {
        if (schema == null || !schema.has("type")) {
            return null;
        }
        return schema.get("type").asText();
    }
}
