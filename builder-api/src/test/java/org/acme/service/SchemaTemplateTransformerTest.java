package org.acme.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class SchemaTemplateTransformerTest {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
    }

    @Test
    void fillTemplate_withStringValue_replacesPlaceholder() throws Exception {
        String templateJson = """
            {
                "type": "object",
                "properties": {
                    "{personId}": {
                        "type": "object",
                        "properties": {
                            "name": { "type": "string" }
                        }
                    }
                }
            }
            """;
        JsonNode template = objectMapper.readTree(templateJson);
        Map<String, Object> values = Map.of("personId", "applicant");

        JsonNode result = SchemaTemplateTransformer.fillTemplate(template, values);

        assertTrue(result.get("properties").has("applicant"));
        assertFalse(result.get("properties").has("{personId}"));
        assertTrue(result.get("properties").get("applicant").get("properties").has("name"));
    }

    @Test
    void fillTemplate_withListValue_expandsToMultipleProperties() throws Exception {
        String templateJson = """
            {
                "type": "object",
                "properties": {
                    "{personId}": {
                        "type": "object",
                        "properties": {
                            "dateOfBirth": { "type": "string" }
                        }
                    }
                }
            }
            """;
        JsonNode template = objectMapper.readTree(templateJson);
        Map<String, Object> values = Map.of("personId", List.of("applicant", "spouse", "child"));

        JsonNode result = SchemaTemplateTransformer.fillTemplate(template, values);

        assertTrue(result.get("properties").has("applicant"));
        assertTrue(result.get("properties").has("spouse"));
        assertTrue(result.get("properties").has("child"));
        assertFalse(result.get("properties").has("{personId}"));
    }

    @Test
    void fillTemplate_withNoMatchingValue_keepsPlaceholder() throws Exception {
        String templateJson = """
            {
                "type": "object",
                "properties": {
                    "{unknownPlaceholder}": {
                        "type": "string"
                    }
                }
            }
            """;
        JsonNode template = objectMapper.readTree(templateJson);
        Map<String, Object> values = Map.of("personId", "applicant");

        JsonNode result = SchemaTemplateTransformer.fillTemplate(template, values);

        assertTrue(result.get("properties").has("{unknownPlaceholder}"));
        assertFalse(result.get("properties").has("applicant"));
    }

    @Test
    void fillTemplate_withNestedPlaceholders_replacesAllLevels() throws Exception {
        String templateJson = """
            {
                "type": "object",
                "properties": {
                    "people": {
                        "type": "object",
                        "properties": {
                            "{personId}": {
                                "type": "object",
                                "properties": {
                                    "dateOfBirth": { "type": "string" }
                                }
                            }
                        }
                    }
                }
            }
            """;
        JsonNode template = objectMapper.readTree(templateJson);
        Map<String, Object> values = Map.of("personId", "client");

        JsonNode result = SchemaTemplateTransformer.fillTemplate(template, values);

        assertTrue(result.get("properties").get("people").get("properties").has("client"));
        assertFalse(result.get("properties").get("people").get("properties").has("{personId}"));
    }

    @Test
    void fillTemplate_withEmptyValues_keepsAllPlaceholders() throws Exception {
        String templateJson = """
            {
                "type": "object",
                "properties": {
                    "{personId}": {
                        "type": "string"
                    }
                }
            }
            """;
        JsonNode template = objectMapper.readTree(templateJson);

        JsonNode result = SchemaTemplateTransformer.fillTemplate(template, Collections.emptyMap());

        assertTrue(result.get("properties").has("{personId}"));
    }

    @Test
    void fillTemplate_withNullTemplate_returnsNull() {
        JsonNode result = SchemaTemplateTransformer.fillTemplate(null, Map.of("personId", "test"));
        assertNull(result);
    }

    @Test
    void fillTemplate_withNonPlaceholderKeys_preservesKeys() throws Exception {
        String templateJson = """
            {
                "type": "object",
                "properties": {
                    "simpleChecks": {
                        "type": "object",
                        "properties": {
                            "ownerOccupant": { "type": "boolean" }
                        }
                    },
                    "{personId}": {
                        "type": "string"
                    }
                }
            }
            """;
        JsonNode template = objectMapper.readTree(templateJson);
        Map<String, Object> values = Map.of("personId", "applicant");

        JsonNode result = SchemaTemplateTransformer.fillTemplate(template, values);

        assertTrue(result.get("properties").has("simpleChecks"));
        assertTrue(result.get("properties").has("applicant"));
        assertFalse(result.get("properties").has("{personId}"));
    }

    @Test
    void fillTemplate_doesNotMutateOriginal() throws Exception {
        String templateJson = """
            {
                "type": "object",
                "properties": {
                    "{personId}": {
                        "type": "string"
                    }
                }
            }
            """;
        JsonNode template = objectMapper.readTree(templateJson);
        Map<String, Object> values = Map.of("personId", "applicant");

        SchemaTemplateTransformer.fillTemplate(template, values);

        // Original should still have the placeholder
        assertTrue(template.get("properties").has("{personId}"));
        assertFalse(template.get("properties").has("applicant"));
    }
}
