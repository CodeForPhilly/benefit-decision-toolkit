package org.codeforphilly.bdt.builder.model.dto.custombenefit;

import org.codeforphilly.bdt.builder.api.validation.AtLeastOneProvided;

import java.util.Map;

@AtLeastOneProvided(fields = {"checkId"})
public record AddCheckRequest(String checkId, Map<String, Object> parameters) {}
