package org.acme.model.dto;

import com.fasterxml.jackson.databind.JsonNode;
import org.acme.api.validation.HasSchema;
import org.acme.api.validation.ValidSchema;

@ValidSchema(required = true, mustBeObject = true)
public record SaveSchemaRequest(JsonNode schema) implements HasSchema {}
