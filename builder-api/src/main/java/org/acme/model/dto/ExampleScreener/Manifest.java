package org.acme.model.dto.ExampleScreener;

import java.util.List;

public record Manifest(List<ScreenerManifest> screeners,
        List<String> workingCustomChecks, List<String> publishedCustomChecks,
        List<String> dmnPaths) {
}
