export const bufferedTimeRangesToTuples = (
  buffered?: TimeRanges,
): Array<[number, number]> => {
  if (!buffered) {
    return [];
  }

  const bufferedTuples: Array<[number, number]> = [];

  for (let i = 0; i < buffered.length; i++) {
    bufferedTuples.push([buffered.start(i), buffered.end(i)]);
  }

  return bufferedTuples;
};
