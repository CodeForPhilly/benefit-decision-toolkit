package org.acme.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.acme.model.domain.EligibilityCheck;
import org.acme.persistence.EligibilityCheckRepository;
import org.acme.persistence.ScreenerRepository;
import org.acme.persistence.StorageService;
import org.acme.persistence.impl.EligibilityCheckRepositoryImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ExampleScreenerImportServiceTest {

    private static final String USER_ID = "new-user";
    private EligibilityCheck seedCheck;
    private String seedExampleSourceId;

    private final ObjectMapper mapper = new ObjectMapper();
    private final EligibilityCheckRepositoryImpl ids = new EligibilityCheckRepositoryImpl();
    private final EligibilityCheckRepository checkRepository = mock(EligibilityCheckRepository.class);
    private final ScreenerRepository screenerRepository = mock(ScreenerRepository.class);
    private final StorageService storageService = mock(StorageService.class);
    private final ExampleScreenerImportService service =
            new ExampleScreenerImportService(screenerRepository, checkRepository, storageService);

    @BeforeEach
    void setUp() throws Exception {
        seedCheck = findReferencedSeedCheck();
        assumeTrue(seedCheck != null, "The example screener's benefits use no custom checks");
        // Seed checks exported from an account that imported the example carry its identity
        seedExampleSourceId = seedCheck.getExampleSourceId() != null
                ? seedCheck.getExampleSourceId()
                : ids.getWorkingId(seedCheck);
        when(checkRepository.getWorkingId(any())).thenAnswer(invocation -> ids.getWorkingId(invocation.getArgument(0)));
        when(checkRepository.getPublishedId(any(), anyString()))
                .thenAnswer(invocation -> ids.getPublishedId(invocation.getArgument(0), invocation.getArgument(1)));
        when(checkRepository.newWorkingId()).thenAnswer(invocation -> ids.newWorkingId());
        when(screenerRepository.saveNewWorkingScreener(any())).thenReturn("screener-1");
        when(storageService.getCheckDmnModelPath(anyString())).thenAnswer(invocation -> "check/" + invocation.getArgument(0));
    }

    // The first custom check a benefit uses, as the seed stores it (working or published)
    private EligibilityCheck findReferencedSeedCheck() throws Exception {
        JsonNode manifest = readResource("seed-data/example-screener/manifest.json");
        Map<String, JsonNode> seedChecks = new HashMap<>();
        for (String collection : List.of("workingCustomChecks", "publishedCustomChecks")) {
            for (JsonNode path : manifest.path(collection)) {
                JsonNode check = readResource(path.asText());
                seedChecks.put(check.path("id").asText(), check);
            }
        }
        for (JsonNode screener : manifest.path("screeners")) {
            for (JsonNode benefitPath : screener.path("benefits")) {
                for (JsonNode checkConfig : readResource(benefitPath.asText()).path("checks")) {
                    JsonNode check = seedChecks.get(checkConfig.path("sourceCheckId").asText());
                    if (check != null) {
                        return mapper.treeToValue(check, EligibilityCheck.class);
                    }
                }
            }
        }
        return null;
    }

    private JsonNode readResource(String path) throws Exception {
        try (var stream = getClass().getClassLoader().getResourceAsStream(path)) {
            return mapper.readTree(stream);
        }
    }

    @Test
    void importGivesChecksIdsIndependentOfTheirNames() throws Exception {
        service.importForUser(USER_ID);

        ArgumentCaptor<EligibilityCheck> saved = ArgumentCaptor.forClass(EligibilityCheck.class);
        verify(checkRepository, atLeastOnce()).saveNewWorkingCustomCheck(saved.capture());
        EligibilityCheck imported = saved.getAllValues().stream()
                .filter(check -> seedExampleSourceId.equals(check.getExampleSourceId()))
                .findFirst().orElseThrow();
        assertFalse(imported.getId().contains(imported.getName()));
        assertEquals(USER_ID, imported.getOwnerId());
    }

    @Test
    void importKeepsTheExampleIdentityOfAReExportedSeedCheck() throws Exception {
        assumeTrue(seedCheck.getExampleSourceId() != null, "The seed check was not exported from an imported example");
        assertFalse(seedCheck.getExampleSourceId().equals(ids.getWorkingId(seedCheck)));

        service.importForUser(USER_ID);

        ArgumentCaptor<EligibilityCheck> saved = ArgumentCaptor.forClass(EligibilityCheck.class);
        verify(checkRepository, atLeastOnce()).saveNewWorkingCustomCheck(saved.capture());
        assertTrue(saved.getAllValues().stream()
                .anyMatch(check -> seedCheck.getExampleSourceId().equals(check.getExampleSourceId())));
    }

    @Test
    void reimportKeepsARenamedCheckAndPublishesUnderItsId() throws Exception {
        EligibilityCheck renamed = new EligibilityCheck("renamed", seedCheck.getModule(), "", List.of(), USER_ID);
        renamed.setId("W-kept");
        renamed.setExampleSourceId(seedExampleSourceId);
        when(checkRepository.getAllWorkingCustomChecks(USER_ID)).thenReturn(List.of(renamed));

        service.importForUser(USER_ID);

        verify(checkRepository, never()).updateWorkingCustomCheck(any());
        // Other example checks are still imported; only the renamed one is kept as it is
        verify(checkRepository, never()).saveNewWorkingCustomCheck(
                argThat(check -> seedExampleSourceId.equals(check.getExampleSourceId())));
        ArgumentCaptor<EligibilityCheck> published = ArgumentCaptor.forClass(EligibilityCheck.class);
        verify(checkRepository, atLeastOnce()).saveNewPublishedCustomCheck(published.capture());
        assertTrue(published.getAllValues().stream().anyMatch(check -> check.getId().startsWith("P-kept-")));
    }

    @Test
    void importReservesTheNamesOfTheChecksItCreates() throws Exception {
        service.importForUser(USER_ID);

        verify(checkRepository).reserveCheckName(org.mockito.ArgumentMatchers.eq(USER_ID),
                org.mockito.ArgumentMatchers.eq(seedCheck.getModule()), org.mockito.ArgumentMatchers.eq(seedCheck.getName()),
                org.mockito.ArgumentMatchers.startsWith("W-"));
    }

    @Test
    void importRefusesToDuplicateANameUsedByAnotherCheck() {
        EligibilityCheck other = new EligibilityCheck(seedCheck.getName(), seedCheck.getModule(), "", List.of(), USER_ID);
        other.setId("W-unrelated");
        when(checkRepository.getAllWorkingCustomChecks(USER_ID)).thenReturn(List.of(other));

        assertThrows(IllegalStateException.class, () -> service.importForUser(USER_ID));
    }
}
