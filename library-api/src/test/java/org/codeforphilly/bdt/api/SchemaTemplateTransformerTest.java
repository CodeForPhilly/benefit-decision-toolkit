package org.codeforphilly.bdt.api;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for SchemaTemplateTransformer utility class.
 */
public class SchemaTemplateTransformerTest {

    @Test
    public void testFillTemplateSinglePlaceholder() throws IOException {
        String template = """
            {
              "type": "object",
              "properties": {
                "{person}": {
                  "type": "object",
                  "properties": {
                    "dateOfBirth": { "type": "string" }
                  }
                }
              }
            }
            """;

        JsonNode templateNode = SchemaTemplateTransformer.parseSchema(template);
        JsonNode filled = SchemaTemplateTransformer.fillTemplate(templateNode, Map.of("person", "client"));

        assertTrue(filled.has("properties"));
        assertTrue(filled.get("properties").has("client"));
        assertFalse(filled.get("properties").has("{person}"));

        JsonNode clientNode = filled.get("properties").get("client");
        assertTrue(clientNode.has("properties"));
        assertTrue(clientNode.get("properties").has("dateOfBirth"));
    }

    @Test
    public void testFillTemplateMultiplePlaceholders() throws IOException {
        String template = """
            {
              "type": "object",
              "properties": {
                "{person1}": {
                  "type": "object",
                  "properties": {
                    "dateOfBirth": { "type": "string" },
                    "enrollments": { "type": "array", "items": { "type": "string" } }
                  }
                },
                "{person2}": {
                  "type": "object",
                  "properties": {
                    "dateOfBirth": { "type": "string" }
                  }
                }
              }
            }
            """;

        JsonNode templateNode = SchemaTemplateTransformer.parseSchema(template);
        JsonNode filled = SchemaTemplateTransformer.fillTemplate(templateNode,
            Map.of("person1", "applicant", "person2", "spouse"));

        JsonNode properties = filled.get("properties");
        assertTrue(properties.has("applicant"));
        assertTrue(properties.has("spouse"));
        assertFalse(properties.has("{person1}"));
        assertFalse(properties.has("{person2}"));

        // Verify applicant has both dateOfBirth and enrollments
        assertTrue(properties.get("applicant").get("properties").has("dateOfBirth"));
        assertTrue(properties.get("applicant").get("properties").has("enrollments"));

        // Verify spouse has only dateOfBirth
        assertTrue(properties.get("spouse").get("properties").has("dateOfBirth"));
        assertFalse(properties.get("spouse").get("properties").has("enrollments"));
    }

    @Test
    public void testFillTemplatePreservesNonPlaceholders() throws IOException {
        String template = """
            {
              "type": "object",
              "properties": {
                "{person}": {
                  "type": "object",
                  "properties": {
                    "name": { "type": "string" }
                  }
                },
                "parameters": {
                  "type": "object",
                  "properties": {
                    "minAge": { "type": "number" }
                  }
                }
              }
            }
            """;

        JsonNode templateNode = SchemaTemplateTransformer.parseSchema(template);
        JsonNode filled = SchemaTemplateTransformer.fillTemplate(templateNode, Map.of("person", "client"));

        JsonNode properties = filled.get("properties");
        assertTrue(properties.has("client"));
        assertTrue(properties.has("parameters"));
        assertTrue(properties.get("parameters").get("properties").has("minAge"));
    }

    @Test
    public void testFillTemplateWithMissingValue() throws IOException {
        String template = """
            {
              "type": "object",
              "properties": {
                "{person}": {
                  "type": "object",
                  "properties": {
                    "name": { "type": "string" }
                  }
                }
              }
            }
            """;

        JsonNode templateNode = SchemaTemplateTransformer.parseSchema(template);
        // Pass empty map - placeholder should remain unchanged
        JsonNode filled = SchemaTemplateTransformer.fillTemplate(templateNode, Map.of());

        assertTrue(filled.get("properties").has("{person}"));
    }

    @Test
    public void testFlattenTemplateSinglePlaceholder() throws IOException {
        String template = """
            {
              "type": "object",
              "properties": {
                "{person}": {
                  "type": "object",
                  "properties": {
                    "dateOfBirth": { "type": "string" },
                    "enrollments": { "type": "array", "items": { "type": "string" } }
                  }
                }
              }
            }
            """;

        JsonNode templateNode = SchemaTemplateTransformer.parseSchema(template);
        JsonNode flattened = SchemaTemplateTransformer.flattenTemplate(templateNode);

        // Should not have properties with placeholders
        assertFalse(flattened.has("properties"));

        // Should have additionalProperties
        assertTrue(flattened.has("additionalProperties"));
        JsonNode additionalProps = flattened.get("additionalProperties");
        assertEquals("object", additionalProps.get("type").asText());
        assertTrue(additionalProps.get("properties").has("dateOfBirth"));
        assertTrue(additionalProps.get("properties").has("enrollments"));
    }

