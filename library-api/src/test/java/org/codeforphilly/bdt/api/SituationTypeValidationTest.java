package org.codeforphilly.bdt.api;

import com.fasterxml.jackson.databind.JsonNode;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.inject.Inject;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Validates that all "situation" inputs in DMN models are proper subtypes of BDT.tSituation.
 *
 * This test ensures:
 * 1. BDT.dmn exists and defines tSituation with all expected fields (recursively)
 * 2. All DMN models with decision services that accept a "situation" parameter either:
 *    a) Reference BDT.tSituation directly (typeRef="BDT.tSituation"), OR
 *    b) Define a local tSituation type that is a valid subset of BDT.tSituation
 *       (all fields/nested fields exist in BDT.tSituation)
 *
 * Uses JSON schema comparison via DMNSchemaResolver to recursively validate nested types.
 */
@QuarkusTest
public class SituationTypeValidationTest {

    @Inject
    ModelRegistry modelRegistry;

    @Inject
    DMNSchemaResolver schemaResolver;

    private static final String DMN_NAMESPACE = "http://www.omg.org/spec/DMN/20180521/MODEL/";
    private static final String BDT_NAMESPACE = "https://kie.apache.org/dmn/_1B91A885-130A-4E0B-A762-E12AA6DD5C79";

    @Test
    public void testBdtDefinesTSituation() {
        // Find BDT tSituation schema in dmnDefinitions.json
        String bdtSchemaKey = findBdtTSituationSchemaKey();
        assertNotNull(bdtSchemaKey, "BDT.tSituation schema should exist in dmnDefinitions.json");

        JsonNode bdtSchema = schemaResolver.getSchema(bdtSchemaKey);
        assertNotNull(bdtSchema, "BDT.tSituation schema should be loadable");

        // Generate example to verify structure
        Map<String, Object> bdtExample = schemaResolver.generateExampleFromSchema(bdtSchema);
        assertFalse(bdtExample.isEmpty(), "BDT.tSituation should have fields");

        // Verify expected core fields exist
        assertTrue(bdtExample.containsKey("people"),
            "BDT.tSituation should define 'people' field");
        assertTrue(bdtExample.containsKey("primaryPersonId"),
            "BDT.tSituation should define 'primaryPersonId' field");

        System.out.println("BDT.tSituation schema key: " + bdtSchemaKey);
        System.out.println("BDT.tSituation example fields: " + bdtExample.keySet());
    }

    /**
     * Find the schema key for BDT.tSituation in dmnDefinitions.json.
     * Pattern: looks for a schema with x-dmn-type containing BDT namespace and tSituation.
     */
    private String findBdtTSituationSchemaKey() {
        Set<String> allKeys = schemaResolver.getAllSchemaKeys();
        for (String key : allKeys) {
            JsonNode schema = schemaResolver.getSchema(key);
            if (schema != null && schema.has("x-dmn-type")) {
                String dmnType = schema.get("x-dmn-type").asText();
                if (dmnType.contains(BDT_NAMESPACE) && dmnType.contains("tSituation")) {
                    return key;
                }
            }
        }
        return null;
    }

    @Test
    public void testAllSituationInputsAreValidSubtypes() throws Exception {
        Map<String, ModelInfo> allModels = modelRegistry.getAllModels();

        // Get all models with decision services (both benefits and checks)
        List<ModelInfo> modelsToValidate = allModels.values().stream()
            .filter(model -> model.getPath().startsWith("checks/") || model.getPath().startsWith("benefits/"))
            .filter(model -> !model.getDecisionServices().isEmpty())
            .collect(Collectors.toList());

        assertTrue(modelsToValidate.size() > 0,
            "Should have at least one model to validate");

        for (ModelInfo model : modelsToValidate) {
            validateSituationInput(model);
        }
    }

