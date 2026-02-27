package org.acme.model.dto.CustomBenefit;

import java.util.Map;

import org.acme.api.validation.AtLeastOneProvided;

@AtLeastOneProvided(fields = {"parameters"})
public record UpdateCheckParametersRequest(Map<String, Object> parameters) {}
