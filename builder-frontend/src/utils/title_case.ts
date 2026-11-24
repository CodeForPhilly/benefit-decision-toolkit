export const titleCase = (str: string) => {
  const words = str
    .replace(/[-_]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();

  return words.length === 0
    ? words
    : words.charAt(0).toUpperCase() + words.slice(1);
};

// "NotAlreadyEnrolled" -> "Not already enrolled". Matches the library-api's Swagger
// descriptions and the docs site, which split digits the same way.
export const sentenceCase = (str: string) => {
  const words = str
    .replace(/([a-z])([A-Z0-9])/g, "$1 $2")
    .replace(/([0-9])([A-Z])/g, "$1 $2")
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};
