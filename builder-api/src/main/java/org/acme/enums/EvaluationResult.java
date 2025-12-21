package org.acme.enums;

import java.util.Optional;

public enum EvaluationResult {
    TRUE("TRUE"),
    FALSE("FALSE"),
    UNABLE_TO_DETERMINE("UNABLE_TO_DETERMINE");

    public final String label;

    private EvaluationResult(String label) {
        this.label = label;
    }

    public static EvaluationResult fromStringIgnoreCase(String value) {
        for (EvaluationResult s : EvaluationResult.values()) {
            if (s.name().equalsIgnoreCase(value)) {
                return s;
            }
        }
        return EvaluationResult.UNABLE_TO_DETERMINE;
    }
}
