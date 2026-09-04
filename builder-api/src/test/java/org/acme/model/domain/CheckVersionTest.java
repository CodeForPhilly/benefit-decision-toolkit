package org.acme.model.domain;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CheckVersionTest {

    @Test
    void parsesADottedVersion() {
        assertArrayEquals(new int[]{2, 3, 4}, CheckVersion.parse("2.3.4").orElseThrow());
    }

    @Test
    void treatsMissingPartsAsZero() {
        assertArrayEquals(new int[]{2, 0, 0}, CheckVersion.parse("2").orElseThrow());
        assertArrayEquals(new int[]{2, 3, 0}, CheckVersion.parse("2.3").orElseThrow());
    }

    /* Stored versions are free-form strings, so anything at all can come back from Firestore */
    @ParameterizedTest
    @ValueSource(strings = {"", " ", ".", "..", "...", ".1", "not-a-version", "v2.0.0", "1.invalid.0",
            "1.2.3.4", "-1.0.0", "1.0.0-rc1", "99999999999999"})
    void rejectsAnythingThatIsNotAVersion(String version) {
        assertTrue(CheckVersion.parse(version).isEmpty(), "expected \"" + version + "\" to be rejected");
    }

    @Test
    void rejectsAMissingVersion() {
        assertEquals(Optional.empty(), CheckVersion.parse(null));
    }

    @Test
    void ordersVersionsByEachPart() {
        assertTrue(CheckVersion.compare("2.0.0", "1.9.9") > 0);
        assertTrue(CheckVersion.compare("1.2.3", "1.3.0") < 0);
        assertEquals(0, CheckVersion.compare("1.2.3", "1.2.3"));
    }

    /* An unreadable version must not crash the comparison it takes part in */
    @Test
    void ordersUnreadableVersionsBelowReadableOnes() {
        assertTrue(CheckVersion.compare("1.0.0", "v2.0.0") > 0);
        assertTrue(CheckVersion.compare("v2.0.0", "1.0.0") < 0);
        assertEquals(0, CheckVersion.compare("v2.0.0", "also-bad"));
        assertEquals(0, CheckVersion.compare(null, null));
    }

    @Test
    void incrementsTheMajorPartAndResetsTheRest() {
        assertArrayEquals(new int[]{3, 0, 0}, CheckVersion.nextMajor(new int[]{2, 4, 6}));
        assertEquals("3.0.0", CheckVersion.format(CheckVersion.nextMajor(new int[]{2, 4, 6})));
    }

    @Test
    void startsAtTheVersionNewChecksAreCreatedWith() {
        EligibilityCheck newCheck = new EligibilityCheck("a-check", "a-module", "", List.of(), "owner-1");
        assertEquals(newCheck.getVersion(), CheckVersion.format(CheckVersion.initial()));
    }
}
