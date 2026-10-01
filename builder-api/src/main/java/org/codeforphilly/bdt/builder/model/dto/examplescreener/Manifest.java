package org.codeforphilly.bdt.builder.model.dto.examplescreener;

import java.util.List;

public record Manifest(List<ScreenerManifest> screeners,
        List<String> workingCustomChecks, List<String> publishedCustomChecks,
        List<String> dmnPaths) {
}
