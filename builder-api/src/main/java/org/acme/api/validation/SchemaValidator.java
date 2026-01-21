package org.acme.api.validation;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class SchemaValidator implements ConstraintValidator<ValidSchema, HasSchema> {

  private boolean required;
  private boolean mustBeObject;

  @Override
  public void initialize(ValidSchema ann) {
    this.required = ann.required();
    this.mustBeObject = ann.mustBeObject();
  }

  @Override
  public boolean isValid(HasSchema value, ConstraintValidatorContext ctx) {
    if (value == null) return true;

    JsonNode schema = value.schema();

    // Priority 1: required check (null or JSON null)
    if (required && (schema == null || schema.isNull())) {
      return fail(ctx, "schema cannot be null", "schema");
    }

    // If not required and absent, it's valid
    if (schema == null || schema.isNull()) return true;

    // Priority 2: type check
    if (mustBeObject && !schema.isObject()) {
      return fail(ctx, "schema must be a JSON object", "schema");
    }

    return true;
  }

  private static boolean fail(ConstraintValidatorContext ctx, String msg, String node) {
    ctx.disableDefaultConstraintViolation();
    ctx.buildConstraintViolationWithTemplate(msg).addPropertyNode(node).addConstraintViolation();
    return false;
  }
}
