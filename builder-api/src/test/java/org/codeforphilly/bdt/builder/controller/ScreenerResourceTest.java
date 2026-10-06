package org.codeforphilly.bdt.builder.controller;

import io.quarkus.security.identity.SecurityIdentity;
import org.codeforphilly.bdt.builder.model.domain.Screener;
import org.codeforphilly.bdt.builder.model.dto.screener.EditScreenerRequest;
import org.codeforphilly.bdt.builder.persistence.DuplicateScreenerNameException;
import org.codeforphilly.bdt.builder.persistence.ScreenerRepository;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ScreenerResourceTest {
    private final ScreenerRepository screenerRepository = mock(ScreenerRepository.class);
    private final SecurityIdentity identity = mock(SecurityIdentity.class);
    private final ScreenerResource resource = new ScreenerResource();
    private Screener screener;

    @BeforeEach
    void setUp() {
        resource.screenerRepository = screenerRepository;
        JsonWebToken token = mock(JsonWebToken.class);
        when(identity.getPrincipal()).thenReturn(token);
        when(token.getClaim("user_id")).thenReturn("owner");
        screener = Screener.create("owner", "Housing", null);
        screener.setId("screener-1");
        when(screenerRepository.getWorkingScreener("screener-1")).thenReturn(Optional.of(screener));
    }

    @Test
    void changedNameIsCheckedForUniqueness() throws Exception {
        doThrow(new DuplicateScreenerNameException()).when(screenerRepository).renameWorkingScreener(any());
        try (var response = resource.updateScreener(identity, "screener-1", new EditScreenerRequest("Food"))) {
            assertEquals(409, response.getStatus());
        }
        verify(screenerRepository, never()).updateWorkingScreener(any());
    }

    @Test
    void unchangedNameSavesWithoutTheUniquenessCheck() throws Exception {
        // Screeners created before names were unique may already share this name.
        try (var response = resource.updateScreener(identity, "screener-1", new EditScreenerRequest(" housing "))) {
            assertEquals(200, response.getStatus());
        }
        verify(screenerRepository).updateWorkingScreener(screener);
        assertEquals("housing", screener.getScreenerName());
        verify(screenerRepository, never()).renameWorkingScreener(any());
    }
}
