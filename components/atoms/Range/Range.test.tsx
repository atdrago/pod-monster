import { render, screen } from '@testing-library/react';
import type { CDPSession } from 'playwright';
import { cdp, commands } from 'vitest/browser';

import { Range } from './Range';

interface ProtocolNode {
  attributes?: Array<string>;
  children?: Array<ProtocolNode>;
  contentDocument?: ProtocolNode;
  nodeId: number;
  nodeName: string;
  shadowRoots?: Array<ProtocolNode>;
}

// The tsconfig does not load the types of the Playwright provider. Thus,
// `vitest/browser` types the session with no methods.
function getCdpSession() {
  return cdp() as CDPSession;
}

function hasAttribute(node: ProtocolNode, name: string, value: string) {
  const attributes = node.attributes ?? [];

  for (let i = 0; i < attributes.length; i += 2) {
    if (attributes[i] === name && attributes[i + 1] === value) {
      return true;
    }
  }

  return false;
}

function findNode(
  node: ProtocolNode,
  isMatch: (node: ProtocolNode) => boolean,
): ProtocolNode | undefined {
  if (isMatch(node)) {
    return node;
  }

  const descendants = [
    ...(node.children ?? []),
    ...(node.shadowRoots ?? []),
    ...(node.contentDocument ? [node.contentDocument] : []),
  ];

  for (const descendant of descendants) {
    const match = findNode(descendant, isMatch);

    if (match) {
      return match;
    }
  }

  return undefined;
}

/**
 * For a `::-webkit-*` part, `getComputedStyle()` returns the style of the
 * input. Thus, this helper reads the part from the user-agent shadow tree
 * through the Chrome DevTools Protocol. Chromium gives the parts the ids
 * `track` and `thumb`.
 */
async function getSliderPartStyle(label: string, partId: 'thumb' | 'track') {
  const { root } = await getCdpSession().send('DOM.getDocument', {
    depth: -1,
    pierce: true,
  });
  const input = findNode(
    root,
    (node) =>
      node.nodeName === 'INPUT' && hasAttribute(node, 'aria-label', label),
  );
  const part = input
    ? findNode(input, (node) => hasAttribute(node, 'id', partId))
    : undefined;

  if (!part) {
    throw new Error(`No slider part "${partId}" for the label "${label}"`);
  }

  const { computedStyle } = await getCdpSession().send(
    'CSS.getComputedStyleForNode',
    {
      nodeId: part.nodeId,
    },
  );

  return new Map(computedStyle.map(({ name, value }) => [name, value]));
}

describe('Range', () => {
  describe('variants', () => {
    it('should render the audio variant at value 50', async () => {
      const { container } = render(
        <Range aria-label="Seek" defaultValue={50} variant="audio" />,
      );
      const element = container.querySelector('input');
      await expect(element).toMatchScreenshot('range-variant-audio.png');
    });

    it('should render the volume variant at value 50', async () => {
      const { container } = render(
        <Range aria-label="Volume" defaultValue={50} variant="volume" />,
      );
      const element = container.querySelector('input');
      await expect(element).toMatchScreenshot('range-variant-volume.png');
    });
  });

  // The Chrome DevTools Protocol works in Chromium only.
  describe('slider parts', () => {
    beforeAll(async () => {
      await getCdpSession().send('DOM.enable');
      await getCdpSession().send('CSS.enable');
    });

    afterAll(async () => {
      await getCdpSession().send('CSS.disable');
      await getCdpSession().send('DOM.disable');
    });

    it('should render the audio track 32px tall and the thumb 24px wide', async () => {
      render(<Range aria-label="Seek" defaultValue={50} variant="audio" />);

      const trackStyle = await getSliderPartStyle('Seek', 'track');
      const thumbStyle = await getSliderPartStyle('Seek', 'thumb');

      expect(trackStyle.get('height')).toBe('32px');
      expect(thumbStyle.get('width')).toBe('24px');
    });

    it('should render the volume track 2px tall and the thumb 16px round', async () => {
      render(<Range aria-label="Volume" defaultValue={50} variant="volume" />);

      const trackStyle = await getSliderPartStyle('Volume', 'track');
      const thumbStyle = await getSliderPartStyle('Volume', 'thumb');

      expect(trackStyle.get('height')).toBe('2px');
      expect(thumbStyle.get('width')).toBe('16px');
      expect(thumbStyle.get('height')).toBe('16px');
      expect(
        parseFloat(thumbStyle.get('border-top-left-radius') ?? ''),
      ).toBeGreaterThanOrEqual(8);
    });
  });

  describe('className', () => {
    it('should apply a custom className to the input', () => {
      render(
        <Range
          aria-label="Volume"
          className="custom-class"
          defaultValue={50}
          variant="volume"
        />,
      );

      expect(screen.getByRole('slider', { name: 'Volume' })).toHaveClass(
        'custom-class',
      );
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render the audio variant at value 50', async () => {
      const { container } = render(
        <Range aria-label="Seek" defaultValue={50} variant="audio" />,
      );
      const element = container.querySelector('input');
      await expect(element).toMatchScreenshot('range-variant-audio-dark.png');
    });

    it('should render the volume variant at value 50', async () => {
      const { container } = render(
        <Range aria-label="Volume" defaultValue={50} variant="volume" />,
      );
      const element = container.querySelector('input');
      await expect(element).toMatchScreenshot('range-variant-volume-dark.png');
    });
  });
});
