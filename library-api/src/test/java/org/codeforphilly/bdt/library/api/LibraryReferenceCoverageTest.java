package org.codeforphilly.bdt.library.api;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import org.w3c.dom.Document;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.InputStream;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Every library benefit and check is documented: a reference, a rationale for each check a benefit runs,
 * a description for each check parameter (defined in the check's own file), and at least one Bruno example.
 */
@QuarkusTest
class LibraryReferenceCoverageTest {

    @Inject
    ModelRegistry registry;

    @Test
    void everyExposedBenefitAndCheckIsFullyDocumented() throws Exception {
        List<ModelInfo> library = registry.getAllModels().values().stream().filter(ModelInfo::isLibraryExposed).toList();
        // An empty registry (a failed scan or runtime lookup) would otherwise pass with nothing checked.
        assertFalse(library.isEmpty(), "No library benefits or checks were registered");
        List<String> gaps = new ArrayList<>();
        for (ModelInfo model : library) {
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
            String parametersType = ReferenceDocs.undocumentedParametersType(dmn(model.getPath()));
            if (parametersType != null) {
                gaps.add(name + ": parameters input has type " + parametersType
                    + ", which is not defined in its own file, so its parameters are not documented");
            }
            if (model.getExamples().isEmpty()) {
                gaps.add(name + ": no Bruno test with a docs { } block");
            }
        }
        assertEquals(List.of(), gaps.stream().sorted().toList());
    }

    private static Document dmn(String path) throws Exception {
        try (InputStream in = Thread.currentThread().getContextClassLoader().getResourceAsStream(path + ".dmn")) {
            assertNotNull(in, "No DMN file at " + path + ".dmn");
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            return factory.newDocumentBuilder().parse(in);
        }
    }

    private static List<?> list(Object value) {
        return value instanceof List<?> list ? list : List.of();
    }
}
