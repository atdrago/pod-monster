import { render, screen } from '@testing-library/react';
import { commands } from 'vitest/browser';

import { Typography } from 'components/atoms/Typography';

import { LinkStack } from './LinkStack';

function TitleAndSubtitle() {
  return (
    <>
      <Typography as="h2" className="font-bold" size="headingSmaller">
        Example Show
      </Typography>
      <Typography as="p" size="paragraph">
        Example Author
      </Typography>
    </>
  );
}

describe('LinkStack', () => {
  it('should render a title and a subtitle', async () => {
    const { container } = render(
      <LinkStack space="small">
        <TitleAndSubtitle />
      </LinkStack>,
    );
    const element = container.firstElementChild;
    await expect(element).toMatchScreenshot('linkStack-default.png');
  });

  it('should render a title and a subtitle as a link', async () => {
    const { container } = render(
      <LinkStack href="/test-link" space="small">
        <TitleAndSubtitle />
      </LinkStack>,
    );
    const element = container.querySelector('a');
    await expect(element).toMatchScreenshot('linkStack-href.png');
  });

  describe('behavior', () => {
    it('should render a div with no underline when no href is given', () => {
      const { container } = render(<LinkStack />);

      expect(container.firstElementChild?.tagName).toBe('DIV');
      expect(container.firstElementChild).toHaveClass('no-underline');
      expect(screen.queryByRole('link')).toBeNull();
    });

    it('should render a link when href is provided', () => {
      render(
        <LinkStack href="/test-link">
          <div>Link content</div>
        </LinkStack>,
      );

      expect(screen.getByText('Link content').parentElement).toHaveAttribute(
        'href',
        '/test-link',
      );
      expect(screen.getByRole('link')).toHaveClass('no-underline');
    });

    it('should apply a custom className', () => {
      render(
        <LinkStack className="custom-class">
          <div>Custom styled content</div>
        </LinkStack>,
      );

      expect(
        screen.getByText('Custom styled content').parentElement,
      ).toHaveClass('no-underline', 'custom-class');
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render a title and a subtitle', async () => {
      const { container } = render(
        <LinkStack space="small">
          <TitleAndSubtitle />
        </LinkStack>,
      );
      const element = container.firstElementChild;
      await expect(element).toMatchScreenshot('linkStack-default-dark.png');
    });

    it('should render a title and a subtitle as a link', async () => {
      const { container } = render(
        <LinkStack href="/test-link" space="small">
          <TitleAndSubtitle />
        </LinkStack>,
      );
      const element = container.querySelector('a');
      await expect(element).toMatchScreenshot('linkStack-href-dark.png');
    });
  });
});
