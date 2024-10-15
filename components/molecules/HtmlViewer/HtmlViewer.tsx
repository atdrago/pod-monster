import { memo } from 'react';
import ReactMarkdown from 'react-markdown';

import { Blockquote } from 'components/atoms/Blockquote';
import { Typography } from 'components/atoms/Typography';
import { useClassNames } from 'hooks/useClassNames';
import { listItem, underlinedLink } from 'styles';
import type { MarkdownViewerProps } from 'types';

import {
  htmlViewerContainer,
  imgClassName,
  listLayout,
} from './htmlViewer.css';

export const HtmlViewer = memo(
  function MarkdownViewerMemo({
    children,
    className,
    shouldUseCapsize = true,
    ...reactMarkdownProps
  }: MarkdownViewerProps) {
    const baseClassName = useClassNames(htmlViewerContainer, className);

    return (
      <Typography
        as="div"
        size="paragraph"
        className={baseClassName}
        shouldUseCapsize={false}
      >
        <ReactMarkdown
          components={{
            a({
              children: aChildren,
              className: _className,
              node: _node,
              ...props
            }) {
              return (
                <a
                  className={underlinedLink}
                  rel="noreferrer noopener"
                  target="_blank"
                  {...props}
                >
                  {aChildren}
                </a>
              );
            },
            blockquote({ className: _className, node: _node, ...props }) {
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
            img({
              alt,
              className: _className,
              height,
              node: _node,
              src,
              width,
            }) {
              return (
                <img
                  alt={alt}
                  className={imgClassName}
                  height={height}
                  src={src}
                  width={width}
                />
              );
            },
            li({
              className: _className,
              node: _node,
              ordered: _ordered,
              ...props
            }) {
              return <li className={listItem} {...props} />;
            },
            ol({
              className: _className,
              node: _node,
              ordered: _ordered,
              ...props
            }) {
              return <ol className={listLayout} {...props} />;
            },
            p({ className: _className, node: _node, ...props }) {
              return (
                <Typography
                  shouldUseCapsize={shouldUseCapsize}
                  as="p"
                  size="paragraph"
                  {...props}
                />
              );
            },
            pre({ className: _className, node: _node, ...props }) {
              return (
                <Typography
                  shouldUseCapsize={shouldUseCapsize}
                  as="pre"
                  size="monospace"
                  {...props}
                />
              );
            },
            small({ className: _className, node: _node, ...props }) {
              return (
                <Typography
                  shouldUseCapsize={shouldUseCapsize}
                  as="small"
                  size="legal"
                  {...props}
                />
              );
            },
            ul({
              className: _className,
              node: _node,
              ordered: _ordered,
              ...props
            }) {
              return <ul className={listLayout} {...props} />;
            },
          }}
          {...reactMarkdownProps}
        >
          {typeof children === 'string' ? children : ''}
        </ReactMarkdown>
      </Typography>
    );
  },
  function areEqual(prevProps, nextProps) {
    return (
      prevProps.children === nextProps.children &&
      prevProps.className === nextProps.className &&
      prevProps.shouldUseCapsize === nextProps.shouldUseCapsize
    );
  },
);
