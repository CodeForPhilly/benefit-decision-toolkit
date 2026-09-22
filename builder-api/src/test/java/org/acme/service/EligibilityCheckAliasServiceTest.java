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
    void generateCreatesReadableAliasWithoutExternalConfiguration() {
        String alias = service.generate(
            "PersonNotEnrolledInBenefit",
            Map.of("personId", "client", "benefit", "PhlHomesteadExemption")
        );

        assertEquals("Client not already enrolled in Homestead Exemption", alias);
    }

    @Test
    void generateIncludesOtherwiseUnrepresentedParameters() {
        String alias = service.generate("IncomeThreshold", Map.of("householdIncomeLimit", 50_000));

        assertEquals("Income Threshold (household income limit: 50000)", alias);
    }

    @Test
    void generateHumanizesAParameterlessCheckName() {
        assertEquals("Owner occupant", service.generate("owner-occupant", Map.of()));
    }
}
