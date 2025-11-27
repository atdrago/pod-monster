import { render } from '@testing-library/react';

import CogIcon from 'icons/cog.svg';

import { Icon } from './Icon';

describe('Icon', () => {
  describe('sizes', () => {
    it('should render xxsmall icon', async () => {
      const { container } = render(
        <Icon size="xxsmall">
          <CogIcon />
        </Icon>,
      );
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('icon-size-xxsmall.png');
    });

    it('should render xsmall icon', async () => {
      const { container } = render(
        <Icon size="xsmall">
          <CogIcon />
        </Icon>,
      );
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('icon-size-xsmall.png');
    });

    it('should render small icon', async () => {
      const { container } = render(
        <Icon size="small">
          <CogIcon />
        </Icon>,
      );
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('icon-size-small.png');
    });

    it('should render smallMedium icon', async () => {
      const { container } = render(
        <Icon size="smallMedium">
          <CogIcon />
        </Icon>,
      );
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('icon-size-smallMedium.png');
    });

    it('should render medium icon', async () => {
      const { container } = render(
        <Icon size="medium">
          <CogIcon />
        </Icon>,
      );
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('icon-size-medium.png');
    });

    it('should render large icon', async () => {
      const { container } = render(
        <Icon size="large">
          <CogIcon />
        </Icon>,
      );
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('icon-size-large.png');
    });
  });

  describe('orientations', () => {
    it('should render default orientation', async () => {
      const { container } = render(
        <Icon size="medium" orientation="default">
          <CogIcon />
        </Icon>,
      );
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('icon-orientation-default.png');
    });

    it('should render reverse orientation', async () => {
      const { container } = render(
        <Icon size="medium" orientation="reverse">
          <CogIcon />
        </Icon>,
      );
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('icon-orientation-reverse.png');
    });

    it('should render rotate90 orientation', async () => {
      const { container } = render(
        <Icon size="medium" orientation="rotate90">
          <CogIcon />
        </Icon>,
      );
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('icon-orientation-rotate90.png');
    });

    it('should render spinning orientation', async () => {
      const { container } = render(
        <Icon size="medium" orientation="spinning">
          <CogIcon />
        </Icon>,
      );
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('icon-orientation-spinning.png');
    });
  });

  describe('colors', () => {
    it('should render with foreground color', async () => {
      const { container } = render(
        <Icon size="medium" color="foreground">
          <CogIcon />
        </Icon>,
      );
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('icon-color-foreground.png');
    });

    it('should render with blue color', async () => {
      const { container } = render(
        <Icon size="medium" color="blue">
          <CogIcon />
        </Icon>,
      );
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('icon-color-blue.png');
    });

    it('should render with green color', async () => {
      const { container } = render(
        <Icon size="medium" color="green">
          <CogIcon />
        </Icon>,
      );
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('icon-color-green.png');
    });

    it('should render with red color', async () => {
      const { container } = render(
        <Icon size="medium" color="red">
          <CogIcon />
        </Icon>,
      );
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('icon-color-red.png');
    });
  });

  describe('polymorphic', () => {
    it('should render as custom element type', async () => {
      const { container } = render(
        <Icon as="div" size="medium">
          <CogIcon />
        </Icon>,
      );
      const element = container.querySelector('div');
      await expect(element).toMatchScreenshot('icon-as-div.png');
    });
  });

  describe('className', () => {
    it('should apply custom className', async () => {
      const { container } = render(
        <Icon size="medium" className="custom-class">
          <CogIcon />
        </Icon>,
      );
      const element = container.querySelector('span');
      await expect(element).toMatchScreenshot('icon-custom-className.png');
    });
  });
});
