package org.acme.service;

import org.acme.model.domain.EligibilityCheck;
import org.acme.persistence.EligibilityCheckRepository;
import org.acme.persistence.ScreenerRepository;
import org.acme.persistence.StorageService;
import org.acme.persistence.impl.EligibilityCheckRepositoryImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ExampleScreenerImportServiceTest {

    private static final String USER_ID = "new-user";
    private static final String SEED_CHECK_ID = "W-example-wants-extra-cash";

    private final EligibilityCheckRepositoryImpl ids = new EligibilityCheckRepositoryImpl();
    private final EligibilityCheckRepository checkRepository = mock(EligibilityCheckRepository.class);
    private final ScreenerRepository screenerRepository = mock(ScreenerRepository.class);
    private final StorageService storageService = mock(StorageService.class);
    private final ExampleScreenerImportService service =
            new ExampleScreenerImportService(screenerRepository, checkRepository, storageService);

    @BeforeEach
    void setUp() throws Exception {
        when(checkRepository.getWorkingId(any())).thenAnswer(invocation -> ids.getWorkingId(invocation.getArgument(0)));
        when(checkRepository.getPublishedId(any(), anyString()))
                .thenAnswer(invocation -> ids.getPublishedId(invocation.getArgument(0), invocation.getArgument(1)));
        when(checkRepository.newWorkingId()).thenAnswer(invocation -> ids.newWorkingId());
        when(screenerRepository.saveNewWorkingScreener(any())).thenReturn("screener-1");
        when(storageService.getCheckDmnModelPath(anyString())).thenAnswer(invocation -> "check/" + invocation.getArgument(0));
    }

    @Test
    void importGivesChecksIdsIndependentOfTheirNames() throws Exception {
        service.importForUser(USER_ID);

        ArgumentCaptor<EligibilityCheck> saved = ArgumentCaptor.forClass(EligibilityCheck.class);
        verify(checkRepository, atLeastOnce()).saveNewWorkingCustomCheck(saved.capture());
        EligibilityCheck imported = saved.getAllValues().stream()
                .filter(check -> SEED_CHECK_ID.equals(check.getExampleSourceId()))
                .findFirst().orElseThrow();
        assertFalse(imported.getId().contains(imported.getName()));
        assertEquals(USER_ID, imported.getOwnerId());
    }

    @Test
    void reimportKeepsARenamedCheckAndPublishesUnderItsId() throws Exception {
        EligibilityCheck renamed = new EligibilityCheck("renamed", "Philadelphia examples", "", List.of(), USER_ID);
        renamed.setId("W-kept");
        renamed.setExampleSourceId(SEED_CHECK_ID);
        when(checkRepository.getAllWorkingCustomChecks(USER_ID)).thenReturn(List.of(renamed));

        service.importForUser(USER_ID);

        verify(checkRepository, never()).updateWorkingCustomCheck(any());
        verify(checkRepository, never()).saveNewWorkingCustomCheck(any());
        ArgumentCaptor<EligibilityCheck> published = ArgumentCaptor.forClass(EligibilityCheck.class);
        verify(checkRepository, atLeastOnce()).saveNewPublishedCustomCheck(published.capture());
        assertTrue(published.getAllValues().stream().anyMatch(check -> check.getId().startsWith("P-kept-")));
    }

    @Test
    void importReservesTheNamesOfTheChecksItCreates() throws Exception {
        service.importForUser(USER_ID);

        verify(checkRepository).reserveCheckName(org.mockito.ArgumentMatchers.eq(USER_ID),
                org.mockito.ArgumentMatchers.eq("Philadelphia examples"), org.mockito.ArgumentMatchers.eq("Would like extra cash"),
                org.mockito.ArgumentMatchers.startsWith("W-"));
    }

    @Test
    void importRefusesToDuplicateANameUsedByAnotherCheck() {
        EligibilityCheck other = new EligibilityCheck("Would like extra cash", "Philadelphia examples", "", List.of(), USER_ID);
        other.setId("W-unrelated");
        when(checkRepository.getAllWorkingCustomChecks(USER_ID)).thenReturn(List.of(other));

        assertThrows(IllegalStateException.class, () -> service.importForUser(USER_ID));
    }
}
