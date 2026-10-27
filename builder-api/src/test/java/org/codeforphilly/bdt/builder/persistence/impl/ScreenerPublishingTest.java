package org.codeforphilly.bdt.builder.persistence.impl;

import jakarta.ws.rs.BadRequestException;
import org.codeforphilly.bdt.builder.model.domain.Screener;
import org.codeforphilly.bdt.builder.persistence.PublishedScreenerRepository;
import org.codeforphilly.bdt.builder.persistence.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScreenerPublishingTest {
    @Mock StorageService storage;
    @Mock PublishedScreenerRepository published;
    @Spy @InjectMocks ScreenerRepositoryImpl repository;
    Screener screener;

    @BeforeEach
    void setup() {
        screener = Screener.create("owner", "Housing", null);
        screener.setId("working");
        when(storage.getScreenerWorkingFormSchemaPath("working")).thenReturn("form/working/working.json");
    }

    @Test
    void missingFormDoesNotCreateAPublicRecordOrMarkTheScreenerPublished() throws Exception {
        when(storage.readFormSchema("form/working/working.json")).thenReturn(Optional.empty());
        var error = assertThrows(BadRequestException.class, () -> repository.publishScreener(screener));
        assertEquals("Save the form in Form Editor before publishing.", error.getMessage());
        assertNull(screener.getPublishedScreenerId());
        assertNull(screener.getLastPublishDate());
        verifyNoInteractions(published);
        verify(repository, never()).updateWorkingScreener(any());
        verify(storage, never()).updatePublishedFormSchemaArtifact(anyString(), anyString());
    }

    @Test
    void failedStorageReadIsNotTreatedAsAnUnsavedForm() throws Exception {
        var failure = new IOException("Storage unavailable");
        when(storage.readFormSchema("form/working/working.json")).thenThrow(failure);
        assertSame(failure, assertThrows(IOException.class, () -> repository.publishScreener(screener)));
        verifyNoInteractions(published);
        verify(repository, never()).updateWorkingScreener(any());
    }

    @Test
    void failedFormCopyDoesNotRefreshBenefitsOrAdvancePublicationMetadata() throws Exception {
        savedForm();
        screener.setPublishedScreenerId("public");
        screener.setLastPublishDate("previous publication");
        doThrow(new IOException("Write failed")).when(storage).updatePublishedFormSchemaArtifact("working", "public");
        assertThrows(IOException.class, () -> repository.publishScreener(screener));
        assertEquals("previous publication", screener.getLastPublishDate());
        verifyNoInteractions(published);
        verify(repository, never()).updateWorkingScreener(any());
    }

    @Test
    void publicationIsMarkedSuccessfulOnlyAfterArtifactsHaveBeenSaved() throws Exception {
        savedForm();
        when(published.createPublishedScreener(screener)).thenReturn("public");
        doNothing().when(repository).updateWorkingScreener(screener);
        repository.publishScreener(screener);
        var order = inOrder(storage, published, repository);
        order.verify(storage).readFormSchema("form/working/working.json");
        order.verify(published).createPublishedScreener(screener);
        order.verify(storage).updatePublishedFormSchemaArtifact("working", "public");
        order.verify(published).refreshPublishedScreenerbenefits("public", List.of());
        order.verify(repository).updateWorkingScreener(screener);
        assertNotNull(screener.getLastPublishDate());
    }

    private void savedForm() throws Exception {
        when(storage.readFormSchema("form/working/working.json")).thenReturn(Optional.of(Map.of("components", List.of())));
        doReturn(List.of()).when(repository).getBenefitsInScreener(screener);
    }
}
