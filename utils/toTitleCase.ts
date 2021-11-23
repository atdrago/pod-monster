export const toTitleCase = (input?: string): string | undefined => {
  if (!input) {
    return input;
  }

  return input
    .split(' ')
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};
