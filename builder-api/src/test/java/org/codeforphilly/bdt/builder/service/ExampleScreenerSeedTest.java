package org.codeforphilly.bdt.builder.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/* Checks that the bundled seed is internally consistent. It deliberately asserts nothing about
   what the example contains, so the example can be edited and re-exported freely. */
class ExampleScreenerSeedTest {
    private static final String MANIFEST = "seed-data/example-screener/manifest.json";

    private final ObjectMapper mapper = new ObjectMapper();
    private JsonNode manifest;

    @BeforeEach
    void loadManifest() throws Exception {
        manifest = json(MANIFEST);
    }

    @Test
    void everyManifestPathIsBundled() throws Exception {
        for (JsonNode screener : manifest.path("screeners")) {
            json(screener.path("screenerPath").asText());
            for (JsonNode benefitPath : screener.path("benefits")) {
                json(benefitPath.asText());
            }
            String formPath = screener.path("formSchema").asText();
            if (!formPath.isEmpty()) {
                json(formPath);
            }
        }
        for (String collection : List.of("workingCustomChecks", "publishedCustomChecks", "dmnPaths")) {
            for (JsonNode path : manifest.path(collection)) {
                resource(path.asText());
            }
        }
    }

    @Test
    void benefitsReferenceBundledCustomChecksAndSetRequiredParameters() throws Exception {
        Map<String, JsonNode> customChecks = customChecksById();
        Map<String, String> dmnPaths = dmnPathsByCheckId();
        for (JsonNode screener : manifest.path("screeners")) {
            for (JsonNode benefitPath : screener.path("benefits")) {
                for (JsonNode checkConfig : json(benefitPath.asText()).path("checks")) {
                    String context = benefitPath.asText() + " check " + checkConfig.path("checkName").asText();
                    String sourceCheckId = sourceCheckId(checkConfig);
                    if (!isLibraryCheckId(sourceCheckId)) {
                        assertTrue(customChecks.containsKey(sourceCheckId),
                                context + " references " + sourceCheckId + ", which is not in the seed");
                        assertTrue(dmnPaths.containsKey(sourceCheckId),
                                context + " references " + sourceCheckId + ", which has no DMN in the seed");
                    }
                    for (JsonNode parameter : checkConfig.path("parameterDefinitions")) {
                        if (parameter.path("required").asBoolean()) {
                            String key = parameter.path("key").asText();
                            assertTrue(checkConfig.path("parameters").hasNonNull(key),
                                    context + " is missing required parameter " + key);
                        }
                    }
                }
            }
        }
    }

    @Test
    void everyCustomCheckHasAValidDmnMatchingItsInputDefinition() throws Exception {
        KieDmnService dmnService = new KieDmnService();
        Map<String, String> dmnPaths = dmnPathsByCheckId();
        for (Map.Entry<String, JsonNode> check : customChecksById().entrySet()) {
            String checkId = check.getKey();
            String dmnPath = dmnPaths.get(checkId);
            assertNotNull(dmnPath, "No DMN in the seed for " + checkId);
            String xml = resource(dmnPath);
            String name = new DmnParser(xml).getName();
            assertEquals(List.of(), dmnService.validateDmnXml(xml, Map.of(), name, name), checkId);
            assertEquals(dmnService.extractInputSchema(xml, Map.of(), name),
                    check.getValue().path("inputDefinition"), checkId);
        }
    }

    @Test
    void formsAskForTheCustomInputsTheirChecksUse() throws Exception {
        Map<String, JsonNode> customChecks = customChecksById();
        for (JsonNode screener : manifest.path("screeners")) {
            String formPath = screener.path("formSchema").asText();
            List<String> formKeys = formPath.isEmpty()
                    ? List.of()
                    : json(formPath).findValuesAsText("key");
            for (JsonNode benefitPath : screener.path("benefits")) {
                for (JsonNode checkConfig : json(benefitPath.asText()).path("checks")) {
                    JsonNode check = customChecks.get(sourceCheckId(checkConfig));
                    if (check == null) {
                        continue;
                    }
                    check.path("inputDefinition").path("properties").path("custom").path("properties")
                            .fieldNames().forEachRemaining(field -> assertTrue(
                                    formKeys.stream().anyMatch(key -> key.equals("custom." + field)
                                            || key.startsWith("custom." + field + ".")),
                                    screener.path("screenerPath").asText() + " has no form field for custom."
                                            + field + ", which " + check.path("id").asText() + " needs"));
                }
            }
        }
    }

    private Map<String, JsonNode> customChecksById() throws Exception {
        Map<String, JsonNode> checks = new HashMap<>();
        for (String collection : List.of("workingCustomChecks", "publishedCustomChecks")) {
            for (JsonNode path : manifest.path(collection)) {
                JsonNode check = json(path.asText());
                checks.put(check.path("id").asText(), check);
            }
        }
        return checks;
    }

    // The importer finds a check's DMN by the file name, which is the check's id
    private Map<String, String> dmnPathsByCheckId() {
        Map<String, String> paths = new HashMap<>();
        for (JsonNode path : manifest.path("dmnPaths")) {
            String fileName = Paths.get(path.asText()).getFileName().toString();
            paths.put(fileName.substring(0, fileName.lastIndexOf('.')), path.asText());
        }
        return paths;
    }

    // Mirrors ExampleScreenerImportService
    private String sourceCheckId(JsonNode checkConfig) {
        String sourceCheckId = checkConfig.path("sourceCheckId").asText();
        return sourceCheckId.isBlank() ? checkConfig.path("checkId").asText() : sourceCheckId;
    }

    private boolean isLibraryCheckId(String checkId) {
        return checkId.startsWith("L");
    }

    private JsonNode json(String path) throws Exception {
        return mapper.readTree(resource(path));
    }

    private String resource(String path) throws Exception {
        try (var stream = getClass().getClassLoader().getResourceAsStream(path)) {
            assertNotNull(stream, path + " is not bundled");
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
