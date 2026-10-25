/**
 * Projection of the cube onto the screen.
 *
 * Nested 3D transforms do not compose in React Native, so each sticker gets a
 * single matrix carrying the whole pipeline: model -> camera -> perspective.
 * Visibility is decided by back-face culling and the painting order by a
 * `zIndex` derived from the distance to the camera.
 *
 * The matrices are in the layout React Native expects in
 * `transform: [{matrix}]`, which is also CSS `matrix3d`.
 */

import type { MoveSpec, Sticker } from './cube';
import {
  cross,
  multiply,
  normalize,
  perspective,
  rotationX,
  rotationY,
  scaling,
  transformDirection,
  transformPoint,
  type Mat4,
  type Vec3,
} from './matrix';

export const CUBE_SIZE = 3;
/** Sticker size in cubie units; the rest is the gap between stickers. */
export const STICKER_SIZE = 0.88;
const CORNER_RADIUS = 0.1;
/** Where the camera sits by default: slightly above, slightly to the side. */
export const DEFAULT_CAMERA: CameraAngles = {
  yaw: (-34 * Math.PI) / 180,
  pitch: (26 * Math.PI) / 180,
};

/** Looking straight down would flip the cube, so the pitch stops short. */
export const MAX_PITCH = (85 * Math.PI) / 180;

export interface CameraAngles {
  /** Turn around the vertical axis, in radians. */
  yaw: number;
  /** Tilt, in radians: positive shows more of the top. */
  pitch: number;
}

export interface Layout {
  /** Pixels per cubie. */
  k: number;
  size: number;
  /** Camera rotation alone, used for depth and culling. */
  camera: Mat4;
  /** Camera, flip to screen axes and perspective. */
  vp: Mat4;
}

export function buildLayout(
  size: number,
  angles: CameraAngles = DEFAULT_CAMERA,
  n = CUBE_SIZE,
): Layout {
  // 1.85 leaves room for the corners of the cube and for the extra width a
  // layer takes while it is turning.
  const k = size / (n * 1.85);
  const camera = multiply(rotationX(angles.pitch), rotationY(angles.yaw));
  const vp = multiply(
    perspective(k * n * 7),
    multiply(scaling(k, -k, k), camera), // -k flips Y: the world is up, the screen is down
  );
  return { k, size, camera, vp };
}

export interface Quad {
  key: string;
  color: string;
  matrix: Mat4;
  sizePx: number;
  radius: number;
  zIndex: number;
}

/**
 * Builds the matrix of one square face. `restCentre` and `restNormal` describe
 * the quad at rest; `rotation` is the turn of the layer it belongs to, applied
 * to the whole local frame — rotating the normal alone would slide the stickers
 * around while keeping them upright, which is not how a layer turns.
 *
 * Returns `null` when the quad faces away from the camera.
 */
export function buildQuad(
  layout: Layout,
  key: string,
  color: string,
  restCentre: Vec3,
  restNormal: Vec3,
  worldSize: number,
  rotation: Mat4 | null = null,
): Quad | null {
  // Any basis perpendicular to the normal will do: the quad is a plain square.
  const up: Vec3 = Math.abs(restNormal[1]) > 0.9 ? [0, 0, 1] : [0, 1, 0];
  const restU = normalize(cross(up, restNormal));
  const restV = cross(restNormal, restU);

  const centre = rotation ? transformPoint(rotation, restCentre) : restCentre;
  const normal = rotation ? transformDirection(rotation, restNormal) : restNormal;
  const u = rotation ? transformDirection(rotation, restU) : restU;
  const v = rotation ? transformDirection(rotation, restV) : restV;

  if (transformDirection(layout.camera, normal)[2] <= 0.01) {
    return null;
  }

  const inv = 1 / layout.k; // the local coordinates of a View are in pixels

  const model: Mat4 = [
    u[0] * inv, u[1] * inv, u[2] * inv, 0,
    v[0] * inv, v[1] * inv, v[2] * inv, 0,
    normal[0] * inv, normal[1] * inv, normal[2] * inv, 0,
    centre[0], centre[1], centre[2], 1,
  ];

  const depth = transformPoint(layout.camera, centre)[2];

  return {
    key,
    color,
    matrix: multiply(layout.vp, model),
    sizePx: worldSize * layout.k,
    radius: CORNER_RADIUS * layout.k,
    zIndex: Math.round(depth * 100) + 1000,
  };
}

export function stickerQuad(
  layout: Layout,
  sticker: Sticker,
  color: string,
  rotation: Mat4 | null,
): Quad | null {
  return buildQuad(
    layout,
    `s${sticker.id}`,
    color,
    sticker.pos,
    sticker.normal,
    STICKER_SIZE,
    rotation,
  );
}

/**
 * The two faces exposed at the cut while a layer turns — without them the cube
 * looks hollow mid-move.
 */
export function cutQuads(
  layout: Layout,
  spec: MoveSpec,
  rotation: Mat4,
  color: string,
  n = CUBE_SIZE,
): Quad[] {
  const axisUnit: Vec3 = [0, 0, 0];
  axisUnit[spec.axis] = 1;

  // Face of the part that stays still, looking towards the layer that left.
  const staticNormal = axisUnit.map(value => value * spec.cutSide) as Vec3;
  const staticCentre: Vec3 = [0, 0, 0];
  staticCentre[spec.axis] = spec.cutCoord + 0.005 * spec.cutSide;

  // Face of the turning layer, looking back at the body of the cube.
  const layerNormal = axisUnit.map(value => -value * spec.cutSide) as Vec3;
  const layerCentre: Vec3 = [0, 0, 0];
  layerCentre[spec.axis] = spec.cutCoord - 0.005 * spec.cutSide;

  const quads: Quad[] = [];

  const still = buildQuad(layout, 'cut-static', color, staticCentre, staticNormal, n);
  if (still) {
    quads.push(still);
  }

  const turning = buildQuad(layout, 'cut-layer', color, layerCentre, layerNormal, n, rotation);
  if (turning) {
    quads.push(turning);
  }

  return quads;
}

/** Where the centre of a quad lands on screen, relative to the centre of the stage. */
export function quadScreenCentre(quad: Quad): { x: number; y: number } {
  const w = quad.matrix[15];
  return { x: quad.matrix[12] / w, y: quad.matrix[13] / w };
}
