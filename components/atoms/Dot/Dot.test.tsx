import { render } from '@testing-library/react';

import { Dot } from './Dot';

describe('Dot', () => {
  it('should render blue dot', async () => {
    const { container } = render(<Dot color="blue" />);
    const element = container.querySelector('span');
    await expect(element).toMatchScreenshot('dot-blue.png');
  });

  it('should render green dot', async () => {
    const { container } = render(<Dot color="green" />);
    const element = container.querySelector('span');
    await expect(element).toMatchScreenshot('dot-green.png');
  });

  it('should render pink dot', async () => {
    const { container } = render(<Dot color="pink" />);
    const element = container.querySelector('span');
    await expect(element).toMatchScreenshot('dot-pink.png');
  });

  it('should render red dot', async () => {
    const { container } = render(<Dot color="red" />);
    const element = container.querySelector('span');
    await expect(element).toMatchScreenshot('dot-red.png');
  });

  it('should render yellow dot', async () => {
    const { container } = render(<Dot color="yellow" />);
    const element = container.querySelector('span');
    await expect(element).toMatchScreenshot('dot-yellow.png');
  });

  it('should render transparent dot', async () => {
    const { container } = render(<Dot color="transparent" />);
    const element = container.querySelector('span');
    await expect(element).toMatchScreenshot('dot-transparent.png');
  });

  it('should render dot with label', async () => {
    const { container } = render(<Dot color="blue" label="Status indicator" />);
    const element = container.querySelector('span');
    await expect(element).toMatchScreenshot('dot-with-label.png');
  });
});
