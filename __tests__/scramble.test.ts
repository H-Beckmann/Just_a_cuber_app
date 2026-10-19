/**
 * @format
 */

import Cube from 'cubejs';

import { applyMoves, isSolved, moveToString, solvedCube } from '../src/lib/cube';
import {
  FALLBACK_LENGTH,
  initScrambler,
  isScramblerReady,
  randomMoveScramble,
  randomStateScramble,
} from '../src/lib/scramble';

const OPPOSITE: Record<string, string> = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' };

describe('random-move fallback', () => {
  it('has the expected length', () => {
    expect(randomMoveScramble()).toHaveLength(FALLBACK_LENGTH);
    expect(randomMoveScramble(12)).toHaveLength(12);
  });

  it('never repeats a face and never writes A B A on one axis', () => {
    for (let attempt = 0; attempt < 200; attempt++) {
      const moves = randomMoveScramble();
      for (let i = 1; i < moves.length; i++) {
        expect(moves[i].face).not.toBe(moves[i - 1].face);
        if (i >= 2 && OPPOSITE[moves[i].face] === moves[i - 1].face) {
          expect(moves[i].face).not.toBe(moves[i - 2].face);
        }
      }
    }
  });

  it('is reproducible for a given random source', () => {
    const seeded = () => {
      let state = 42;
      return () => {
        state = (state * 1103515245 + 12345) % 2147483648;
        return state / 2147483648;
      };
    };
    expect(randomMoveScramble(20, seeded())).toEqual(randomMoveScramble(20, seeded()));
  });

  it('actually mixes the cube', () => {
    expect(isSolved(applyMoves(solvedCube(3), randomMoveScramble(), 3))).toBe(false);
  });
});

describe('random-state scrambles', () => {
  it('is unavailable until the solver is built', () => {
    expect(isScramblerReady()).toBe(false);
    expect(randomStateScramble()).toBeNull();
  });

  it('loads the precomputed tables instead of building them', async () => {
    const started = Date.now();
    await expect(initScrambler()).resolves.toBe(true);
    const elapsed = Date.now() - started;

    // Building these takes ~25s on a phone and ~1s here; parsing them is
    // milliseconds. A regression to initSolver() would blow way past this.
    expect(elapsed).toBeLessThan(5000);

    expect(Object.keys(Cube.pruningTables).sort()).toEqual([
      'sliceFlip',
      'sliceTwist',
      'sliceURFtoDLFParity',
      'sliceURtoDFParity',
    ]);
    for (const table of Object.values(Cube.pruningTables)) {
      expect((table as number[]).length).toBeGreaterThan(100000);
    }
  });

  it('produces valid, non-trivial scrambles once the solver is ready', async () => {
    await expect(initScrambler()).resolves.toBe(true);
    expect(isScramblerReady()).toBe(true);

    for (let attempt = 0; attempt < 3; attempt++) {
      const moves = randomStateScramble();
      expect(moves).not.toBeNull();
      expect(moves!.length).toBeGreaterThan(14);
      expect(moves!.length).toBeLessThanOrEqual(25);

      // Only outer-face moves, like the WCA notation for the 3x3.
      for (const move of moves!) {
        expect(move.wide).toBe(1);
        expect(moveToString(move)).toMatch(/^[URFDLB][2']?$/);
      }

      expect(isSolved(applyMoves(solvedCube(3), moves!, 3))).toBe(false);
    }
  }, 60000);
});
