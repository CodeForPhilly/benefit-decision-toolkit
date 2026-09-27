package org.acme.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.ws.rs.core.Response;
import org.acme.model.domain.EligibilityCheck;
import org.acme.model.dto.EligibilityCheck.CreateCheckRequest;
import org.acme.model.dto.EligibilityCheck.EditCheckRequest;
import org.acme.persistence.DocumentAlreadyExistsException;
import org.acme.persistence.EligibilityCheckRepository;
import org.acme.persistence.StorageService;
import org.acme.service.CustomCheckDmnTemplate;
import org.acme.service.CustomCheckDmnRenameValidator;
import org.acme.service.DmnService;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;
import java.util.logging.Filter;
import java.util.logging.Level;
import java.util.logging.LogRecord;
import java.util.logging.Logger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
    private static final String PUBLISHED_PREFIX = "P-" + USER_ID + "-my-module-my-check";

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
        resource.customCheckDmnRenameValidator = new CustomCheckDmnRenameValidator();

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
        when(repository.newWorkingId()).thenReturn("W-new");
        when(repository.getPublishedId(any(), anyString()))
                .thenAnswer(invocation -> PUBLISHED_PREFIX + "-" + invocation.<String>getArgument(1));
    }

    @Test
    void createCustomCheckPersistsAndReturnsTheStarterDmn() throws Exception {
        CreateCheckRequest request = new CreateCheckRequest(
                "incomeCheck",
                "income",
                "Checks the applicant's income",
                List.of()
        );
        String checkId = "W-new";
        String dmnPath = "check/" + checkId + ".dmn";
        String initialDmn = "<dmn:definitions/>";

        when(customCheckDmnTemplate.create(request.name(), request.description())).thenReturn(initialDmn);
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
        String checkId = "W-new";

        when(customCheckDmnTemplate.create(request.name(), request.description()))
                .thenReturn("<dmn:definitions/>");
        when(storageService.getCheckDmnModelPath(checkId)).thenReturn("check/" + checkId + ".dmn");
        RuntimeException storageFailure = new RuntimeException("storage unavailable");
        doThrow(storageFailure)
                .when(storageService).writeStringToStorage(anyString(), anyString(), anyString());

        Response response = captureExpectedErrorLog(
                "Could not save the DMN model of check " + checkId + ", removing the check",
                storageFailure,
                () -> resource.createCustomCheck(identity, request));

        assertEquals(Response.Status.INTERNAL_SERVER_ERROR.getStatusCode(), response.getStatus());
        verify(repository).deleteWorkingCustomCheck(checkId);
        verify(repository).releaseCheckName(USER_ID, request.module(), request.name(), checkId);
    }

    @Test
    void createCustomCheckRejectsAnExistingActiveCheck() throws Exception {
        CreateCheckRequest request = createCheckRequest();
        EligibilityCheck existing = new EligibilityCheck(
                request.name(), request.module(), request.description(), List.of(), USER_ID);
        when(repository.getAllWorkingCustomChecks(USER_ID)).thenReturn(List.of(existing));

        Response response = resource.createCustomCheck(identity, request);

        assertEquals(Response.Status.CONFLICT.getStatusCode(), response.getStatus());
        assertEquals(
                "You already have a check named \"incomeCheck\" in module \"income\".",
                ((java.util.Map<?, ?>) response.getEntity()).get("error"));
        verify(repository, never()).saveNewWorkingCustomCheck(any());
        verify(storageService, never()).writeStringToStorage(anyString(), anyString(), anyString());
    }

    @Test
    void createCustomCheckExplainsAnArchivedCollision() throws Exception {
        CreateCheckRequest request = createCheckRequest();
        EligibilityCheck existing = new EligibilityCheck(
                request.name(), request.module(), request.description(), List.of(), USER_ID);
        existing.setIsArchived(true);
        when(repository.getAllWorkingCustomChecks(USER_ID)).thenReturn(List.of(existing));

        Response response = resource.createCustomCheck(identity, request);

        assertEquals(Response.Status.CONFLICT.getStatusCode(), response.getStatus());
        assertEquals(
                "A check named \"incomeCheck\" in module \"income\" is archived. Restore it or choose a different name.",
                ((java.util.Map<?, ?>) response.getEntity()).get("error"));
        verify(repository, never()).saveNewWorkingCustomCheck(any());
    }

    private CreateCheckRequest createCheckRequest() {
        return new CreateCheckRequest(
                "incomeCheck",
                "income",
                "Checks the applicant's income",
                List.of());
    }

    @Test
    void getCustomChecksCanIncludeArchivedChecksInOneRead() {
        EligibilityCheck archivedCheck = new EligibilityCheck(
                "old-check", "income", "an old check", List.of(), USER_ID);
        archivedCheck.setIsArchived(true);
        when(repository.getAllWorkingCustomChecks(USER_ID))
                .thenReturn(List.of(workingCheck, archivedCheck));

        Response response = resource.getCustomChecks(identity, true, true);

        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
        assertEquals(List.of(workingCheck, archivedCheck), response.getEntity());
        verify(repository).getAllWorkingCustomChecks(USER_ID);
        verify(repository, never()).getWorkingCustomChecks(USER_ID);
    }

    @Test
    void getCustomChecksOmitsArchivedChecksByDefault() {
        when(repository.getWorkingCustomChecks(USER_ID)).thenReturn(List.of(workingCheck));

        Response response = resource.getCustomChecks(identity, true, null);

        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
        assertEquals(List.of(workingCheck), response.getEntity());
        verify(repository).getWorkingCustomChecks(USER_ID);
        verify(repository, never()).getAllWorkingCustomChecks(USER_ID);
    }

    @Test
    void getCustomChecksRejectsIncludeArchivedWithoutWorking() {
        Response response = resource.getCustomChecks(identity, null, true);

        assertEquals(Response.Status.BAD_REQUEST.getStatusCode(), response.getStatus());
        assertEquals("includeArchived requires working=true",
                ((java.util.Map<?, ?>) response.getEntity()).get("error"));
        verify(repository, never()).getLatestVersionPublishedCustomChecks(USER_ID);
    }

    @Test
    void renameCustomCheckUpdatesWorkingDecisionButLeavesPublishedVersionUntouched() throws Exception {
        EligibilityCheck publishedCheck = new EligibilityCheck("my-check", "my-module", "a check", List.of(), USER_ID);
        publishedCheck.setId("published-check-1");
        String originalDmn = new CustomCheckDmnTemplate().create("my-check", "a check");
        when(storageService.getStringFromStorage("checks/dmn.xml")).thenReturn(Optional.of(originalDmn));
        Response response = resource.updateCustomCheck(identity, CHECK_ID,
                new EditCheckRequest("  New public title  ", null, null,
                        originalDmn.replace("name=\"my-check\"", "name=\"New public title\""), originalDmn));

        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
        assertEquals("New public title", workingCheck.getName());
        assertEquals(CHECK_ID, workingCheck.getId());
        verify(repository).updateWorkingCustomCheck(workingCheck);
        assertEquals("my-check", publishedCheck.getName());
        verify(repository, never()).updatePublishedCustomCheck(any());
        verify(storageService).writeStringToStorage(org.mockito.ArgumentMatchers.eq("checks/dmn.xml"),
                org.mockito.ArgumentMatchers.contains("name=\"New public title\""),
                org.mockito.ArgumentMatchers.eq("application/xml"));
    }

    @Test
    void renameCustomCheckRejectsMissingDecision() throws Exception {
        Response response = resource.updateCustomCheck(identity, CHECK_ID,
                new EditCheckRequest("other-check", null, null, "<definitions/>", "<definitions/>"));

        assertEquals(Response.Status.CONFLICT.getStatusCode(), response.getStatus());
        verify(repository, never()).updateWorkingCustomCheck(any());
    }

    @Test
    void renameCustomCheckRejectsStaleModelWithoutWriting() throws Exception {
        Response response = resource.updateCustomCheck(identity, CHECK_ID,
                new EditCheckRequest("new-check", null, null, "<definitions/>", "outdated"));

        assertEquals(Response.Status.CONFLICT.getStatusCode(), response.getStatus());
        verify(storageService, never()).writeStringToStorage(anyString(), anyString(), anyString());
        verify(repository, never()).updateWorkingCustomCheck(any());
    }

    @Test
    void renameCustomCheckRequiresRefactoredModel() throws Exception {
        Response response = resource.updateCustomCheck(identity, CHECK_ID,
                new EditCheckRequest("new-check", null, null, null, null));

        assertEquals(Response.Status.BAD_REQUEST.getStatusCode(), response.getStatus());
        verify(repository, never()).updateWorkingCustomCheck(any());
    }

    @Test
    void renameCustomCheckRestoresDmnWhenMetadataUpdateFails() throws Exception {
        String originalDmn = new CustomCheckDmnTemplate().create("my-check", "a check");
        when(storageService.getStringFromStorage("checks/dmn.xml")).thenReturn(Optional.of(originalDmn));
        doThrow(new Exception("Firestore unavailable"))
                .when(repository).updateWorkingCustomCheck(workingCheck);

        Response response = resource.updateCustomCheck(identity, CHECK_ID,
                new EditCheckRequest("new-check", null, null,
                        originalDmn.replace("name=\"my-check\"", "name=\"new-check\""), originalDmn));

        assertEquals(Response.Status.INTERNAL_SERVER_ERROR.getStatusCode(), response.getStatus());
        verify(storageService).writeStringToStorage("checks/dmn.xml", originalDmn, "application/xml");
        verify(repository).releaseCheckName(USER_ID, "my-module", "new-check", CHECK_ID);
        verify(repository, never()).releaseCheckName(USER_ID, "my-module", "my-check", CHECK_ID);
    }

    @Test
    void createCustomCheckRejectsNameAlreadyUsedByARenamedCheck() throws Exception {
        workingCheck.setName("new-check");
        when(repository.getAllWorkingCustomChecks(USER_ID)).thenReturn(List.of(workingCheck));
        CreateCheckRequest request = new CreateCheckRequest("new-check", "my-module", "another", List.of());

        Response response = resource.createCustomCheck(identity, request);

        assertEquals(Response.Status.CONFLICT.getStatusCode(), response.getStatus());
        verify(repository, never()).saveNewWorkingCustomCheck(any());
    }

    @Test
    void createCustomCheckConflictsWhenAConcurrentRequestReservedTheName() throws Exception {
        CreateCheckRequest request = createCheckRequest();
        doThrow(new DocumentAlreadyExistsException("reservation", null))
                .when(repository).reserveCheckName(USER_ID, request.module(), request.name(), "W-new");

        Response response = resource.createCustomCheck(identity, request);

        assertEquals(Response.Status.CONFLICT.getStatusCode(), response.getStatus());
        verify(repository, never()).saveNewWorkingCustomCheck(any());
    }

    @Test
    void createCustomCheckReleasesTheNameWhenTheCheckCannotBeSaved() throws Exception {
        CreateCheckRequest request = createCheckRequest();
        when(repository.saveNewWorkingCustomCheck(any())).thenThrow(new Exception("Firestore unavailable"));

        Response response = resource.createCustomCheck(identity, request);

        assertEquals(Response.Status.INTERNAL_SERVER_ERROR.getStatusCode(), response.getStatus());
        verify(repository).releaseCheckName(USER_ID, request.module(), request.name(), "W-new");
    }

    @Test
    void renameCustomCheckMovesTheNameReservation() throws Exception {
        String originalDmn = new CustomCheckDmnTemplate().create("my-check", "a check");
        when(storageService.getStringFromStorage("checks/dmn.xml")).thenReturn(Optional.of(originalDmn));

        Response response = resource.updateCustomCheck(identity, CHECK_ID,
                new EditCheckRequest("new-check", null, null,
                        originalDmn.replace("name=\"my-check\"", "name=\"new-check\""), originalDmn));

        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
        verify(repository).reserveCheckName(USER_ID, "my-module", "new-check", CHECK_ID);
        verify(repository).releaseCheckName(USER_ID, "my-module", "my-check", CHECK_ID);
    }

    @Test
    void renameCustomCheckConflictsWhenAConcurrentRequestReservedTheName() throws Exception {
        String originalDmn = new CustomCheckDmnTemplate().create("my-check", "a check");
        when(storageService.getStringFromStorage("checks/dmn.xml")).thenReturn(Optional.of(originalDmn));
        doThrow(new DocumentAlreadyExistsException("reservation", null))
                .when(repository).reserveCheckName(USER_ID, "my-module", "new-check", CHECK_ID);

        Response response = resource.updateCustomCheck(identity, CHECK_ID,
                new EditCheckRequest("new-check", null, null,
                        originalDmn.replace("name=\"my-check\"", "name=\"new-check\""), originalDmn));

        assertEquals(Response.Status.CONFLICT.getStatusCode(), response.getStatus());
        verify(storageService, never()).writeStringToStorage(anyString(), anyString(), anyString());
        verify(repository, never()).updateWorkingCustomCheck(any());
    }

    // Check ids built from names outlive a rename, so they must not reserve the old name
    @Test
    void createCustomCheckAllowsTheFormerNameOfARenamedCheck() throws Exception {
        EligibilityCheck renamedCheck = new EligibilityCheck("renamed", "my-module", "", List.of(), USER_ID);
        renamedCheck.setId("W-" + USER_ID + "-my-module-my-check");
        when(repository.getAllWorkingCustomChecks(USER_ID)).thenReturn(List.of(renamedCheck));
        when(repository.saveNewWorkingCustomCheck(any())).thenReturn("W-new");
        CreateCheckRequest request = new CreateCheckRequest("my-check", "my-module", "another", List.of());

        Response response = resource.createCustomCheck(identity, request);

        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
    }

    @Test
    void renameCustomCheckAllowsTheFormerNameOfAnotherRenamedCheck() throws Exception {
        EligibilityCheck renamedCheck = new EligibilityCheck("renamed", "my-module", "", List.of(), USER_ID);
        renamedCheck.setId("W-" + USER_ID + "-my-module-free-name");
        when(repository.getAllWorkingCustomChecks(USER_ID)).thenReturn(List.of(workingCheck, renamedCheck));
        String originalDmn = new CustomCheckDmnTemplate().create("my-check", "a check");
        when(storageService.getStringFromStorage("checks/dmn.xml")).thenReturn(Optional.of(originalDmn));

        Response response = resource.updateCustomCheck(identity, CHECK_ID,
                new EditCheckRequest("free-name", null, null,
                        originalDmn.replace("name=\"my-check\"", "name=\"free-name\""), originalDmn));

        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
        assertEquals("free-name", workingCheck.getName());
    }

    @Test
    void renameCustomCheckRejectsANameInUse() throws Exception {
        EligibilityCheck otherCheck = new EligibilityCheck("taken", "my-module", "", List.of(), USER_ID);
        otherCheck.setId("W-other");
        when(repository.getAllWorkingCustomChecks(USER_ID)).thenReturn(List.of(workingCheck, otherCheck));

        Response response = resource.updateCustomCheck(identity, CHECK_ID,
                new EditCheckRequest("taken", null, null, "<definitions/>", "<definitions/>"));

        assertEquals(Response.Status.CONFLICT.getStatusCode(), response.getStatus());
        verify(repository, never()).updateWorkingCustomCheck(any());
    }

    @Test
    void restoreCustomCheckMakesAnArchivedCheckActive() throws Exception {
        workingCheck.setIsArchived(true);
        when(repository.getWorkingCustomCheck(USER_ID, CHECK_ID, true))
                .thenReturn(Optional.of(workingCheck));

        Response response = resource.restoreCustomCheck(identity, CHECK_ID);

        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
        assertFalse(workingCheck.getIsArchived());
        verify(repository).updateWorkingCustomCheck(workingCheck);
    }

    @Test
    void restoreCustomCheckRejectsAnActiveCheck() throws Exception {
        when(repository.getWorkingCustomCheck(USER_ID, CHECK_ID, true))
                .thenReturn(Optional.of(workingCheck));

        Response response = resource.restoreCustomCheck(identity, CHECK_ID);

        assertEquals(Response.Status.BAD_REQUEST.getStatusCode(), response.getStatus());
        assertEquals("Check is not archived", ((java.util.Map<?, ?>) response.getEntity()).get("error"));
        verify(repository, never()).updateWorkingCustomCheck(any());
    }

    @Test
    void restoreCustomCheckReturnsNotFoundForAnUnknownCheck() {
        when(repository.getWorkingCustomCheck(USER_ID, CHECK_ID, true))
                .thenReturn(Optional.empty());

        Response response = resource.restoreCustomCheck(identity, CHECK_ID);

        assertEquals(Response.Status.NOT_FOUND.getStatusCode(), response.getStatus());
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

    @Test
    void malformedPublishedVersionsAreIgnored() throws Exception {
        workingCheck.setVersion("2.0.0");
        when(repository.getPublishedCheckVersions(workingCheck))
                .thenReturn(List.of(
                        publishedVersion(""),
                        publishedVersion("not-a-version"),
                        publishedVersion("1.invalid.0"),
                        publishedVersion("2.0.0")
                ));

        Response response = resource.publishCustomCheck(identity, CHECK_ID);

        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
        assertEquals("3.0.0", capturedPublishedVersion());
    }

    // Dot-only strings split into no parts at all, so they must not be read as version 0.0.0
    @Test
    void dotOnlyPublishedVersionsAreIgnored() throws Exception {
        workingCheck.setVersion("2.0.0");
        when(repository.getPublishedCheckVersions(workingCheck))
                .thenReturn(List.of(publishedVersion("."), publishedVersion("...")));

        Response response = resource.publishCustomCheck(identity, CHECK_ID);

        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
        assertEquals("2.0.0", capturedPublishedVersion());
    }

    /* Ignoring a corrupt version must not hand back a version whose published id is already taken:
       that document could never be written, so publishing would fail for good. */
    @Test
    void publishSkipsVersionsWhosePublishedIdAlreadyExists() throws Exception {
        workingCheck.setVersion("2.0.0");
        when(repository.getPublishedCheckVersions(workingCheck))
                .thenReturn(List.of(
                        publishedVersion("1.0.0"),
                        publishedVersion("v2.0.0", PUBLISHED_PREFIX + "-2.0.0")
                ));

        Response response = resource.publishCustomCheck(identity, CHECK_ID);

        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
        assertEquals("3.0.0", capturedPublishedVersion());
    }

    @Test
    void publishKeepsSkippingUntilAnUnusedVersionIsFound() throws Exception {
        workingCheck.setVersion("1.0.0");
        when(repository.getPublishedCheckVersions(workingCheck))
                .thenReturn(List.of(
                        publishedVersion("1.0.0"),
                        publishedVersion("v2.0.0", PUBLISHED_PREFIX + "-2.0.0"),
                        publishedVersion("v3.0.0", PUBLISHED_PREFIX + "-3.0.0")
                ));

        Response response = resource.publishCustomCheck(identity, CHECK_ID);

        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
        assertEquals("4.0.0", capturedPublishedVersion());
    }

    // A corrupt working version cannot be published as-is, or the next publish inherits the corruption
    @Test
    void firstPublishOfACorruptWorkingVersionStartsAtTheInitialVersion() throws Exception {
        workingCheck.setVersion("not-a-version");
        when(repository.getPublishedCheckVersions(workingCheck)).thenReturn(List.of());

        Response response = resource.publishCustomCheck(identity, CHECK_ID);

        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
        assertEquals("1.0.0", capturedPublishedVersion());
    }

    // An unreadable version list must not be mistaken for "never published"
    @Test
    void publishFailsWhenPublishedVersionsCannotBeRead() throws Exception {
        workingCheck.setVersion("2.0.0");
        RuntimeException readFailure = new RuntimeException("firestore unavailable");
        when(repository.getPublishedCheckVersions(workingCheck)).thenThrow(readFailure);

        Response response = captureExpectedErrorLog(
                "Could not read published versions of check " + CHECK_ID,
                readFailure,
                () -> resource.publishCustomCheck(identity, CHECK_ID));

        assertEquals(Response.Status.INTERNAL_SERVER_ERROR.getStatusCode(), response.getStatus());
        verify(repository, never()).saveNewPublishedCustomCheck(any());
        verify(repository, never()).updateWorkingCustomCheck(any());
    }

    private <T> T captureExpectedErrorLog(String expectedMessage, Throwable expectedCause, Supplier<T> action) {
        Logger resourceLogger = Logger.getLogger(EligibilityCheckResource.class.getName());
        Filter previousFilter = resourceLogger.getFilter();
        List<LogRecord> capturedLogs = new ArrayList<>();
        resourceLogger.setFilter(record -> {
            if (expectedMessage.equals(record.getMessage()) && record.getThrown() == expectedCause) {
                capturedLogs.add(record);
                return false;
            }
            return previousFilter == null || previousFilter.isLoggable(record);
        });

        T result;
        try {
            result = action.get();
        } finally {
            resourceLogger.setFilter(previousFilter);
        }

        assertEquals(1, capturedLogs.size(), "expected exactly one matching log event");
        LogRecord capturedLog = capturedLogs.get(0);
        assertEquals(expectedMessage, capturedLog.getMessage());
        assertEquals(Level.SEVERE.intValue(), capturedLog.getLevel().intValue());
        assertSame(expectedCause, capturedLog.getThrown());
        return result;
    }

    private EligibilityCheck publishedVersion(String version) {
        return publishedVersion(version, PUBLISHED_PREFIX + "-" + version);
    }

    /* The id is fixed when a version is published, so a version field corrupted later no longer matches it */
    private EligibilityCheck publishedVersion(String version, String id) {
        EligibilityCheck published = new EligibilityCheck("my-check", "my-module", "a check", List.of(), USER_ID);
        published.setVersion(version);
        published.setId(id);
        return published;
    }

    /* The version the endpoint actually published */
    private String capturedPublishedVersion() throws Exception {
        ArgumentCaptor<EligibilityCheck> captor = ArgumentCaptor.forClass(EligibilityCheck.class);
        verify(repository).saveNewPublishedCustomCheck(captor.capture());
        return captor.getValue().getVersion();
    }
}
