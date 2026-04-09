package org.acme.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.Timestamp;
import com.google.firebase.cloud.FirestoreClient;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.acme.constants.CollectionNames;
import org.acme.constants.FieldNames;
import org.acme.persistence.FirestoreUtils;
import org.acme.persistence.StorageService;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@ApplicationScoped
public class ExampleScreenerExportService {
    private static final Path EXPORT_ROOT = Paths.get("src", "main", "resources", "seed-data", "example-screener");
    private static final String SYSTEM_COLLECTION = "system";
    private static final String SYSTEM_CONFIG_ID = "config";

    private final StorageService storageService;
    private final String bucketName;
    private final ObjectMapper objectMapper;

    @Inject
    public ExampleScreenerExportService(
        StorageService storageService,
        @ConfigProperty(name = "GCS_BUCKET_NAME", defaultValue = "demo-bdt-dev.appspot.com") String bucketName
    ) {
        this.storageService = storageService;
        this.bucketName = bucketName;
        this.objectMapper = new ObjectMapper();
    }

    public ExportSummary exportForUser(String userId) throws Exception {
        resetExportRoot();

        List<Map<String, Object>> workingScreeners = getDocumentsByOwner(CollectionNames.WORKING_SCREENER_COLLECTION, userId);
        List<Map<String, Object>> workingCustomChecks = getDocumentsByOwner(CollectionNames.WORKING_CUSTOM_CHECK_COLLECTION, userId);
        List<Map<String, Object>> publishedCustomChecks = getDocumentsByOwner(CollectionNames.PUBLISHED_CUSTOM_CHECK_COLLECTION, userId);

        int firestoreDocuments = 0;
        firestoreDocuments += exportScreeners(workingScreeners);
        firestoreDocuments += exportChecks(CollectionNames.WORKING_CUSTOM_CHECK_COLLECTION, workingCustomChecks);
        firestoreDocuments += exportChecks(CollectionNames.PUBLISHED_CUSTOM_CHECK_COLLECTION, publishedCustomChecks);
        firestoreDocuments += exportSystemConfig();

        int storageFiles = 0;
        storageFiles += exportScreenerForms(workingScreeners);
        storageFiles += exportCheckDmns(workingCustomChecks);
        storageFiles += exportCheckDmns(publishedCustomChecks);

        writeManifest(firestoreDocuments, storageFiles);

        Log.info("Exported Firebase seed data for user " + userId + " to " + EXPORT_ROOT.toAbsolutePath().normalize());
        return new ExportSummary(
            EXPORT_ROOT.toAbsolutePath().normalize().toString(),
            workingScreeners.size(),
            firestoreDocuments,
            storageFiles
        );
    }

    private List<Map<String, Object>> getDocumentsByOwner(String collectionName, String userId) {
        List<Map<String, Object>> documents = new ArrayList<>(
            FirestoreUtils.getFirestoreDocsByField(collectionName, FieldNames.OWNER_ID, userId)
        );
        documents.sort(Comparator.comparing(document -> requiredString(document, FieldNames.ID, collectionName)));
        return documents;
    }

    private int exportScreeners(List<Map<String, Object>> workingScreeners) throws IOException {
        int firestoreDocuments = 0;

        for (Map<String, Object> screener : workingScreeners) {
            String screenerId = requiredString(screener, FieldNames.ID, CollectionNames.WORKING_SCREENER_COLLECTION);
            writeJsonFile(
                EXPORT_ROOT.resolve("firestore").resolve("workingScreener").resolve(screenerId + ".json"),
                firestoreDocumentForExport(screener, screenerId)
            );
            firestoreDocuments++;

            firestoreDocuments += exportBenefits(screenerId);
        }

        return firestoreDocuments;
    }

    private int exportBenefits(String screenerId) throws IOException {
        String collectionPath = CollectionNames.WORKING_SCREENER_COLLECTION + "/" + screenerId + "/customBenefit";
        List<Map<String, Object>> benefits = new ArrayList<>(FirestoreUtils.getAllDocsInCollection(collectionPath));
        benefits.sort(Comparator.comparing(benefit -> requiredString(benefit, FieldNames.ID, collectionPath)));

        int exportedBenefits = 0;
        for (Map<String, Object> benefit : benefits) {
            String benefitId = requiredString(benefit, FieldNames.ID, collectionPath);
            writeJsonFile(
                EXPORT_ROOT.resolve("firestore")
                    .resolve("workingScreener")
                    .resolve(screenerId)
                    .resolve("customBenefit")
                    .resolve(benefitId + ".json"),
                firestoreDocumentForExport(benefit, benefitId)
            );
            exportedBenefits++;
        }

        return exportedBenefits;
    }

    private int exportChecks(String collectionName, List<Map<String, Object>> checks) throws IOException {
        int exportedChecks = 0;
        for (Map<String, Object> check : checks) {
            String checkId = requiredString(check, FieldNames.ID, collectionName);
            writeJsonFile(
                EXPORT_ROOT.resolve("firestore").resolve(collectionName).resolve(checkId + ".json"),
                firestoreDocumentForExport(check, checkId)
            );
            exportedChecks++;
        }
        return exportedChecks;
    }

