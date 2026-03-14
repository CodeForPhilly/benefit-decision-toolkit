package org.acme.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum AccountHookAction {
    ADD_EXAMPLE_SCREENER("add example screener"),
    UNABLE_TO_DETERMINE("UNABLE_TO_DETERMINE");

    private final String label;

    AccountHookAction(String label) {
        this.label = label;
    }

    @JsonValue
    public String getLabel() {
        return label;
    }

    @JsonCreator
    public static AccountHookAction fromValue(String value) {
        for (AccountHookAction action : values()) {
            if (action.label.equalsIgnoreCase(value)) {
                return action;
            }
        }
        return UNABLE_TO_DETERMINE;
    }
}