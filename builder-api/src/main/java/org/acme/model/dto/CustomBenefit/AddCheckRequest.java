package org.acme.model.dto.CustomBenefit;

import org.acme.api.validation.AtLeastOneProvided;

@AtLeastOneProvided(fields = {"checkId"})
public record AddCheckRequest(String checkId) {}

