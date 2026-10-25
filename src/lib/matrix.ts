/**
 * Minimal 4x4 matrix / 3D vector helpers.
 *
 * Matrices are column-major `number[16]`, the same layout React Native expects
 * in `transform: [{matrix}]` (and the same as CSS `matrix3d`).
 * Index of row `r`, column `c` is `c * 4 + r`.
 */

export type Vec3 = [number, number, number];
export type Mat4 = number[];

export function identity(): Mat4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

/** Returns `a * b` (apply `b` first, then `a`). */
export function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Array<number>(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] =
        a[r] * b[c * 4] +
        a[4 + r] * b[c * 4 + 1] +
        a[8 + r] * b[c * 4 + 2] +
        a[12 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

export function rotationX(rad: number): Mat4 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
}

export function rotationY(rad: number): Mat4 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
}

export function rotationZ(rad: number): Mat4 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

/** Rotation around the world axis 0 = X, 1 = Y, 2 = Z. */
export function rotationAroundAxis(axis: 0 | 1 | 2, rad: number): Mat4 {
  return axis === 0
    ? rotationX(rad)
    : axis === 1
    ? rotationY(rad)
    : rotationZ(rad);
}

export function scaling(sx: number, sy: number, sz: number): Mat4 {
  return [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1];
}

/**
 * Perspective with the eye at distance `d` (pixels) on +Z, looking at the
 * origin. Points with z > 0 (closer to the eye) are magnified.
 */
export function perspective(d: number): Mat4 {
  const m = identity();
  m[11] = -1 / d;
  return m;
}

/** Transforms a point (w = 1), without the perspective divide. */
export function transformPoint(m: Mat4, v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12],
    m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13],
    m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14],
  ];
}

/** Transforms a direction (w = 0), i.e. ignores the translation column. */
export function transformDirection(m: Mat4, v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[4] * v[1] + m[8] * v[2],
    m[1] * v[0] + m[5] * v[1] + m[9] * v[2],
    m[2] * v[0] + m[6] * v[1] + m[10] * v[2],
  ];
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}