    private void validateSituationInput(ModelInfo model) throws Exception {
        // Load and parse the DMN file (add .dmn extension to path)
        String dmnPath = model.getPath() + ".dmn";
        InputStream dmnStream = getClass().getClassLoader()
            .getResourceAsStream(dmnPath);
        assertNotNull(dmnStream,
            "DMN file should exist at " + dmnPath);

        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(dmnStream);

        // Find inputData elements with name="situation"
        NodeList inputDataElements = doc.getElementsByTagNameNS(DMN_NAMESPACE, "inputData");
        Element situationInput = null;

        for (int i = 0; i < inputDataElements.getLength(); i++) {
            Element inputData = (Element) inputDataElements.item(i);
            if ("situation".equals(inputData.getAttribute("name"))) {
                situationInput = inputData;
                break;
            }
        }

        // Not all models have a situation input (e.g., utility models like Age.dmn)
        if (situationInput == null) {
            System.out.println("Skipping " + model.getPath() + " - no 'situation' input found");
            return;
        }

        // Find the variable element within inputData
        NodeList variables = situationInput.getElementsByTagNameNS(DMN_NAMESPACE, "variable");
        assertTrue(variables.getLength() > 0,
            model.getPath() + ": situation input must have a variable element");

        Element variable = (Element) variables.item(0);
        String typeRef = variable.getAttribute("typeRef");

        assertNotNull(typeRef,
            model.getPath() + ": situation variable must have a typeRef");
        assertFalse(typeRef.isEmpty(),
            model.getPath() + ": situation variable typeRef must not be empty");

        // Case 1: Direct reference to BDT.tSituation - this is always valid
        if ("BDT.tSituation".equals(typeRef)) {
            System.out.println("✓ " + model.getPath() + " uses BDT.tSituation directly");
            return;
        }

        // Case 2: Local tSituation reference - must validate it's a proper subset
        if ("tSituation".equals(typeRef)) {
            validateLocalTSituationType(model, doc);
            return;
        }

        // Any other typeRef is invalid
        fail(model.getPath() + ": situation variable has unexpected typeRef '" + typeRef +
            "'. Expected 'BDT.tSituation' or 'tSituation'");
    }

    private void validateLocalTSituationType(ModelInfo model, Document doc) {
        // Find BDT tSituation schema
        String bdtSchemaKey = findBdtTSituationSchemaKey();
        assertNotNull(bdtSchemaKey, "BDT.tSituation schema must exist");

        // Find local tSituation schema from dmnDefinitions.json
        String localSchemaKey = findLocalTSituationSchemaKey(model);
        if (localSchemaKey == null) {
            fail(model.getPath() + ": uses typeRef='tSituation' but schema not found in dmnDefinitions.json");
        }

        // Get schemas
        JsonNode bdtSchema = schemaResolver.getSchema(bdtSchemaKey);
        JsonNode localSchema = schemaResolver.getSchema(localSchemaKey);

        assertNotNull(bdtSchema, "BDT schema should exist");
        assertNotNull(localSchema, "Local schema should exist for " + model.getPath());

        // Check that local schema has properties (not empty/Any-only)
        if (!localSchema.has("properties") || !localSchema.get("properties").fields().hasNext()) {
            fail(model.getPath() + ": local tSituation must define at least one field from BDT.tSituation. " +
                "It currently has no fields (may just be typeRef='Any').");
        }

        // Recursively validate that local schema is subset of BDT schema
        List<String> invalidPaths = new ArrayList<>();
        validateSchemaSubset(bdtSchema, localSchema, "", invalidPaths);

        if (!invalidPaths.isEmpty()) {
            // Generate examples for error message
            Map<String, Object> bdtExample = schemaResolver.generateExampleFromSchema(bdtSchema);
            Map<String, Object> localExample = schemaResolver.generateExampleFromSchema(localSchema);

            fail(model.getPath() + ": local tSituation defines structure not compatible with BDT.tSituation.\n" +
                "Invalid paths: " + invalidPaths + "\n" +
                "Local example: " + localExample + "\n" +
                "BDT example: " + bdtExample);
        }

        // Generate example for success message
        Map<String, Object> localExample = schemaResolver.generateExampleFromSchema(localSchema);
        System.out.println("✓ " + model.getPath() + " uses valid local tSituation subset with fields: " +
            localExample.keySet());
    }

    /**
     * Find the schema key for a model's local tSituation type.
     * Pattern: {nsN}tSituation where N is the namespace number for the model.
     */
    private String findLocalTSituationSchemaKey(ModelInfo model) {
        String modelNamespace = model.getNamespace();
        Set<String> allKeys = schemaResolver.getAllSchemaKeys();

        for (String key : allKeys) {
            JsonNode schema = schemaResolver.getSchema(key);
            if (schema != null && schema.has("x-dmn-type")) {
                String dmnType = schema.get("x-dmn-type").asText();
                // Check if this is tSituation from the model's namespace
                if (dmnType.contains(modelNamespace) && dmnType.contains("tSituation")) {
                    return key;
                }
            }
        }
        return null;
    }

