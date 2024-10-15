import type { ReactMarkdownOptions } from 'react-markdown/lib/react-markdown';

export interface MarkdownViewerProps extends ReactMarkdownOptions {
  className?: string;
  shouldUseCapsize?: boolean;
}
