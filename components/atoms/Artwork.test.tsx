import { render, screen } from '@testing-library/react';
import { commands } from 'vitest/browser';

import { Artwork } from './Artwork';

const SQUARE_IMAGE_SRC = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" fill="#56B6C2"/><circle cx="80" cy="80" r="48" fill="#E06C75"/></svg>',
)}`;
const WIDE_IMAGE_SRC = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="#98C379"/><rect x="120" y="50" width="80" height="80" fill="#D19A66"/></svg>',
)}`;
const SUBTITLE_TEXT = 'A line of the transcript that the player shows now.';

async function waitForImageDecode() {
  await screen.getByAltText<HTMLImageElement>('Cover art').decode();
}

describe('Artwork', () => {
  describe('image', () => {
    it('should render a square image', async () => {
      const { container } = render(
        <Artwork
          alt="Cover art"
          height={160}
          src={SQUARE_IMAGE_SRC}
          width={160}
        />,
      );
      await waitForImageDecode();
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('artwork-image.png');
    });
  });

  describe('placeholder', () => {
    it('should render the placeholder label when there is no image', async () => {
      const { container } = render(
        <Artwork alt="" height={80} label="1." width={80} />,
      );
      expect(screen.getByText('1.')).toBeVisible();
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('artwork-placeholder.png');
    });
  });

  describe('subtitle', () => {
    it('should render a subtitle over the image', async () => {
      const { container } = render(
        <Artwork
          alt="Cover art"
          height={320}
          src={SQUARE_IMAGE_SRC}
          subtitle={SUBTITLE_TEXT}
          width={320}
        />,
      );
      await waitForImageDecode();
      expect(screen.getByRole('log')).toHaveTextContent(SUBTITLE_TEXT);
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('artwork-subtitle.png');
    });
  });

  describe('shadow', () => {
    it('should render a shadow', async () => {
      // The padding of the wrapper puts the shadow inside the screenshot.
      const { container } = render(
        <div className="w-fit p-6">
          <Artwork
            alt="Cover art"
            height={80}
            shadow={true}
            src={SQUARE_IMAGE_SRC}
            width={80}
          />
        </div>,
      );
      await waitForImageDecode();
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('artwork-shadow.png');
    });
  });

  describe('isSquare', () => {
    it('should fit a wide image in a square', async () => {
      const { container } = render(
        <Artwork
          alt="Cover art"
          height={180}
          src={WIDE_IMAGE_SRC}
          width={320}
        />,
      );
      await waitForImageDecode();
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('artwork-square-wideImage.png');
    });

    it('should render a wide image at its own ratio when not square', async () => {
      const { container } = render(
        <Artwork
          alt="Cover art"
          height={180}
          isSquare={false}
          src={WIDE_IMAGE_SRC}
          width={320}
        />,
      );
      await waitForImageDecode();
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot(
        'artwork-notSquare-wideImage.png',
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

    it('should render a square image', async () => {
      const { container } = render(
        <Artwork
          alt="Cover art"
          height={160}
          src={SQUARE_IMAGE_SRC}
          width={160}
        />,
      );
      await waitForImageDecode();
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('artwork-image-dark.png');
    });

    it('should render the placeholder label when there is no image', async () => {
      const { container } = render(
        <Artwork alt="" height={80} label="1." width={80} />,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('artwork-placeholder-dark.png');
    });

    it('should render a subtitle over the image', async () => {
      const { container } = render(
        <Artwork
          alt="Cover art"
          height={320}
          src={SQUARE_IMAGE_SRC}
          subtitle={SUBTITLE_TEXT}
          width={320}
        />,
      );
      await waitForImageDecode();
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('artwork-subtitle-dark.png');
    });

    it('should render a shadow', async () => {
      const { container } = render(
        <div className="w-fit p-6">
          <Artwork
            alt="Cover art"
            height={80}
            shadow={true}
            src={SQUARE_IMAGE_SRC}
            width={80}
          />
        </div>,
      );
      await waitForImageDecode();
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('artwork-shadow-dark.png');
    });

    it('should fit a wide image in a square', async () => {
      const { container } = render(
        <Artwork
          alt="Cover art"
          height={180}
          src={WIDE_IMAGE_SRC}
          width={320}
        />,
      );
      await waitForImageDecode();
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot(
        'artwork-square-wideImage-dark.png',
      );
    });
  });
});
