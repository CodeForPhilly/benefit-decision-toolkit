package org.codeforphilly.bdt.builder.api.validation;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validation;
import org.codeforphilly.bdt.builder.model.domain.Benefit;
import org.codeforphilly.bdt.builder.model.domain.CheckConfig;
import org.codeforphilly.bdt.builder.model.dto.custombenefit.UpdateCheckExplanationRequest;
import org.codeforphilly.bdt.builder.model.dto.screener.ScreenerTransfer;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class CheckExplanationTest {
    @Test
    void explanationSurvivesBenefitStorageAndOlderBenefitsStillLoad() throws Exception {
        var mapper = new ObjectMapper();
        var check = new CheckConfig();
        check.setCheckId("instance");
        check.setAliasName("Income limit");
        check.setExplanation("Your income must be within the program limit.");
        var benefit = new Benefit("benefit", "Benefit", "", "owner", List.of(check));
        // Working/published storage and benefit copies use this same Jackson mapping.
        var stored = mapper.convertValue(benefit, Map.class);
        var restored = mapper.convertValue(stored, Benefit.class);
        assertEquals(check.getExplanation(), restored.getChecks().getFirst().getExplanation());
        assertNull(mapper.readValue("{\"checkId\":\"legacy\"}", CheckConfig.class).getExplanation());
    }

    @Test
    void validatesOptionalExplanationLength() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            assertTrue(validator.validate(new UpdateCheckExplanationRequest(null)).isEmpty());
            assertTrue(validator.validate(new UpdateCheckExplanationRequest("x".repeat(2000))).isEmpty());
            assertEquals(1, validator.validate(new UpdateCheckExplanationRequest("x".repeat(2001))).size());
            var check = new CheckConfig();
            check.setExplanation("x".repeat(2001));
            var benefit = new Benefit("id", "Benefit", "", "owner", List.of(check));
            var transfer = new ScreenerTransfer(ScreenerTransfer.FORMAT, ScreenerTransfer.VERSION,
                "Screener", null, List.of(benefit), List.of());
            assertEquals(1, validator.validate(transfer).size());
        }
    }
}
