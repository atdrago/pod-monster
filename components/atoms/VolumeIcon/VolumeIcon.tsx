import type { FunctionComponent } from 'react';

import { Icon } from 'components/atoms/Icon';
import VolumeHighIcon from 'icons/volume-high.svg';
import VolumeLowIcon from 'icons/volume-low.svg';
import VolumeMediumIcon from 'icons/volume-medium.svg';
import VolumeZeroIcon from 'icons/volume-mute.svg';
import VolumeMuteIcon from 'icons/volume-mute2.svg';
import type { IVolumeIconProps } from 'types';

export const VolumeIcon: FunctionComponent<IVolumeIconProps> = ({
  isMuted,
  volume,
}) => (
  <Icon size="small">
    {isMuted ? (
      <VolumeMuteIcon />
    ) : volume > 0.75 ? (
      <VolumeHighIcon />
    ) : volume > 0.25 ? (
      <VolumeMediumIcon />
    ) : volume > 0 ? (
      <VolumeLowIcon />
    ) : (
      <VolumeZeroIcon />
    )}
  </Icon>
);
