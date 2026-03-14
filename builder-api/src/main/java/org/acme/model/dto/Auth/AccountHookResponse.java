package org.acme.model.dto.Auth;

import java.util.Map;

public record AccountHookResponse(Boolean success,
        Map<String, Boolean> actions) {
};
