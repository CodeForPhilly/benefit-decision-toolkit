package org.acme.api.validation;

import jakarta.validation.*;
import java.lang.reflect.Method;
import java.util.Map;

public class AtLeastOneProvidedValidator
    implements ConstraintValidator<AtLeastOneProvided, Object> {

  private String[] fields;

  @Override
  public void initialize(AtLeastOneProvided ann) {
    this.fields = ann.fields();
  }

  @Override
  public boolean isValid(Object value, ConstraintValidatorContext ctx) {
    if (value == null) return true;

    Class<?> cls = value.getClass();

    for (String fieldName : fields) {
      try {
        // Works for records + POJOs
        Method accessor = cls.getMethod(fieldName);
        Object fieldValue = accessor.invoke(value);

        if (fieldValue instanceof String s && !s.isBlank()) return true;
        if (fieldValue instanceof Map<?, ?> m && !m.isEmpty()) return true;
        if (fieldValue != null) return true;

      } catch (NoSuchMethodException e) {
        throw new IllegalStateException("No accessor '" + fieldName + "()' on " + cls.getName(), e);
      } catch (Exception e) {
        return false;
      }
    }

    return false;
  }
}
