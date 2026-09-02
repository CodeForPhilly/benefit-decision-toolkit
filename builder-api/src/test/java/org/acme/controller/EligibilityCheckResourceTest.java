package org.acme.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.ws.rs.core.Response;
import org.acme.model.domain.EligibilityCheck;
import org.acme.model.dto.EligibilityCheck.CreateCheckRequest;
import org.acme.persistence.EligibilityCheckRepository;
import org.acme.persistence.StorageService;
import org.acme.service.CustomCheckDmnTemplate;
import org.acme.service.DmnService;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EligibilityCheckResourceTest {

    private static final String USER_ID = "owner-1";
    private static final String CHECK_ID = "check-1";

    private final EligibilityCheckResource resource = new EligibilityCheckResource();
    private final EligibilityCheckRepository repository = mock(EligibilityCheckRepository.class);
    private final StorageService storageService = mock(StorageService.class);
    private final DmnService dmnService = mock(DmnService.class);
    private final CustomCheckDmnTemplate customCheckDmnTemplate = mock(CustomCheckDmnTemplate.class);
    private final SecurityIdentity identity = mock(SecurityIdentity.class);
    private final JsonWebToken principal = mock(JsonWebToken.class);

    private EligibilityCheck workingCheck;

    @BeforeEach
    void setUp() throws Exception {
        resource.eligibilityCheckRepository = repository;
        resource.storageService = storageService;
        resource.dmnService = dmnService;
        resource.customCheckDmnTemplate = customCheckDmnTemplate;

        when(principal.<String>getClaim("user_id")).thenReturn(USER_ID);
        when(identity.getPrincipal()).thenReturn(principal);

        workingCheck = new EligibilityCheck("my-check", "my-module", "a check", List.of(), USER_ID);
        workingCheck.setId(CHECK_ID);

        when(repository.getWorkingCustomCheck(USER_ID, CHECK_ID)).thenReturn(Optional.of(workingCheck));
        when(storageService.getCheckDmnModelPath(anyString())).thenReturn("checks/dmn.xml");
        when(storageService.getStringFromStorage("checks/dmn.xml")).thenReturn(Optional.of("<definitions/>"));
        when(dmnService.extractInputSchema(anyString(), any(), anyString()))
                .thenReturn(new ObjectMapper().createObjectNode());
        when(repository.saveNewPublishedCustomCheck(any())).thenReturn("published-check-1");
    }

    @Test
    void createCustomCheckPersistsAndReturnsTheStarterDmn() throws Exception {
        CreateCheckRequest request = new CreateCheckRequest(
                "incomeCheck",
                "income",
                "Checks the applicant's income",
                List.of()
        );
        String checkId = "W-owner-1-income-incomeCheck";
        String dmnPath = "check/" + checkId + ".dmn";
        String initialDmn = "<dmn:definitions/>";

        when(customCheckDmnTemplate.create(request.name(), request.description())).thenReturn(initialDmn);
        when(repository.saveNewWorkingCustomCheck(any(EligibilityCheck.class)))
                .thenAnswer(invocation -> {
                    EligibilityCheck check = invocation.getArgument(0);
                    check.setId(checkId);
                    return checkId;
                });
        when(storageService.getCheckDmnModelPath(checkId)).thenReturn(dmnPath);

        Response response = resource.createCustomCheck(identity, request);

        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
        EligibilityCheck createdCheck = (EligibilityCheck) response.getEntity();
        assertEquals(checkId, createdCheck.getId());
        assertEquals(initialDmn, createdCheck.getDmnModel());
        verify(storageService).writeStringToStorage(dmnPath, initialDmn, "application/xml");
        assertSame(createdCheck, response.getEntity());
    }

    // A check document without its DMN model is unusable, and its id would block the next attempt
    @Test
    void createCustomCheckRemovesTheCheckWhenItsDmnCannotBeStored() throws Exception {
        CreateCheckRequest request = new CreateCheckRequest(
                "incomeCheck",
                "income",
                "Checks the applicant's income",
                List.of()
        );
        String checkId = "W-owner-1-income-incomeCheck";

        when(customCheckDmnTemplate.create(request.name(), request.description()))
                .thenReturn("<dmn:definitions/>");
        when(repository.saveNewWorkingCustomCheck(any(EligibilityCheck.class))).thenReturn(checkId);
        when(storageService.getCheckDmnModelPath(checkId)).thenReturn("check/" + checkId + ".dmn");
        doThrow(new RuntimeException("storage unavailable"))
                .when(storageService).writeStringToStorage(anyString(), anyString(), anyString());

        Response response = resource.createCustomCheck(identity, request);

        assertEquals(Response.Status.INTERNAL_SERVER_ERROR.getStatusCode(), response.getStatus());
        verify(repository).deleteWorkingCustomCheck(checkId);
    }

    @Test
    void firstPublishKeepsInitialVersion() throws Exception {
        when(repository.getPublishedCheckVersions(workingCheck)).thenReturn(List.of());

        Response response = resource.publishCustomCheck(identity, CHECK_ID);

        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
        assertEquals("1.0.0", capturedPublishedVersion());
    }

    @Test
    void laterPublishIncrementsPastHighestPublishedVersion() throws Exception {
        workingCheck.setVersion("2.0.0");
        when(repository.getPublishedCheckVersions(workingCheck))
                .thenReturn(List.of(publishedVersion("1.0.0"), publishedVersion("2.0.0")));

        Response response = resource.publishCustomCheck(identity, CHECK_ID);

        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
        assertEquals("3.0.0", capturedPublishedVersion());
    }

    // A working version that lags what is already published must not reuse a published version number
    @Test
    void staleWorkingVersionDoesNotReusePublishedVersion() throws Exception {
        workingCheck.setVersion("1.0.0");
        when(repository.getPublishedCheckVersions(workingCheck))
                .thenReturn(List.of(publishedVersion("2.0.0"), publishedVersion("1.0.0")));

        Response response = resource.publishCustomCheck(identity, CHECK_ID);

        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
        assertEquals("3.0.0", capturedPublishedVersion());
    }

    // An unreadable version list must not be mistaken for "never published"
    @Test
    void publishFailsWhenPublishedVersionsCannotBeRead() throws Exception {
        workingCheck.setVersion("2.0.0");
        when(repository.getPublishedCheckVersions(workingCheck)).thenThrow(new RuntimeException("firestore unavailable"));

        Response response = resource.publishCustomCheck(identity, CHECK_ID);

        assertEquals(Response.Status.INTERNAL_SERVER_ERROR.getStatusCode(), response.getStatus());
        verify(repository, never()).saveNewPublishedCustomCheck(any());
        verify(repository, never()).updateWorkingCustomCheck(any());
    }

    private EligibilityCheck publishedVersion(String version) {
        EligibilityCheck published = new EligibilityCheck("my-check", "my-module", "a check", List.of(), USER_ID);
        published.setVersion(version);
        return published;
    }

    /* The version the endpoint actually published */
    private String capturedPublishedVersion() throws Exception {
        ArgumentCaptor<EligibilityCheck> captor = ArgumentCaptor.forClass(EligibilityCheck.class);
        verify(repository).saveNewPublishedCustomCheck(captor.capture());
        return captor.getValue().getVersion();
    }
}
