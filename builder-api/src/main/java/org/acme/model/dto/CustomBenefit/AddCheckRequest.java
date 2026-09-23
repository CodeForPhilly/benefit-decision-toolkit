package org.acme.model.dto.CustomBenefit;

import org.acme.api.validation.AtLeastOneProvided;

import java.util.Map;

@AtLeastOneProvided(fields = {"checkId"})
public record AddCheckRequest(String checkId, Map<String, Object> parameters) {}
