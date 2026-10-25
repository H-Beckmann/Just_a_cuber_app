/**
 * @format
 *
 * The tutorial tells the reader what each algorithm does and does not touch.
 * These tests check those claims against the cube engine, so the text cannot
 * drift away from the truth.
 */

import {
  applyMoves,
  isSolved,
  movesToString,
  parseMoves,
  solvedCube,
  stickerLayer,
  type Sticker,
} from '../src/lib/cube';
import { TUTORIAL } from '../src/lib/tutorial';

const solved = solvedCube(3);

function algorithm(stepId: string, index = 0): string {
  const step = TUTORIAL.find(candidate => candidate.id === stepId);
  if (!step?.algorithms?.[index]) {
    throw new Error(`O passo ${stepId} não tem algoritmo ${index}`);
  }
  return step.algorithms[index].moves;
}

function after(text: string): Sticker[] {
  return applyMoves(solved, parseMoves(text), 3);
}

function inPlace(sticker: Sticker, index: number): boolean {
  const home = solved[index];
  return (
    sticker.pos.every((value, axis) => value === home.pos[axis]) &&
    sticker.normal.every((value, axis) => value === home.normal[axis])
  );
}

/** True when nothing below the given layer moved (0 = bottom, 2 = top). */
function layersBelowUntouched(
  state: Sticker[],
  highestUntouched: number,
): boolean {
  return state.every(
    (sticker, index) =>
      stickerLayer(sticker, 1, 3) > highestUntouched || inPlace(sticker, index),
  );
}

/** How many repetitions bring the cube back, or null within two dozen. */
function order(text: string): number | null {
  const moves = parseMoves(text);
  let state = solved;
  for (let count = 1; count <= 24; count++) {
    state = applyMoves(state, moves, 3);
    if (isSolved(state)) {
      return count;
    }
  }
  return null;
}

/** The cubie a sticker belongs to, as a key, so pieces can be compared. */
function cubieKey(sticker: Sticker): string {
  return sticker.pos
    .map((value, axis) => value - sticker.normal[axis] * 0.5)
    .join(',');
}

function topPiecesLeftAlone(state: Sticker[]): Set<string> {
  const moved = new Set<string>();
  const seen = new Set<string>();

  state.forEach((sticker, index) => {
    const key = cubieKey(solved[index]);
    if (stickerLayer(solved[index], 1, 3) !== 2) {
      return;
    }
    seen.add(key);
    if (!inPlace(sticker, index)) {
      moved.add(key);
    }
  });

  return new Set([...seen].filter(key => !moved.has(key)));
}

describe('every algorithm in the tutorial', () => {
  const all = TUTORIAL.flatMap(step =>
    (step.algorithms ?? []).map(
      entry => [step.id, entry.label, entry.moves] as const,
    ),
  );

  it('there is one in the steps that need it', () => {
    expect(all.length).toBeGreaterThanOrEqual(8);
  });

  it.each(all)(
    '%s — %s is written in valid notation',
    (_step, _label, moves) => {
      const parsed = parseMoves(moves);
      expect(parsed.length).toBeGreaterThan(0);
      // Nothing was silently dropped on the way in.
      expect(movesToString(parsed)).toBe(moves);
    },
  );

  it.each(all)('%s — %s actually changes the cube', (_step, _label, moves) => {
    expect(isSolved(after(moves))).toBe(false);
  });
});

describe('first layer', () => {
  it('the corner algorithm comes back around after six goes', () => {
    // That is what lets the text say "repeat until it drops in".
    expect(order(algorithm('cantos-brancos'))).toBe(6);
  });
});

describe('second layer', () => {
  it.each([0, 1])('algorithm %i leaves the first layer alone', index => {
    expect(
      layersBelowUntouched(after(algorithm('segunda-camada', index)), 0),
    ).toBe(true);
  });

  it('does disturb the middle layer, which is the point', () => {
    expect(layersBelowUntouched(after(algorithm('segunda-camada', 0)), 1)).toBe(
      false,
    );
  });
});

describe('last layer', () => {
  it('the yellow cross leaves the two layers below alone', () => {
    expect(layersBelowUntouched(after(algorithm('cruz-amarela')), 1)).toBe(
      true,
    );
  });

  it('positioning the corners is a three-cycle that spares the front-right one', () => {
    const moves = algorithm('posicionar-cantos');
    expect(layersBelowUntouched(after(moves), 1)).toBe(true);
    expect(order(moves)).toBe(3);

    // The text says to hold the finished corner at the front-right.
    expect(topPiecesLeftAlone(after(moves))).toContain('1,1,1');
  });

  it('positioning the edges is a three-cycle that spares the back one', () => {
    const moves = algorithm('posicionar-arestas');
    expect(layersBelowUntouched(after(moves), 1)).toBe(true);
    expect(order(moves)).toBe(3);

    // The text says to hold the finished edge at the back.
    expect(topPiecesLeftAlone(after(moves))).toContain('0,1,-1');
  });

  it('turning a corner comes back around after six goes', () => {
    // Which is why the cube looks wrecked halfway and recovers by the end.
    expect(order(algorithm('virar-cantos'))).toBe(6);
  });
});
