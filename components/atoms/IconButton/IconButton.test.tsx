import { render } from '@testing-library/react';

import { Icon } from 'components/atoms/Icon';
import CogIcon from 'icons/cog.svg';

import { IconButton } from './IconButton';

describe('IconButton', () => {
  describe('sizes', () => {
    it('should render small icon button', async () => {
      const { container } = render(
        <IconButton label="Settings" size="small">
          <Icon size="small">
            <CogIcon />
          </Icon>
        </IconButton>,
      );
      const element = container.querySelector('button');
      await expect(element).toMatchScreenshot('iconButton-size-small.png');
    });

    it('should render medium icon button', async () => {
      const { container } = render(
        <IconButton label="Settings" size="medium">
          <Icon size="medium">
            <CogIcon />
          </Icon>
        </IconButton>,
      );
      const element = container.querySelector('button');
      await expect(element).toMatchScreenshot('iconButton-size-medium.png');
    });

    it('should render large icon button', async () => {
      const { container } = render(
        <IconButton label="Settings" size="large">
          <Icon size="large">
            <CogIcon />
          </Icon>
        </IconButton>,
      );
      const element = container.querySelector('button');
      await expect(element).toMatchScreenshot('iconButton-size-large.png');
    });
  });

  describe('background variants', () => {
    it('should render default background', async () => {
      const { container } = render(
        <IconButton label="Settings" background="default">
          <Icon size="small">
            <CogIcon />
          </Icon>
        </IconButton>,
      );
      const element = container.querySelector('button');
      await expect(element).toMatchScreenshot(
        'iconButton-background-default.png',
      );
    });

    it('should render circle background', async () => {
      const { container } = render(
        <IconButton label="Settings" background="circle">
          <Icon size="small">
            <CogIcon />
          </Icon>
        </IconButton>,
      );
      const element = container.querySelector('button');
      await expect(element).toMatchScreenshot(
        'iconButton-background-circle.png',
      );
    });
  });

  describe('polymorphic', () => {
    it('should render as anchor element', async () => {
      const { container } = render(
        <IconButton as="a" href="#test" label="Settings">
          <Icon size="small">
            <CogIcon />
          </Icon>
        </IconButton>,
      );
      const element = container.querySelector('a');
      await expect(element).toMatchScreenshot('iconButton-as-anchor.png');
    });
  });

  describe('className', () => {
    it('should apply custom className', async () => {
      const { container } = render(
        <IconButton label="Settings" className="custom-class">
          <Icon size="small">
            <CogIcon />
          </Icon>
        </IconButton>,
      );
      const element = container.querySelector('button');
      await expect(element).toMatchScreenshot(
        'iconButton-custom-className.png',
      );
    });
  });

  describe('combinations', () => {
    it('should render large circle icon button', async () => {
      const { container } = render(
        <IconButton label="Settings" size="large" background="circle">
          <Icon size="large">
            <CogIcon />
          </Icon>
        </IconButton>,
      );
      const element = container.querySelector('button');
      await expect(element).toMatchScreenshot('iconButton-large-circle.png');
    });

    it('should render medium circle icon button', async () => {
      const { container } = render(
        <IconButton label="Settings" size="medium" background="circle">
          <Icon size="medium">
            <CogIcon />
          </Icon>
        </IconButton>,
      );
      const element = container.querySelector('button');
      await expect(element).toMatchScreenshot('iconButton-medium-circle.png');
    });
  });
});
