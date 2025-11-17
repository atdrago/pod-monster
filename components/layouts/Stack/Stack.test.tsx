import { render } from '@testing-library/react';
import { Stack } from './Stack';

// Basic test to ensure the Stack component can be imported and used
describe('Stack', () => {
  it('should export Stack component', () => {
    const { container } = render(<Stack />);

    expect(container).toMatchSnapshot();
  });
});
