package org.codeforphilly.bdt.builder.persistence;

import org.codeforphilly.bdt.builder.model.domain.EligibilityCheck;
import org.codeforphilly.bdt.builder.persistence.impl.EligibilityCheckRepositoryImpl;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

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

    @Test
    void newWorkingIdsDoNotDependOnTheName() {
        String id = repository.newWorkingId();

        assertTrue(id.startsWith("W-"));
        assertNotEquals(id, repository.newWorkingId());
    }

    @Test
    void publishedIdOfAnOpaqueWorkingIdMapsBackToIt() {
        EligibilityCheck working = new EligibilityCheck("name", "income", "", List.of(), "owner");
        working.setId(repository.newWorkingId());
        EligibilityCheck published = new EligibilityCheck("name", "income", "", List.of(), "owner");
        published.setVersion("2.0.0");
        published.setId(repository.getPublishedId(working, "2.0.0"));

        assertEquals(working.getId(), repository.getWorkingId(published));
    }

    @Test
    void nameReservationIdsCannotBeConfusedAcrossModuleAndName() {
        assertNotEquals(repository.getCheckNameReservationId("owner", "a:b", "c"),
                repository.getCheckNameReservationId("owner", "a", "b:c"));
        assertFalse(repository.getCheckNameReservationId("owner", "a/b", "c").contains("/"));
    }
}
