import { render, screen } from '@testing-library/react';
import { useState } from 'react';
import { commands, userEvent } from 'vitest/browser';

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

    it('should clear the value and hide the clear button on a click', async () => {
      const handleChange = vi.fn();

      function ControlledSearchField() {
        const [value, setValue] = useState('Example');

        return (
          <SearchField
            aria-label="Search"
            onChange={(event) => {
              handleChange(event.target.value);
              setValue(event.target.value);
            }}
            placeholder="Search by term"
            type="search"
            value={value}
          />
        );
      }

      render(<ControlledSearchField />);
      const clearButton = screen.getByLabelText('Clear search field');

      await userEvent.click(clearButton);

      expect(handleChange).toHaveBeenCalledExactlyOnceWith('');
      expect(screen.getByLabelText('Search')).toHaveValue('');
      expect(clearButton).not.toBeVisible();
    });
  });

  describe('input', () => {
    // iOS Safari zooms in on focus when the text of an input is below 16px.
    it('should render the text of the input at 16px', () => {
      render(
        <SearchField
          aria-label="Search"
          onChange={noop}
          placeholder="Search by term"
          type="search"
          value=""
        />,
      );

      expect(screen.getByLabelText('Search')).toHaveStyle({
        fontSize: '16px',
      });
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

  describe('className', () => {
    it('should apply a custom className to the root', () => {
      const { container } = render(
        <SearchField
          aria-label="Search"
          className="custom-class"
          onChange={noop}
          value=""
        />,
      );

      expect(container.querySelector('form')).toHaveClass('custom-class');
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
