import { tryConvertTextOrHtmlToVtt } from './tryConvertTextOrHtmlToVtt';

it('should return undefined when not parsable', async () => {
  const vtt = await tryConvertTextOrHtmlToVtt('foo bar', 60);
  expect(vtt).toEqual(undefined);
});

it('should convert text to vtt', async () => {
  // Snippet from - https://share.transistor.fm/s/0ba4b425/transcript.txt
  const textInput = `[00:00:00] **Cassidy Williams:** Previously on Remotely Interesting...

[00:00:03] **Jason Lengstorf:** For everyone who's not watching this live Tara just opened her mouth at the end of that joke.

[00:00:10] **Cassidy Williams:** Hello and welcome to Remotely Interesting.

[00:00:12] **Phil Hawksworth:** This is remotely interesting.

[00:00:14] **Divya Tagtachian:** Well, that seems a little presumptuous.

[00:00:16] **Sarah Drasner:** No no no, that's the name of the show.

[00:00:26] **Cassidy Williams:** Hello? Do you value things? I doubt it because I don't. Just kidding. We probably value things. And the company you work for, probably values things to, uh, does that align? Oh, no, but we're joined by the only guest that has ever come back to our show. Thuy Doan as well as some other nerds. Why don't you all introduce yourselves?

[00:00:55] **Cassidy Williams:** Fine, Jason. We also have Phil and Charlie who will [00:01:00] not introduce themselves either. And so we're going to get a wonderful little sample size of opinions on this matter and learn from each other's experiences. So hello everyone.

[00:01:14] **Cassidy Williams:** So does your company have values? That's that's my, that's my straight up question because I feel like a lot of companies talk about it, but I, I have seen my fair share of companies who talk the talk, but don't necessarily walk the walk, um, toilets.

[00:01:31] **Jason Lengstorf:** Well, you're going to talk about it and you're going to be about it

[00:01:34] **Cassidy Williams:** Word, huh?

[00:01:36] **Thuy Doan:** Oh snap. So I actually, I'm pretty sure, sure. I know my company's values, but I had to Google it just in case, cause I didn't want to say the wrong thing. Okay. So my company, they have four values, uh, being user obsessed, radical candor, growth mindset, and extreme ownership. I feel like three of them [00:02:00] are pretty straightforward, but in case people don't know what radical candor is.`;

  const vtt = await tryConvertTextOrHtmlToVtt(textInput, 305);
  expect(vtt).toMatchSnapshot();
});

it('should convert html to vtt', async () => {
  // Snippet from - https://feeds.buzzsprout.com/1538779/10139859/transcript
  const textInput = `<body>
    <h1><!--block-->Podland 24/02</h1>
    <p><!--block-->[00:00:00]</p>
    <p><!--block-->[00:00:00] Welcome to Podland the last word in podcasting use. It's the 24th of February, 2022. I'm James. Cridlin the editor of pod news.net.</p>
    <p><!--block-->[00:00:08] And I'm Sam Sethi, the MD of river radio, the podcast, first radio station going live on dab on the 1st of March.</p>
  </body>`;

  const vtt = await tryConvertTextOrHtmlToVtt(textInput, 7025);

  expect(vtt).toMatchSnapshot();
});

it('should exclude last transcript cue if duration is not specified', async () => {
  // Snippet from - https://feeds.buzzsprout.com/1538779/10139859/transcript
  const textInput = `<body>
    <h1><!--block-->Podland 24/02</h1>
    <p><!--block-->[00:00:00]</p>
    <p><!--block-->[00:00:00] Welcome to Podland the last word in podcasting use. It's the 24th of February, 2022. I'm James. Cridlin the editor of pod news.net.</p>
    <p><!--block-->[00:00:08] And I'm Sam Sethi, the MD of river radio, the podcast, first radio station going live on dab on the 1st of March.</p>
  </body>`;

  const vtt = await tryConvertTextOrHtmlToVtt(textInput);

  expect(vtt).toMatchSnapshot();
});
