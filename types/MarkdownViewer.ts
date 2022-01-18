import type { ReactMarkdownOptions } from 'react-markdown/lib/react-markdown';

export interface IMarkdownViewerProps extends ReactMarkdownOptions {
  className?: string;
  shouldUseCapsize?: boolean;
}
