import type { FunctionComponent } from 'react';

import { Icon } from 'components/atoms/Icon';
import PauseIcon from 'icons/pause2.svg';
import PlayIcon from 'icons/play3.svg';
import type { IPlayPauseIconProps } from 'types';

export const PlayPauseIcon: FunctionComponent<IPlayPauseIconProps> = ({
  isPaused,
  size = 'small',
}) => (
  <Icon size={size}>
    {isPaused ? <PlayIcon style={{ marginLeft: '3px' }} /> : <PauseIcon />}
  </Icon>
);
