import type { FunctionComponent } from 'react';

import { Icon } from 'components/atoms/Icon';
import PauseIcon from 'icons/pause2.svg';
import PlayIcon from 'icons/play3.svg';
import SpinnerIcon from 'icons/spinner8.svg';
import { spinnerClassName } from 'styles';
import type { PlayPauseIconProps } from 'types';

export const PlayPauseIcon: FunctionComponent<PlayPauseIconProps> = ({
  isLoading,
  isPaused,
  size = 'small',
}) => (
  <Icon size={size}>
    {isLoading ? (
      <SpinnerIcon className={spinnerClassName} />
    ) : isPaused ? (
      <PlayIcon style={{ marginLeft: '3px' }} />
    ) : (
      <PauseIcon />
    )}
  </Icon>
);