    /**
     * Recursively validate that local schema is a structural and type-compatible subset of BDT schema.
     * All fields/paths in local schema must exist in BDT schema with compatible types and formats.
     *
     * @param bdtSchema The canonical BDT schema node
     * @param localSchema The local schema node to validate
     * @param currentPath The current path in dot notation (for error reporting)
     * @param invalidPaths List to accumulate invalid paths found
     */
    private void validateSchemaSubset(JsonNode bdtSchema, JsonNode localSchema, String currentPath, List<String> invalidPaths) {
        // Resolve any $ref references
        JsonNode resolvedBdt = resolveSchemaRef(bdtSchema);
        JsonNode resolvedLocal = resolveSchemaRef(localSchema);

        // If local schema is null or missing, it's valid (no constraint)
        if (resolvedLocal == null || resolvedLocal.isNull()) {
            return;
        }

        // Check if local is unstructured (only x-dmn-type, no type/properties/items/$ref)
        boolean localHasStructure = resolvedLocal.has("type") ||
                                     resolvedLocal.has("properties") ||
                                     resolvedLocal.has("items") ||
                                     resolvedLocal.has("$ref");

        boolean bdtHasStructure = resolvedBdt.has("type") ||
                                  resolvedBdt.has("properties") ||
                                  resolvedBdt.has("items") ||
                                  resolvedBdt.has("$ref");

        // If BDT has structure but local doesn't, that's invalid
        if (bdtHasStructure && !localHasStructure) {
            String localType = resolvedLocal.has("x-dmn-type") ?
                resolvedLocal.get("x-dmn-type").asText() : "unknown";
            invalidPaths.add(currentPath +
                " [local uses unstructured type '" + localType +
                "' but BDT has structured type]");
            return;
        }

        // Handle object types (have "properties")
        if (resolvedLocal.has("properties")) {
            if (!resolvedBdt.has("properties")) {
                invalidPaths.add(currentPath + " [BDT is not an object but local is]");
                return;
            }

            JsonNode localProps = resolvedLocal.get("properties");
            JsonNode bdtProps = resolvedBdt.get("properties");

            // Check each local property
            localProps.fields().forEachRemaining(entry -> {
                String fieldName = entry.getKey();
                String newPath = currentPath.isEmpty() ? fieldName : currentPath + "." + fieldName;

                // Check if field exists in BDT
                if (!bdtProps.has(fieldName)) {
                    invalidPaths.add(newPath + " [field does not exist in BDT]");
                    return;
                }

                // Recursively validate the field's schema
                validateSchemaSubset(bdtProps.get(fieldName), entry.getValue(), newPath, invalidPaths);
            });
            return;
        }

        // Handle array types (have "items")
        if (resolvedLocal.has("items")) {
            if (!resolvedBdt.has("items")) {
                invalidPaths.add(currentPath + " [BDT is not an array but local is]");
                return;
            }

            String newPath = currentPath + "[]";
            validateSchemaSubset(resolvedBdt.get("items"), resolvedLocal.get("items"), newPath, invalidPaths);
            return;
        }

        // Handle primitive types - check type and format compatibility
        String localType = resolvedLocal.has("type") ? resolvedLocal.get("type").asText() : null;
        String bdtType = resolvedBdt.has("type") ? resolvedBdt.get("type").asText() : null;

        if (localType != null && bdtType != null && !localType.equals(bdtType)) {
            invalidPaths.add(currentPath + " [type mismatch: BDT has " + bdtType + ", local has " + localType + "]");
            return;
        }

        // Check format (important for date vs string distinction)
        String localFormat = resolvedLocal.has("format") ? resolvedLocal.get("format").asText() : null;
        String bdtFormat = resolvedBdt.has("format") ? resolvedBdt.get("format").asText() : null;

        // Both should have same format, or both should have no format
        if (!Objects.equals(localFormat, bdtFormat)) {
            String localDesc = localFormat != null ? localFormat : "no format";
            String bdtDesc = bdtFormat != null ? bdtFormat : "no format";
            invalidPaths.add(currentPath + " [format mismatch: BDT has " + bdtDesc + ", local has " + localDesc + "]");
        }
    }

    /**
     * Resolve a JSON Schema $ref to get the actual schema definition.
     * Uses DMNSchemaResolver's schema cache.
     */
    private JsonNode resolveSchemaRef(JsonNode schema) {
        if (schema == null || !schema.has("$ref")) {
            return schema;
        }

        String ref = schema.get("$ref").asText();
        String refKey = null;

        if (ref.startsWith("#/components/schemas/")) {
            refKey = ref.substring("#/components/schemas/".length());
        } else if (ref.startsWith("#/definitions/")) {
            refKey = ref.substring("#/definitions/".length());
        }

        if (refKey != null) {
            JsonNode refSchema = schemaResolver.getSchema(refKey);
            if (refSchema != null) {
                // Recursively resolve in case the referenced schema is also a reference
                return resolveSchemaRef(refSchema);
            }
        }

        return schema;
    }
}
