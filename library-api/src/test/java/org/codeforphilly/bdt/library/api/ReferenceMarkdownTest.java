package org.codeforphilly.bdt.library.api;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReferenceMarkdownTest {

    @Test
    void parametersWithoutATypeShowNoType() {
        Map<String, Object> structured = new HashMap<>();
        structured.put("name", "limits");
        structured.put("type", null);
        structured.put("description", "Income limits by household size.");

        String markdown = ReferenceMarkdown.render(Map.of(
            "summary", "Checks income.",
            "explanation", "Compares income to a limit.",
            "parameters", List.of(Map.of("name", "maxAge", "type", "number"), structured),
            "limitations", List.of(),
            "sources", List.of(),
            "lastReviewed", "2026-11-12"));

        assertTrue(markdown.contains("- `maxAge` (number)\n"), markdown);
        assertTrue(markdown.contains("- `limits`: Income limits by household size.\n"), markdown);
        assertFalse(markdown.contains("null"), markdown);
    }
}