    private int exportSystemConfig() throws IOException {
        Optional<Map<String, Object>> config = FirestoreUtils.getFirestoreDocById(SYSTEM_COLLECTION, SYSTEM_CONFIG_ID);
        if (config.isEmpty()) {
            return 0;
        }

        writeJsonFile(
            EXPORT_ROOT.resolve("firestore").resolve(SYSTEM_COLLECTION).resolve(SYSTEM_CONFIG_ID + ".json"),
            firestoreDocumentForExport(config.get(), SYSTEM_CONFIG_ID)
        );
        return 1;
    }

    private int exportScreenerForms(List<Map<String, Object>> workingScreeners) throws IOException {
        int exportedForms = 0;

        for (Map<String, Object> screener : workingScreeners) {
            String screenerId = requiredString(screener, FieldNames.ID, CollectionNames.WORKING_SCREENER_COLLECTION);
            Optional<String> formSchema = storageService.getStringFromStorage(
                storageService.getScreenerWorkingFormSchemaPath(screenerId)
            );

            if (formSchema.isEmpty()) {
                continue;
            }

            writeStringFile(
                EXPORT_ROOT.resolve("storage").resolve("form").resolve("working").resolve(screenerId + ".json"),
                formSchema.get()
            );
            exportedForms++;
        }

        return exportedForms;
    }

    private int exportCheckDmns(List<Map<String, Object>> checks) throws IOException {
        int exportedDmns = 0;
        Set<String> exportedIds = new LinkedHashSet<>();

        for (Map<String, Object> check : checks) {
            String checkId = requiredString(check, FieldNames.ID, "customCheck");
            if (!exportedIds.add(checkId)) {
                continue;
            }

            Optional<String> dmnModel = storageService.getStringFromStorage(storageService.getCheckDmnModelPath(checkId));
            if (dmnModel.isEmpty()) {
                continue;
            }

            writeStringFile(
                EXPORT_ROOT.resolve("storage").resolve("check").resolve(checkId + ".dmn"),
                dmnModel.get()
            );
            exportedDmns++;
        }

        return exportedDmns;
    }

    private void writeManifest(int firestoreDocuments, int storageFiles) throws IOException {
        Map<String, Object> manifest = new LinkedHashMap<>();
        manifest.put("exportedAt", Instant.now().toString());
        manifest.put("source", "builder-api");
        manifest.put("projectId", FirestoreClient.getFirestore().getOptions().getProjectId());
        manifest.put("storageBucket", bucketName);
        manifest.put("firestoreDocuments", firestoreDocuments);
        manifest.put("storageFiles", storageFiles);

        writeJsonFile(EXPORT_ROOT.resolve("manifest.json"), manifest);
    }

    private Map<String, Object> firestoreDocumentForExport(Map<String, Object> rawData, String documentId) {
        Map<String, Object> exportData = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : rawData.entrySet()) {
            exportData.put(entry.getKey(), normalizeFirestoreValue(entry.getValue()));
        }
        exportData.put("_id", documentId);
        return exportData;
    }

    private Object normalizeFirestoreValue(Object value) {
        if (value instanceof Timestamp timestamp) {
            Map<String, Object> exportedTimestamp = new LinkedHashMap<>();
            exportedTimestamp.put("_type", "timestamp");
            exportedTimestamp.put("value", timestamp.toDate().toInstant().toString());
            return exportedTimestamp;
        }

        if (value instanceof Map<?, ?> mapValue) {
            Map<String, Object> normalizedMap = new LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : mapValue.entrySet()) {
                normalizedMap.put(String.valueOf(entry.getKey()), normalizeFirestoreValue(entry.getValue()));
            }
            return normalizedMap;
        }

        if (value instanceof List<?> listValue) {
            List<Object> normalizedList = new ArrayList<>();
            for (Object item : listValue) {
                normalizedList.add(normalizeFirestoreValue(item));
            }
            return normalizedList;
        }

        return value;
    }

    private void resetExportRoot() throws IOException {
        if (Files.exists(EXPORT_ROOT)) {
            try (var walk = Files.walk(EXPORT_ROOT)) {
                walk.sorted(Comparator.reverseOrder()).forEach(path -> {
                    try {
                        Files.delete(path);
                    } catch (IOException e) {
                        throw new RuntimeException("Failed to delete " + path, e);
                    }
                });
            } catch (RuntimeException e) {
                if (e.getCause() instanceof IOException ioException) {
                    throw ioException;
                }
                throw e;
            }
        }

        Files.createDirectories(EXPORT_ROOT);
    }

    private void writeJsonFile(Path path, Object data) throws IOException {
        Files.createDirectories(path.getParent());
        Files.writeString(path, objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(data));
    }

    private void writeStringFile(Path path, String data) throws IOException {
        Files.createDirectories(path.getParent());
        Files.writeString(path, data);
    }

    private String requiredString(Map<String, Object> data, String fieldName, String context) {
        Object value = data.get(fieldName);
        if (!(value instanceof String stringValue) || stringValue.isBlank()) {
            throw new IllegalStateException("Missing field '" + fieldName + "' for " + context);
        }
        return stringValue;
    }

    public record ExportSummary(
        String outputPath,
        int screenerCount,
        int firestoreDocuments,
        int storageFiles
    ) {}
}
