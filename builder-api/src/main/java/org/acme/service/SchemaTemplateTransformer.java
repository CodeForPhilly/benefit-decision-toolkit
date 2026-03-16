package org.acme.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Transforms JSON Schema templates that contain placeholder keys.
 *
 * <p>Placeholder keys use the syntax {placeholderName} and can be transformed by
 * substituting placeholders with provided values (e.g., {personId} → "client").
 *
 * <p>Example templated schema:
 * <pre>
 * {
 *   "type": "object",
 *   "properties": {
 *     "{personId}": {
 *       "type": "object",
 *       "properties": {
 *         "dateOfBirth": { "type": "string" }
 *       }
 *     }
 *   }
 * }
 * </pre>
 *
 * <p>Fill mode with {personId: "client"} produces:
 * <pre>
 * {
 *   "type": "object",
 *   "properties": {
 *     "client": { ... }
 *   }
 * }
 * </pre>
 *
 * <p>Array expansion with {personId: ["client", "spouse"]} produces:
 * <pre>
 * {
 *   "type": "object",
 *   "properties": {
 *     "client": { ... },
 *     "spouse": { ... }
 *   }
 * }
 * </pre>
 */
public class SchemaTemplateTransformer {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    // Pattern to match placeholder keys like {placeholderName}
    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("^\\{([^}]+)\\}$");

    private SchemaTemplateTransformer() {
        // Utility class - prevent instantiation
    }

    /**
     * Fill template placeholders with provided values.
     *
     * <p>Walks through the schema and replaces any property key matching {placeholder}
     * with the corresponding value from the values map. Values can be:
     * <ul>
     *   <li>String: replaces the placeholder with a single property</li>
     *   <li>List&lt;String&gt;: expands the placeholder into multiple properties, one per list item</li>
     * </ul>
     *
     * <p>Example with array expansion:
     * <pre>
     * Template: { "properties": { "{personId}": { "type": "object" } } }
     * Values: { "personId": ["alice", "bob"] }
     * Result: { "properties": { "alice": { "type": "object" }, "bob": { "type": "object" } } }
     * </pre>
     *
     * @param templateSchema the schema containing placeholder keys
     * @param values map of placeholder names to replacement values (String or List&lt;String&gt;)
     * @return a new schema with placeholders replaced by actual values
     */
    public static JsonNode fillTemplate(JsonNode templateSchema, Map<String, ?> values) {
        if (templateSchema == null) {
            return null;
        }
        return fillTemplateRecursive(templateSchema.deepCopy(), values);
    }

    @SuppressWarnings("unchecked")
    private static JsonNode fillTemplateRecursive(JsonNode node, Map<String, ?> values) {
        if (node.isObject()) {
            ObjectNode objectNode = (ObjectNode) node;

            // If this object has "properties", process them for placeholder substitution
            if (objectNode.has("properties")) {
                JsonNode properties = objectNode.get("properties");
                if (properties.isObject()) {
                    ObjectNode newProperties = MAPPER.createObjectNode();

                    properties.fields().forEachRemaining(entry -> {
                        String key = entry.getKey();
                        JsonNode value = entry.getValue();

                        // Check if key is a placeholder
                        Matcher matcher = PLACEHOLDER_PATTERN.matcher(key);
                        if (matcher.matches()) {
                            String placeholderName = matcher.group(1);
                            Object replacement = values.get(placeholderName);
                            if (replacement != null) {
                                if (replacement instanceof List) {
                                    // Array expansion: create a property for each list item
                                    List<String> replacements = (List<String>) replacement;
                                    for (String r : replacements) {
                                        newProperties.set(r, fillTemplateRecursive(value.deepCopy(), values));
                                    }
                                } else {
                                    // Single value replacement
                                    newProperties.set(replacement.toString(), fillTemplateRecursive(value, values));
                                }
                            } else {
                                // Keep original placeholder if no value provided
                                newProperties.set(key, fillTemplateRecursive(value, values));
                            }
                        } else {
                            // Non-placeholder key - keep as is
                            newProperties.set(key, fillTemplateRecursive(value, values));
                        }
                    });

                    objectNode.set("properties", newProperties);
                }
            }

            // Recursively process other object fields
            objectNode.fields().forEachRemaining(entry -> {
                if (!"properties".equals(entry.getKey())) {
                    JsonNode processed = fillTemplateRecursive(entry.getValue(), values);
                    objectNode.set(entry.getKey(), processed);
                }
            });

            return objectNode;
        } else if (node.isArray()) {
            ArrayNode arrayNode = (ArrayNode) node;
            ArrayNode newArray = MAPPER.createArrayNode();
            for (JsonNode element : arrayNode) {
                newArray.add(fillTemplateRecursive(element, values));
            }
            return newArray;
        }

        return node;
    }
}
