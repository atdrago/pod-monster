import { render } from '@testing-library/react';
import { commands } from 'vitest/browser';

import { Typography } from 'components/atoms/Typography';

function UnorderedList() {
  return (
    <Typography
      as="ul"
      className="list-layout"
      size="paragraph"
      shouldUseCapsize={false}
    >
      <li>It is available for public testing and use.</li>
      <li>You can expect all changes that land to be stable.</li>
      <li>
        There are core features that have not yet been implemented, and the
        features that have been implemented are subject to frequent changes.
      </li>
    </Typography>
  );
}

function OrderedList() {
  return (
    <Typography
      as="ol"
      className="list-layout"
      size="paragraph"
      shouldUseCapsize={false}
    >
      <li>The Podcast Index provides all the podcast data.</li>
      <li>TypeScript allows you to write statically-typed JavaScript.</li>
      <li>
        Next.js renders each page, and React builds the interface from small
        components.
      </li>
    </Typography>
  );
}

describe('listLayout', () => {
  it('should render an unordered list', async () => {
    const { container } = render(<UnorderedList />);
    const element = container.querySelector('ul');
    await expect(element).toMatchScreenshot('listLayout-unordered.png');
  });

  it('should render an ordered list', async () => {
    const { container } = render(<OrderedList />);
    const element = container.querySelector('ol');
    await expect(element).toMatchScreenshot('listLayout-ordered.png');
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render an unordered list', async () => {
      const { container } = render(<UnorderedList />);
      const element = container.querySelector('ul');
      await expect(element).toMatchScreenshot('listLayout-unordered-dark.png');
    });

    it('should render an ordered list', async () => {
      const { container } = render(<OrderedList />);
      const element = container.querySelector('ol');
      await expect(element).toMatchScreenshot('listLayout-ordered-dark.png');
    });
  });
});
