package org.acme.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.logging.Log;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.acme.enums.EvaluationResult;
import org.acme.model.domain.CheckConfig;
import org.acme.model.domain.EligibilityCheck;
import org.acme.persistence.StorageService;
import org.acme.persistence.FirestoreUtils;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;


@ApplicationScoped
public class LibraryApiService {
    private static final String DEFAULT_LIBRARY_API_URL = "http://localhost:8083";

    @Inject
    private StorageService storageService;

    @ConfigProperty(name = "library-api.base-url")
    Optional<String> libraryApiBaseUrl;

    private List<EligibilityCheck> checks;
    private String effectiveBaseUrl;
    private boolean useVersionedUrls;

    @PostConstruct
    void init() {
        try {
            // Determine effective base URL
            effectiveBaseUrl = libraryApiBaseUrl.orElse(DEFAULT_LIBRARY_API_URL);

            // Infer environment from URL - localhost = development, else = production
            boolean isProduction = !(effectiveBaseUrl.contains("localhost") || effectiveBaseUrl.contains("127.0.0.1"));
            useVersionedUrls = isProduction;

            Log.info("========================================");
            Log.info("Library API Configuration");
            Log.info("========================================");
            Log.info("Base URL: " + effectiveBaseUrl);
            Log.info("Mode: " + (isProduction ? "production" : "development"));
            Log.info("Versioned URLs: " + (useVersionedUrls ? "enabled" : "disabled"));
            Log.info("========================================");

            // Get path of most recent library schema json document
            Optional<Map<String, Object>> configOpt = FirestoreUtils.getFirestoreDocById("system", "config");
            if (configOpt.isEmpty()){
                Log.error("Failed to load library api config");
                return;
            }
            Map<String, Object> config = configOpt.get();
            String schemaPath = config.get("latestJsonStoragePath").toString();
            Optional<String> apiSchemaOpt = storageService.getStringFromStorage(schemaPath);
            if (apiSchemaOpt.isEmpty()){
                Log.error("Failed to load library api schema document");
                return;
            }
            String apiSchemaJson = apiSchemaOpt.get();

            ObjectMapper mapper = new ObjectMapper();

            checks = mapper.readValue(apiSchemaJson, new TypeReference<List<EligibilityCheck>>() {});
            Log.info("Loaded " + checks.size() + " library checks");
        } catch (Exception e) {
            throw new RuntimeException("Failed to load library api metadata", e);
        }
    }

    public List<EligibilityCheck> getAll() {
        return checks;
    }

    public List<EligibilityCheck> getByModule(String module) {
        return checks.stream()
                .filter(e -> module.equals(e.getModule()))
                .toList();
    }

    public EligibilityCheck getById(String id) {
         List<EligibilityCheck> matches = checks.stream()
                .filter(e -> id.equals(e.getId()))
                .toList();
         if (matches.isEmpty()) {
             return null;
         }
         return matches.getFirst();
    }

    public EvaluationResult evaluateCheck(CheckConfig checkConfig, Map<String, Object> inputs) throws JsonProcessingException {

        // TODO: Check that checkConfig has required attributes and handle null values

        Map<String, Object> data = new HashMap<>();
        data.put("parameters", checkConfig.getParameters());
        data.put("situation", inputs);
        ObjectMapper mapper = new ObjectMapper();
        String bodyJson = mapper.writeValueAsString(data);

        HttpClient client = HttpClient.newHttpClient();

        // Determine base URL based on configuration
        String baseUrl;
        if (useVersionedUrls) {
            // Production: Use versioned Cloud Run URLs
            String urlEncodedVersion = checkConfig.getCheckVersion().replace('.', '-');
            baseUrl = String.format("https://library-api-v%s---library-api-cnsoqyluna-uc.a.run.app", urlEncodedVersion);
            Log.debug("Using versioned URL: " + baseUrl);
        } else {
            // Development: Use configured base URL directly
            baseUrl = effectiveBaseUrl;
            Log.debug("Using base URL: " + baseUrl);
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + checkConfig.getEvaluationUrl()))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(bodyJson))
                .build();

        try {
            HttpResponse<String> response =
                    client.send(request, HttpResponse.BodyHandlers.ofString());

            int statusCode = response.statusCode();
            if (statusCode != 200){
                Log.error("Error evaluating library check " + checkConfig.getCheckId());
                Log.error("Inputs and parameters that caused error:" + bodyJson);
                return EvaluationResult.UNABLE_TO_DETERMINE;
            }
            String body = response.body();
            Map<String, Object> responseBody = mapper.readValue(
                    body,
                    new TypeReference<Map<String, Object>>() {}
            );

            // TODO: Need a safer way to validate the returned data is in the right format
            Object result = responseBody.get("checkResult");
            if (result == null) {
                return EvaluationResult.UNABLE_TO_DETERMINE;
            }
            return EvaluationResult.fromStringIgnoreCase(result.toString());
        }
        catch (Exception e){
            Log.error(e);
            return EvaluationResult.UNABLE_TO_DETERMINE;
        }
    }
}
