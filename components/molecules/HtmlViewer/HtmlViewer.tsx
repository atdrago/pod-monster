import { memo } from 'react';
import ReactMarkdown from 'react-markdown';

import { Blockquote } from 'components/atoms/Blockquote';
import { Typography } from 'components/atoms/Typography';
import { useClassNames } from 'hooks/useClassNames';
import { listItem, listLayout } from 'styles';
import type { IMarkdownViewerProps } from 'types';

import { htmlViewerContainer } from './htmlViewer.css';

export const HtmlViewer = memo(
  function MarkdownViewerMemo({
    children,
    className,
    shouldUseCapsize = true,
    ...reactMarkdownProps
  }: IMarkdownViewerProps) {
    const baseClassName = useClassNames(htmlViewerContainer, className);

    return (
      <div className={baseClassName}>
        <ReactMarkdown
          components={{
            blockquote({ node: _node, ...props }) {
              return <Blockquote {...props} />;
            },
            code({
              children: codeChildren,
              className: codeClassName,
              inline: _inline,
              node: _node,
              ...props
            }) {
              return (
                <code className={codeClassName} {...props}>
                  {codeChildren}
                </code>
              );
            },
            h1({ node: _node, ...props }) {
              return (
                <Typography
                  shouldUseCapsize={shouldUseCapsize}
                  as="h1"
                  size="headingSmall"
                  {...props}
                />
              );
            },
            h2({ node: _node, ...props }) {
              return (
                <Typography
                  shouldUseCapsize={shouldUseCapsize}
                  as="h2"
                  size="headingSmall"
                  {...props}
                />
              );
            },
            h3({ node: _node, ...props }) {
              return (
                <Typography
                  shouldUseCapsize={shouldUseCapsize}
                  as="h3"
                  size="headingSmall"
                  {...props}
                />
              );
            },
            h4({ node: _node, ...props }) {
              return (
                <Typography
                  shouldUseCapsize={shouldUseCapsize}
                  as="h4"
                  size="headingSmaller"
                  {...props}
                />
              );
            },
            img({ alt, height, node: _node, src, width }) {
              return <img alt={alt} height={height} src={src} width={width} />;
            },
            li({ node: _node, ordered: _ordered, ...props }) {
              return <li className={listItem} {...props} />;
            },
            ol({ node: _node, ordered: _ordered, ...props }) {
              return <ol className={listLayout} {...props} />;
            },
            p({ node: _node, ...props }) {
              return (
                <Typography
                  shouldUseCapsize={shouldUseCapsize}
                  as="p"
                  size="paragraph"
                  {...props}
                />
              );
            },
            pre({ node: _node, ...props }) {
              return (
                <Typography
                  shouldUseCapsize={shouldUseCapsize}
                  as="pre"
                  size="monospace"
                  {...props}
                />
              );
            },
            small({ node: _node, ...props }) {
              return (
                <Typography
                  shouldUseCapsize={shouldUseCapsize}
                  as="small"
                  size="legal"
                  {...props}
                />
              );
            },
            ul({ node: _node, ordered: _ordered, ...props }) {
              return <ul className={listLayout} {...props} />;
            },
          }}
          {...reactMarkdownProps}
        >
          {typeof children === 'string' ? children : ''}
        </ReactMarkdown>
      </div>
    );
  },
  function areEqual(prevProps, nextProps) {
    return (
      prevProps.children === nextProps.children &&
      prevProps.className === nextProps.className &&
      prevProps.shouldUseCapsize === nextProps.shouldUseCapsize
    );
  }
);
