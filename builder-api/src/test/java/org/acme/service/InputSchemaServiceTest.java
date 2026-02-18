package org.acme.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.acme.model.domain.CheckConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class InputSchemaServiceTest {

    private InputSchemaService service;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        service = new InputSchemaService();
        objectMapper = new ObjectMapper();
    }

    // ==== transformPeopleSchema tests ====

    @Test
    void transformPeopleSchema_withPeopleArrayAndPersonId_transformsToObject() throws Exception {
        String schemaJson = """
            {
                "type": "object",
                "properties": {
                    "people": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "dateOfBirth": { "type": "string", "format": "date" }
                            }
                        }
                    }
                }
            }
            """;
        JsonNode schema = objectMapper.readTree(schemaJson);

        JsonNode result = service.transformPeopleSchema(schema, "applicant");

        // Verify people is now an object with personId key
        assertTrue(result.has("properties"));
        JsonNode people = result.get("properties").get("people");
        assertEquals("object", people.get("type").asText());
        assertTrue(people.has("properties"));
        assertTrue(people.get("properties").has("applicant"));
        // Verify the items schema is nested under the personId
        assertTrue(people.get("properties").get("applicant").has("properties"));
        assertTrue(people.get("properties").get("applicant").get("properties").has("dateOfBirth"));
    }

    @Test
    void transformPeopleSchema_withoutPersonId_returnsOriginal() throws Exception {
        String schemaJson = """
            {
                "type": "object",
                "properties": {
                    "people": {
                        "type": "array",
                        "items": { "type": "object", "properties": { "dateOfBirth": { "type": "string" } } }
                    }
                }
            }
            """;
        JsonNode schema = objectMapper.readTree(schemaJson);

        JsonNode result = service.transformPeopleSchema(schema, null);

        // Should return a copy of the original
        assertEquals("array", result.get("properties").get("people").get("type").asText());
    }

    @Test
    void transformPeopleSchema_withoutPeopleProperty_returnsOriginal() throws Exception {
        String schemaJson = """
            {
                "type": "object",
                "properties": {
                    "income": { "type": "number" }
                }
            }
            """;
        JsonNode schema = objectMapper.readTree(schemaJson);

        JsonNode result = service.transformPeopleSchema(schema, "applicant");

        // Should return a copy of the original
        assertTrue(result.get("properties").has("income"));
        assertFalse(result.get("properties").has("people"));
    }

    // ==== transformEnrollmentsSchema tests ====

    @Test
    void transformEnrollmentsSchema_withEnrollmentsAndPersonId_movesUnderPeople() throws Exception {
        String schemaJson = """
            {
                "type": "object",
                "properties": {
                    "enrollments": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "personId": { "type": "string" },
                                "benefit": { "type": "string" }
                            }
                        }
                    }
                }
            }
            """;
        JsonNode schema = objectMapper.readTree(schemaJson);

        JsonNode result = service.transformEnrollmentsSchema(schema, "applicant");

        // Verify top-level enrollments is removed
        assertFalse(result.get("properties").has("enrollments"));

        // Verify people.applicant.enrollments exists
        assertTrue(result.get("properties").has("people"));
        JsonNode people = result.get("properties").get("people");
        assertEquals("object", people.get("type").asText());
        assertTrue(people.get("properties").has("applicant"));

        JsonNode applicant = people.get("properties").get("applicant");
        assertTrue(applicant.get("properties").has("enrollments"));

        // Verify enrollments is now array of strings
        JsonNode enrollments = applicant.get("properties").get("enrollments");
        assertEquals("array", enrollments.get("type").asText());
        assertEquals("string", enrollments.get("items").get("type").asText());
    }

    @Test
    void transformEnrollmentsSchema_withExistingPeopleStructure_mergesEnrollments() throws Exception {
        // Simulate a schema that already has people transformed (e.g., from transformPeopleSchema)
        String schemaJson = """
            {
                "type": "object",
                "properties": {
                    "people": {
                        "type": "object",
                        "properties": {
                            "applicant": {
                                "type": "object",
                                "properties": {
                                    "dateOfBirth": { "type": "string", "format": "date" }
                                }
                            }
                        }
                    },
                    "enrollments": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "personId": { "type": "string" },
                                "benefit": { "type": "string" }
                            }
                        }
                    }
                }
            }
            """;
        JsonNode schema = objectMapper.readTree(schemaJson);

        JsonNode result = service.transformEnrollmentsSchema(schema, "applicant");

        // Verify top-level enrollments is removed
        assertFalse(result.get("properties").has("enrollments"));

        // Verify people.applicant now has both dateOfBirth and enrollments
        JsonNode applicant = result.get("properties").get("people").get("properties").get("applicant");
        assertTrue(applicant.get("properties").has("dateOfBirth"));
        assertTrue(applicant.get("properties").has("enrollments"));
    }

    @Test
    void transformEnrollmentsSchema_withoutPersonId_returnsOriginal() throws Exception {
        String schemaJson = """
            {
                "type": "object",
                "properties": {
                    "enrollments": {
                        "type": "array",
                        "items": { "type": "object", "properties": { "benefit": { "type": "string" } } }
                    }
                }
            }
            """;
        JsonNode schema = objectMapper.readTree(schemaJson);

        JsonNode result = service.transformEnrollmentsSchema(schema, null);

        // Should return a copy of the original
        assertTrue(result.get("properties").has("enrollments"));
    }

    @Test
    void transformEnrollmentsSchema_withoutEnrollmentsProperty_returnsOriginal() throws Exception {
        String schemaJson = """
            {
                "type": "object",
                "properties": {
                    "income": { "type": "number" }
                }
            }
            """;
        JsonNode schema = objectMapper.readTree(schemaJson);

        JsonNode result = service.transformEnrollmentsSchema(schema, "applicant");

        // Should return a copy of the original
        assertTrue(result.get("properties").has("income"));
        assertFalse(result.get("properties").has("enrollments"));
    }

    // ==== transformInputDefinitionSchema composition tests ====

    @Test
    void transformInputDefinitionSchema_withPeopleAndEnrollments_appliesBothTransforms() throws Exception {
        String schemaJson = """
            {
                "type": "object",
                "properties": {
                    "people": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "dateOfBirth": { "type": "string", "format": "date" }
                            }
                        }
                    },
                    "enrollments": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "personId": { "type": "string" },
                                "benefit": { "type": "string" }
                            }
                        }
                    }
                }
            }
            """;
        JsonNode inputDefinition = objectMapper.readTree(schemaJson);

        CheckConfig checkConfig = new CheckConfig();
        checkConfig.setInputDefinition(inputDefinition);
        Map<String, Object> params = new HashMap<>();
        params.put("personId", "applicant");
        checkConfig.setParameters(params);

        JsonNode result = service.transformInputDefinitionSchema(checkConfig);

        // Verify top-level enrollments is removed
        assertFalse(result.get("properties").has("enrollments"));

        // Verify people.applicant has both dateOfBirth and enrollments
        JsonNode applicant = result.get("properties").get("people").get("properties").get("applicant");
        assertTrue(applicant.get("properties").has("dateOfBirth"));
        assertTrue(applicant.get("properties").has("enrollments"));
        assertEquals("string", applicant.get("properties").get("enrollments").get("items").get("type").asText());
    }

    // ==== extractJsonSchemaPaths tests ====

    @Test
    void extractJsonSchemaPaths_withTransformedSchema_extractsCorrectPaths() throws Exception {
        String schemaJson = """
            {
                "type": "object",
                "properties": {
                    "people": {
                        "type": "object",
                        "properties": {
                            "applicant": {
                                "type": "object",
                                "properties": {
                                    "dateOfBirth": { "type": "string", "format": "date" },
                                    "enrollments": {
                                        "type": "array",
                                        "items": { "type": "string" }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            """;
        JsonNode schema = objectMapper.readTree(schemaJson);

        List<String> paths = service.extractJsonSchemaPaths(schema);

        assertTrue(paths.contains("people.applicant.dateOfBirth"));
        assertTrue(paths.contains("people.applicant.enrollments"));
        assertEquals(2, paths.size());
    }

    @Test
    void extractJsonSchemaPaths_withEnrollmentOnlySchema_extractsCorrectPath() throws Exception {
        // This tests the result after transformEnrollmentsSchema is applied to an enrollment-only check
        String schemaJson = """
            {
                "type": "object",
                "properties": {
                    "people": {
                        "type": "object",
                        "properties": {
                            "applicant": {
                                "type": "object",
                                "properties": {
                                    "enrollments": {
                                        "type": "array",
                                        "items": { "type": "string" }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            """;
        JsonNode schema = objectMapper.readTree(schemaJson);

        List<String> paths = service.extractJsonSchemaPaths(schema);

        assertTrue(paths.contains("people.applicant.enrollments"));
        assertEquals(1, paths.size());
    }
}
