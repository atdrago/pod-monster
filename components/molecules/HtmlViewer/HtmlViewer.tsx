import { memo } from 'react';
import ReactMarkdown, { type Options } from 'react-markdown';

import { Blockquote } from 'components/atoms/Blockquote';
import { Typography } from 'components/atoms/Typography';

interface HtmlViewerProps extends Options {
  className?: string;
  shouldTrimTextBox?: boolean;
}

export const HtmlViewer = memo(
  function MarkdownViewerMemo({
    children,
    className,
    shouldTrimTextBox = true,
    ...reactMarkdownProps
  }: HtmlViewerProps) {
    return (
      <Typography
        as="div"
        size="paragraph"
        className={className}
        shouldTrimTextBox={false}
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
                  className="underline"
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
              // inline: _inline,
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
                  shouldTrimTextBox={shouldTrimTextBox}
                  as="h1"
                  size="headingSmall"
                  className="font-bold"
                  {...props}
                />
              );
            },
            h2({ node: _node, ...props }) {
              return (
                <Typography
                  className="font-bold"
                  shouldTrimTextBox={shouldTrimTextBox}
                  as="h2"
                  size="headingSmall"
                  {...props}
                />
              );
            },
            h3({ node: _node, ...props }) {
              return (
                <Typography
                  className="font-bold"
                  shouldTrimTextBox={shouldTrimTextBox}
                  as="h3"
                  size="headingSmall"
                  {...props}
                />
              );
            },
            h4({ node: _node, ...props }) {
              return (
                <Typography
                  as="h4"
                  className="font-bold"
                  shouldTrimTextBox={shouldTrimTextBox}
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
                  className="h-auto max-w-full"
                  height={height}
                  src={src}
                  width={width}
                />
              );
            },
            li({
              className: _className,
              node: _node,
              // ordered: _ordered,
              ...props
            }) {
              return <li className="text-paragraph break-words" {...props} />;
            },
            ol({
              className: _className,
              node: _node,
              // ordered: _ordered,
              ...props
            }) {
              return (
                <ol
                  className="mx-auto w-full max-w-content list-decimal pl-6"
                  {...props}
                />
              );
            },
            p({ className: _className, node: _node, ...props }) {
              return (
                <Typography
                  shouldTrimTextBox={shouldTrimTextBox}
                  as="p"
                  size="paragraph"
                  {...props}
                />
              );
            },
            pre({ className: _className, node: _node, ...props }) {
              return (
                <Typography
                  shouldTrimTextBox={shouldTrimTextBox}
                  as="pre"
                  size="monospace"
                  {...props}
                />
              );
            },
            small({ className: _className, node: _node, ...props }) {
              // A trimmed inline root becomes a block, and a block cannot wrap
              // inside a paragraph. Thus, this root stays inline and untrimmed.
              return (
                <Typography
                  shouldTrimTextBox={false}
                  as="small"
                  size="legal"
                  {...props}
                />
              );
            },
            ul({
              className: _className,
              node: _node,
              // ordered: _ordered,
              ...props
            }) {
              return (
                <ul
                  className="mx-auto w-full max-w-content list-disc pl-6"
                  {...props}
                />
              );
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
      prevProps.shouldTrimTextBox === nextProps.shouldTrimTextBox
    );
  },
);
