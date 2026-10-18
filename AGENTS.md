# AGENTS.md for pod-monster

Instructions for LLM agents that work in this codebase.

## Principles

These are the engineering principles of this repository. They have priority over all other rules.

### Confidence

Do not make a change until you have 95% confidence in what to build. Ask me follow-up questions until you reach that level of confidence.

### Modern Ideologies

When you choose between a modern solution and a legacy solution, always choose the modern solution. If the modern solution adds technical debt, record the debt in a clear, short `// TODO` comment. A legacy solution is technical debt by nature. Thus, give equal weight to a modern solution with technical debt and a legacy solution with no technical debt.

## Project Overview

Pod Monster is a mobile-first web app for podcasts. It supports many features of the Podcasting 2.0 `podcast` namespace. The stack is:

- [Next.js](https://nextjs.org/) with the App Router (`app/`), React, and TypeScript.
- [Tailwind CSS](https://tailwindcss.com/) for styles. Some components still use [vanilla-extract](https://vanilla-extract.style/) (`*.css.ts` files).
- [TanStack Query](https://tanstack.com/query) for data on the client.
- The `@atdrago/podcast-index` workspace package (`packages/podcast-index/`) for calls to the Podcast Index API.
- [Vitest](https://vitest.dev/) in browser mode, with Playwright and Chromium, for tests.

The components follow atomic design: `components/atoms/`, `components/molecules/`, `components/organisms/`, and `components/layouts/`.

## Verify Changes

After each code change, run the commands below from the project root. You must fix all issues.

### 1. Fix format and lint issues

```sh
npm run format && npm run lint:fix
```

- `npm run format` formats all project files in place with [Prettier](https://prettier.io/). The configuration is in `.prettierrc.json`.
- `npm run lint:fix` runs [ESLint](https://eslint.org/) and fixes the issues that ESLint can fix. The configuration is in `eslint.config.mjs`.

### 2. Lint with ESLint

```sh
npm run lint
```

ESLint fails on an error or a warning (`--max-warnings 0`). `npm run lint:fix` fixes most warnings, for example the key order and the blank lines.

### 3. Type-check with TypeScript

```sh
npm run typecheck
```

`npm run typecheck` runs `tsc -b`. Build mode first checks the `packages/podcast-index` project reference, and writes its declarations to `packages/podcast-index/dist/`. Then it checks the app. Git ignores `dist/` and the `*.tsbuildinfo` files.

If a project reference causes an error, fix the reference. Do not remove the `references` array. CI does not run this check, so run it before you push.

### 4. Test with Vitest

```sh
npx vitest run
```

`npx vitest run` runs the suite one time. `npm test` starts Vitest in watch mode in an interactive terminal. The tests run in headless Chromium through Playwright. Before the first run, install the browser:

```sh
npx playwright install chromium
```

### Recommended Workflow

After each set of edits, run all checks together:

```sh
npm run format && npm run lint:fix && npm run lint && npm run typecheck && npx vitest run
```

## Code Style

### Format and lint

Do not change the format by hand. This includes semicolons, quotes, whitespace, and line breaks. Prettier and ESLint control the format.

### Atomic classes with Tailwind

Use [Tailwind CSS](https://tailwindcss.com/docs) utility classes for styles when possible. Use the `style` prop only in these cases:

- No Tailwind utility exists for the style.
- The code calculates a value at runtime, and the `className` prop changes too frequently as a result.

Do not add a new vanilla-extract file (`*.css.ts`). The Tailwind theme tokens are in the `@theme` block of `styles/globals.css`.

### React rules

- Use `PropsWithChildren` when you add the `children` prop to a type.
- Always support a `className` prop. Add its value to the `className` of the root node.
- When a hook uses `useQuery`, return the `useQuery` result, so that the caller can use it.

### Artwork corner radius

A round corner crops the corners of a cover image, and so removes real artwork. Thus, the rule depends on the size. It keeps the detail where the user can see it, and relaxes where the user cannot:

- **Artwork that shows at 80px or more in one or both dimensions** uses a subtle `rounded-sm` corner, at most. At this size, the corner detail is visible. Keep the radius small, and never use a card radius.
- **Artwork below 80px in both dimensions** can use any radius. At this size, the user sees only colors and shapes, so the loss at the corners is small. The radius can match the UI around the artwork.

This rule applies only to cover art. It does not apply to a photo of a person (an avatar).

The radius does not always come from the `<img>` element. Any parent that clips the artwork can round it, for example a parent with `overflow-hidden` and a `rounded-*` class. To change the radius, change the class on the element that clips.

## Tests

### Test patterns

Use `components/atoms/IconButton/IconButton.test.tsx` as the canonical reference for test style. The main conventions are:

1. **Location and name**: Put the test file next to the source file, with the name `ComponentName.test.tsx`.
2. **Globals**: Vitest globals are on. Use `describe`, `it`, and `expect` with no import.
3. **Render**: Import `render` from `@testing-library/react`.
4. **Imports**: Import the component under test with a relative path (`./IconButton`). Import other modules from the `baseUrl` root (`components/atoms/Icon`).
5. **One top-level `describe`**: Use one `describe('ComponentName', ...)` block in each test file. Nested `describe` blocks can group the cases, for example `sizes` and `background variants`.
6. **Test names**: Start each test name with "should" and a verb, for example "should render…" or "should apply…".
7. **Visual output**: Assert the look of the component with `await expect(element).toMatchScreenshot('iconButton-size-small.png')`. Give each screenshot a unique name: the component, then the case. Vitest keeps the reference images in `__screenshots__/` next to the test file.
8. **Behavior**: Assert behavior with explicit matchers from `@testing-library/jest-dom`, for example `toBeVisible()` or `toHaveAttribute()`.
9. **Query priority**: For a behavior assertion, prefer `screen.getByText()`. Use `screen.getByTestId()` only as a last resort, when no visible text exists. For a screenshot, select the root element from `container`.
10. **What to cover**: For each component, test:
    - each variant and each prop value
    - the default behavior when a prop is not given
    - the edge cases from real use, for example no children or a custom `className`
    - the polymorphic `as` prop, when the component has one
11. **No DOM snapshots**: Do not add a new `toMatchSnapshot()` call on rendered DOM. Use `toMatchScreenshot()` for the look, and explicit matchers for behavior.

After an intended visual change, update the reference images with `npx vitest run -u`. Then look at each changed image before you commit it.