    @Test
    public void testFlattenTemplateMultiplePlaceholders() throws IOException {
        String template = """
            {
              "type": "object",
              "properties": {
                "{person1}": {
                  "type": "object",
                  "properties": {
                    "dateOfBirth": { "type": "string" },
                    "enrollments": { "type": "array", "items": { "type": "string" } }
                  }
                },
                "{person2}": {
                  "type": "object",
                  "properties": {
                    "dateOfBirth": { "type": "string" }
                  }
                }
              }
            }
            """;

        JsonNode templateNode = SchemaTemplateTransformer.parseSchema(template);
        JsonNode flattened = SchemaTemplateTransformer.flattenTemplate(templateNode);

        assertTrue(flattened.has("additionalProperties"));
        JsonNode additionalProps = flattened.get("additionalProperties");

        // Should have merged properties from both placeholders
        assertTrue(additionalProps.get("properties").has("dateOfBirth"));
        assertTrue(additionalProps.get("properties").has("enrollments"));
    }

    @Test
    public void testFlattenTemplatePreservesNonPlaceholders() throws IOException {
        String template = """
            {
              "type": "object",
              "properties": {
                "{person}": {
                  "type": "object",
                  "properties": {
                    "name": { "type": "string" }
                  }
                },
                "parameters": {
                  "type": "object",
                  "properties": {
                    "minAge": { "type": "number" }
                  }
                }
              }
            }
            """;

        JsonNode templateNode = SchemaTemplateTransformer.parseSchema(template);
        JsonNode flattened = SchemaTemplateTransformer.flattenTemplate(templateNode);

        // Non-placeholder properties should be preserved
        assertTrue(flattened.has("properties"));
        assertTrue(flattened.get("properties").has("parameters"));

        // Placeholder should be converted to additionalProperties
        assertTrue(flattened.has("additionalProperties"));
    }

    @Test
    public void testExtractPlaceholders() throws IOException {
        String template = """
            {
              "type": "object",
              "properties": {
                "{person1}": {
                  "type": "object",
                  "properties": {
                    "nested": {
                      "type": "object",
                      "properties": {
                        "{nestedPlaceholder}": { "type": "string" }
                      }
                    }
                  }
                },
                "{person2}": { "type": "object" },
                "regularProp": { "type": "string" }
              }
            }
            """;

        JsonNode templateNode = SchemaTemplateTransformer.parseSchema(template);
        Set<String> placeholders = SchemaTemplateTransformer.extractPlaceholders(templateNode);

        assertTrue(placeholders.contains("person1"));
        assertTrue(placeholders.contains("person2"));
        assertTrue(placeholders.contains("nestedPlaceholder"));
        assertEquals(3, placeholders.size());
    }

    @Test
    public void testHasPlaceholders() throws IOException {
        String withPlaceholders = """
            {
              "type": "object",
              "properties": {
                "{person}": { "type": "object" }
              }
            }
            """;

        String withoutPlaceholders = """
            {
              "type": "object",
              "properties": {
                "person": { "type": "object" }
              }
            }
            """;

        assertTrue(SchemaTemplateTransformer.hasPlaceholders(
            SchemaTemplateTransformer.parseSchema(withPlaceholders)));
        assertFalse(SchemaTemplateTransformer.hasPlaceholders(
            SchemaTemplateTransformer.parseSchema(withoutPlaceholders)));
    }

    @Test
    public void testNestedFillTemplate() throws IOException {
        String template = """
            {
              "type": "object",
              "properties": {
                "household": {
                  "type": "object",
                  "properties": {
                    "{member}": {
                      "type": "object",
                      "properties": {
                        "age": { "type": "number" }
                      }
                    }
                  }
                }
              }
            }
            """;

        JsonNode templateNode = SchemaTemplateTransformer.parseSchema(template);
        JsonNode filled = SchemaTemplateTransformer.fillTemplate(templateNode, Map.of("member", "parent"));

        JsonNode householdProps = filled.get("properties").get("household").get("properties");
        assertTrue(householdProps.has("parent"));
        assertFalse(householdProps.has("{member}"));
    }

    @Test
    public void testFlattenNestedPlaceholders() throws IOException {
        String template = """
            {
              "type": "object",
              "properties": {
                "household": {
                  "type": "object",
                  "properties": {
                    "{member1}": {
                      "type": "object",
                      "properties": {
                        "age": { "type": "number" },
                        "income": { "type": "number" }
                      }
                    },
                    "{member2}": {
                      "type": "object",
                      "properties": {
                        "age": { "type": "number" }
                      }
                    }
                  }
                }
              }
            }
            """;

        JsonNode templateNode = SchemaTemplateTransformer.parseSchema(template);
        JsonNode flattened = SchemaTemplateTransformer.flattenTemplate(templateNode);

        JsonNode household = flattened.get("properties").get("household");
        assertTrue(household.has("additionalProperties"));

        JsonNode additionalProps = household.get("additionalProperties");
        // Should have merged properties from both placeholders
        assertTrue(additionalProps.get("properties").has("age"));
        assertTrue(additionalProps.get("properties").has("income"));
    }

