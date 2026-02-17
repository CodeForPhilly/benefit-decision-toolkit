package org.acme.api.validation;

import jakarta.validation.*;
import java.lang.annotation.*;
import java.lang.annotation.Retention;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = AtLeastOneProvidedValidator.class)
public @interface AtLeastOneProvided {
  String message() default "At least one field must be provided";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};

  String[] fields(); // names of fields to check
}
