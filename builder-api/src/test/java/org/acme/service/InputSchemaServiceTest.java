package org.acme.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.acme.model.domain.CheckConfig;
import org.acme.model.domain.FormPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Collections;
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
    void transformPeopleSchema_withPeopleArrayAndSinglePersonId_transformsToObject() throws Exception {
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

        JsonNode result = service.transformPeopleSchema(schema, List.of("applicant"));

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
    void transformPeopleSchema_withMultiplePersonIds_transformsToObjectWithMultipleKeys() throws Exception {
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

        JsonNode result = service.transformPeopleSchema(schema, List.of("applicant", "spouse", "child"));

        // Verify people is now an object with all personId keys
        assertTrue(result.has("properties"));
        JsonNode people = result.get("properties").get("people");
        assertEquals("object", people.get("type").asText());
        assertTrue(people.has("properties"));

        // Verify all three personIds are present
        assertTrue(people.get("properties").has("applicant"));
        assertTrue(people.get("properties").get("applicant").get("properties").has("dateOfBirth"));
        assertTrue(people.get("properties").has("spouse"));
        assertTrue(people.get("properties").get("spouse").get("properties").has("dateOfBirth"));
        assertTrue(people.get("properties").has("child"));
        assertTrue(people.get("properties").get("child").get("properties").has("dateOfBirth"));
    }

    @Test
    void transformPeopleSchema_withoutPersonIds_returnsOriginal() throws Exception {
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

        JsonNode result = service.transformPeopleSchema(schema, Collections.emptyList());

        // Should return a copy of the original
        assertEquals("array", result.get("properties").get("people").get("type").asText());
    }

    @Test
    void transformPeopleSchema_withNullPersonIds_returnsOriginal() throws Exception {
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

        JsonNode result = service.transformPeopleSchema(schema, List.of("applicant"));

        // Should return a copy of the original
        assertTrue(result.get("properties").has("income"));
        assertFalse(result.get("properties").has("people"));
    }

    // ==== transformEnrollmentsSchema tests ====

    @Test
    void transformEnrollmentsSchema_withEnrollmentsAndSinglePersonId_movesUnderPeople() throws Exception {
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

        JsonNode result = service.transformEnrollmentsSchema(schema, List.of("applicant"));

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
    void transformEnrollmentsSchema_withMultiplePersonIds_movesUnderAllPeople() throws Exception {
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

        JsonNode result = service.transformEnrollmentsSchema(schema, List.of("applicant", "spouse"));

        // Verify top-level enrollments is removed
        assertFalse(result.get("properties").has("enrollments"));

        // Verify people structure exists
        assertTrue(result.get("properties").has("people"));
        JsonNode people = result.get("properties").get("people");
        assertEquals("object", people.get("type").asText());

        // Verify both personIds have enrollments
        assertTrue(people.get("properties").has("applicant"));
        assertTrue(people.get("properties").has("spouse"));

        JsonNode applicant = people.get("properties").get("applicant");
        JsonNode spouse = people.get("properties").get("spouse");

        assertTrue(applicant.get("properties").has("enrollments"));
        assertTrue(spouse.get("properties").has("enrollments"));

        // Verify enrollments is array of strings for both
        assertEquals("array", applicant.get("properties").get("enrollments").get("type").asText());
        assertEquals("array", spouse.get("properties").get("enrollments").get("type").asText());
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

        JsonNode result = service.transformEnrollmentsSchema(schema, List.of("applicant"));

        // Verify top-level enrollments is removed
        assertFalse(result.get("properties").has("enrollments"));

        // Verify people.applicant now has both dateOfBirth and enrollments
        JsonNode applicant = result.get("properties").get("people").get("properties").get("applicant");
        assertTrue(applicant.get("properties").has("dateOfBirth"));
        assertTrue(applicant.get("properties").has("enrollments"));
    }

    @Test
    void transformEnrollmentsSchema_withoutPersonIds_returnsOriginal() throws Exception {
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

        JsonNode result = service.transformEnrollmentsSchema(schema, Collections.emptyList());

        // Should return a copy of the original
        assertTrue(result.get("properties").has("enrollments"));
    }

    @Test
    void transformEnrollmentsSchema_withNullPersonIds_returnsOriginal() throws Exception {
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

        JsonNode result = service.transformEnrollmentsSchema(schema, List.of("applicant"));

        // Should return a copy of the original
        assertTrue(result.get("properties").has("income"));
        assertFalse(result.get("properties").has("enrollments"));
    }

    // ==== transformInputDefinitionSchema composition tests ====

    @Test
    void transformInputDefinitionSchema_withPersonId_appliesBothTransforms() throws Exception {
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

    @Test
    void transformInputDefinitionSchema_withPeopleIds_appliesBothTransformsForAllIds() throws Exception {
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
        params.put("peopleIds", List.of("applicant", "spouse", "child"));
        checkConfig.setParameters(params);

        JsonNode result = service.transformInputDefinitionSchema(checkConfig);

        // Verify top-level enrollments is removed
        assertFalse(result.get("properties").has("enrollments"));

        // Verify all three personIds exist under people and have both dateOfBirth and enrollments
        JsonNode peopleProps = result.get("properties").get("people").get("properties");
        for (String personId : List.of("applicant", "spouse", "child")) {
            assertTrue(peopleProps.has(personId));
            JsonNode person = peopleProps.get(personId);
            assertTrue(person.get("properties").has("dateOfBirth"), personId + " should have dateOfBirth");
            assertTrue(person.get("properties").has("enrollments"), personId + " should have enrollments");
        }
    }

    @Test
    void transformInputDefinitionSchema_withBothPersonIdAndPeopleIds_combinesBoth() throws Exception {
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
        JsonNode inputDefinition = objectMapper.readTree(schemaJson);

        CheckConfig checkConfig = new CheckConfig();
        checkConfig.setInputDefinition(inputDefinition);
        Map<String, Object> params = new HashMap<>();
        params.put("personId", "applicant");
        params.put("peopleIds", List.of("spouse", "child"));
        checkConfig.setParameters(params);

        JsonNode result = service.transformInputDefinitionSchema(checkConfig);

        // Verify all three personIds exist (personId + peopleIds combined)
        JsonNode peopleProps = result.get("properties").get("people").get("properties");
        assertTrue(peopleProps.has("applicant"));
        assertTrue(peopleProps.has("spouse"));
        assertTrue(peopleProps.has("child"));
    }

    @Test
    void transformInputDefinitionSchema_withNoPersonParams_returnsOriginalStructure() throws Exception {
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
        JsonNode inputDefinition = objectMapper.readTree(schemaJson);

        CheckConfig checkConfig = new CheckConfig();
        checkConfig.setInputDefinition(inputDefinition);
        Map<String, Object> params = new HashMap<>();
        params.put("minAge", 65); // Some other parameter, not personId/peopleIds
        checkConfig.setParameters(params);

        JsonNode result = service.transformInputDefinitionSchema(checkConfig);

        // Should return people as array (no transformation)
        assertEquals("array", result.get("properties").get("people").get("type").asText());
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

        List<FormPath> paths = service.extractJsonSchemaPaths(schema);

        assertTrue(paths.contains(new FormPath("people.applicant.dateOfBirth", "string")));
        assertTrue(paths.contains(new FormPath("people.applicant.enrollments", "array")));
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

        List<FormPath> paths = service.extractJsonSchemaPaths(schema);

        assertTrue(paths.contains(new FormPath("people.applicant.enrollments", "array")));
        assertEquals(1, paths.size());
    }

    @Test
    void extractJsonSchemaPaths_withMultiplePersonIds_extractsPathsForAll() throws Exception {
        // This tests the result after transformation with multiple peopleIds
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
                            },
                            "spouse": {
                                "type": "object",
                                "properties": {
                                    "dateOfBirth": { "type": "string", "format": "date" }
                                }
                            }
                        }
                    }
                }
            }
            """;
        JsonNode schema = objectMapper.readTree(schemaJson);

        List<FormPath> paths = service.extractJsonSchemaPaths(schema);

        assertTrue(paths.contains(new FormPath("people.applicant.dateOfBirth", "string")));
        assertTrue(paths.contains(new FormPath("people.spouse.dateOfBirth", "string")));
        assertEquals(2, paths.size());
    }
}
