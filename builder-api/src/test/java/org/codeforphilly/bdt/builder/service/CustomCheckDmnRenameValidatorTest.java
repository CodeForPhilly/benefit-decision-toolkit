package org.codeforphilly.bdt.builder.service;

import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CustomCheckDmnRenameValidatorTest {
    private final CustomCheckDmnRenameValidator validator = new CustomCheckDmnRenameValidator();

    @Test
    void acceptsARenameThatPreservesTheDecisionIdentity() throws Exception {
        String original = new CustomCheckDmnTemplate().create("incomeCheck", "Income test");
        String renamed = original.replace("name=\"incomeCheck\"", "name=\"newIncomeCheck\"");
        validator.validate(original, renamed, "incomeCheck", "newIncomeCheck");
        assertTrue(new KieDmnService().validateDmnXml(
                renamed, Map.of(), "renamed-check", "newIncomeCheck").isEmpty());
    }

    @Test
    void rejectsAReplacementDecision() {
        String original = new CustomCheckDmnTemplate().create("incomeCheck", "Income test");
        String replacement = new CustomCheckDmnTemplate().create("newIncomeCheck", "Income test");
        assertThrows(IllegalArgumentException.class,
                () -> validator.validate(original, replacement, "incomeCheck", "newIncomeCheck"));
    }
}
