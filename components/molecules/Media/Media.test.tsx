import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { LazyMotion, domAnimation } from 'framer-motion';
import type { ComponentProps } from 'react';
import { commands } from 'vitest/browser';

import { MediaProvider, useMediaContext } from 'contexts/MediaContext';
import { SettingsProvider } from 'contexts/SettingsContext';

import { Media } from './Media';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

const DATABASE_NAME = 'pod.monster';
const DURATION_IN_SECONDS = 3;
const TITLE = 'Example Show';

function deleteDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * The time labels show "..." until the media has a duration. Thus, the source
 * is a silent 8-bit mono WAV file with a known duration.
 */
function createSilentWavDataUrl(durationInSeconds: number) {
  const sampleRate = 8000;
  const sampleCount = sampleRate * durationInSeconds;
  const bytes = new Uint8Array(44 + sampleCount);
  const view = new DataView(bytes.buffer);

  const writeAscii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + sampleCount, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  writeAscii(36, 'data');
  view.setUint32(40, sampleCount, true);
  bytes.fill(128, 44);

  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join(
    '',
  );

  return `data:audio/wav;base64,${btoa(binary)}`;
}

const SRC = createSilentWavDataUrl(DURATION_IN_SECONDS);

type MediaWithContextRefsProps = Omit<
  ComponentProps<typeof Media>,
  'audioRef' | 'videoRef'
>;

function MediaWithContextRefs(props: MediaWithContextRefsProps) {
  const { audioRef, videoRef } = useMediaContext();

  return <Media audioRef={audioRef} videoRef={videoRef} {...props} />;
}

async function renderMedia(props: Partial<MediaWithContextRefsProps> = {}) {
  const rendered = render(
    <SettingsProvider>
      <QueryClientProvider client={new QueryClient()}>
        <LazyMotion features={domAnimation}>
          <MediaProvider>
            <MediaWithContextRefs src={SRC} title={TITLE} {...props} />
          </MediaProvider>
        </LazyMotion>
      </QueryClientProvider>
    </SettingsProvider>,
  );

  await waitFor(() => expect(screen.queryAllByText('...')).toHaveLength(0));

  return rendered;
}

// The title text sits in an inner span, so the title label is the heading.
function getTimeLabels() {
  return [
    screen.getByText('00:00:00'),
    screen.getByRole('heading', { name: TITLE }),
    screen.getByText('00:00:03'),
  ];
}

describe('Media', () => {
  beforeEach(async () => {
    await deleteDatabase();
  });

  describe('default', () => {
    it('should render the title and the time labels over the range', async () => {
      const { container } = await renderMedia();
      const element = container.querySelector('audio + div');

      expect(screen.getByText(TITLE)).toBeVisible();
      expect(screen.getByText('00:00:00')).toBeVisible();
      expect(screen.getByText('00:00:03')).toBeVisible();
      await expect(element).toMatchScreenshot('media-default.png');
    });

    it('should hide the audio element', async () => {
      const { container } = await renderMedia();

      expect(container.querySelector('audio')).not.toBeVisible();
    });

    it('should render the time labels white', async () => {
      await renderMedia();

      for (const label of getTimeLabels()) {
        expect(label).toHaveStyle({
          color: 'rgb(255, 255, 255)',
          mixBlendMode: 'difference',
        });
      }
    });

    it('should center the title and align the remaining time to the right', async () => {
      await renderMedia();

      expect(screen.getByText('00:00:00')).toHaveStyle({ textAlign: 'left' });
      expect(screen.getByRole('heading', { name: TITLE })).toHaveStyle({
        textAlign: 'center',
      });
      expect(screen.getByText('00:00:03')).toHaveStyle({ textAlign: 'right' });
    });
  });

  describe('className', () => {
    it('should apply a custom className to the audio element', async () => {
      const { container } = await renderMedia({ className: 'custom-class' });

      expect(container.querySelector('audio')).toHaveClass('custom-class');
    });
  });

  describe('currentTime', () => {
    it('should render the elapsed and the remaining time', async () => {
      const { container } = await renderMedia({ currentTime: 1 });
      const element = container.querySelector('audio + div');

      expect(screen.getByText('00:00:01')).toBeVisible();
      expect(screen.getByText('00:00:02')).toBeVisible();
      await expect(element).toMatchScreenshot('media-current-time.png');
    });
  });

  describe('isTitleVisible', () => {
    it('should render no title', async () => {
      const { container } = await renderMedia({ isTitleVisible: false });
      const element = container.querySelector('audio + div');

      expect(screen.queryByText(TITLE)).toBeNull();
      await expect(element).toMatchScreenshot('media-title-hidden.png');
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render the title and the time labels over the range', async () => {
      const { container } = await renderMedia();
      const element = container.querySelector('audio + div');
      await expect(element).toMatchScreenshot('media-default-dark.png');
    });

    it('should render the time labels white', async () => {
      await renderMedia();

      for (const label of getTimeLabels()) {
        expect(label).toHaveStyle({
          color: 'rgb(255, 255, 255)',
          mixBlendMode: 'difference',
        });
      }
    });
  });
});
