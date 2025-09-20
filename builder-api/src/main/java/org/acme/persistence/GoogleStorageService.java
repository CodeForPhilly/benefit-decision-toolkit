package org.acme.persistence;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.storage.*;
import com.google.firebase.cloud.StorageClient;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class GoogleStorageService implements StorageService {

    @Override
    public void writeStringToStorage(String filePath, String content, String contentType){
        try {
            Bucket bucket = StorageClient.getInstance().bucket();
            InputStream inputSteam = new ByteArrayInputStream(content.getBytes(StandardCharsets.UTF_8));
            Blob blob = bucket.create(filePath, inputSteam, contentType);
            Log.info("Uploaded to GCS: " + blob.getName());
        } catch (Exception e){
            Log.error("Error writing file to GCS: " + e.getMessage());
        }
    }

    @Override
    public void writeBytesToStorage(String filePath, byte[] content, String contentType){
        try {
            Bucket bucket = StorageClient.getInstance().bucket();
            InputStream inputSteam = new ByteArrayInputStream(content);
            Blob blob = bucket.create(filePath, inputSteam, contentType);
            Log.info("Uploaded to GCS: " + blob.getName());
        } catch (Exception e){
            Log.error("Error writing file to GCS: " + e.getMessage());
        }
    }

    @Override
    public void writeJsonToStorage(String filePath, JsonNode json){
        try {
            Bucket bucket = StorageClient.getInstance().bucket();
            ObjectMapper mapper = new ObjectMapper();
            InputStream inputSteam = new ByteArrayInputStream(mapper.writeValueAsBytes(json));
            Blob blob = bucket.create(filePath, inputSteam, "application/json");
            Log.info("Uploaded to GCS: " + blob.getName());
        } catch (Exception e){
            Log.error("Error writing file to GCS: " + e.getMessage());
        }
    }

    @Override
    public Optional<InputStream> getFileInputStreamFromStorage(String filePath) {
        try {
            Bucket bucket = StorageClient.getInstance().bucket();
            Blob blob = bucket.get(filePath);

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
            Bucket bucket = StorageClient.getInstance().bucket();
            Blob blob = bucket.get(filePath);

            if (blob == null || !blob.exists()) {
                return Optional.empty();
            }

            // Get content and convert to UTF-8 String
            byte[] data = blob.getContent(Blob.BlobSourceOption.generationMatch());
            String content = new String(data, StandardCharsets.UTF_8);

            return Optional.of(content);

        } catch (Exception e) {
            Log.error("Error fetching XML file from Firebase Storage: ", e);
            return Optional.empty();
        }
    }

    @Override
    public Optional<byte[]> getFileBytesFromStorage(String filePath) {
        try {
            Bucket bucket = StorageClient.getInstance().bucket();
            Blob blob = bucket.get(filePath);

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
            Bucket bucket = StorageClient.getInstance().bucket();
            Blob blob = bucket.get(filePath);

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
            Bucket bucket = StorageClient.getInstance().bucket();
            Blob workingFormBlob = bucket.get(getScreenerWorkingFormSchemaPath(screenerId));
            CopyWriter formCopyWriter = workingFormBlob.copyTo(BlobId.of(bucket.getName(), getScreenerPublishedFormSchemaPath(screenerId)));
            formCopyWriter.getResult();
            Log.info("Working form schema copied to published artifact path for screener: " + screenerId);
        } catch (Exception e){
            Log.error("Error updating published form schema in cloud storage");
            throw new Exception("Error updating published form schema in cloud storage");
        }
    }
}
