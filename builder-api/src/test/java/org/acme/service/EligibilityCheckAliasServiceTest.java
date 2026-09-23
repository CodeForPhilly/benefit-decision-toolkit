package org.acme.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EligibilityCheckAliasServiceTest {
    private EligibilityCheckAliasService service;

    @BeforeEach
    void setUp() {
        service = new EligibilityCheckAliasService();
        service.objectMapper = new ObjectMapper();
        service.apiKey = Optional.empty();
        service.model = "unused";
    }

    @Test
    void generateReturnsNothingWithoutAnApiKey() {
        assertEquals(Optional.empty(), service.generate("IncomeThreshold", Map.of("limit", 50_000)));
    }

    @Test
    void generateReturnsNothingWithABlankApiKey() {
        service.apiKey = Optional.of(" ");

        assertEquals(Optional.empty(), service.generate("IncomeThreshold", Map.of("limit", 50_000)));
    }
}
