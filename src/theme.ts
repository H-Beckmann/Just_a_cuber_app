import type { Face } from './lib/cube';

export const colors = {
  background: '#0E0E11',
  surface: '#17171C',
  surfaceAlt: '#202027',
  border: '#2A2A33',
  text: '#F4F4F6',
  muted: '#8B8B96',
  accent: '#4C8DFF',
  ready: '#33D17A',
  warning: '#FFB020',
  danger: '#FF5A5A',
};

/** Sticker colours, in the usual western colour scheme. */
export const faceColors: Record<Face, string> = {
  U: '#F2F3F5',
  D: '#FFD500',
  F: '#00A651',
  B: '#0B5CD5',
  R: '#EE2B2B',
  L: '#FF8A1E',
};

/** Colour of the plastic seen inside the cube while a layer is turning. */
export const cubeBody = '#101014';
