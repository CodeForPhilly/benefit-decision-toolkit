package org.acme.repository.utils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Bucket;
import com.google.firebase.cloud.StorageClient;
import io.quarkus.logging.Log;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Map;
import java.util.Optional;

public class StorageUtils {

    public static String getScreenerPublishedFormSchemaPath(String screenerId){
        return "form/published/" + screenerId + ".json";
    }

    public static String getScreenerPublishedDmnModelPath(String screenerId){
        return "dmn/published/" + screenerId + ".dmn";
    }


    public static String getPublishedCompiledDmnModelPath(String screenerId){
        return "compiled_dmn_models/published/" + screenerId + "/kiebase.ser";
    }

    public static Map<String, Object> getFormSchemaFromStorage(String filePath) {
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

    public static Optional<byte[]> getFileBytesFromStorage(String filePath) {
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

    public static Optional<InputStream> getFileInputStreamFromStorage(String filePath) {
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
}
