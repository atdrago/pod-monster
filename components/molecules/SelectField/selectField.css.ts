import { style } from '@vanilla-extract/css';

export const labelClassName = style({
  display: 'block',
  fontWeight: 'bold',
  position: 'relative',
  textAlign: 'center',
});

export const selectClassName = style({
  appearance: 'none',
  background: 'none',
  border: 0,
  bottom: 0,
  color: 'transparent',
  left: 0,
  margin: 'auto',
  position: 'absolute',
  right: 0,
  textAlign: 'center',
  top: 0,
});
