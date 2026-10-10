package org.codeforphilly.bdt.builder.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class EligibilityCheckAliasService {
    @Inject
    ObjectMapper objectMapper;

    @Inject
    GeminiClient geminiClient;

    @ConfigProperty(name = "alias-generation.enabled", defaultValue = "true")
    boolean enabled;

    /**
     * Generates a display alias with Gemini. Returns empty when generation is disabled, no API
     * key is configured, or generation fails, so callers can tell the user instead of storing a guess.
     */
    public Optional<String> generate(String checkName, Map<String, Object> parameters) {
        if (!enabled) {
            return Optional.empty();
        }
        if (!geminiClient.isConfigured()) {
            Log.warn("GEMINI_API_KEY is not configured; skipping eligibility check alias generation");
            return Optional.empty();
        }

        try {
            Map<String, Object> responseSchema = Map.of(
                "type", "object",
                "properties", Map.of("alias", Map.of("type", "string")),
                "required", List.of("alias")
            );
            Optional<String> generatedJson = geminiClient.generateJson(
                "alias generation", buildPrompt(checkName, parameters), responseSchema, 60, Duration.ofSeconds(8));
            if (generatedJson.isEmpty()) {
                return Optional.empty();
            }
            String alias = objectMapper.readTree(generatedJson.get()).path("alias").asText().trim();
            return alias.isBlank() ? Optional.empty() : Optional.of(alias);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return Optional.empty();
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
