package org.codeforphilly.bdt.functions;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class LocationServiceTest {

    // --- lookup() ---

    @Test
    public void testLookupExactMatch() {
        List<String> results = LocationService.lookup("countyName", Map.of("zipCode", "19107"));
        assertFalse(results.isEmpty(), "Should find a county for zip 19107");
        assertTrue(results.contains("Philadelphia"));
    }

    @Test
    public void testLookupCaseInsensitiveFilterValue() {
        List<String> uppercase = LocationService.lookup("zipCode", Map.of("stateAbbreviation", "PA", "countyName", "Philadelphia"));
        List<String> lowercase = LocationService.lookup("zipCode", Map.of("stateAbbreviation", "pa", "countyName", "philadelphia"));
        assertFalse(uppercase.isEmpty(), "Exact case should return results");
        assertEquals(uppercase.size(), lowercase.size(),
                "Lowercase filter values should return same number of results as title-case");
        assertTrue(lowercase.containsAll(uppercase));
    }

    @Test
    public void testLookupCaseInsensitiveMixedCase() {
        List<String> titleCase = LocationService.lookup("zipCode", Map.of("stateAbbreviation", "PA", "countyName", "Philadelphia"));
        List<String> upperCase = LocationService.lookup("zipCode", Map.of("stateAbbreviation", "PA", "countyName", "PHILADELPHIA"));
        assertEquals(titleCase.size(), upperCase.size(),
                "UPPERCASE filter value should return same results as title-case");
    }

    @Test
    public void testLookupTrimsLeadingWhitespace() {
        List<String> trimmed   = LocationService.lookup("countyName", Map.of("zipCode", "19107"));
        List<String> withSpace = LocationService.lookup("countyName", Map.of("zipCode", "  19107"));
        assertEquals(trimmed, withSpace, "Leading whitespace on filter value should be trimmed");
    }

    @Test
    public void testLookupTrimsTrailingWhitespace() {
        List<String> trimmed   = LocationService.lookup("countyName", Map.of("zipCode", "19107"));
        List<String> withSpace = LocationService.lookup("countyName", Map.of("zipCode", "19107  "));
        assertEquals(trimmed, withSpace, "Trailing whitespace on filter value should be trimmed");
    }

    @Test
    public void testLookupReturnsEmptyForNoMatch() {
        List<String> results = LocationService.lookup("countyName", Map.of("stateAbbreviation", "ZZ"));
        assertTrue(results.isEmpty(), "Unknown state abbreviation should return an empty list");
    }

    // --- lookupFuzzy() ---

    @Test
    public void testLookupFuzzyAbbreviationWithPeriod() {
        // "Mont." should match both "Montgomery" and "Montour" in PA
        List<String> results = LocationService.lookupFuzzy("countyName",
                Map.of("countyName", "Mont.", "stateAbbreviation", "PA"));
        assertFalse(results.isEmpty(), "Abbreviated 'Mont.' should match counties starting with 'Mont'");
        assertTrue(results.contains("Montgomery"),
                "Expected 'Montgomery' in fuzzy results for 'Mont.'");
    }

    @Test
    public void testLookupFuzzyPrefixNoTrailingPeriod() {
        // "Los" should match "Los Angeles" and other "Los ..." counties
        List<String> results = LocationService.lookupFuzzy("countyName",
                Map.of("countyName", "Los"));
        assertFalse(results.isEmpty(), "Prefix 'Los' should match counties starting with 'Los'");
        assertTrue(results.stream().allMatch(name -> name.toLowerCase().startsWith("los")),
                "All results should start with 'Los'");
    }

    @Test
    public void testLookupFuzzyIsCaseInsensitive() {
        List<String> upper = LocationService.lookupFuzzy("countyName",
                Map.of("countyName", "PHILA", "stateAbbreviation", "PA"));
        List<String> lower = LocationService.lookupFuzzy("countyName",
                Map.of("countyName", "phila", "stateAbbreviation", "PA"));
        assertEquals(upper.size(), lower.size(),
                "Fuzzy lookup should be case-insensitive");
        assertTrue(lower.containsAll(upper));
    }

    @Test
    public void testLookupFuzzyTrimsWhitespace() {
        List<String> trimmed   = LocationService.lookupFuzzy("countyName", Map.of("countyName", "Phila", "stateAbbreviation", "PA"));
        List<String> withSpace = LocationService.lookupFuzzy("countyName", Map.of("countyName", "  Phila  ", "stateAbbreviation", "PA"));
        assertEquals(trimmed, withSpace, "Fuzzy lookup should trim whitespace before matching");
    }

    @Test
    public void testLookupFuzzyReturnsEmptyForNoMatch() {
        List<String> results = LocationService.lookupFuzzy("countyName",
                Map.of("countyName", "ZZZZZ"));
        assertTrue(results.isEmpty(), "Fuzzy lookup should return empty list when nothing matches");
    }
}
