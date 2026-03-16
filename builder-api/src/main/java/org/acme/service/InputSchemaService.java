package org.acme.service;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.enterprise.context.ApplicationScoped;

import org.acme.model.domain.Benefit;
import org.acme.model.domain.CheckConfig;
import org.acme.model.domain.FormPath;

import java.util.*;

/**
 * Service for extracting paths from JSON Schema input definitions.
 *
 * <p>Uses the x-template-schema from library-api as the source of truth for inputDefinition.
 * The inputDefinition contains template placeholders (e.g., {personId}) that are filled
 * using the check's configured parameters via SchemaTemplateTransformer.fillTemplate().
 */
@ApplicationScoped
public class InputSchemaService {

    /**
     * Extracts all unique input paths from all benefits in a screener.
     *
     * <p>For each check in each benefit:
     * <ol>
     *   <li>Takes the inputDefinition (x-template-schema from library-api)</li>
     *   <li>Fills template placeholders using the check's parameters</li>
     *   <li>Extracts JSON Schema paths from the filled schema</li>
     * </ol>
     *
     * @param benefits List of benefits containing checks with inputDefinitions
     * @return List of unique FormPath objects
     */
    public List<FormPath> extractUniqueInputPaths(List<Benefit> benefits) {
        Map<String, String> pathTypeMap = new HashMap<>();

        for (Benefit benefit : benefits) {
            List<CheckConfig> checks = benefit.getChecks();
            if (checks == null) continue;

            for (CheckConfig check : checks) {
                JsonNode inputDefinition = check.getInputDefinition();
                if (inputDefinition == null) continue;

                // Fill template placeholders with the check's parameters
                Map<String, Object> parameters = check.getParameters();
                JsonNode filledSchema = SchemaTemplateTransformer.fillTemplate(
                    inputDefinition,
                    parameters != null ? parameters : Collections.emptyMap()
                );

                // Extract paths from the filled schema
                List<FormPath> checkFormPaths = extractJsonSchemaPaths(filledSchema);
                for (FormPath checkFormPath : checkFormPaths) {
                    // If the same path exists with different types, keep the first one found
                    pathTypeMap.putIfAbsent(checkFormPath.getPath(), checkFormPath.getType());
                }
            }
        }

        // Convert to sorted list of FormPath objects
        return pathTypeMap.entrySet().stream()
            .map(entry -> new FormPath(entry.getKey(), entry.getValue()))
            .toList();
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
