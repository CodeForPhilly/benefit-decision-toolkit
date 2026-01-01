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
    @Inject
    private StorageService storageService;

    private List<EligibilityCheck> checks;

    @PostConstruct
    void init() {
        try {
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

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://library-api-cnsoqyluna-uc.a.run.app" + checkConfig.getEvaluationUrl()))
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
            String result = responseBody.get("checkResult").toString();
            return EvaluationResult.fromStringIgnoreCase(result);
        }
        catch (Exception e){
            Log.error(e);
            return EvaluationResult.UNABLE_TO_DETERMINE;
        }
    }
}

