'use client';

import { Typography } from 'components/atoms/Typography';
import { useSettingsContext } from 'contexts/SettingsContext';

interface AnotherTabNoticeProps {
  className?: string;
}

/**
 * Asks the visitor to close a tab that blocks the upgrade of the database. A
 * screen reader speaks an alert when it mounts with its text, so the notice
 * needs no empty live region before the block.
 */
export const AnotherTabNotice = ({ className }: AnotherTabNoticeProps) => {
  const { isBlockedByAnotherTab } = useSettingsContext();

  if (!isBlockedByAnotherTab) {
    return null;
  }

  return (
    <div
      className={`w-full max-w-content rounded-sm border border-note-border p-4 ${className ?? ''}`}
      role="alert"
    >
      <Typography as="p" size="paragraph">
        Pod Monster is open in another tab or window. Close it, and you&apos;ll
        be able to play episodes.
      </Typography>
    </div>
  );
};
