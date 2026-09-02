package org.acme.api.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

/*
 * A check's name becomes the FEEL name of the decision and of the input in the check's DMN model,
 * so a name FEEL cannot parse produces a starter model that never compiles.
 */
@Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Constraint(validatedBy = CheckNameValidator.class)
public @interface ValidCheckName {

  String message() default "Check name is not valid.";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};
}
