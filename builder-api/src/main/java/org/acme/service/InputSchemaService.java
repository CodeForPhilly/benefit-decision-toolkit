package org.acme.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.enterprise.context.ApplicationScoped;

import org.acme.model.domain.Benefit;
import org.acme.model.domain.CheckConfig;
import org.acme.model.domain.FormPath;

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
    public Set<FormPath> extractAllInputPaths(List<Benefit> benefits) {
        Set<FormPath> pathSet = new HashSet<>();

        for (Benefit benefit : benefits) {
            List<CheckConfig> checks = benefit.getChecks();
            if (checks == null) continue;

            for (CheckConfig check : checks) {
                JsonNode transformedSchema = transformInputDefinitionSchema(check);
                List<FormPath> paths = extractJsonSchemaPaths(transformedSchema);
                pathSet.addAll(paths);
            }
        }

        return pathSet;
    }

    /**
     * Transforms a CheckConfig's inputDefinition JSON Schema by applying all schema transformations.
     * Currently applies:
     * 1. People transformation: converts people array to object keyed by personId
     * 2. Enrollments transformation: moves enrollments under people.{personId}.enrollments
     *
     * @param checkConfig The CheckConfig containing inputDefinition and parameters
     * @return A new JsonNode with all transformations applied
     */
    public JsonNode transformInputDefinitionSchema(CheckConfig checkConfig) {
        JsonNode inputDefinition = checkConfig.getInputDefinition();

        if (inputDefinition == null || !inputDefinition.has("properties")) {
            return inputDefinition != null ? inputDefinition.deepCopy() : objectMapper.createObjectNode();
        }

        // Extract personId from parameters
        Map<String, Object> parameters = checkConfig.getParameters();
        String personId = parameters != null ? (String) parameters.get("personId") : null;

        // Apply each transformation in sequence
        JsonNode schema = inputDefinition.deepCopy();
        schema = transformPeopleSchema(schema, personId);
        schema = transformEnrollmentsSchema(schema, personId);

        return schema;
    }

    /**
     * Transforms the `people` array property into an object with personId-keyed properties.
     *
     * Example:
     *   Input:  { people: { type: "array", items: { properties: { dateOfBirth: ... } } } }
     *   Output: { people: { type: "object", properties: { [personId]: { properties: { dateOfBirth: ... } } } } }
     *
     * @param schema The JSON Schema to transform
     * @param personId The personId to use as the key under people
     * @return A new JsonNode with `people` transformed, or the original if no transformation needed
     */
    public JsonNode transformPeopleSchema(JsonNode schema, String personId) {
        if (schema == null || !schema.has("properties")) {
            return schema != null ? schema.deepCopy() : objectMapper.createObjectNode();
        }

        JsonNode properties = schema.get("properties");
        JsonNode peopleProperty = properties.get("people");

        // If no people property, return a copy of the original schema
        if (peopleProperty == null) {
            return schema.deepCopy();
        }

        // If people property exists but no personId, return original (can't transform)
        if (personId == null || personId.isEmpty()) {
            return schema.deepCopy();
        }

        // Deep clone the schema to avoid mutations
        ObjectNode transformedSchema = schema.deepCopy();
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
     * Transforms the `enrollments` array property by moving it under people.{personId}.enrollments
     * as an array of strings (benefit names).
     *
     * Example:
     *   Input:  { enrollments: { type: "array", items: { properties: { personId: ..., benefit: ... } } } }
     *   Output: { people: { type: "object", properties: { [personId]: { properties: { enrollments: { type: "array", items: { type: "string" } } } } } } }
     *
     * @param schema The JSON Schema to transform
     * @param personId The personId to use as the key under people
     * @return A new JsonNode with `enrollments` transformed, or the original if no transformation needed
     */
    public JsonNode transformEnrollmentsSchema(JsonNode schema, String personId) {
        if (schema == null || !schema.has("properties")) {
            return schema != null ? schema.deepCopy() : objectMapper.createObjectNode();
        }

        JsonNode properties = schema.get("properties");
        JsonNode enrollmentsProperty = properties.get("enrollments");

        // If no enrollments property, return a copy of the original schema
        if (enrollmentsProperty == null) {
            return schema.deepCopy();
        }

        // If enrollments property exists but no personId, return original (can't transform)
        if (personId == null || personId.isEmpty()) {
            return schema.deepCopy();
        }

        // Deep clone the schema to avoid mutations
        ObjectNode transformedSchema = schema.deepCopy();
        ObjectNode transformedProperties = (ObjectNode) transformedSchema.get("properties");

        // Remove the top-level enrollments property
        transformedProperties.remove("enrollments");

        // Create enrollments schema as array of strings
        ObjectNode enrollmentsSchema = objectMapper.createObjectNode();
        enrollmentsSchema.put("type", "array");
        ObjectNode itemsSchema = objectMapper.createObjectNode();
        itemsSchema.put("type", "string");
        enrollmentsSchema.set("items", itemsSchema);

        // Get or create the people property
        JsonNode existingPeople = transformedProperties.get("people");
        ObjectNode peopleSchema;
        ObjectNode peopleProps;

        if (existingPeople != null && existingPeople.has("properties")) {
            // People already exists (from transformPeopleSchema)
            peopleSchema = (ObjectNode) existingPeople;
            peopleProps = (ObjectNode) peopleSchema.get("properties");
        } else {
            // Create new people structure
            peopleSchema = objectMapper.createObjectNode();
            peopleSchema.put("type", "object");
            peopleProps = objectMapper.createObjectNode();
            peopleSchema.set("properties", peopleProps);
            transformedProperties.set("people", peopleSchema);
        }

        // Get or create the personId property under people
        JsonNode existingPersonId = peopleProps.get(personId);
        ObjectNode personIdSchema;
        ObjectNode personIdProps;

        if (existingPersonId != null && existingPersonId.has("properties")) {
            // PersonId already exists
            personIdSchema = (ObjectNode) existingPersonId;
            personIdProps = (ObjectNode) personIdSchema.get("properties");
        } else {
            // Create new personId structure
            personIdSchema = objectMapper.createObjectNode();
            personIdSchema.put("type", "object");
            personIdProps = objectMapper.createObjectNode();
            personIdSchema.set("properties", personIdProps);
            peopleProps.set(personId, personIdSchema);
        }

        // Add enrollments under the personId
        personIdProps.set("enrollments", enrollmentsSchema);

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
    public List<FormPath> extractJsonSchemaPaths(JsonNode jsonSchema) {
        if (jsonSchema == null || !jsonSchema.has("properties")) {
            return new ArrayList<>();
        }

        return traverseSchema(jsonSchema, "");
    }

    private List<FormPath> traverseSchema(JsonNode schema, String parentPath) {
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
            String currentType = getEffectiveType(propValue);

            // If this property has nested properties, recurse into it
            if (propValue.has("properties")) {
                formPaths.addAll(traverseSchema(propValue, currentPath));
            } else if ("array".equals(currentType) && propValue.has("items")) {
                // Handle arrays - recurse into items schema with the current path
                JsonNode itemsSchema = propValue.get("items");
                if (itemsSchema.has("properties")) {
                    formPaths.addAll(traverseSchema(itemsSchema, currentPath));
                } else {
                    // Array of primitives - add the path
                    String itemType = getType(itemsSchema);
                    formPaths.add(new FormPath(currentPath, "array:" + (itemType != null ? itemType : "any")));
                }
            } else {
                // Leaf property - add the path
                formPaths.add(new FormPath(currentPath, currentType));
            }
        }

        return formPaths;
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
        if (type.equals("string") && schema.has("format")) {
            String format = schema.get("format").asText();
            // Common date/time formats
            if ("date".equals(format) || "date-time".equals(format) || "time".equals(format)) {
                return format;
            }
        }

        return type;
    }

    private String getType(JsonNode schema) {
        if (schema == null || !schema.has("type")) {
            return null;
        }
        return schema.get("type").asText();
    }
}
