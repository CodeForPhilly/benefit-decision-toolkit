package org.acme.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.logging.Log;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.acme.enums.CheckResult;
import org.acme.model.domain.CheckConfig;
import org.acme.model.domain.EligibilityCheck;
import org.acme.persistence.StorageService;
import org.acme.persistence.FirestoreUtils;

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

    public List<EligibilityCheck> getById(String id) {
        return checks.stream()
                .filter(e -> id.equals(e.getId()))
                .toList();
    }

    public CheckResult evaluateCheck(CheckConfig checkConfig, Map<String, Object> inputs){
        return CheckResult.TRUE;
    }
}

