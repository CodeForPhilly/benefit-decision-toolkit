package org.codeforphilly.bdt.builder.controller;

import io.quarkus.security.identity.SecurityIdentity;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import org.codeforphilly.bdt.builder.model.domain.Screener;
import org.codeforphilly.bdt.builder.service.ScreenerTransferService;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ScreenerTransferResourceTest {
    private final ScreenerTransferResource resource = new ScreenerTransferResource();
    private final ScreenerTransferService service = mock(ScreenerTransferService.class);
    private final SecurityIdentity identity = mock(SecurityIdentity.class);
    private final JsonWebToken token = mock(JsonWebToken.class);

    @BeforeEach
    void setup() {
        resource.transferService = service;
        when(identity.getPrincipal()).thenReturn(token);
        when(token.getClaim("user_id")).thenReturn("recipient");
    }

    @Test
    void successfulImportReturnsCreatedWithTheNewDraft() throws Exception {
        Screener draft = Screener.create("recipient", "Name", null);
        draft.setId("new-screener");
        when(service.importScreener("recipient", null)).thenReturn(draft);
        try (var response = resource.importScreener(identity, null)) {
            assertEquals(201, response.getStatus());
            assertSame(draft, response.getEntity());
        }
    }

    @Test
    void invalidFileReturnsAReadableValidationError() throws Exception {
        when(service.importScreener("recipient", null)).thenThrow(new BadRequestException("Missing DMN model"));
        try (var response = resource.importScreener(identity, null)) {
            assertEquals(400, response.getStatus());
            assertEquals(Map.of("error", "Missing DMN model"), response.getEntity());
        }
    }

    @Test
    void duplicateNameReturnsConflictWithAnActionableMessage() throws Exception {
        when(service.importScreener("recipient", null))
                .thenThrow(new org.codeforphilly.bdt.builder.persistence.DuplicateScreenerNameException());
        try (var response = resource.importScreener(identity, null)) {
            assertEquals(409, response.getStatus());
            assertTrue(response.getEntity().toString().contains("Choose a different name"));
        }
    }

    @Test
    void conflictingCheckReturnsAReadableConflict() throws Exception {
        when(service.importScreener("recipient", null)).thenThrow(
                new org.codeforphilly.bdt.builder.service.CustomCheckImportConflictException("Version rules differ"));
        try (var response = resource.importScreener(identity, null)) {
            assertEquals(409, response.getStatus());
            assertEquals(Map.of("error", "Version rules differ"), response.getEntity());
        }
    }

    @Test
    void rejectedImportKeepsItsStatusInsteadOfAskingForARetry() throws Exception {
        when(service.importScreener("recipient", null)).thenThrow(new ForbiddenException());
        try (var response = resource.importScreener(identity, null)) {
            assertEquals(403, response.getStatus());
        }
    }

    @Test
    void forbiddenExportReturnsForbidden() throws Exception {
        when(service.exportScreener("recipient", "other-screener")).thenThrow(new ForbiddenException());
        try (var response = resource.exportScreener(identity, "other-screener")) {
            assertEquals(403, response.getStatus());
        }
    }

    @Test
    void missingIdentityDoesNotCallTransferService() {
        when(token.getClaim("user_id")).thenReturn(null);
        assertEquals(401, resource.exportScreener(identity, "id").getStatus());
        assertEquals(401, resource.importScreener(identity, null).getStatus());
        verifyNoInteractions(service);
    }
}
