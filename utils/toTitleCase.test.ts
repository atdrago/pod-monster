import { toTitleCase } from './toTitleCase';

test.each([
  {
    expectedOutput: 'Some String',
    input: 'some string',
  },
  {
    expectedOutput: 'Some String',
    input: 'SOME STRING',
  },
  {
    expectedOutput: 'Some Other String',
    input: 'sOmE oThEr StRiNg',
  },
])('should title case "$input"', ({ expectedOutput, input }) => {
  const output = toTitleCase(input);
  expect(output).toEqual(expectedOutput);
});
