package org.codeforphilly.bdt.builder.persistence;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.io.InputStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class GoogleStorageServiceTest {
    private final Storage storage = mock(Storage.class);
    private final GoogleStorageService service = new GoogleStorageService();

    @BeforeEach
    void setup() {
        service.storage = storage;
        service.bucketName = "test-bucket";
    }

    @Test
    void formSavePropagatesCloudStorageFailures() throws Exception {
        var failure = new StorageException(503, "Storage unavailable");
        when(storage.createFrom(any(BlobInfo.class), any(InputStream.class))).thenThrow(failure);
        var schema = new ObjectMapper().readTree("{\"components\":[]}");
        var error = assertThrows(Exception.class, () -> service.writeJsonToStorage("form/working/test.json", schema));
        assertSame(failure, error.getCause());
    }

    @Test
    void publishedFormCopyPropagatesDestinationWriteFailures() throws Exception {
        var source = mock(Blob.class);
        when(storage.get(BlobId.of("test-bucket", "form/working/working.json"))).thenReturn(source);
        when(source.exists()).thenReturn(true);
        when(source.getContent()).thenReturn("{\"components\":[]}".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        var failure = new StorageException(503, "Write unavailable");
        when(storage.createFrom(any(BlobInfo.class), any(InputStream.class))).thenThrow(failure);
        var error = assertThrows(Exception.class, () -> service.updatePublishedFormSchemaArtifact("working", "public"));
        assertSame(failure, error.getCause().getCause());
    }
}
