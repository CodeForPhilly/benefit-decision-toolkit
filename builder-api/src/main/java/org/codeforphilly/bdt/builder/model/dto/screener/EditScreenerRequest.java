package org.codeforphilly.bdt.builder.model.dto.screener;

import org.codeforphilly.bdt.builder.api.validation.AtLeastOneProvided;

@AtLeastOneProvided(fields = {"screenerName"})
public record EditScreenerRequest(String screenerName) {}
