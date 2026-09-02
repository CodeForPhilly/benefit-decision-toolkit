package org.acme.api.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/*
 * Accepts the subset of FEEL names that reads naturally as a check name. FEEL allows more
 * punctuation than this, but characters such as '.', '/' and '+' carry meaning in FEEL
 * expressions, so they are kept out of names the toolkit generates models from.
 */
public class CheckNameValidator implements ConstraintValidator<ValidCheckName, String> {

  private static final Pattern ALLOWED = Pattern.compile("^\\p{L}[\\p{L}\\p{N} '_-]*$");

  private static final Pattern FIRST_WORD = Pattern.compile("^[\\p{L}\\p{N}]+");

  // FEEL keywords: a name that starts with one of these is rejected by the DMN compiler.
  private static final Set<String> RESERVED_FIRST_WORDS = Set.of(
      "and", "between", "else", "every", "external", "false", "for", "function", "if", "in",
      "instance", "not", "null", "of", "or", "return", "satisfies", "some", "then", "true");

  @Override
  public boolean isValid(String name, ConstraintValidatorContext context) {
    if (name == null || name.isBlank()) {
      return reject(context, "Check name must be provided.");
    }

    String trimmedName = name.trim();
    if (!ALLOWED.matcher(trimmedName).matches()) {
      return reject(context, "Check name must start with a letter and use only letters, numbers,"
          + " spaces, apostrophes, hyphens and underscores.");
    }

    Matcher firstWord = FIRST_WORD.matcher(trimmedName);
    if (firstWord.find() && RESERVED_FIRST_WORDS.contains(firstWord.group())) {
      return reject(context, "Check name cannot start with \"" + firstWord.group()
          + "\", which is a reserved word in decision models.");
    }

    return true;
  }

  private boolean reject(ConstraintValidatorContext context, String message) {
    context.disableDefaultConstraintViolation();
    context.buildConstraintViolationWithTemplate(message).addConstraintViolation();
    return false;
  }
}
