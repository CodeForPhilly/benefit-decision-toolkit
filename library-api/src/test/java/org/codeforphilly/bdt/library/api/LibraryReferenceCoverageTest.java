package org.codeforphilly.bdt.library.api;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Every library benefit and check is documented: a reference, a rationale for each check a benefit runs,
 * a description for each check parameter, and at least one Bruno example.
 */
@QuarkusTest
class LibraryReferenceCoverageTest {

    @Inject
    ModelRegistry registry;

    @Test
    void everyExposedBenefitAndCheckIsFullyDocumented() {
        List<String> gaps = new ArrayList<>();
        for (ModelInfo model : registry.getAllModels().values()) {
            if (!model.isLibraryExposed()) {
                continue;
            }
            String name = model.getModelName();
            Map<String, Object> reference = model.getReference();
            if (reference.isEmpty()) {
                gaps.add(name + ": no reference");
                continue;
            }
            for (Object check : list(reference.get("checks"))) {
                Map<?, ?> entry = (Map<?, ?>) check;
                if (entry.get("rationale") == null) {
                    gaps.add(name + ": no rationale for check " + entry.get("alias"));
                }
            }
            for (Object parameter : list(reference.get("parameters"))) {
                Map<?, ?> entry = (Map<?, ?>) parameter;
                if (entry.get("description") == null) {
                    gaps.add(name + ": no description for parameter " + entry.get("name"));
                }
            }
            if (model.getExamples().isEmpty()) {
                gaps.add(name + ": no Bruno test with a docs { } block");
            }
        }
        assertEquals(List.of(), gaps.stream().sorted().toList());
    }

    private static List<?> list(Object value) {
        return value instanceof List<?> list ? list : List.of();
    }
}
