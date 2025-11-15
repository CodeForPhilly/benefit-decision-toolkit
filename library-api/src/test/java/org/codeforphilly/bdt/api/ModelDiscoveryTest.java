package org.codeforphilly.bdt.api;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import javax.inject.Inject;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.hasKey;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class ModelDiscoveryTest {

    @Inject
    ModelRegistry modelRegistry;

    @Test
    public void testAllDMNModelsAreDiscovered() {
        Map<String, ModelInfo> models = modelRegistry.getAllModels();
        assertNotNull(models);
        assertTrue(models.size() > 0, "Should discover at least one DMN model");

        // Log discovered models for debugging
        models.values().forEach(model -> {
            System.out.println("Discovered: " + model.getModelName() +
                             " at " + model.getPath() +
                             " with services: " + model.getDecisionServices());
        });
    }

    @Test
    public void testAllModelsFollowNamingConvention() {
        Map<String, ModelInfo> allModels = modelRegistry.getAllModels();

        for (ModelInfo model : allModels.values()) {
            // Models that are exposed via API should have {ModelName}Service
            String expectedService = model.getModelName() + "Service";

            if (model.getDecisionServices().contains(expectedService)) {
                // This model should appear in OpenAPI
                String path = "/api/v1/" + model.getPath();

                given()
                    .queryParam("format", "JSON")
                .when()
                    .get("/q/openapi")
                .then()
                    .statusCode(200)
                    .body("paths", hasKey(path));
            }
        }
    }

    @Test
    public void testCheckModelsHaveCorrectCategory() {
        Map<String, ModelInfo> allModels = modelRegistry.getAllModels();

        List<ModelInfo> checkModels = allModels.values().stream()
            .filter(model -> model.getPath().startsWith("checks/"))
            .collect(Collectors.toList());

        for (ModelInfo model : checkModels) {
            String category = model.getCategory();
            assertTrue(category.endsWith("Checks"),
                "Check model " + model.getModelName() +
                " should have category ending with 'Checks', got: " + category);
        }
    }

    @Test
    public void testBenefitModelsHaveCorrectCategory() {
        Map<String, ModelInfo> allModels = modelRegistry.getAllModels();

        List<ModelInfo> benefitModels = allModels.values().stream()
            .filter(model -> model.getPath().startsWith("benefits/"))
            .collect(Collectors.toList());

        for (ModelInfo model : benefitModels) {
            String category = model.getCategory();
            assertEquals("Benefits", category,
                "Benefit model " + model.getModelName() + " should have 'Benefits' category");
        }
    }
}
