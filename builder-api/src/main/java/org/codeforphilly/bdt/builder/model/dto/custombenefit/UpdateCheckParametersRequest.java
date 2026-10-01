package org.codeforphilly.bdt.builder.model.dto.custombenefit;

import java.util.Map;

import org.codeforphilly.bdt.builder.api.validation.AtLeastOneProvided;

@AtLeastOneProvided(fields = {"parameters"})
public record UpdateCheckParametersRequest(Map<String, Object> parameters) {}
