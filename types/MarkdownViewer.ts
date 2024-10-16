import type { Options } from 'react-markdown';

export interface MarkdownViewerProps extends Options {
  className?: string;
  shouldUseCapsize?: boolean;
}
