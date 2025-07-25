package org.acme.persistence;

import com.fasterxml.jackson.databind.JsonNode;

import java.io.InputStream;
import java.util.Map;
import java.util.Optional;

public interface StorageService {
    void writeStringToStorage(String filePath, String content, String contentType);

    void writeBytesToStorage(String filePath, byte[] content, String contentType);

    void writeJsonToStorage(String filePath, JsonNode json);

    Optional<InputStream> getFileInputStreamFromStorage(String filePath);

    Optional<String> getStringFromStorage(String filePath);

    Optional<byte[]> getFileBytesFromStorage(String filePath);

    String getScreenerWorkingDmnModelPath(String screenerId);

    String getScreenerWorkingFormSchemaPath(String screenerId);

    String getScreenerPublishedFormSchemaPath(String screenerId);

    String getPublishedCompiledDmnModelPath(String screenerId);

    String getWorkingCompiledDmnModelPath(String screenerId);

    Map<String, Object> getFormSchemaFromStorage(String filePath);

    void updatePublishedFormSchemaArtifact(String screenerId) throws Exception;
}
