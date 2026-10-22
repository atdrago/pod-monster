import { render, screen } from '@testing-library/react';
import { commands } from 'vitest/browser';

import { FileField } from './FileField';

describe('FileField', () => {
  describe('isLoading', () => {
    it('should render the idle state', async () => {
      const { container } = render(<FileField label="Import OPML" />);
      const element = container.querySelector('label');
      await expect(element).toMatchScreenshot('fileField-idle.png');
    });

    it('should render the loading state', async () => {
      const { container } = render(
        <FileField
          isLoading={true}
          label="Import OPML"
          loadingLabel="Importing..."
        />,
      );
      const element = container.querySelector('label');
      await expect(element).toMatchScreenshot('fileField-loading.png');
    });
  });

  describe('behavior', () => {
    it('should show the label when idle', () => {
      render(<FileField label="Import OPML" loadingLabel="Importing..." />);

      expect(screen.getByText('Import OPML')).toBeVisible();
      expect(screen.queryByText('Importing...')).toBeNull();
    });

    it('should show the loading label when loading', () => {
      render(
        <FileField
          isLoading={true}
          label="Import OPML"
          loadingLabel="Importing..."
        />,
      );

      expect(screen.getByText('Importing...')).toBeVisible();
      expect(screen.queryByText('Import OPML')).toBeNull();
    });

    it('should show the default loading label when no loading label is given', () => {
      render(<FileField isLoading={true} label="Import OPML" />);

      expect(screen.getByText('Loading...')).toBeVisible();
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render the idle state', async () => {
      const { container } = render(<FileField label="Import OPML" />);
      const element = container.querySelector('label');
      await expect(element).toMatchScreenshot('fileField-idle-dark.png');
    });

    it('should render the loading state', async () => {
      const { container } = render(
        <FileField
          isLoading={true}
          label="Import OPML"
          loadingLabel="Importing..."
        />,
      );
      const element = container.querySelector('label');
      await expect(element).toMatchScreenshot('fileField-loading-dark.png');
    });
  });
});
