package org.acme.enums;

public enum EvaluationResult {
    TRUE("TRUE"),
    FALSE("FALSE"),
    UNABLE_TO_DETERMINE("UNABLE_TO_DETERMINE");

    public final String label;

    private EvaluationResult(String label) {
        this.label = label;
    }
}
