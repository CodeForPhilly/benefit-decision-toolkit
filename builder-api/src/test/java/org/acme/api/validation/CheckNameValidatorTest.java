package org.acme.api.validation;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.acme.model.dto.EligibilityCheck.CreateCheckRequest;
import org.junit.jupiter.api.Test;
import org.kie.dmn.feel.parser.feel11.FEELParser;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CheckNameValidatorTest {

    private static final List<String> ACCEPTED_NAMES = List.of(
        "Owns and occupies home",
        "Applicant's income",
        "Age-18 check",
        "Age_18 check",
        "Has SNAP",
        "Check 2",
        "Über check",
        "date of birth known",
        "Formal address",
        "a"
    );

    private static final ValidatorFactory VALIDATOR_FACTORY = Validation.buildDefaultValidatorFactory();

    private final Validator validator = VALIDATOR_FACTORY.getValidator();

    @Test
    void acceptsOrdinaryCheckNames() {
        for (String name : ACCEPTED_NAMES) {
            assertEquals(Optional.empty(), violationMessage(name), "expected " + name + " to be accepted");
        }
    }

    // The names we accept have to be names the DMN compiler accepts, or the starter model never compiles.
    @Test
    void acceptedNamesAreValidFeelNames() {
        for (String name : ACCEPTED_NAMES) {
            assertTrue(
                FEELParser.checkVariableName(name).isEmpty(),
                "expected " + name + " to be a valid FEEL name"
            );
            assertTrue(
                FEELParser.checkVariableName(name + " input").isEmpty(),
                "expected the input name derived from " + name + " to be a valid FEEL name"
            );
        }
    }

    @Test
    void rejectsNamesThatDoNotStartWithALetter() {
        assertEquals(
            Optional.of("Check name must start with a letter and use only letters, numbers,"
                + " spaces, apostrophes, hyphens and underscores."),
            violationMessage("2024 income")
        );
    }

    @Test
    void rejectsNamesWithCharactersFeelCannotParse() {
        for (String name : List.of("Income > $50k", "Income (annual)", "Income, adjusted", "Owns home!")) {
            assertTrue(violationMessage(name).isPresent(), "expected " + name + " to be rejected");
            assertTrue(
                FEELParser.checkVariableName(name).isEmpty() == false,
                "expected " + name + " to be an invalid FEEL name"
            );
        }
    }

    @Test
    void rejectsNamesStartingWithAReservedWord() {
        assertEquals(
            Optional.of("Check name cannot start with \"for\", which is a reserved word in decision models."),
            violationMessage("for-profit employment")
        );
        assertTrue(violationMessage("if income is low").isPresent());
        assertTrue(violationMessage("some income").isPresent());
    }

    @Test
    void rejectsMissingNames() {
        assertEquals(Optional.of("Check name must be provided."), violationMessage(null));
        assertEquals(Optional.of("Check name must be provided."), violationMessage("   "));
    }

    /* The message the API would return for this name, or empty when the name is accepted. */
    private Optional<String> violationMessage(String name) {
        CreateCheckRequest request = new CreateCheckRequest(name, "income", "a check", List.of());
        Set<ConstraintViolation<CreateCheckRequest>> violations = validator.validate(request);
        return violations.stream().map(ConstraintViolation::getMessage).findFirst();
    }
}
