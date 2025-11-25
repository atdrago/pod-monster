import { render } from '@testing-library/react';

import { Details } from './Details';

describe('Details', () => {
  it('should render closed details', async () => {
    const { container } = render(
      <Details summary="Click to expand">Content goes here</Details>,
    );
    const element = container.querySelector('details');
    await expect(element).toMatchScreenshot('details-closed.png');
  });

  it('should render open details', async () => {
    const { container } = render(
      <Details open summary="Click to collapse">
        Content goes here
      </Details>,
    );
    const element = container.querySelector('details');
    await expect(element).toMatchScreenshot('details-open.png');
  });

  it('should render loading state when open', async () => {
    const { container } = render(
      <Details open isLoading={true} summary="Loading content">
        Content goes here
      </Details>,
    );
    const element = container.querySelector('details');
    await expect(element).toMatchScreenshot('details-loading.png');
  });

  it('should render error state', async () => {
    const { container } = render(
      <Details hasError={true} summary="Error loading content">
        Content goes here
      </Details>,
    );
    const element = container.querySelector('details');
    await expect(element).toMatchScreenshot('details-error.png');
  });

  it('should render with footer', async () => {
    const { container } = render(
      <Details open summary="Summary text" footer={<div>Footer content</div>}>
        Main content
      </Details>,
    );
    const element = container.querySelector('details');
    await expect(element).toMatchScreenshot('details-with-footer.png');
  });

  it('should render without children', async () => {
    const { container } = render(<Details summary="No content" />);
    const element = container.querySelector('details');
    await expect(element).toMatchScreenshot('details-no-children.png');
  });
});
