package org.codeforphilly.bdt.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Transforms JSON Schema templates that contain placeholder keys.
 *
 * <p>Placeholder keys use the syntax {placeholderName} and can be transformed in two ways:
 * <ul>
 *   <li><b>Fill mode:</b> Substitutes placeholders with provided values (e.g., {person1} → "client")</li>
 *   <li><b>Flatten mode:</b> Merges all placeholder properties into additionalProperties</li>
 * </ul>
 *
 * <p>Example templated schema:
 * <pre>
 * {
 *   "type": "object",
 *   "properties": {
 *     "{person1}": {
 *       "type": "object",
 *       "properties": {
 *         "dateOfBirth": { "type": "string" }
 *       }
 *     },
 *     "{person2}": {
 *       "type": "object",
 *       "properties": {
 *         "dateOfBirth": { "type": "string" }
 *       }
 *     }
 *   }
 * }
 * </pre>
 *
 * <p>Fill mode with {person1: "client", person2: "spouse"} produces:
 * <pre>
 * {
 *   "type": "object",
 *   "properties": {
 *     "client": { ... },
 *     "spouse": { ... }
 *   }
 * }
 * </pre>
 *
 * <p>Flatten mode produces:
 * <pre>
 * {
 *   "type": "object",
 *   "additionalProperties": {
 *     "type": "object",
 *     "properties": {
 *       "dateOfBirth": { "type": "string" }
 *     }
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
     * Template: { "properties": { "{peopleIds}": { "type": "object" } } }
     * Values: { "peopleIds": ["alice", "bob"] }
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

    /**
     * Flatten template by merging all placeholder properties into additionalProperties.
     *
     * <p>This mode creates a schema that accepts any property name by:
     * <ol>
     *   <li>Finding all properties with placeholder keys ({...})</li>
     *   <li>Merging their schemas into a union (combining all properties)</li>
     *   <li>Replacing the placeholder properties with additionalProperties</li>
     * </ol>
     *
     * <p>Non-placeholder properties are preserved as-is.
     *
     * @param templateSchema the schema containing placeholder keys
     * @return a new schema with placeholders converted to additionalProperties
     */
    public static JsonNode flattenTemplate(JsonNode templateSchema) {
        if (templateSchema == null) {
            return null;
        }
        return flattenTemplateRecursive(templateSchema.deepCopy());
    }

    private static JsonNode flattenTemplateRecursive(JsonNode node) {
        if (!node.isObject()) {
            if (node.isArray()) {
                ArrayNode arrayNode = (ArrayNode) node;
                ArrayNode newArray = MAPPER.createArrayNode();
                for (JsonNode element : arrayNode) {
                    newArray.add(flattenTemplateRecursive(element));
                }
                return newArray;
            }
            return node;
        }

        ObjectNode objectNode = (ObjectNode) node;

        if (!objectNode.has("properties")) {
            // Recursively process other fields
            ObjectNode result = MAPPER.createObjectNode();
            objectNode.fields().forEachRemaining(entry -> {
                result.set(entry.getKey(), flattenTemplateRecursive(entry.getValue()));
            });
            return result;
        }

        JsonNode properties = objectNode.get("properties");
        if (!properties.isObject()) {
            return objectNode;
        }

        // Separate placeholder and non-placeholder properties
        List<JsonNode> placeholderSchemas = new ArrayList<>();
        ObjectNode nonPlaceholderProperties = MAPPER.createObjectNode();

        properties.fields().forEachRemaining(entry -> {
            String key = entry.getKey();
            JsonNode value = entry.getValue();

            Matcher matcher = PLACEHOLDER_PATTERN.matcher(key);
            if (matcher.matches()) {
                // Collect placeholder schemas for merging
                placeholderSchemas.add(flattenTemplateRecursive(value));
            } else {
                // Keep non-placeholder properties
                nonPlaceholderProperties.set(key, flattenTemplateRecursive(value));
            }
        });

        ObjectNode result = MAPPER.createObjectNode();

        // Copy all fields except "properties"
        objectNode.fields().forEachRemaining(entry -> {
            if (!"properties".equals(entry.getKey())) {
                result.set(entry.getKey(), flattenTemplateRecursive(entry.getValue()));
            }
        });

        // If there are non-placeholder properties, keep them
        if (nonPlaceholderProperties.size() > 0) {
            result.set("properties", nonPlaceholderProperties);
        }

        // If there were placeholder schemas, merge them into additionalProperties
        if (!placeholderSchemas.isEmpty()) {
            JsonNode mergedSchema = mergeSchemas(placeholderSchemas);
            result.set("additionalProperties", mergedSchema);
        }

        return result;
    }

    /**
     * Merge multiple schemas into one by combining their properties.
     *
     * <p>This performs a union merge - all properties from all schemas are included.
     * If the same property appears in multiple schemas with different definitions,
     * the later definition wins.
     *
     * @param schemas list of schemas to merge
     * @return merged schema containing all properties from all input schemas
     */
    private static JsonNode mergeSchemas(List<JsonNode> schemas) {
        if (schemas.isEmpty()) {
            return MAPPER.createObjectNode();
        }

        if (schemas.size() == 1) {
            return schemas.get(0);
        }

        // Start with a copy of the first schema
        ObjectNode merged = schemas.get(0).deepCopy().isObject()
            ? (ObjectNode) schemas.get(0).deepCopy()
            : MAPPER.createObjectNode();

        // Merge properties from all other schemas
        for (int i = 1; i < schemas.size(); i++) {
            JsonNode schema = schemas.get(i);
            if (!schema.isObject()) {
                continue;
            }

            // Merge type (should be the same, but handle mismatch)
            if (schema.has("type") && !merged.has("type")) {
                merged.set("type", schema.get("type"));
            }

            // Merge properties
            if (schema.has("properties")) {
                ObjectNode mergedProps = merged.has("properties")
                    ? (ObjectNode) merged.get("properties")
                    : MAPPER.createObjectNode();

                schema.get("properties").fields().forEachRemaining(entry -> {
                    mergedProps.set(entry.getKey(), entry.getValue().deepCopy());
                });

                merged.set("properties", mergedProps);
            }

            // Merge required arrays
            if (schema.has("required")) {
                Set<String> requiredSet = new LinkedHashSet<>();
                if (merged.has("required") && merged.get("required").isArray()) {
                    for (JsonNode req : merged.get("required")) {
                        requiredSet.add(req.asText());
                    }
                }
                for (JsonNode req : schema.get("required")) {
                    requiredSet.add(req.asText());
                }
                if (!requiredSet.isEmpty()) {
                    ArrayNode requiredArray = MAPPER.createArrayNode();
                    requiredSet.forEach(requiredArray::add);
                    merged.set("required", requiredArray);
                }
            }
        }

        return merged;
    }

    /**
     * Extract all placeholder names from a schema template.
     *
     * @param templateSchema the schema to scan for placeholders
     * @return set of placeholder names (without braces)
     */
    public static Set<String> extractPlaceholders(JsonNode templateSchema) {
        Set<String> placeholders = new LinkedHashSet<>();
        extractPlaceholdersRecursive(templateSchema, placeholders);
        return placeholders;
    }

    private static void extractPlaceholdersRecursive(JsonNode node, Set<String> placeholders) {
        if (node == null) {
            return;
        }

        if (node.isObject()) {
            ObjectNode objectNode = (ObjectNode) node;

            if (objectNode.has("properties")) {
                JsonNode properties = objectNode.get("properties");
                if (properties.isObject()) {
                    properties.fieldNames().forEachRemaining(key -> {
                        Matcher matcher = PLACEHOLDER_PATTERN.matcher(key);
                        if (matcher.matches()) {
                            placeholders.add(matcher.group(1));
                        }
                    });

                    // Recursively check nested properties
                    properties.fields().forEachRemaining(entry -> {
                        extractPlaceholdersRecursive(entry.getValue(), placeholders);
                    });
                }
            }

            // Check other object fields
            objectNode.fields().forEachRemaining(entry -> {
                if (!"properties".equals(entry.getKey())) {
                    extractPlaceholdersRecursive(entry.getValue(), placeholders);
                }
            });
        } else if (node.isArray()) {
            for (JsonNode element : node) {
                extractPlaceholdersRecursive(element, placeholders);
            }
        }
    }

    /**
     * Check if a schema contains any placeholder keys.
     *
     * @param schema the schema to check
     * @return true if the schema contains at least one placeholder
     */
    public static boolean hasPlaceholders(JsonNode schema) {
        return !extractPlaceholders(schema).isEmpty();
    }

    /**
     * Parse a JSON schema template from a string.
     *
     * @param json the JSON string to parse
     * @return parsed JsonNode
     * @throws IOException if parsing fails
     */
    public static JsonNode parseSchema(String json) throws IOException {
        return MAPPER.readTree(json);
    }

    /**
     * Parse a JSON schema template from an input stream.
     *
     * @param inputStream the input stream to read from
     * @return parsed JsonNode
     * @throws IOException if parsing fails
     */
    public static JsonNode parseSchema(InputStream inputStream) throws IOException {
        return MAPPER.readTree(inputStream);
    }

    /**
     * Convert a JsonNode to a pretty-printed JSON string.
     *
     * @param node the node to convert
     * @return formatted JSON string
     * @throws IOException if conversion fails
     */
    public static String toJsonString(JsonNode node) throws IOException {
        return MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(node);
    }
}
