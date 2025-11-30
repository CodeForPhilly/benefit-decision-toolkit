package org.acme.enums;

public enum CheckResult {
    TRUE("TRUE"),
    FALSE("FALSE"),
    UNABLE_TO_DETERMINE("UNABLE_TO_DETERMINE");

    public final String label;

    private CheckResult(String label) {
        this.label = label;
    }
}
