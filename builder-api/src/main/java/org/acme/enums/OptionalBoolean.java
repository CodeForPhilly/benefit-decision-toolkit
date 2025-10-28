package org.acme.enums;

public enum OptionalBoolean {
    TRUE("TRUE"),
    FALSE("FALSE"),
    UNABLE_TO_DETERMINE("UNABLE_TO_DETERMINE");

    public final String label;

    private OptionalBoolean(String label) {
        this.label = label;
    }
}
