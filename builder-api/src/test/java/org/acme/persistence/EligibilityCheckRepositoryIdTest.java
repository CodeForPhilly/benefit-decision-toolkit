package org.acme.persistence;

import org.acme.model.domain.EligibilityCheck;
import org.acme.persistence.impl.EligibilityCheckRepositoryImpl;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EligibilityCheckRepositoryIdTest {
    private final EligibilityCheckRepositoryImpl repository = new EligibilityCheckRepositoryImpl();

    @Test
    void renameKeepsPublishedVersionsInTheSameLineage() {
        EligibilityCheck working = new EligibilityCheck("new-name", "income", "", List.of(), "owner");
        working.setId("W-owner-income-old-name");
        EligibilityCheck published = new EligibilityCheck("old-name", "income", "", List.of(), "owner");
        published.setVersion("1.0.0");
        published.setId("P-owner-income-old-name-1.0.0");

        assertEquals("W-owner-income-old-name", repository.getWorkingId(published));
        assertEquals(repository.getPublishedPrefix(working), repository.getPublishedPrefix(published));
        assertEquals("P-owner-income-old-name-1.0.1", repository.getPublishedId(working, "1.0.1"));
    }
}
