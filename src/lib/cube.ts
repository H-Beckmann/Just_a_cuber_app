/**
 * Geometric model of an NxNxN cube.
 *
 * Instead of facelet tables, every sticker carries its own 3D position and
 * outward normal. A move is a real rotation of the stickers inside a layer, so
 * the state used by the solver logic and the state drawn on screen are the same
 * thing — the animation can never drift away from the logical state.
 *
 * World units: a cubie has edge 1, the cube is centred at the origin, +X is
 * right (R), +Y is up (U) and +Z is towards the viewer (F).
 */

import type { Vec3 } from './matrix';

export type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

export const FACES: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

export const FACE_NORMALS: Record<Face, Vec3> = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  R: [1, 0, 0],
  L: [-1, 0, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
};

/** Axis each face turns around: 0 = X, 1 = Y, 2 = Z. */
const FACE_AXIS: Record<Face, 0 | 1 | 2> = {
  R: 0,
  L: 0,
  U: 1,
  D: 1,
  F: 2,
  B: 2,
};

/** Whether the face sits on the positive side of its axis. */
const FACE_POSITIVE: Record<Face, boolean> = {
  R: true,
  L: false,
  U: true,
  D: false,
  F: true,
  B: false,
};

export interface Sticker {
  id: number;
  /** The face it belongs to when solved — i.e. its colour. */
  face: Face;
  /** Centre of the sticker, on the surface of the cube. */
  pos: Vec3;
  /** Outward normal of the sticker. */
  normal: Vec3;
}

/** `amount` is 1 = clockwise, 2 = half turn, 3 = counter-clockwise. */
export interface Move {
  face: Face;
  amount: 1 | 2 | 3;
  /** Number of layers turned: 1 = outer face, 2 = wide move (Rw). */
  wide: number;
}

export interface MoveSpec {
  axis: 0 | 1 | 2;
  /** Layer indices (0 = negative side of the axis) that turn. */
  layers: Set<number>;
  /** Signed number of 90° steps around the positive axis. */
  quarters: number;
  /** Total rotation in radians, for the animation. */
  angle: number;
  /** Coordinate of the plane where the turning layer is cut off. */
  cutCoord: number;
  /** +1 when the turning layers sit on the positive side of the axis. */
  cutSide: 1 | -1;
}

export function solvedCube(n = 3): Sticker[] {
  const half = n / 2;
  const grid: number[] = [];
  for (let i = 0; i < n; i++) {
    grid.push(i - (n - 1) / 2);
  }

  const stickers: Sticker[] = [];
  let id = 0;

  for (const face of FACES) {
    const normal = FACE_NORMALS[face];
    const axis = normal[0] !== 0 ? 0 : normal[1] !== 0 ? 1 : 2;
    const free = [0, 1, 2].filter(a => a !== axis);

    for (const a of grid) {
      for (const b of grid) {
        const pos: Vec3 = [0, 0, 0];
        pos[axis] = normal[axis] * half;
        pos[free[0]] = a;
        pos[free[1]] = b;
        stickers.push({ id: id++, face, pos, normal: [...normal] as Vec3 });
      }
    }
  }

  return stickers;
}

/** Exact 90° rotation of a vector around a world axis. `dir` is +1 or -1. */
export function rotate90(axis: 0 | 1 | 2, dir: 1 | -1, v: Vec3): Vec3 {
  const [x, y, z] = v;
  if (axis === 0) {
    return dir === -1 ? [x, z, -y] : [x, -z, y];
  }
  if (axis === 1) {
    return dir === -1 ? [-z, y, x] : [z, y, -x];
  }
  return dir === -1 ? [y, -x, z] : [-y, x, z];
}

export function moveSpec(move: Move, n = 3): MoveSpec {
  const axis = FACE_AXIS[move.face];
  const positive = FACE_POSITIVE[move.face];
  const wide = Math.max(1, Math.min(move.wide, n));

  const layers = new Set<number>();
  for (let i = 0; i < wide; i++) {
    layers.add(positive ? n - 1 - i : i);
  }

  // A clockwise turn seen from outside the face is a negative rotation around
  // the positive axis, and a positive one for faces on the negative side.
  const clockwise = positive ? -1 : 1;
  const steps = move.amount === 3 ? -1 : move.amount === 2 ? 2 : 1;
  const quarters = clockwise * steps;

  return {
    axis,
    layers,
    quarters,
    angle: (quarters * Math.PI) / 2,
    cutCoord: positive ? n / 2 - wide : -n / 2 + wide,
    cutSide: positive ? 1 : -1,
  };
}

