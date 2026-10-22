---
title: A Tailwind class passed through className loses to a component class for the same property
date: 2026-10-22
category: best-practices
module: Component class composition (components/layouts/Stack/Stack.tsx, components/atoms/Typography/Typography.tsx)
problem_type: best_practice
component: frontend
severity: medium
applies_when:
  - 'A caller passes a Tailwind class to a component through `className`'
  - The passed class sets a CSS property that a class of the component also sets
  - A component joins its own classes and the caller's className in one string
tags:
  [
    tailwind,
    classname,
    css-cascade,
    stylesheet-order,
    component-props,
    typography,
    stack,
  ]
---

# A Tailwind class passed through className loses to a component class for the same property

## Context

The components join their own classes and the `className` of the caller in one template literal that ends in `${className ?? ''}` (the `AGENTS.md` React rules ask every root to support `className`). The project uses no `cva` and no `tailwind-merge`. In Tailwind CSS 4.1 (4.1.17 here), two utilities for the same property have equal specificity, so the order of the rules in the generated stylesheet decides. The order of the classes in the `class` attribute has no effect. A class that the caller passes in can therefore lose with no error and no warning.

## Guidance

- **Express a same-property conflict as a component prop, not as a passed class.** The component then emits only one class for that property.
  - `Stack` has a `maxWidth` prop with `none`, `page`, and `small` values (`components/layouts/Stack/Stack.tsx:31-34`, `types/Stack.ts:11`). `CenteredPageLayout` uses `maxWidth="page"` (`components/layouts/CenteredPageLayout/CenteredPageLayout.tsx:14`) because a passed `max-w-5xl` lost to the `max-w-none` of `Stack`.
  - `Typography` has a `textAlign` prop (`components/atoms/Typography/Typography.tsx:16-18`, `Typography.tsx:58`). The `Media` time labels use `textAlign="center"` and `textAlign="right"` (`components/molecules/Media/Media.tsx:242`, `Media.tsx:253`) because a passed `text-center` lost to the `text-left` of the root.
  - `Typography` has a `width` prop (`content` or `auto`), because a passed `w-auto` loses to the `w-full` of the root.
- **A passed longhand utility can override a shorthand class of the component.** Tailwind sorts the longhand utilities after the shorthand utilities, so `-ml-3` (`margin-left`) beats `m-0` (`margin`) and `mx-auto` (`margin-inline`). `EpisodeUnlistenedDot` relies on this to move the `Dot` into the gutter (`components/molecules/EpisodeUnlistenedDot/EpisodeUnlistenedDot.tsx:38`; the `Dot` sets `m-0` at `components/atoms/Dot/Dot.tsx:25`). Do not rely on it for two utilities of the same property.
- **Test the computed style when a caller sets a layout property.** A screenshot at the default viewport does not show a missing width cap. The `CenteredPageLayout` cap failed only in a test that read `getComputedStyle` at a wide viewport.

## Why This Matters

The losing class looks correct in code review: the caller writes `max-w-5xl`, and the class is in the DOM. Only the computed style shows the defect, and it depends on the generated order of the stylesheet, which can change when a new utility enters the build.

## When to Apply

- When you add a `className` to a `Stack`, `Typography`, or another component that sets its own layout, alignment, size, or color classes.
- When you add a new variant to a component: put it in a module-scope `as const` class map keyed by a prop value, and do not ask callers to override it.

## Examples

Before, the passed class loses:

```tsx
<Stack className="max-w-5xl" maxWidth="none">
  {children}
</Stack>
```

The element has both `max-w-none` and `max-w-5xl`, and the stylesheet puts `max-w-none` later, so the computed `max-width` is `none`.

After, one class for the property:

```tsx
<Stack maxWidth="page">{children}</Stack>
```
