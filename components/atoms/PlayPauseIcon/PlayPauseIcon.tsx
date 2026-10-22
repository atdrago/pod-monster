import { Icon, type IconSize } from 'components/atoms/Icon';
import PauseIcon from 'icons/pause2.svg';
import PlayIcon from 'icons/play3.svg';
import SpinnerIcon from 'icons/spinner8.svg';

interface PlayPauseIconProps {
  className?: string;
  isLoading?: boolean;
  isPaused: boolean;
  size?: IconSize;
}

export const PlayPauseIcon = ({
  className,
  isLoading,
  isPaused,
  size = 'small',
}: PlayPauseIconProps) => (
  <Icon className={className} size={size}>
    {isLoading ? (
      <SpinnerIcon className="animate-spin origin-center" />
    ) : isPaused ? (
      <PlayIcon className="ml-[3px]" />
    ) : (
      <PauseIcon />
    )}
  </Icon>
);
