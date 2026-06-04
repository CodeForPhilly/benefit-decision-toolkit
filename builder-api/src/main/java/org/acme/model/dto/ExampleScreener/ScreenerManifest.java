package org.acme.model.dto.ExampleScreener;

import java.util.List;

public record ScreenerManifest(String screenerPath, List<String> benefits,
        String formSchema) {
}
