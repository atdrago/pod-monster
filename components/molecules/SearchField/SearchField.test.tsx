import { render, screen } from '@testing-library/react';
import { commands } from 'vitest/browser';

import { SearchField } from './SearchField';

function noop() {}

describe('SearchField', () => {
  describe('value', () => {
    it('should hide the clear button when the field is empty', async () => {
      const { container } = render(
        <SearchField
          aria-label="Search"
          onChange={noop}
          placeholder="Search by term"
          type="search"
          value=""
        />,
      );
      const element = container.querySelector('form');

      expect(screen.getByLabelText('Clear search field')).not.toBeVisible();
      await expect(element).toMatchScreenshot('searchField-empty.png');
    });

    it('should show the clear button when the field has a value', async () => {
      const { container } = render(
        <SearchField
          aria-label="Search"
          onChange={noop}
          placeholder="Search by term"
          type="search"
          value="Example"
        />,
      );
      const element = container.querySelector('form');

      expect(screen.getByLabelText('Clear search field')).toBeVisible();
      await expect(element).toMatchScreenshot('searchField-value.png');
    });
  });

  describe('feedback', () => {
    it('should render the feedback text next to the label', async () => {
      const { container } = render(
        <SearchField
          feedback="3 results"
          label="Search"
          onChange={noop}
          placeholder="Search by term"
          type="search"
          value="Example"
        />,
      );
      const element = container.querySelector('form');

      expect(screen.getByText('3 results')).toBeVisible();
      await expect(element).toMatchScreenshot('searchField-feedback.png');
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should hide the clear button when the field is empty', async () => {
      const { container } = render(
        <SearchField
          aria-label="Search"
          onChange={noop}
          placeholder="Search by term"
          type="search"
          value=""
        />,
      );
      const element = container.querySelector('form');
      await expect(element).toMatchScreenshot('searchField-empty-dark.png');
    });

    it('should show the clear button when the field has a value', async () => {
      const { container } = render(
        <SearchField
          aria-label="Search"
          onChange={noop}
          placeholder="Search by term"
          type="search"
          value="Example"
        />,
      );
      const element = container.querySelector('form');
      await expect(element).toMatchScreenshot('searchField-value-dark.png');
    });

    it('should render the feedback text next to the label', async () => {
      const { container } = render(
        <SearchField
          feedback="3 results"
          label="Search"
          onChange={noop}
          placeholder="Search by term"
          type="search"
          value="Example"
        />,
      );
      const element = container.querySelector('form');
      await expect(element).toMatchScreenshot('searchField-feedback-dark.png');
    });
  });
});
