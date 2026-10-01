package org.codeforphilly.bdt.builder.model.dto.auth;

import java.util.Set;

import org.codeforphilly.bdt.builder.enums.AccountHookAction;

public record AccountHookRequest(Set<AccountHookAction> hooks) {
}
