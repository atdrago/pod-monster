import { render } from '@testing-library/react';
import { LinkStack } from './LinkStack';

// Basic tests to ensure the LinkStack component can be imported and used
describe('LinkStack', () => {
  it('should export LinkStack component', () => {
    const { container } = render(<LinkStack />);

    expect(container).toMatchSnapshot();
  });

  it('should render as a Link when href is provided', () => {
    const { container } = render(
      <LinkStack href="/test-link">
        <div>Link content</div>
      </LinkStack>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render with custom className', () => {
    const { container } = render(
      <LinkStack className="custom-class">
        <div>Custom styled content</div>
      </LinkStack>,
    );

    expect(container).toMatchSnapshot();
  });
});
