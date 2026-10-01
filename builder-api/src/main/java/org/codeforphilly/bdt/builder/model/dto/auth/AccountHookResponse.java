package org.codeforphilly.bdt.builder.model.dto.auth;

import java.util.Map;

public record AccountHookResponse(Boolean success,
        Map<String, Boolean> actions) {
};
