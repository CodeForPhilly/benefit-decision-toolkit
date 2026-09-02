/*
 * A check's name becomes the FEEL name of the decision and of the input in the check's DMN model,
 * so a name FEEL cannot parse produces a starter model that never compiles. Mirrors
 * CheckNameValidator in builder-api, which is what the API enforces.
 */

const ALLOWED_NAME = /^\p{L}[\p{L}\p{N} '_-]*$/u;

const FIRST_WORD = /^[\p{L}\p{N}]+/u;

// FEEL keywords: a name that starts with one of these is rejected by the DMN compiler.
const RESERVED_FIRST_WORDS = new Set([
  "and",
  "between",
  "else",
  "every",
  "external",
  "false",
  "for",
  "function",
  "if",
  "in",
  "instance",
  "not",
  "null",
  "of",
  "or",
  "return",
  "satisfies",
  "some",
  "then",
  "true",
]);

// Returns the reason the name cannot be used, or null when it is a usable check name.
export const checkNameError = (name: string): string | null => {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return "Check name must be provided.";
  }

  if (!ALLOWED_NAME.test(trimmedName)) {
    return (
      "Check name must start with a letter and use only letters, numbers," +
      " spaces, apostrophes, hyphens and underscores."
    );
  }

  const firstWord = trimmedName.match(FIRST_WORD)?.[0];
  if (firstWord && RESERVED_FIRST_WORDS.has(firstWord)) {
    return `Check name cannot start with "${firstWord}", which is a reserved word in decision models.`;
  }

  return null;
};
