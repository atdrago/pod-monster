import { Icon } from 'components/atoms/Icon';
import PauseIcon from 'icons/pause2.svg';
import PlayIcon from 'icons/play3.svg';
import SpinnerIcon from 'icons/spinner8.svg';
import { spinnerClassName } from 'styles';
import type { iconSizeVariant } from 'components/atoms/Icon/icon.css';

interface PlayPauseIconProps {
  isLoading?: boolean;
  isPaused: boolean;
  size?: keyof typeof iconSizeVariant;
}

export const PlayPauseIcon = ({
  isLoading,
  isPaused,
  size = 'small',
}: PlayPauseIconProps) => (
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
