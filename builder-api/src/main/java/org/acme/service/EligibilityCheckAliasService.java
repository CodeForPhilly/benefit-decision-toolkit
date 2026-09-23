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
import java.util.List;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class EligibilityCheckAliasService {
    @Inject
    ObjectMapper objectMapper;

    @ConfigProperty(name = "alias-generation.enabled", defaultValue = "true")
    boolean enabled;

    @ConfigProperty(name = "alias-generation.gemini.api-key")
    Optional<String> apiKey;

    @ConfigProperty(name = "alias-generation.gemini.model", defaultValue = "gemini-3.5-flash-lite")
    String model;

    @ConfigProperty(
        name = "alias-generation.gemini.base-url",
        defaultValue = "https://generativelanguage.googleapis.com/v1beta/models/"
    )
    String baseUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(3))
        .build();

    /**
     * Generates a display alias with Gemini. Returns empty when generation is disabled, no API
     * key is configured, or generation fails, so callers can tell the user instead of storing a guess.
     */
    public Optional<String> generate(String checkName, Map<String, Object> parameters) {
        if (!enabled) {
            return Optional.empty();
        }
        if (apiKey.isEmpty() || apiKey.get().isBlank()) {
            Log.warn("GEMINI_API_KEY is not configured; skipping eligibility check alias generation");
            return Optional.empty();
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
                .uri(URI.create(baseUrl + model + ":generateContent"))
                .timeout(Duration.ofSeconds(8))
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", apiKey.get())
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                Log.warnf("Gemini alias generation returned HTTP %d", response.statusCode());
                return Optional.empty();
            }

            JsonNode responseJson = objectMapper.readTree(response.body());
            String generatedJson = responseJson.path("candidates").path(0).path("content")
                .path("parts").path(0).path("text").asText();
            String alias = objectMapper.readTree(generatedJson).path("alias").asText().trim();
            return alias.isBlank() ? Optional.empty() : Optional.of(alias);
        } catch (Exception e) {
            Log.warn("Could not generate an eligibility check alias with Gemini", e);
            return Optional.empty();
        }
    }

    private String buildPrompt(String checkName, Map<String, Object> parameters) throws Exception {
        return """
            Write one short, plain-language display name for an eligibility check for a public benefit.
            It will be shown to non-technical users in screening results.
            Incorporate meaningful configured parameter values naturally, but omit implementation details.
            Do not add a period, quotation marks, explanation, or eligibility verdict.
            Prefer sentence case and no more than 12 words.

            Check name: %s
            Parameters: %s

            Example input: PersonNotEnrolledInBenefit; {"personId":"client","benefit":"PhlHomesteadExemption"}
            Example output: Client not already enrolled in Homestead Exemption
            """.formatted(checkName, objectMapper.writeValueAsString(parameters == null ? Map.of() : parameters));
    }
}
