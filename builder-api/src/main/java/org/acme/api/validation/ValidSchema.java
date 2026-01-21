package org.acme.api.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = SchemaValidator.class)
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidSchema {
  String message() default "Invalid schema";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};

  boolean required() default true; // reject null/NullNode

  boolean mustBeObject() default true; // reject non-object
}
