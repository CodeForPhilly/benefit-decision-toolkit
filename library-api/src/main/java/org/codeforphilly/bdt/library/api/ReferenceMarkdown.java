package org.codeforphilly.bdt.library.api;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Renders a published reference ({@code x-bdt-reference}) as the Markdown operation description that
 * Swagger UI shows. Implementation notes are left out: they are for contributors and live on the docs site.
 */
final class ReferenceMarkdown {
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("MMMM d, yyyy", Locale.US);

    private ReferenceMarkdown() {
    }

    @SuppressWarnings("unchecked")
    static String render(Map<String, Object> reference) {
        StringBuilder md = new StringBuilder();
        md.append(reference.get("summary")).append("\n\n");
        md.append(reference.get("explanation")).append("\n\n");

        if (reference.get("administeredBy") instanceof Map<?, ?> agency) {
            md.append("**Administered by:** ").append(link((String) agency.get("name"), (String) agency.get("url")))
                .append("\n\n");
        }
        if (reference.get("programYear") instanceof Map<?, ?> year) {
            md.append("**Program year:** ").append(year.get("label")).append(", ")
                .append(date(year.get("startDate"))).append(" to ").append(date(year.get("endDate"))).append("\n\n");
        }

        List<Map<String, Object>> checks = (List<Map<String, Object>>) reference.get("checks");
        if (checks != null && !checks.isEmpty()) {
            md.append("## Checks\n\nEligible when every check passes.\n\n");
            for (Map<String, Object> check : checks) {
                md.append("- **").append(humanize((String) check.get("alias"))).append("**");
                if (check.get("rationale") != null) {
                    md.append(": ").append(check.get("rationale"));
                }
                md.append(" (`").append(check.get("operationId")).append("`)\n");
            }
            md.append("\n");
        }

        List<Map<String, Object>> parameters = (List<Map<String, Object>>) reference.get("parameters");
        if (parameters != null && !parameters.isEmpty()) {
            md.append("## Parameters\n\n");
            for (Map<String, Object> parameter : parameters) {
                md.append("- `").append(parameter.get("name")).append("`");
                if (parameter.get("type") != null) {
                    md.append(" (").append(parameter.get("type")).append(")");
                }
                if (parameter.get("description") != null) {
                    md.append(": ").append(parameter.get("description"));
                }
                md.append("\n");
            }
            md.append("\n");
        }

        md.append("## Limitations\n\n");
        for (Object limitation : (List<Object>) reference.get("limitations")) {
            md.append("- ").append(limitation).append("\n");
        }

        md.append("\n## Sources\n\n");
        for (Map<String, Object> source : (List<Map<String, Object>>) reference.get("sources")) {
            md.append("- ").append(link((String) source.get("title"), (String) source.get("url")));
            if (source.get("citation") != null) {
                md.append(": ").append(source.get("citation"));
            }
            md.append(" (checked ").append(date(source.get("checkedOn"))).append(")\n");
        }

        md.append("\nLast reviewed ").append(date(reference.get("lastReviewed"))).append(".\n");
        return md.toString();
    }

    private static String link(String text, String url) {
        return url == null ? text : "[" + text + "](" + url + ")";
    }

    private static String date(Object iso) {
        return LocalDate.parse(iso.toString()).format(DATE);
    }

    /** "NotAlreadyEnrolled" -> "Not already enrolled", matching the docs site and the builder. */
    static String humanize(String name) {
        String words = name.replaceAll("([a-z])([A-Z0-9])", "$1 $2")
            .replaceAll("([0-9])([A-Z])", "$1 $2")
            .toLowerCase(Locale.ROOT);
        return Character.toUpperCase(words.charAt(0)) + words.substring(1);
    }
}
