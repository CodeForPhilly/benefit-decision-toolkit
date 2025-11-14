package org.acme.constants;

import org.apache.hc.client5.http.impl.auth.AuthCacheKeeper;

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
