package org.acme.model.dto.Screener;

import org.acme.api.validation.AtLeastOneProvided;

@AtLeastOneProvided(fields = {"screenerName"})
public record EditScreenerRequest(String screenerName) {}
