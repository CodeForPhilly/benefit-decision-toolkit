package org.acme.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.acme.model.domain.Benefit;
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

    // ==== extractJsonSchemaPaths tests ====

    @Test
    void extractJsonSchemaPaths_withSimpleSchema_extractsCorrectPaths() throws Exception {
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
                    }
                }
            }
            """;
        JsonNode schema = objectMapper.readTree(schemaJson);

        List<FormPath> paths = service.extractJsonSchemaPaths(schema);

        assertTrue(paths.contains(new FormPath("people.applicant.dateOfBirth", "date")));
        assertEquals(1, paths.size());
    }

    @Test
    void extractJsonSchemaPaths_withArrayProperty_extractsCorrectPaths() throws Exception {
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

        assertTrue(paths.contains(new FormPath("people.applicant.dateOfBirth", "date")));
        assertTrue(paths.contains(new FormPath("people.applicant.enrollments", "array:string")));
        assertEquals(2, paths.size());
    }

    @Test
    void extractJsonSchemaPaths_withMultiplePersonIds_extractsPathsForAll() throws Exception {
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
        assertTrue(paths.contains(new FormPath("people.applicant.dateOfBirth", "date")));
        assertTrue(paths.contains(new FormPath("people.spouse.dateOfBirth", "date")));
        assertEquals(2, paths.size());
    }

    @Test
    void extractJsonSchemaPaths_skipsParametersProperty() throws Exception {
        String schemaJson = """
            {
                "type": "object",
                "properties": {
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "minAge": { "type": "number" }
                        }
                    },
                    "simpleChecks": {
                        "type": "object",
                        "properties": {
                            "ownerOccupant": { "type": "boolean" }
                        }
                    }
                }
            }
            """;
        JsonNode schema = objectMapper.readTree(schemaJson);

        List<FormPath> paths = service.extractJsonSchemaPaths(schema);

        // parameters should be skipped
        assertFalse(paths.stream().anyMatch(p -> p.getPath().startsWith("parameters")));
        assertTrue(paths.contains(new FormPath("simpleChecks.ownerOccupant", "boolean")));
        assertEquals(1, paths.size());
    }

    @Test
    void extractJsonSchemaPaths_skipsIdProperties() throws Exception {
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
                                    "id": { "type": "string" },
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

        // id should be skipped
        assertFalse(paths.stream().anyMatch(p -> p.getPath().endsWith(".id")));
        assertTrue(paths.contains(new FormPath("people.applicant.dateOfBirth", "date")));
        assertEquals(1, paths.size());
    }

    // ==== extractUniqueInputPaths with fillTemplate tests ====

    @Test
    void extractUniqueInputPaths_withTemplateAndPersonId_fillsTemplateAndExtractsPaths() throws Exception {
        // x-template-schema style with {personId} placeholder
        String schemaJson = """
            {
                "type": "object",
                "properties": {
                    "people": {
                        "type": "object",
                        "properties": {
                            "{personId}": {
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
        JsonNode inputDefinition = objectMapper.readTree(schemaJson);

        CheckConfig checkConfig = new CheckConfig();
        checkConfig.setInputDefinition(inputDefinition);
        Map<String, Object> params = new HashMap<>();
        params.put("personId", "applicant");
        checkConfig.setParameters(params);

        Benefit benefit = new Benefit();
        benefit.setChecks(List.of(checkConfig));

        List<FormPath> paths = service.extractUniqueInputPaths(List.of(benefit));

        assertTrue(paths.contains(new FormPath("people.applicant.dateOfBirth", "date")));
        assertEquals(1, paths.size());
    }

    @Test
    void extractUniqueInputPaths_withTemplateAndPeopleIds_expandsTemplateForAllIds() throws Exception {
        // x-template-schema style with {personId} placeholder
        String schemaJson = """
            {
                "type": "object",
                "properties": {
                    "people": {
                        "type": "object",
                        "properties": {
                            "{personId}": {
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
        JsonNode inputDefinition = objectMapper.readTree(schemaJson);

        CheckConfig checkConfig = new CheckConfig();
        checkConfig.setInputDefinition(inputDefinition);
        Map<String, Object> params = new HashMap<>();
        // Using a list of personIds should expand the template for each one
        params.put("personId", List.of("applicant", "spouse", "child"));
        checkConfig.setParameters(params);

        Benefit benefit = new Benefit();
        benefit.setChecks(List.of(checkConfig));

        List<FormPath> paths = service.extractUniqueInputPaths(List.of(benefit));

        assertTrue(paths.contains(new FormPath("people.applicant.dateOfBirth", "date")));
        assertTrue(paths.contains(new FormPath("people.spouse.dateOfBirth", "date")));
        assertTrue(paths.contains(new FormPath("people.child.dateOfBirth", "date")));
        assertEquals(3, paths.size());
    }

    @Test
    void extractUniqueInputPaths_withNoTemplate_extractsPathsDirectly() throws Exception {
        // Schema without any {placeholder} - e.g., simpleChecks
        String schemaJson = """
            {
                "type": "object",
                "properties": {
                    "simpleChecks": {
                        "type": "object",
                        "properties": {
                            "ownerOccupant": { "type": "boolean" }
                        }
                    }
                }
            }
            """;
        JsonNode inputDefinition = objectMapper.readTree(schemaJson);

        CheckConfig checkConfig = new CheckConfig();
        checkConfig.setInputDefinition(inputDefinition);
        checkConfig.setParameters(Collections.emptyMap());

        Benefit benefit = new Benefit();
        benefit.setChecks(List.of(checkConfig));

        List<FormPath> paths = service.extractUniqueInputPaths(List.of(benefit));

        assertTrue(paths.contains(new FormPath("simpleChecks.ownerOccupant", "boolean")));
        assertEquals(1, paths.size());
    }

    @Test
    void extractUniqueInputPaths_withMultipleBenefits_deduplicatesPaths() throws Exception {
        // Two benefits with overlapping paths
        String schemaJson = """
            {
                "type": "object",
                "properties": {
                    "people": {
                        "type": "object",
                        "properties": {
                            "{personId}": {
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
        JsonNode inputDefinition = objectMapper.readTree(schemaJson);

        // First benefit with applicant
        CheckConfig check1 = new CheckConfig();
        check1.setInputDefinition(inputDefinition);
        Map<String, Object> params1 = new HashMap<>();
        params1.put("personId", "applicant");
        check1.setParameters(params1);

        // Second benefit also with applicant (same path)
        CheckConfig check2 = new CheckConfig();
        check2.setInputDefinition(inputDefinition);
        Map<String, Object> params2 = new HashMap<>();
        params2.put("personId", "applicant");
        check2.setParameters(params2);

        Benefit benefit1 = new Benefit();
        benefit1.setChecks(List.of(check1));

        Benefit benefit2 = new Benefit();
        benefit2.setChecks(List.of(check2));

        List<FormPath> paths = service.extractUniqueInputPaths(List.of(benefit1, benefit2));

        // Should only have one path (deduplicated)
        assertTrue(paths.contains(new FormPath("people.applicant.dateOfBirth", "date")));
        assertEquals(1, paths.size());
    }

    @Test
    void extractUniqueInputPaths_withNullInputDefinition_skipsCheck() throws Exception {
        CheckConfig checkConfig = new CheckConfig();
        checkConfig.setInputDefinition(null);
        checkConfig.setParameters(Collections.emptyMap());

        Benefit benefit = new Benefit();
        benefit.setChecks(List.of(checkConfig));

        List<FormPath> paths = service.extractUniqueInputPaths(List.of(benefit));

        assertTrue(paths.isEmpty());
    }

    @Test
    void extractUniqueInputPaths_withNullParameters_usesEmptyMap() throws Exception {
        String schemaJson = """
            {
                "type": "object",
                "properties": {
                    "simpleChecks": {
                        "type": "object",
                        "properties": {
                            "ownerOccupant": { "type": "boolean" }
                        }
                    }
                }
            }
            """;
        JsonNode inputDefinition = objectMapper.readTree(schemaJson);

        CheckConfig checkConfig = new CheckConfig();
        checkConfig.setInputDefinition(inputDefinition);
        checkConfig.setParameters(null);

        Benefit benefit = new Benefit();
        benefit.setChecks(List.of(checkConfig));

        List<FormPath> paths = service.extractUniqueInputPaths(List.of(benefit));

        assertTrue(paths.contains(new FormPath("simpleChecks.ownerOccupant", "boolean")));
        assertEquals(1, paths.size());
    }

    @Test
    void extractUniqueInputPaths_withUnfilledPlaceholder_keepsPlaceholderInPath() throws Exception {
        // If a placeholder isn't filled, it stays as-is in the schema
        String schemaJson = """
            {
                "type": "object",
                "properties": {
                    "people": {
                        "type": "object",
                        "properties": {
                            "{personId}": {
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
        JsonNode inputDefinition = objectMapper.readTree(schemaJson);

        CheckConfig checkConfig = new CheckConfig();
        checkConfig.setInputDefinition(inputDefinition);
        // No personId parameter provided
        checkConfig.setParameters(Collections.emptyMap());

        Benefit benefit = new Benefit();
        benefit.setChecks(List.of(checkConfig));

        List<FormPath> paths = service.extractUniqueInputPaths(List.of(benefit));

        // The placeholder remains unfilled
        assertTrue(paths.contains(new FormPath("people.{personId}.dateOfBirth", "date")));
        assertEquals(1, paths.size());
    }
}
