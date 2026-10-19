/**
 * Scramble generation for the 3x3x3.
 *
 * The real generator is random-state, the same idea the WCA uses: pick a
 * position uniformly at random among all 43 quintillion of them and solve it
 * with a two-phase (Kociemba) solver, then invert the solution.
 *
 * The solver needs lookup tables. Building them takes around 25 seconds on a
 * phone — Hermes interprets, it does not compile, so the tight loops crawl —
 * while parsing them back from JSON takes about 45ms. So they are built once
 * on a machine with a JIT (scripts/build-solver-tables.js) and only loaded
 * here. Until that load finishes there is a random-move fallback.
 *
 * Difference from TNoodle (the official tool): the solutions here are capped at
 * 22 moves instead of 20 — asking the solver for shorter ones costs minutes —
 * and the randomness comes from `Math.random`, not from a cryptographic source.
 * The distribution of the states is still uniform, which is what makes a
 * scramble fair.
 */

import Cube from 'cubejs';

import { parseMoves, type Face, type Move } from './cube';
import solverTables from './solverTables';

export const FALLBACK_LENGTH = 20;

const SCRAMBLE_FACES: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

const OPPOSITE: Record<Face, Face> = {
  U: 'D',
  D: 'U',
  R: 'L',
  L: 'R',
  F: 'B',
  B: 'F',
};

export type Rng = () => number;

let solverReady = false;
let initPromise: Promise<boolean> | null = null;

export function isScramblerReady(): boolean {
  return solverReady;
}

/**
 * Loads the precomputed solver tables. Resolves to `false` if that fails, in
 * which case the random-move fallback stays in place.
 */
export function initScrambler(): Promise<boolean> {
  if (solverReady) {
    return Promise.resolve(true);
  }
  if (!initPromise) {
    initPromise = new Promise<boolean>(resolve => {
      // One turn of the event loop so the first frame is on screen before the
      // tables are parsed.
      setTimeout(() => {
        try {
          const tables = JSON.parse(solverTables) as {
            moveTables: Record<string, unknown>;
            pruningTables: Record<string, unknown>;
          };
          Cube.moveTables = tables.moveTables;
          Cube.pruningTables = tables.pruningTables;
          solverReady = true;
          resolve(true);
        } catch {
          resolve(false);
        }
      }, 0);
    });
  }
  return initPromise;
}

function pick<T>(items: T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length) % items.length];
}

/**
 * Fallback generator: random moves, dropping the two cases that waste a move —
 * the same face twice in a row, and the A B A pattern on a single axis.
 */
export function randomMoveScramble(length = FALLBACK_LENGTH, rng: Rng = Math.random): Move[] {
  const moves: Move[] = [];
  let previous: Face | null = null;
  let beforePrevious: Face | null = null;

  while (moves.length < length) {
    const candidates = SCRAMBLE_FACES.filter(face => {
      if (face === previous) {
        return false;
      }
      if (previous !== null && face === beforePrevious && OPPOSITE[face] === previous) {
        return false;
      }
      return true;
    });

    const face = pick(candidates, rng);
    const amount = pick<1 | 2 | 3>([1, 2, 3], rng);
    moves.push({ face, amount, wide: 1 });

    beforePrevious = previous;
    previous = face;
  }

  return moves;
}

/** `null` while the solver is not ready, or if it fails on this state. */
export function randomStateScramble(): Move[] | null {
  if (!solverReady) {
    return null;
  }
  try {
    const moves = parseMoves(Cube.scramble());
    return moves.length > 0 ? moves : null;
  } catch {
    return null;
  }
}

/** Random-state when available, random-move otherwise. */
export function generateScramble(): Move[] {
  return randomStateScramble() ?? randomMoveScramble();
}
