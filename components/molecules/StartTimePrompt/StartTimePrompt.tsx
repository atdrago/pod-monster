import { useId, useState, useSyncExternalStore } from 'react';

import { Button } from 'components/atoms/Button';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { useIsMounted } from 'hooks/useIsMounted';
import { secondsToShortClockTime } from 'utils/date';

interface StartTimePromptProps {
  className?: string;
  isPlayFromDisabled?: boolean;
  onNotNowClick: () => void;
  onPlayFromClick: (startTime: number) => void;
  /** In seconds. */
  startTime: number;
}

const subscribeToNothing = () => () => {};

/**
 * A screen reader speaks a change of the text of a live region, but not the
 * text that the region has when it is inserted. Thus, after a client
 * navigation, the line gets its text one render after the mount. A server
 * render and its hydration keep the text, so that the first paint of a share
 * link shows the line.
 */
const useIsLiveLineFilled = () => {
  const isServerOrHydrationRender = useSyncExternalStore(
    subscribeToNothing,
    () => false,
    () => true,
  );
  const [isFromServer] = useState(isServerOrHydrationRender);
  const isMounted = useIsMounted();

  return isFromServer || isMounted;
};

/** Asks to play an episode from the time of a share link, with the copy of the app. */
export const StartTimePrompt = ({
  className,
  isPlayFromDisabled = false,
  onNotNowClick,
  onPlayFromClick,
  startTime,
}: StartTimePromptProps) => {
  const lineId = useId();
  const isLiveLineFilled = useIsLiveLineFilled();
  const formattedStartTime = secondsToShortClockTime(startTime);

  const handlePlayFromClick = () => {
    if (isPlayFromDisabled) {
      return;
    }

    onPlayFromClick(startTime);
  };

  return (
    <Stack
      aria-labelledby={lineId}
      as="section"
      className={`rounded-lg border border-zinc-400 p-6 dark:border-zinc-600 ${className ?? ''}`}
      space="small"
    >
      <Typography
        aria-live="polite"
        as="p"
        className="font-bold"
        id={lineId}
        size="headingSmaller"
      >
        {isLiveLineFilled ? `Start Listening at ${formattedStartTime}?` : null}
      </Typography>
      <Stack className="sm:flex-row" space="small">
        <Button disabled={isPlayFromDisabled} onClick={handlePlayFromClick}>
          {`Play from ${formattedStartTime}`}
        </Button>
        <Button onClick={onNotNowClick}>Not Now</Button>
      </Stack>
    </Stack>
  );
};