    @Test
    public void testLoadSchemaTemplateFromFile() throws IOException {
        // Test loading the actual schema template file we created
        try (InputStream is = getClass().getResourceAsStream(
                "/checks/age/person-min-age.schema.json")) {
            assertNotNull(is, "Schema template file should exist");
            JsonNode schema = SchemaTemplateTransformer.parseSchema(is);

            assertTrue(SchemaTemplateTransformer.hasPlaceholders(schema));

            Set<String> placeholders = SchemaTemplateTransformer.extractPlaceholders(schema);
            assertTrue(placeholders.contains("personId"));
        }
    }

    @Test
    public void testNullHandling() {
        assertNull(SchemaTemplateTransformer.fillTemplate(null, Map.of()));
        assertNull(SchemaTemplateTransformer.flattenTemplate(null));
        assertTrue(SchemaTemplateTransformer.extractPlaceholders(null).isEmpty());
        assertFalse(SchemaTemplateTransformer.hasPlaceholders(null));
    }

    @Test
    public void testToJsonString() throws IOException {
        String template = """
            {"type":"object","properties":{"{person}":{"type":"string"}}}
            """;

        JsonNode node = SchemaTemplateTransformer.parseSchema(template);
        String json = SchemaTemplateTransformer.toJsonString(node);

        assertNotNull(json);
        assertTrue(json.contains("\"type\""));
        assertTrue(json.contains("\"properties\""));
    }

    @Test
    public void testFillTemplateWithArrayExpansion() throws IOException {
        String template = """
            {
              "type": "object",
              "properties": {
                "situation": {
                  "type": "object",
                  "properties": {
                    "people": {
                      "type": "object",
                      "properties": {
                        "{peopleIds}": {
                          "type": "object",
                          "properties": {
                            "dateOfBirth": { "type": "string" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            """;

        JsonNode templateNode = SchemaTemplateTransformer.parseSchema(template);

        // When value is a List, each element becomes a separate property
        JsonNode filled = SchemaTemplateTransformer.fillTemplate(templateNode,
            Map.of("peopleIds", List.of("alice", "bob", "charlie")));

        JsonNode people = filled.get("properties").get("situation")
            .get("properties").get("people").get("properties");

        // Should have expanded into three separate properties
        assertTrue(people.has("alice"));
        assertTrue(people.has("bob"));
        assertTrue(people.has("charlie"));
        assertFalse(people.has("{peopleIds}"));

        // Each should have the same schema
        assertTrue(people.get("alice").get("properties").has("dateOfBirth"));
        assertTrue(people.get("bob").get("properties").has("dateOfBirth"));
        assertTrue(people.get("charlie").get("properties").has("dateOfBirth"));
    }

    @Test
    public void testFillTemplateWithEmptyArray() throws IOException {
        String template = """
            {
              "type": "object",
              "properties": {
                "{items}": { "type": "object" }
              }
            }
            """;

        JsonNode templateNode = SchemaTemplateTransformer.parseSchema(template);
        JsonNode filled = SchemaTemplateTransformer.fillTemplate(templateNode,
            Map.of("items", List.of()));

        // Empty array should result in no properties from that placeholder
        assertEquals(0, filled.get("properties").size());
    }

    @Test
    public void testFillTemplateMixedStringAndArray() throws IOException {
        String template = """
            {
              "type": "object",
              "properties": {
                "{person}": {
                  "type": "object",
                  "properties": {
                    "name": { "type": "string" }
                  }
                },
                "{items}": {
                  "type": "object",
                  "properties": {
                    "value": { "type": "number" }
                  }
                }
              }
            }
            """;

        JsonNode templateNode = SchemaTemplateTransformer.parseSchema(template);

        // Mix of single string and array values
        Map<String, Object> values = Map.of(
            "person", "client",
            "items", List.of("item1", "item2")
        );
        JsonNode filled = SchemaTemplateTransformer.fillTemplate(templateNode, values);

        JsonNode props = filled.get("properties");

        // Single replacement
        assertTrue(props.has("client"));
        assertTrue(props.get("client").get("properties").has("name"));

        // Array expansion
        assertTrue(props.has("item1"));
        assertTrue(props.has("item2"));
        assertTrue(props.get("item1").get("properties").has("value"));
        assertTrue(props.get("item2").get("properties").has("value"));
    }

    @Test
    public void testLoadSomeoneMinAgeSchemaTemplate() throws IOException {
        // Test the someone-min-age schema which uses {peopleIds} placeholder
        try (InputStream is = getClass().getResourceAsStream(
                "/checks/age/someone-min-age.schema.json")) {
            assertNotNull(is, "Schema template file should exist");
            JsonNode schema = SchemaTemplateTransformer.parseSchema(is);

            assertTrue(SchemaTemplateTransformer.hasPlaceholders(schema));

            Set<String> placeholders = SchemaTemplateTransformer.extractPlaceholders(schema);
            assertTrue(placeholders.contains("peopleIds"));
        }
    }
}
