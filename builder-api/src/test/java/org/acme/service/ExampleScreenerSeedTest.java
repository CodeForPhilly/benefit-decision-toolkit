package org.acme.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.acme.enums.EvaluationResult;
import org.acme.persistence.StorageService;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ExampleScreenerSeedTest {
    private final ObjectMapper mapper = new ObjectMapper();

    private String resource(String path) throws Exception {
        try (var stream = getClass().getClassLoader().getResourceAsStream(path)) {
            assertNotNull(stream, path);
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    @Test
    void manifestContainsFourBenefitsAndEveryReferencedResource() throws Exception {
        JsonNode manifest = mapper.readTree(resource("seed-data/example-screener/manifest.json"));
        assertEquals(1, manifest.path("screeners").size());
        JsonNode screener = manifest.path("screeners").get(0);
        resource(screener.path("screenerPath").asText());
        JsonNode form = mapper.readTree(resource(screener.path("formSchema").asText()));
        assertTrue(form.path("components").size() > 10);
        assertEquals(4, screener.path("benefits").size());
        assertTrue(form.path("components").findValuesAsText("key").contains("custom.wantsExtraCash"));
        int libraryChecks = 0;
        int customChecks = 0;
        for (JsonNode path : screener.path("benefits")) {
            JsonNode benefit = mapper.readTree(resource(path.asText()));
            for (JsonNode check : benefit.path("checks")) {
                if (check.path("sourceCheckId").asText().startsWith("L-")) {
                    libraryChecks++;
                    assertTrue(check.path("evaluationUrl").asText().startsWith("/api/v1/checks/"));
                    if (check.path("parameters").has("personId")) {
                        assertEquals("client", check.path("parameters").path("personId").asText());
                    }
                } else {
                    customChecks++;
                    boolean found = false;
                    for (JsonNode checkPath : manifest.path("publishedCustomChecks")) {
                        found |= mapper.readTree(resource(checkPath.asText())).path("id")
                            .asText().equals(check.path("sourceCheckId").asText());
                    }
                    assertTrue(found, "Custom check must reference an exported published version");
                }
            }
        }
        assertEquals(13, libraryChecks);
        assertEquals(1, customChecks);
        for (String collection : new String[]{"workingCustomChecks", "publishedCustomChecks", "dmnPaths"}) {
            assertEquals(collection.equals("dmnPaths") ? 2 : 1, manifest.path(collection).size());
            for (JsonNode path : manifest.path(collection)) resource(path.asText());
        }
    }

    @Test
    void customChecksEvaluateYesNoAndUnknownForWorkingAndPublishedVersions() throws Exception {
        JsonNode manifest = mapper.readTree(resource("seed-data/example-screener/manifest.json"));
        KieDmnService service = new KieDmnService();
        StorageService storage = mock(StorageService.class);
        var storageField = KieDmnService.class.getDeclaredField("storageService");
        storageField.setAccessible(true);
        storageField.set(service, storage);
        for (JsonNode path : manifest.path("dmnPaths")) {
            String xml = resource(path.asText());
            String name = new DmnParser(xml).getName();
            assertTrue(service.validateDmnXml(xml, Map.of(), name, name).isEmpty());
            JsonNode generatedSchema = service.extractInputSchema(xml, Map.of(), name);
            for (String collection : new String[]{"workingCustomChecks", "publishedCustomChecks"}) {
                for (JsonNode checkPath : manifest.path(collection)) {
                    assertEquals(generatedSchema, mapper.readTree(resource(checkPath.asText())).path("inputDefinition"));
                }
            }
            when(storage.getStringFromStorage(path.asText())).thenReturn(Optional.of(xml));
            for (Boolean answer : new Boolean[]{true, false, null}) {
                Map<String, Object> inputs = new HashMap<>();
                inputs.put("wantsExtraCash", answer);
                EvaluationResult expected = answer == null ? EvaluationResult.UNABLE_TO_DETERMINE
                    : answer ? EvaluationResult.TRUE : EvaluationResult.FALSE;
                assertEquals(expected, service.evaluateDmn(path.asText(), name, inputs, Map.of("expectedAnswer", true)));
            }
        }
    }
    @Test
    void screenerEvaluationReadsTheCustomFormObject() throws Exception {
        JsonNode manifest = mapper.readTree(resource("seed-data/example-screener/manifest.json"));
        org.acme.model.domain.Benefit benefit = null;
        for (JsonNode benefitPath : manifest.path("screeners").get(0).path("benefits")) {
            var candidate = mapper.readValue(resource(benefitPath.asText()), org.acme.model.domain.Benefit.class);
            if (candidate.getChecks().stream().anyMatch(check -> !check.getSourceCheckId().startsWith("L-"))) {
                benefit = candidate;
                break;
            }
        }
        assertNotNull(benefit, "Example must contain a benefit with a custom check");
        var controller = new org.acme.controller.DecisionResource();
        var repository = mock(org.acme.persistence.PublishedScreenerRepository.class);
        var storage = mock(StorageService.class);
        var library = mock(LibraryApiService.class);
        var dmn = new KieDmnService();
        var storageField = KieDmnService.class.getDeclaredField("storageService");
        storageField.setAccessible(true);
        storageField.set(dmn, storage);
        var screener = new org.acme.model.domain.Screener();
        when(repository.getScreener("example")).thenReturn(Optional.of(screener));
        when(repository.getBenefitsInScreener(screener)).thenReturn(java.util.List.of(benefit));
        when(library.evaluateCheck(any(), any())).thenReturn(new LibraryApiService.LibraryCheckEvaluation(
            EvaluationResult.TRUE, Map.of(), java.util.List.of()));
        var customCheck = benefit.getChecks().stream()
            .filter(check -> !check.getSourceCheckId().startsWith("L-")).findFirst().orElseThrow();
        String dmnPath = "";
        for (JsonNode path : manifest.path("dmnPaths")) {
            if (path.asText().endsWith("/" + customCheck.getSourceCheckId() + ".dmn")) {
                dmnPath = path.asText();
                break;
            }
        }
        assertFalse(dmnPath.isEmpty(), "Published custom check must have a DMN");
        String xml = resource(dmnPath);
        when(storage.getCheckDmnModelPath(anyString())).thenReturn("cash.dmn");
        when(storage.getStringFromStorage("cash.dmn")).thenReturn(Optional.of(xml));
        Map<String, Object> services = Map.of("publishedScreenerRepository", repository,
            "storageService", storage, "libraryApi", library, "dmnService", dmn,
            "inputSchemaService", new InputSchemaService());
        for (var entry : services.entrySet()) {
            var field = org.acme.controller.DecisionResource.class.getDeclaredField(entry.getKey());
            field.setAccessible(true);
            field.set(controller, entry.getValue());
        }
        for (Boolean answer : new Boolean[]{true, false, null}) {
            Map<String, Object> custom = new HashMap<>();
            custom.put("wantsExtraCash", answer);
            try (var response = controller.evaluatePublishedScreener("example", Map.of("custom", custom))) {
                assertEquals(200, response.getStatus());
                JsonNode result = mapper.valueToTree(response.getEntity());
                assertEquals(answer == null ? "UNABLE_TO_DETERMINE" : answer ? "TRUE" : "FALSE",
                    result.path(benefit.getId()).path("result").asText());
            }
        }
    }

}
