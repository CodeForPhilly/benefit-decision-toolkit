package org.acme.constants;

public enum CheckStatus {
    WORKING('W'),
    PUBLISHED('P');

    private final char code;

    CheckStatus(char code) {
        this.code = code;
    }

    public char getCode() {
        return code;
    }
}
