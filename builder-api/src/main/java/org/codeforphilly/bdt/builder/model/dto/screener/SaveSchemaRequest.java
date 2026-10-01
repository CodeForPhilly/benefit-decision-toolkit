package org.codeforphilly.bdt.builder.model.dto.screener;

import com.fasterxml.jackson.databind.JsonNode;
import org.codeforphilly.bdt.builder.api.validation.HasSchema;
import org.codeforphilly.bdt.builder.api.validation.ValidSchema;

@ValidSchema(required = true, mustBeObject = true)
public record SaveSchemaRequest(JsonNode schema) implements HasSchema {}
