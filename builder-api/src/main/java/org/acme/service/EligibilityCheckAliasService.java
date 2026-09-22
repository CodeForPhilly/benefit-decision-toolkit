package org.acme.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@ApplicationScoped
public class EligibilityCheckAliasService {
    private static final String API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
    private static final Pattern WORD_BOUNDARY = Pattern.compile("([a-z0-9])([A-Z])");
    private static final Pattern ACRONYM_BOUNDARY = Pattern.compile("([A-Z]+)([A-Z][a-z])");

    @Inject
    ObjectMapper objectMapper;

    @ConfigProperty(name = "alias-generation.gemini.api-key")
    Optional<String> apiKey;

    @ConfigProperty(name = "alias-generation.gemini.model", defaultValue = "gemini-3.5-flash-lite")
    String model;

    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(3))
        .build();

    public String generate(String checkName, Map<String, Object> parameters) {
        String fallback = fallbackAlias(checkName, parameters);
        if (apiKey.isEmpty() || apiKey.get().isBlank()) {
            return fallback;
        }

        try {
            String prompt = buildPrompt(checkName, parameters);
            Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                    "temperature", 0.2,
                    "maxOutputTokens", 60,
                    "responseMimeType", "application/json",
                    "responseJsonSchema", Map.of(
                        "type", "object",
                        "properties", Map.of("alias", Map.of("type", "string")),
                        "required", List.of("alias")
                    )
                )
            );
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE_URL + model + ":generateContent"))
                .timeout(Duration.ofSeconds(8))
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", apiKey.get())
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                Log.warnf("Gemini alias generation returned HTTP %d; using fallback", response.statusCode());
                return fallback;
            }

            JsonNode responseJson = objectMapper.readTree(response.body());
            String generatedJson = responseJson.path("candidates").path(0).path("content")
                .path("parts").path(0).path("text").asText();
            String alias = objectMapper.readTree(generatedJson).path("alias").asText().trim();
            return alias.isBlank() ? fallback : alias;
        } catch (Exception e) {
            Log.warn("Could not generate an eligibility check alias with Gemini; using fallback", e);
            return fallback;
        }
    }

    String fallbackAlias(String checkName, Map<String, Object> parameters) {
        String alias = humanize(checkName);
        Map<String, Object> safeParameters = parameters == null ? Map.of() : parameters;

        Object personId = safeParameters.get("personId");
        if (hasValue(personId)) {
            alias = alias.replaceFirst("(?i)\\bperson(?: id)?\\b", Matcher.quoteReplacement(humanizeValue(personId)));
        }

        Object benefit = safeParameters.get("benefit");
        if (hasValue(benefit)) {
            String benefitName = humanizeValue(benefit).replaceFirst("(?i)^PHL\\s+", "");
            alias = alias.replaceFirst("(?i)\\bbenefit\\b", Matcher.quoteReplacement(benefitName));
        }

        alias = alias.replaceFirst("(?i)\\bnot enrolled in\\b", "not already enrolled in");

        List<String> unmatchedParameters = new ArrayList<>();
        for (Map.Entry<String, Object> entry : safeParameters.entrySet()) {
            if (!hasValue(entry.getValue()) || entry.getKey().equals("personId") || entry.getKey().equals("benefit")) {
                continue;
            }
            String parameterName = humanize(entry.getKey()).toLowerCase(Locale.ROOT);
            if (!alias.toLowerCase(Locale.ROOT).contains(parameterName)) {
                unmatchedParameters.add(parameterName + ": " + humanizeValue(entry.getValue()));
            }
        }
        if (!unmatchedParameters.isEmpty()) {
            alias += " (" + String.join(", ", unmatchedParameters) + ")";
        }
        return capitalize(alias);
    }

    private String buildPrompt(String checkName, Map<String, Object> parameters) throws Exception {
        return """
            Write one short, plain-language display name for an eligibility check.
            It will be shown to residents in screener results.
            Incorporate meaningful configured parameter values naturally, but omit implementation details.
            Do not add a period, quotation marks, explanation, or eligibility verdict.
            Prefer sentence case and no more than 12 words.

            Check name: %s
            Parameters: %s

            Example input: PersonNotEnrolledInBenefit; {"personId":"client","benefit":"PhlHomesteadExemption"}
            Example output: Client not already enrolled in Homestead Exemption
            """.formatted(checkName, objectMapper.writeValueAsString(parameters == null ? Map.of() : parameters));
    }

    private static boolean hasValue(Object value) {
        return value != null && !value.toString().isBlank();
    }

    private static String humanizeValue(Object value) {
        if (value instanceof List<?> list) {
            return list.stream().map(EligibilityCheckAliasService::humanizeValue).toList().toString();
        }
        return humanize(value.toString());
    }

    private static String humanize(String value) {
        if (value == null || value.isBlank()) {
            return "Eligibility check";
        }
        String spaced = value.replace('-', ' ').replace('_', ' ');
        spaced = ACRONYM_BOUNDARY.matcher(spaced).replaceAll("$1 $2");
        spaced = WORD_BOUNDARY.matcher(spaced).replaceAll("$1 $2");
        spaced = spaced.replaceAll("\\s+", " ").trim();
        return capitalize(spaced);
    }

    private static String capitalize(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }
}
