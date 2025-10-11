package org.acme.enums;

public enum DmnResult {
    TRUE("TRUE"),
    FALSE("FALSE"),
    UNABLE_TO_DETERMINE("UNABLE_TO_DETERMINE");

    public final String label;

    private DmnResult(String label) {
        this.label = label;
    }
}
