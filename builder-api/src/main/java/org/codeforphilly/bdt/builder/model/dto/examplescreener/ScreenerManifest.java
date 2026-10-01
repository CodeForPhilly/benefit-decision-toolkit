package org.codeforphilly.bdt.builder.model.dto.examplescreener;

import java.util.List;

public record ScreenerManifest(String screenerPath, List<String> benefits,
        String formSchema) {
}
