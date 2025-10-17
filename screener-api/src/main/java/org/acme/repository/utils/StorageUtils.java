package org.acme.repository.utils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.Storage;

import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Map;
import java.util.Optional;

import org.eclipse.microprofile.config.ConfigProvider;

@ApplicationScoped
public class StorageUtils {

    @Inject
    Storage storage;

    private final String bucketName = ConfigProvider.getConfig()
            .getOptionalValue("GCS_BUCKET_NAME", String.class)
            .orElse("demo-bdt-dev.appspot.com");
    // private static final Storage storage = Storage.getInstance();

    public String getScreenerPublishedFormSchemaPath(String screenerId){
        return "form/published/" + screenerId + ".json";
    }

    public String getScreenerPublishedDmnModelPath(String screenerId){
        return "dmn/published/" + screenerId + ".dmn";
    }


    public String getPublishedCompiledDmnModelPath(String screenerId){
        return "compiled_dmn_models/published/" + screenerId + "/kiebase.ser";
    }

    public Map<String, Object> getFormSchemaFromStorage(String filePath) {
        try {
            BlobId blobId = BlobId.of(bucketName, filePath);
            Blob blob = this.storage.get(blobId);

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

    public Optional<byte[]> getFileBytesFromStorage(String filePath) {
        try {
            BlobId blobId = BlobId.of(bucketName, filePath);
            Blob blob = this.storage.get(blobId);

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

    public Optional<InputStream> getFileInputStreamFromStorage(String filePath) {
        try {
            BlobId blobId = BlobId.of(bucketName, filePath);
            Blob blob = this.storage.get(blobId);

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
}
