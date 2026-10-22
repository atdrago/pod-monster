---
title: Vitest browser screenshots leak the color scheme, scale the image, and record animation frames
date: 2026-10-22
category: best-practices
module: Screenshot tests (vitest.config.mts, vitest.setup.ts, components/**/*.test.tsx)
problem_type: best_practice
component: testing_framework
severity: medium
applies_when:
  - 'A test calls `toMatchScreenshot` in the Vitest browser project'
  - A test renders a component in dark mode, or at a viewport other than the default
  - A component under a screenshot animates with framer-motion
  - 'Someone regenerates the reference images with `npx vitest run -u`'
  - A screenshot must show a box-shadow or text that overflows its element box
retire_when: 'A Vitest release runs each test file in its own Playwright page, or stops scaling the tester iframe into the headless window; check the Vitest browser-mode release notes, then run the leak probe in this doc again'
tags:
  [
    vitest,
    browser-mode,
    playwright,
    screenshots,
    dark-mode,
    framer-motion,
    flaky-tests,
  ]
---

# Vitest browser screenshots leak the color scheme, scale the image, and record animation frames

## Context

The Tailwind transition gave every component a screenshot suite in both color schemes (Vitest 4.0 browser mode, the Playwright provider, Chromium). Probes during that work found five behaviors of the harness that the tests and the config do not explain by themselves.

## Guidance

1. **Switch the color scheme with a browser command, and reset it before each file.** The `setColorScheme` command calls `page.emulateMedia({ colorScheme })` on the Playwright page (`vitest.config.mts:10-13`, registered at `vitest.config.mts:35`). The emulation reaches the tester iframe. It is page-level, and one page runs several test files in sequence. Thus a dark scheme that a file leaves behind, for example after a failed `afterAll`, changes the screenshots of the next file. `vitest.setup.ts:8-9` sets the light scheme in a global `beforeAll`. A probe proved the leak: with no reset, the next file (`Checkbox`) failed its screenshots. `AGENTS.md` ("Dark mode") states the `describe('dark')` convention.

2. **Do not add a global viewport reset.** `page.viewport(width, height)` from `vitest/browser` resizes only the iframe of the current test file. A probe left 1024px set in one file, and the next file still started at the default 414px. Reset the viewport in the `afterAll` of the file anyway, for the later tests in that file.

3. **Measure CSS sizes in the DOM, not in the image.** The orchestrator fits the tester iframe into the 1280x720 headless window, so each image is scaled by 720 / viewport height. At the default 414x896 viewport the factor is about 0.804, so a 414px element is about 333px wide in the image. At 1024x768 the factor is 0.9375. Assert a width with `getBoundingClientRect()`.

4. **Skip framer-motion animations in a screenshot block.** A screenshot taken before the end of a spring or height animation differs by 1 to 2px from run to run. Set `MotionGlobalConfig.skipAnimations = true` in a `beforeAll` and reset it in the `afterAll` (`components/organisms/MediaPlayer/MediaPlayer.test.tsx:290-294`, `components/molecules/SizeField/SizeField.test.tsx:26-30`).

5. **Review every image that `-u` writes.** `npx vitest run -u` rewrites each reference image that differs at all, also when the difference is inside the `allowedMismatchedPixels: 10` allowance (`vitest.config.mts:44`). A regeneration can therefore commit noise in images that the change does not touch. Restore such an image from `git show HEAD:<path>` before the commit.

6. **Wrap a shadow in a padded element.** An element screenshot crops at the border box of the element. An outer `box-shadow` is cut off, so the shadow cases screenshot a padded wrapper (`components/atoms/Artwork.test.tsx:64-66`). Text that a `text-box` trim lets overflow its box is cut off the same way.

## Why This Matters

Cases 1, 4, and 5 make a suite flaky or let a wrong image become the reference. Cases 2 and 3 cost time when an implementer adds a reset that is not needed, or compares image pixels with CSS pixels.

## When to Apply

- When you write a new screenshot suite, or add a `dark` or `wide` block.
- When a screenshot changes by one or two pixels from run to run.
- Before you commit images that `-u` wrote.

## Examples

The leak probe for case 1. File A runs first:

```tsx
it('should switch to dark and not reset it', async () => {
  await commands.setColorScheme('dark');
});
```

Without the reset in `vitest.setup.ts`, the light screenshots of the next file fail. With the reset, they pass.
