/**
 * Takes an object and removes all null and undefined properties
 */
export const removeNullAndUndefined = <TInput>(input: TInput): TInput => {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'object' && input !== null) {
    let key: keyof typeof input;

    for (key in input) {
      const value = input[key];

      if (value === undefined || value === null) {
        delete input[key];
      } else if (typeof value === 'object') {
        removeNullAndUndefined(value);

        if (!Object.keys(value).length) {
          delete input[key];
        }
      }
    }
  }

  return input;
};
