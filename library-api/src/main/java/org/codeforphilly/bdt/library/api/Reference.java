package org.codeforphilly.bdt.library.api;

import org.kie.dmn.api.core.DMNModel;
import org.kie.dmn.api.core.DMNResult;
import org.kie.dmn.api.core.DMNRuntime;
import org.kie.dmn.api.core.ast.DecisionNode;

import java.net.URI;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Reads the constant {@code reference} decision of a benefit or eligibility check (see GLOSSARY.md).
 * The result is plain JSON (strings, lists and maps; dates as ISO strings) so it can be published in OpenAPI.
 */
final class Reference {

    static final String DECISION = "reference";

    enum Kind {
        BENEFIT(List.of("explanation", "administeredBy", "programYear", "sources", "limitations", "lastReviewed")),
        CHECK(List.of("explanation", "sources", "limitations", "lastReviewed"));

        private final List<String> fields;

        Kind(List<String> fields) {
            this.fields = fields;
        }
    }

    /** Thrown for an invalid reference so startup fails instead of publishing a partial library. */
    static class InvalidReferenceException extends IllegalStateException {
        InvalidReferenceException(String message) {
            super(message);
        }

        InvalidReferenceException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    private Reference() {
    }

    /** Returns the validated reference, or an empty map when the model has no {@code reference} decision. */
    static Map<String, Object> evaluate(DMNRuntime runtime, DMNModel model, Kind kind) {
        DecisionNode decision = model.getDecisionByName(DECISION);
        if (decision == null) {
            return Map.of();
        }
        String where = model.getName() + "." + DECISION;
        if (!decision.getDecision().getInformationRequirement().isEmpty()) {
            throw new InvalidReferenceException(where + " must be constant (no information requirements)");
        }
        Object value;
        try {
            DMNResult result = runtime.evaluateByName(model, runtime.newContext(), DECISION);
            if (result.hasErrors()) {
                throw new InvalidReferenceException("Failed to evaluate " + where + ": " + result.getMessages());
            }
            value = result.getDecisionResultByName(DECISION).getResult();
        } catch (InvalidReferenceException e) {
            throw e;
        } catch (RuntimeException e) {
            throw new InvalidReferenceException("Failed to evaluate " + where, e);
        }
        return new Validator(where).reference(value, kind);
    }

    /** Checks each field and copies it into ordered, unmodifiable plain-JSON values. */
    private record Validator(String where) {

        Map<String, Object> reference(Object value, Kind kind) {
            Map<?, ?> context = map(value, where);
            rejectUnknown(context, kind.fields, where);
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("explanation", text(context.get("explanation"), "explanation"));
            if (kind == Kind.BENEFIT) {
                Map<?, ?> agency = map(context.get("administeredBy"), "administeredBy");
                rejectUnknown(agency, List.of("name", "url"), "administeredBy");
                out.put("administeredBy", ordered(
                    "name", text(agency.get("name"), "administeredBy.name"),
                    "url", url(agency.get("url"), "administeredBy.url")));
                Object programYear = context.get("programYear");
                if (programYear != null) {
                    Map<?, ?> year = map(programYear, "programYear");
                    rejectUnknown(year, List.of("label", "startDate", "endDate"), "programYear");
                    out.put("programYear", ordered(
                        "label", text(year.get("label"), "programYear.label"),
                        "startDate", date(year.get("startDate"), "programYear.startDate"),
                        "endDate", date(year.get("endDate"), "programYear.endDate")));
                }
            }
            List<Object> sources = new ArrayList<>();
            List<?> sourceList = list(context.get("sources"), "sources");
            if (sourceList.isEmpty()) {
                throw invalid("sources", "must list at least one source");
            }
            for (int i = 0; i < sourceList.size(); i++) {
                String field = "sources[" + i + "]";
                Map<?, ?> source = map(sourceList.get(i), field);
                rejectUnknown(source, List.of("title", "url", "citation", "checkedOn"), field);
                Object url = source.get("url");
                Object citation = source.get("citation");
                sources.add(ordered(
                    "title", text(source.get("title"), field + ".title"),
                    "url", url == null ? null : url(url, field + ".url"),
                    "citation", citation == null ? null : text(citation, field + ".citation"),
                    "checkedOn", date(source.get("checkedOn"), field + ".checkedOn")));
            }
            out.put("sources", Collections.unmodifiableList(sources));
            List<Object> limitations = new ArrayList<>();
            List<?> limitationList = list(context.get("limitations"), "limitations");
            for (int i = 0; i < limitationList.size(); i++) {
                limitations.add(text(limitationList.get(i), "limitations[" + i + "]"));
            }
            out.put("limitations", Collections.unmodifiableList(limitations));
            out.put("lastReviewed", date(context.get("lastReviewed"), "lastReviewed"));
            return Collections.unmodifiableMap(out);
        }

        private Map<String, Object> ordered(Object... keysAndValues) {
            Map<String, Object> map = new LinkedHashMap<>();
            for (int i = 0; i < keysAndValues.length; i += 2) {
                map.put((String) keysAndValues[i], keysAndValues[i + 1]);
            }
            return Collections.unmodifiableMap(map);
        }

        private void rejectUnknown(Map<?, ?> map, List<String> allowed, String field) {
            for (Object key : map.keySet()) {
                if (!allowed.contains(String.valueOf(key))) {
                    throw invalid(field, "has unknown field '" + key + "' (allowed: " + allowed + ")");
                }
            }
        }

        private Map<?, ?> map(Object value, String field) {
            if (value instanceof Map<?, ?> map) {
                return map;
            }
            throw invalid(field, "must be a context");
        }

        private List<?> list(Object value, String field) {
            if (value instanceof List<?> list) {
                return list;
            }
            throw invalid(field, "must be a list");
        }

        private String text(Object value, String field) {
            if (value instanceof String text && !text.isBlank()) {
                return text;
            }
            throw invalid(field, "must be non-empty text");
        }

        private String url(Object value, String field) {
            String url = text(value, field);
            try {
                if ("https".equals(URI.create(url).getScheme())) {
                    return url;
                }
            } catch (IllegalArgumentException ignored) {
                // reported below
            }
            throw invalid(field, "must be an https URL");
        }

        private String date(Object value, String field) {
            if (value instanceof LocalDate date) {
                return date.toString();
            }
            throw invalid(field, "must be a date");
        }

        private InvalidReferenceException invalid(String field, String problem) {
            String path = field.equals(where) ? where : where + "." + field;
            return new InvalidReferenceException(path + " " + problem);
        }
    }
}
