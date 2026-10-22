---
title: The CSS text-box trim clips, skips, and stretches boxes in ways that capsize did not
date: 2026-10-22
category: best-practices
module: Typography trim (components/atoms/Typography/Typography.tsx, styles/globals.css)
problem_type: best_practice
component: frontend
severity: medium
applies_when:
  - 'A component trims its line box to the cap height and the baseline with `text-box`'
  - A trimmed text element also truncates with an ellipsis or clamps to a number of lines
  - A trimmed element is an inline element, for example span, a, label, small, or a Link
  - A box with a trim holds no line of text, for example a virtual list or a block image
  - A layout moves from capsize, or from hand-made negative margins, to `text-box`
retire_when: 'A Chromium release changes how text-box-trim applies to the lines inside a descendant overflow box, or to an inline-block box on a line of its parent; check the Chrome release notes and the CSS Inline Layout 3 spec for text-box-trim'
tags:
  [
    text-box,
    text-box-trim,
    capsize,
    typography,
    ellipsis,
    line-clamp,
    tailwind,
    chromium,
  ]
---

# The CSS text-box trim clips, skips, and stretches boxes in ways that capsize did not

## Context

The Tailwind transition replaced the capsize trim with the CSS `text-box` property (the typography unit of the transition, in the Tailwind transition pull request, unmerged as of this writing). The `text-box-trim-cap` utility sets `text-box: trim-both cap alphabetic` (`styles/globals.css:114-115`). Capsize trimmed with negative margins on `::before` and `::after` pseudo-elements. `text-box` trims the first and the last line box. That difference changed the look in five places that the screenshot suite found in Chromium 143.

## Guidance

1. **Use `overflow-x: clip`, not `overflow: hidden`, on an ellipsis span inside a trimmed root.** The root trim reaches the first and the last line inside a descendant span. A span with `overflow: hidden` then ends at the baseline and clips the descenders of g, j, p, q, and y. `overflow-x: clip` clips only the horizontal overflow, so the ellipsis works and the descenders stay. `Typography` uses `block overflow-x-clip text-ellipsis whitespace-nowrap` for the ellipsis span (`components/atoms/Typography/Typography.tsx:68`).

2. **Turn the trim off for a line clamp.** A line clamp needs `display: -webkit-box` and `overflow: hidden` (`Typography.tsx:77`), so it cannot use `overflow-x: clip`. With the trim on, the clamp clips the descenders of the last line. The two clamp call sites pass `shouldTrimTextBox={false}` (`components/molecules/SubscriptionItem/SubscriptionItem.tsx:81`, `components/organisms/EpisodePlayButton/EpisodePlayButton.tsx:125`).

3. **Give a trimmed inline root `display: block`, not `inline-block`.** `text-box` does not trim an inline box. An `inline-block` box is trimmed, but it sits on a line of its parent, and the strut of that line keeps the full line height. A flex `li` is a block container too, so the `Footer` links grew from 11px to 24px with `inline-block`. `Typography` adds `block` to a trimmed root whose element is in `INLINE_ELEMENTS` or is a component (`Typography.tsx:22`, `Typography.tsx:43`, `Typography.tsx:61`). The root is full width by default, so `block` fills the same line.

4. **Expect a box with no line of its own to keep its full height.** `text-box` trims line boxes, so it trims nothing on a box whose content has no line. Capsize pulled such a box in with negative margins anyway. Two boxes grew by about 12.7px:
   - The `TimedList` content box, whose only child is the `react-window` list (240px, not 227px).
   - A markdown paragraph that wraps an image, because Tailwind preflight makes `img` a block. The image no longer overlaps the block above it.

5. **Give a trimmed ellipsis root `min-w-0`.** The legacy root clipped its own overflow, so it shrank in a flex row or a grid column. The new root does not clip, so `Typography` adds `min-w-0` to every ellipsis root (`Typography.tsx:50`). Without it, a long header title pushed the row out of view.

6. **Write both edge keywords.** The static value `text-box: trim-both cap` computed to `none` in Chromium 143, so the converted `Badge` was never trimmed. `trim-both cap alphabetic` works.

7. **Do not trim monospace text.** Capsize never trimmed it, and the trim changed the code block images (`Typography.tsx:40-41`).

## Why This Matters

Each of these cases passes type checks and lint, and most of them pass a quick look in the browser. Only an element screenshot with descender text or a real parent context shows them. The suite has the guard images for case 1: `typography-whitespace-ellipsis-descenders` (`components/atoms/Typography/Typography.test.tsx:322-342`).

## When to Apply

- When you add a `Typography` with `whitespace="ellipsis"` or a number, or a new trimmed text element.
- When you put a trimmed text element inside a flex row, a grid column, or an inline context.
- When you trim a box that holds no text line.

## Examples

Before, with capsize semantics carried over literally:

```tsx
<span className="block truncate">{children}</span>
```

The trim on the root clips the descenders of this span, because `truncate` sets `overflow: hidden`.

After:

```tsx
<span className="block overflow-x-clip text-ellipsis whitespace-nowrap">
  {children}
</span>
```