/** Index of the layer a sticker belongs to along `axis` (0 = negative side). */
export function stickerLayer(sticker: Sticker, axis: 0 | 1 | 2, n = 3): number {
  const cubieCentre = sticker.pos[axis] - sticker.normal[axis] * 0.5;
  return Math.round(cubieCentre + (n - 1) / 2);
}

export function stickersInMove(stickers: Sticker[], spec: MoveSpec, n = 3): Set<number> {
  const ids = new Set<number>();
  for (const sticker of stickers) {
    if (spec.layers.has(stickerLayer(sticker, spec.axis, n))) {
      ids.add(sticker.id);
    }
  }
  return ids;
}

export function applyMove(stickers: Sticker[], move: Move, n = 3): Sticker[] {
  const spec = moveSpec(move, n);
  const dir: 1 | -1 = spec.quarters < 0 ? -1 : 1;
  const steps = Math.abs(spec.quarters);

  return stickers.map(sticker => {
    if (!spec.layers.has(stickerLayer(sticker, spec.axis, n))) {
      return sticker;
    }
    let pos = sticker.pos;
    let normal = sticker.normal;
    for (let i = 0; i < steps; i++) {
      pos = rotate90(spec.axis, dir, pos);
      normal = rotate90(spec.axis, dir, normal);
    }
    return { ...sticker, pos, normal };
  });
}

export function applyMoves(stickers: Sticker[], moves: Move[], n = 3): Sticker[] {
  return moves.reduce((acc, move) => applyMove(acc, move, n), stickers);
}

export function isSolved(stickers: Sticker[]): boolean {
  return stickers.every(sticker => {
    const home = FACE_NORMALS[sticker.face];
    return (
      sticker.normal[0] === home[0] &&
      sticker.normal[1] === home[1] &&
      sticker.normal[2] === home[2]
    );
  });
}

/**
 * Reading order of each face in the standard facelet notation: for every face,
 * the direction of a row step and of a column step, as axis/sign pairs.
 */
const FACELET_READING: Record<Face, { row: [0 | 1 | 2, number]; col: [0 | 1 | 2, number] }> = {
  U: { row: [2, 1], col: [0, 1] }, // back to front, left to right
  R: { row: [1, -1], col: [2, -1] }, // top to bottom, front to back
  F: { row: [1, -1], col: [0, 1] }, // top to bottom, left to right
  D: { row: [2, -1], col: [0, 1] }, // front to back, left to right
  L: { row: [1, -1], col: [2, 1] }, // top to bottom, back to front
  B: { row: [1, -1], col: [0, -1] }, // top to bottom, right to left
};

/**
 * The 54 colours in the usual URFDLB order, the format solvers speak. Useful
 * to compare this model against an independent implementation.
 */
export function faceletString(stickers: Sticker[], n = 3): string {
  const half = n / 2;
  const offset = (n - 1) / 2;
  let out = '';

  for (const face of FACES) {
    const normal = FACE_NORMALS[face];
    const axis = normal[0] !== 0 ? 0 : normal[1] !== 0 ? 1 : 2;
    const { row, col } = FACELET_READING[face];

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const pos: Vec3 = [0, 0, 0];
        pos[axis] = normal[axis] * half;
        pos[row[0]] = (r - offset) * row[1];
        pos[col[0]] = (c - offset) * col[1];

        const sticker = stickers.find(
          candidate =>
            candidate.pos[0] === pos[0] &&
            candidate.pos[1] === pos[1] &&
            candidate.pos[2] === pos[2] &&
            candidate.normal[axis] === normal[axis],
        );
        out += sticker ? sticker.face : '?';
      }
    }
  }

  return out;
}

export function invertMove(move: Move): Move {
  return { ...move, amount: move.amount === 1 ? 3 : move.amount === 3 ? 1 : 2 };
}

export function invertMoves(moves: Move[]): Move[] {
  return [...moves].reverse().map(invertMove);
}

export function moveToString(move: Move): string {
  const base = move.wide > 1 ? `${move.face}w` : move.face;
  const suffix = move.amount === 2 ? '2' : move.amount === 3 ? "'" : '';
  return base + suffix;
}

export function movesToString(moves: Move[]): string {
  return moves.map(moveToString).join(' ');
}

const MOVE_PATTERN = /^([URFDLB])(w?)(2|'|’)?$/;

export function parseMove(token: string): Move | null {
  const match = MOVE_PATTERN.exec(token.trim());
  if (!match) {
    return null;
  }
  const [, face, wide, suffix] = match;
  return {
    face: face as Face,
    wide: wide ? 2 : 1,
    amount: suffix === '2' ? 2 : suffix ? 3 : 1,
  };
}

export function parseMoves(text: string): Move[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map(parseMove)
    .filter((move): move is Move => move !== null);
}
