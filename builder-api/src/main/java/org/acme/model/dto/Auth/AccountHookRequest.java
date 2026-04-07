package org.acme.model.dto.Auth;

import java.util.Set;

import org.acme.enums.AccountHookAction;

public record AccountHookRequest(Set<AccountHookAction> hooks) {
}
