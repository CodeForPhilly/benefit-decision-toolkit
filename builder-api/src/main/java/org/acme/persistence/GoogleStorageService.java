package org.acme.persistence;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.storage.*;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import com.google.cloud.storage.Storage;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class GoogleStorageService implements StorageService {
    @Inject
    Storage storage;

    @Inject
    @ConfigProperty(name = "GCS_BUCKET_NAME", defaultValue = "demo-bdt-dev.appspot.com")
    String bucketName;

    @Override
    public void writeStringToStorage(String filePath, String content, String contentType){
        try {
            BlobId blobId = BlobId.of(bucketName, filePath);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                    .setContentType(contentType)
                    .build();
            byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
            storage.createFrom(blobInfo, new ByteArrayInputStream(bytes));
            Log.info("Uploaded to GCS: " + filePath);
        } catch (Exception e){
            Log.error("Error writing string to GCS: " + e.getMessage());
        }
    }

    @Override
    public void writeBytesToStorage(String filePath, byte[] content, String contentType){
        try {
            BlobId blobId = BlobId.of(bucketName, filePath);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                    .setContentType(contentType)
                    .build();
            storage.createFrom(blobInfo, new ByteArrayInputStream(content));
            Log.info("Uploaded to GCS: " + filePath);
        } catch (Exception e){
            Log.error("Error writing bytes to GCS: " + e.getMessage());
        }
    }

    @Override
    public void writeJsonToStorage(String filePath, JsonNode json){
        try {
            ObjectMapper mapper = new ObjectMapper();
            byte[] content = mapper.writeValueAsBytes(json);
            BlobId blobId = BlobId.of(bucketName, filePath);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                    .setContentType("application/json")
                    .build();
            storage.createFrom(blobInfo, new ByteArrayInputStream(content));
            Log.info("Uploaded to GCS: " + filePath);
        } catch (Exception e){
            Log.error("Error writing JSON to GCS: " + e.getMessage());
        }
    }

    @Override
    public Optional<InputStream> getFileInputStreamFromStorage(String filePath) {
        try {
            BlobId blobId = BlobId.of(bucketName, filePath);
            Blob blob = storage.get(blobId);

            if (blob == null || !blob.exists()) {
                return Optional.empty();
            }

            byte[] data = blob.getContent();
            return Optional.of(new ByteArrayInputStream(data));

        } catch (Exception e){
            Log.error("Error fetching file from firebase storage: ", e);
            return Optional.empty();
        }
    }

    @Override
    public Optional<String> getStringFromStorage(String filePath) {
        try {
            BlobId blobId = BlobId.of(bucketName, filePath);
            Blob blob = storage.get(blobId);

            if (blob == null || !blob.exists()) {
                return Optional.empty();
            }

            // Get content and convert to UTF-8 String
            byte[] data = blob.getContent();
            String content = new String(data, StandardCharsets.UTF_8);

            return Optional.of(content);

        } catch (Exception e) {
            Log.error("Error fetching file from Firebase Storage: ", e);
            return Optional.empty();
        }
    }

    @Override
    public Optional<byte[]> getFileBytesFromStorage(String filePath) {
        try {
            BlobId blobId = BlobId.of(bucketName, filePath);
            Blob blob = storage.get(blobId);

            if (blob == null || !blob.exists()) {
                return Optional.empty();
            }

            byte[] data = blob.getContent();
            return Optional.of(data);

        } catch (Exception e){
            Log.error("Error fetching file from firebase storage: ", e);
            return Optional.empty();
        }
    }
    @Override
    public String getScreenerWorkingDmnModelPath(String screenerId){
        return "dmn/working/" + screenerId + ".dmn";
    }

    @Override
    public String getScreenerWorkingFormSchemaPath(String screenerId){
        return "form/working/" + screenerId + ".json";
    }

    @Override
    public String getScreenerPublishedFormSchemaPath(String screenerId){
        return "form/published/" + screenerId + ".json";
    }

    @Override
    public String getPublishedCompiledDmnModelPath(String screenerId){
        return "compiled_dmn_models/published/" + screenerId + "/kiebase.ser";
    }

    @Override
    public String getWorkingCompiledDmnModelPath(String screenerId){
        return "compiled_dmn_models/working/" + screenerId + "/kiebase.ser";
    }
    @Override
    public Map<String, Object> getFormSchemaFromStorage(String filePath) {
        try {
            BlobId blobId = BlobId.of(bucketName, filePath);
            Blob blob = storage.get(blobId);

            if (blob == null || !blob.exists()) {
               return null;
            }

            byte[] content = blob.getContent();

            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> formSchema = mapper.readValue(new ByteArrayInputStream(content), new TypeReference<Map<String, Object>>() {
            });

            return formSchema;

        } catch (Exception e){
            Log.error("Error fetching form model from firebase storage: ", e);
            return null;
        }
    }

    @Override
    public void updatePublishedFormSchemaArtifact(String screenerId) throws Exception {
        try {
            String sourcePath = getScreenerWorkingFormSchemaPath(screenerId);
            String destPath = getScreenerPublishedFormSchemaPath(screenerId);

            BlobId sourceBlobId = BlobId.of(bucketName, sourcePath);
            Blob sourceBlob = storage.get(sourceBlobId);
            if (sourceBlob == null || !sourceBlob.exists()) {
                throw new Exception("Working form schema does not exist in cloud storage for screener: " + screenerId);
            }

            byte[] content = sourceBlob.getContent();

            writeBytesToStorage(destPath, content, "application/json");
            Log.info("Working form schema copied to published artifact path for screener: " + screenerId);
        } catch (Exception e) {
            Log.error("Error updating published form schema in cloud storage:", e);
            throw new Exception("Error updating published form schema in cloud storage");
        }
    }
}
