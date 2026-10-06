package org.codeforphilly.bdt.builder.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import org.codeforphilly.bdt.builder.model.domain.*;
import org.codeforphilly.bdt.builder.model.dto.screener.ScreenerTransfer;
import org.codeforphilly.bdt.builder.persistence.*;
import org.codeforphilly.bdt.builder.persistence.impl.EligibilityCheckRepositoryImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ScreenerTransferServiceTest {
    private final ScreenerRepository screeners = mock(ScreenerRepository.class);
    // Use the real ID helpers so round trips test the repository's versioned ID format.
    private final EligibilityCheckRepository checks = mock(EligibilityCheckRepositoryImpl.class, CALLS_REAL_METHODS);
    private final StorageService storage = mock(StorageService.class);
    private final LibraryApiService library = mock(LibraryApiService.class);
    private final ScreenerTransferService service = new ScreenerTransferService(screeners, checks, storage, library);
    private final ObjectMapper mapper = new ObjectMapper();
    private Screener source;
    private List<Benefit> benefits;
    private EligibilityCheck draft;

    @BeforeEach
    void setup() throws Exception {
        doReturn(List.of()).when(checks).getAllWorkingCustomChecks(anyString());
        doNothing().when(checks).reserveCheckName(anyString(), anyString(), anyString(), anyString());
        doNothing().when(checks).releaseCheckName(anyString(), anyString(), anyString(), anyString());
        doAnswer(invocation -> invocation.<EligibilityCheck>getArgument(0).getId()).when(checks).saveNewWorkingCustomCheck(any());
        doAnswer(invocation -> invocation.<EligibilityCheck>getArgument(0).getId()).when(checks).saveNewPublishedCustomCheck(any());
        doNothing().when(checks).deleteWorkingCustomCheck(anyString());
        doNothing().when(checks).deletePublishedCustomCheck(anyString());
        when(storage.getCheckDmnModelPath(anyString())).thenAnswer(i -> "check/" + i.getArgument(0) + ".dmn");
        when(storage.getScreenerWorkingFormSchemaPath(anyString())).thenAnswer(i -> "form/working/" + i.getArgument(0) + ".json");
        when(screeners.saveNewWorkingScreener(any())).thenAnswer(i -> i.<Screener>getArgument(0).getId());
        source = Screener.create("sender", "Housing screener", null);
        source.setId("source-screener");
        source.setPublishedScreenerId("public-link");
        source.setLastPublishDate("yesterday");
        source.setFormSchema(Map.of("type", "default", "components", List.of(Map.of("key", "income", "type", "number"))));
        draft = check("W-family", "3.0.0");
        EligibilityCheck v1 = check("P-family-1.0.0", "1.0.0");
        EligibilityCheck v2 = check("P-family-2.0.0", "2.0.0");
        doReturn(Optional.of(draft)).when(checks).getWorkingCustomCheck("sender", "W-family", true);
        doReturn(Optional.of(v1)).when(checks).getPublishedCustomCheck("sender", v1.getId(), true);
        doReturn(Optional.of(v2)).when(checks).getPublishedCustomCheck("sender", v2.getId(), true);
        CheckConfig c1 = config(v1.getId(), "1.0.0");
        c1.setAliasName("Income under $50,000");
        c1.setAliasGenerated(true);
        c1.setParameters(Map.of("limit", 50000));
        CheckConfig c2 = config(v2.getId(), "2.0.0");
        CheckConfig lc = config("L-library", "1.0.0");
        lc.setEvaluationUrl("http://sender/library");
        EligibilityCheck libraryCheck = new EligibilityCheck();
        libraryCheck.setEvaluationUrl("http://recipient/library");
        when(library.getScreenerCheckById("L-library")).thenReturn(Optional.of(libraryCheck));
        Benefit first = new Benefit("benefit-a", "First", "A description", "sender", List.of(c1, lc));
        Benefit second = new Benefit("benefit-b", "Second", "Another description", "sender", List.of(c2));
        benefits = List.of(second, first); // Repository collection order differs from screener order.
        source.setBenefits(List.of(new BenefitDetail("benefit-a", "First", "A description"),
                new BenefitDetail("benefit-b", "Second", "Another description")));
        when(screeners.getWorkingScreenerMetaDataOnly(source.getId())).thenReturn(Optional.of(source));
        when(screeners.getWorkingScreener(source.getId())).thenReturn(Optional.of(source));
        when(screeners.getBenefitsInScreener(source)).thenReturn(benefits);
    }

    @Test
    void roundTripPreservesRulesVersionsFormAndSettingsWithNewOwnershipAndIds() throws Exception {
        ScreenerTransfer export = service.exportScreener("sender", source.getId());
        String json = mapper.writeValueAsString(export);
        assertFalse(json.contains("ownerId\":\"sender"));
        assertFalse(json.contains("public-link"));
        assertEquals(3, export.customChecks().size());
        // Exercise the exact single-file representation, including embedded XML.
        Screener imported = service.importScreener("recipient", mapper.readValue(json, ScreenerTransfer.class));
        assertNotEquals(source.getId(), imported.getId());
        assertEquals("recipient", imported.getOwnerId());
        assertEquals(source.getScreenerName(), imported.getScreenerName());
        assertNull(imported.getPublishedScreenerId());
        assertNull(imported.getLastPublishDate());
        assertEquals(List.of("First", "Second"), imported.getBenefits().stream().map(BenefitDetail::getName).toList());
        ArgumentCaptor<Benefit> savedBenefits = ArgumentCaptor.forClass(Benefit.class);
        verify(screeners, times(2)).saveNewCustomBenefit(eq(imported.getId()), savedBenefits.capture());
        Benefit first = savedBenefits.getAllValues().getFirst();
        assertNotEquals("benefit-a", first.getId());
        assertEquals("recipient", first.getOwnerId());
        CheckConfig configured = first.getChecks().getFirst();
        assertEquals(Map.of("limit", 50000), configured.getParameters());
        assertEquals("Income under $50,000", configured.getAliasName());
        assertTrue(configured.isAliasGenerated());
        assertEquals("1.0.0", configured.getCheckVersion());
        assertNotEquals("P-family-1.0.0", configured.getSourceCheckId());
        assertNull(configured.getEvaluationUrl());
        assertEquals("L-library", first.getChecks().get(1).getSourceCheckId());
        assertEquals("http://recipient/library", first.getChecks().get(1).getEvaluationUrl());
        ArgumentCaptor<EligibilityCheck> savedDraft = ArgumentCaptor.forClass(EligibilityCheck.class);
        verify(checks).saveNewWorkingCustomCheck(savedDraft.capture());
        EligibilityCheck importedDraft = savedDraft.getValue();
        assertEquals("3.0.0", importedDraft.getVersion());
        assertEquals("recipient", importedDraft.getOwnerId());
        assertFalse(importedDraft.getIsArchived());
        assertNull(importedDraft.getExampleSourceId());
        ArgumentCaptor<EligibilityCheck> savedPublished = ArgumentCaptor.forClass(EligibilityCheck.class);
        verify(checks, times(2)).saveNewPublishedCustomCheck(savedPublished.capture());
        for (EligibilityCheck published : savedPublished.getAllValues()) {
            assertEquals(importedDraft.getId(), checks.getWorkingId(published));
            verify(storage).writeStringToStorage("check/" + published.getId() + ".dmn", check(published.getId(), published.getVersion()).getDmnModel(), "application/xml");
        }
        verify(storage).writeStringToStorage("form/working/" + imported.getId() + ".json",
                mapper.writeValueAsString(source.getFormSchema()), "application/json");
        assertEquals("sender", draft.getOwnerId());
        assertEquals("benefit-a", source.getBenefits().getFirst().getId());
    }

    @Test
    void importingTwiceDoesNotReuseOrOverwriteCustomChecks() throws Exception {
        ScreenerTransfer export = service.exportScreener("sender", source.getId());
        doReturn(List.of(draft)).when(checks).getAllWorkingCustomChecks("recipient");
        Screener one = service.importScreener("recipient", export);
        Screener two = service.importScreener("recipient", export);
        assertNotEquals(one.getId(), two.getId());
        ArgumentCaptor<EligibilityCheck> saved = ArgumentCaptor.forClass(EligibilityCheck.class);
        verify(checks, times(2)).saveNewWorkingCustomCheck(saved.capture());
        assertNotEquals(saved.getAllValues().get(0).getId(), saved.getAllValues().get(1).getId());
        assertEquals("income (imported 2)", saved.getValue().getModule());
        assertEquals("Income", saved.getValue().getName());
        assertEquals("income", draft.getModule());
    }

    @Test
    void missingModelIsRejectedBeforeAnyWrites() throws Exception {
        ScreenerTransfer export = service.exportScreener("sender", source.getId());
        export.customChecks().getFirst().setDmnModel(null);
        assertThrows(BadRequestException.class, () -> service.importScreener("recipient", export));
        verify(checks, never()).reserveCheckName(anyString(), anyString(), anyString(), anyString());
        verify(screeners, never()).saveNewWorkingScreener(any());
        verify(storage, never()).writeStringToStorage(anyString(), anyString(), anyString());
    }

    @Test
    void rejectsUnsupportedFormatAndUnresolvedReferences() throws Exception {
        assertThrows(BadRequestException.class, () -> service.importScreener("recipient",
                new ScreenerTransfer(ScreenerTransfer.FORMAT, 99, "Name", null, List.of(), List.of())));
        ScreenerTransfer export = service.exportScreener("sender", source.getId());
        export.benefits().getFirst().getChecks().getFirst().setSourceCheckId("P-missing-1.0.0");
        assertThrows(BadRequestException.class, () -> service.importScreener("recipient", export));
        verify(screeners, never()).saveNewWorkingScreener(any());
    }

    @Test
    void refusesExportsForOtherUsersBeforeReadingArtifacts() throws Exception {
        assertThrows(ForbiddenException.class, () -> service.exportScreener("recipient", source.getId()));
        verify(screeners, never()).getWorkingScreener(anyString());
        verify(screeners, never()).getBenefitsInScreener(any());
    }

    @Test
    void refusesCustomCheckBelongingToSomeoneElse() throws Exception {
        EligibilityCheck foreign = check("P-family-1.0.0", "1.0.0");
        foreign.setOwnerId("someone-else");
        doReturn(Optional.of(foreign)).when(checks).getPublishedCustomCheck("sender", foreign.getId(), true);
        assertThrows(ForbiddenException.class, () -> service.exportScreener("sender", source.getId()));
    }

    @Test
    void failedFormWriteRollsBackBenefitsChecksModelsAndNameReservations() throws Exception {
        ScreenerTransfer export = service.exportScreener("sender", source.getId());
        doThrow(new Exception("Storage unavailable")).when(storage)
                .writeStringToStorage(startsWith("form/"), anyString(), eq("application/json"));
        assertThrows(Exception.class, () -> service.importScreener("recipient", export));
        verify(screeners, times(2)).deleteCustomBenefit(anyString(), anyString());
        verify(checks).deleteWorkingCustomCheck(anyString());
        verify(checks, times(2)).deletePublishedCustomCheck(anyString());
        verify(checks).releaseCheckName(eq("recipient"), eq("income"), eq("Income"), anyString());
        verify(storage, times(4)).deleteFile(anyString());
        verify(screeners, never()).saveNewWorkingScreener(any());
    }

    @Test
    void emptyScreenerCanBeSharedWithoutAFormOrCustomChecks() throws Exception {
        Screener imported = service.importScreener("recipient", new ScreenerTransfer(ScreenerTransfer.FORMAT,
                ScreenerTransfer.VERSION, "Empty", null, List.of(), List.of()));
        assertEquals(List.of(), imported.getBenefits());
        verify(screeners).saveNewWorkingScreener(imported);
        verify(storage, never()).writeStringToStorage(anyString(), anyString(), anyString());
    }

    @Test
    void archivedChecksAlreadyUsedByAScreenerCanBeShared() throws Exception {
        draft.setIsArchived(true);
        ScreenerTransfer export = service.exportScreener("sender", source.getId());
        assertTrue(export.customChecks().stream().anyMatch(EligibilityCheck::getIsArchived));
        service.importScreener("recipient", export);
        ArgumentCaptor<EligibilityCheck> saved = ArgumentCaptor.forClass(EligibilityCheck.class);
        verify(checks).saveNewWorkingCustomCheck(saved.capture());
        assertFalse(saved.getValue().getIsArchived());
    }

    @Test
    void publishedModelCanSupplyAnEditableDraftWhenTheOriginalDraftIsMissing() throws Exception {
        doReturn(Optional.empty()).when(checks).getWorkingCustomCheck("sender", "W-family", true);
        ScreenerTransfer export = service.exportScreener("sender", source.getId());
        assertEquals(2, export.customChecks().size());
        service.importScreener("recipient", export);
        ArgumentCaptor<EligibilityCheck> saved = ArgumentCaptor.forClass(EligibilityCheck.class);
        verify(checks).saveNewWorkingCustomCheck(saved.capture());
        assertEquals("2.0.0", saved.getValue().getVersion());
    }

    @Test
    void unavailableLibraryCheckRejectsImportBeforeWrites() throws Exception {
        ScreenerTransfer export = service.exportScreener("sender", source.getId());
        when(library.getScreenerCheckById("L-library")).thenReturn(Optional.empty());
        assertThrows(BadRequestException.class, () -> service.importScreener("recipient", export));
        verify(checks, never()).reserveCheckName(anyString(), anyString(), anyString(), anyString());
        verify(storage, never()).writeStringToStorage(anyString(), anyString(), anyString());
    }

    @Test
    void bundledExampleCanBeExportedAndImportedWithItsInternalLibraryCheck() throws Exception {
        var manifest = readResource("seed-data/example-screener/manifest.json", com.fasterxml.jackson.databind.JsonNode.class);
        var screenerFiles = manifest.path("screeners").get(0);
        Screener example = readResource(screenerFiles.path("screenerPath").asText(), Screener.class);
        example.setOwnerId("sender");
        example.setFormSchema(mapper.convertValue(readResource(screenerFiles.path("formSchema").asText(),
                com.fasterxml.jackson.databind.JsonNode.class), Map.class));
        List<Benefit> exampleBenefits = new ArrayList<>();
        for (var path : screenerFiles.path("benefits")) {
            exampleBenefits.add(readResource(path.asText(), Benefit.class));
        }
        when(screeners.getWorkingScreenerMetaDataOnly(example.getId())).thenReturn(Optional.of(example));
        when(screeners.getWorkingScreener(example.getId())).thenReturn(Optional.of(example));
        when(screeners.getBenefitsInScreener(example)).thenReturn(exampleBenefits);
        for (String group : List.of("workingCustomChecks", "publishedCustomChecks")) {
            for (var path : manifest.path(group)) {
                EligibilityCheck model = readResource(path.asText(), EligibilityCheck.class);
                model.setOwnerId("sender");
                try (var xml = getClass().getClassLoader().getResourceAsStream(
                        "seed-data/example-screener/storage/check/" + model.getId() + ".dmn")) {
                    model.setDmnModel(new String(xml.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8));
                }
                if (model.getId().startsWith("W-")) {
                    doReturn(Optional.of(model)).when(checks).getWorkingCustomCheck("sender", model.getId(), true);
                } else {
                    doReturn(Optional.of(model)).when(checks).getPublishedCustomCheck("sender", model.getId(), true);
                }
            }
        }
        LibraryApiService actualLibrary = new LibraryApiService();
        actualLibrary.loadBenefitsMetadata(mapper.writeValueAsString(exampleBenefits));
        String internalId = "L-internal-sctf-age-requirement-0.9.0";
        assertTrue(actualLibrary.getById(internalId).isEmpty());
        ScreenerTransferService transferService = new ScreenerTransferService(screeners, checks, storage, actualLibrary);
        var exported = transferService.exportScreener("sender", example.getId());
        var imported = transferService.importScreener("recipient",
                mapper.readValue(mapper.writeValueAsString(exported), ScreenerTransfer.class));
        assertEquals(4, imported.getBenefits().size());
        var saved = ArgumentCaptor.forClass(Benefit.class);
        verify(screeners, times(4)).saveNewCustomBenefit(eq(imported.getId()), saved.capture());
        var internal = saved.getAllValues().stream().flatMap(benefit -> benefit.getChecks().stream())
                .filter(config -> internalId.equals(config.getSourceCheckId())).findFirst().orElseThrow();
        assertEquals("/api/v1/checks/internal/sctf-age-requirement", internal.getEvaluationUrl());
    }

    private <T> T readResource(String path, Class<T> type) throws Exception {
        try (var stream = getClass().getClassLoader().getResourceAsStream(path)) {
            return mapper.readValue(stream, type);
        }
    }

    private EligibilityCheck check(String id, String version) {
        EligibilityCheck check = new EligibilityCheck("Income", "income", "Description", List.of(), "sender");
        check.setId(id);
        check.setVersion(version);
        check.setExampleSourceId("example");
        check.setDmnModel("<definitions xmlns=\"https://www.omg.org/spec/DMN/20240513/MODEL/\" namespace=\"income\" name=\"Income\">"
                + "<decision id=\"decision\" name=\"Income\"><literalExpression><text>true</text></literalExpression></decision></definitions>");
        return check;
    }

    private CheckConfig config(String source, String version) {
        CheckConfig config = new CheckConfig();
        config.setCheckId(UUID.randomUUID().toString());
        config.setSourceCheckId(source);
        config.setCheckName("Income");
        config.setCheckModule("income");
        config.setCheckVersion(version);
        return config;
    }
}
