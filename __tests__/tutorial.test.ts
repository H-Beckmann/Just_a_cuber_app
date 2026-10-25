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

/**
 * The two last-layer steps tell the reader to hold a finished piece in a
 * given spot and repeat. These walk that instruction over every position the
 * last layer can be in, to make sure it always finishes — and to pin the
 * number of repetitions the text promises.
 */
describe('following the written procedure finishes the job', () => {
  const AUF = ['', 'U', 'U2', "U'"];

  function centreColour(state: Sticker[], normal: number[]): string | undefined {
    return state.find(
      candidate =>
        candidate.normal.join() === normal.join() &&
        candidate.pos.filter(value => Math.abs(value) === 1.5).length === 1 &&
        candidate.pos.every(value => Math.abs(value) === 1.5 || value === 0),
    )?.face;
  }

  /** Top-layer pieces whose colours match the centres around them. */
  function placed(state: Sticker[], spots: Record<string, string>): string[] {
    const pieces = new Map<string, { colours: string[]; centres: (string | undefined)[] }>();

    for (const sticker of state) {
      const key = sticker.pos
        .map((value, axis) => value - sticker.normal[axis] * 0.5)
        .join(',');
      if (!spots[key]) {
        continue;
      }
      const piece = pieces.get(key) ?? { colours: [], centres: [] };
      piece.colours.push(sticker.face);
      piece.centres.push(centreColour(state, sticker.normal));
      pieces.set(key, piece);
    }

    const ready: string[] = [];
    for (const [key, { colours, centres }] of pieces) {
      if ([...colours].sort().join() === [...centres].sort().join()) {
        ready.push(spots[key]);
      }
    }
    return ready;
  }

  /** Every position the last layer can reach through this algorithm. */
  function reachable(moves: string): Sticker[][] {
    const seen = new Map<string, Sticker[]>();
    const key = (state: Sticker[]) =>
      state.map(s => `${s.pos.join()}|${s.normal.join()}|${s.face}`).join(';');

    const queue = [solved];
    seen.set(key(solved), solved);

    while (queue.length > 0) {
      const state = queue.shift() as Sticker[];
      for (const auf of AUF) {
        const next = applyMoves(state, parseMoves(`${auf} ${moves}`), 3);
        if (!seen.has(key(next))) {
          seen.set(key(next), next);
          queue.push(next);
        }
      }
    }
    return [...seen.values()];
  }

  /**
   * Turn U looking for the spot the text describes, hold it in place and
   * apply; when no turn of U shows exactly one finished piece, apply once
   * anyway and look again. Returns how many times the algorithm ran.
   */
  function follow(
    start: Sticker[],
    moves: string,
    spots: Record<string, string>,
    hold: Record<string, string>,
  ): number | null {
    let state = start;

    for (let round = 0; round < 8; round++) {
      const views = AUF.map(auf => {
        const turned = applyMoves(state, parseMoves(auf), 3);
        return { turned, ready: placed(turned, spots) };
      });

      if (views.some(view => view.ready.length === 4)) {
        return round;
      }

      const single = views.find(view => view.ready.length === 1);
      if (single) {
        state = applyMoves(single.turned, parseMoves(hold[single.ready[0]]), 3);
      }
      state = applyMoves(state, parseMoves(moves), 3);
    }

    return null;
  }

  it('places the four corners, whatever the layer looks like', () => {
    const spots = { '1,1,1': 'FD', '-1,1,1': 'FE', '1,1,-1': 'TD', '-1,1,-1': 'TE' };
    const hold = { FD: '', TD: 'y', TE: 'y2', FE: "y'" };
    const moves = algorithm('posicionar-cantos');

    const runs = reachable(moves).map(state => follow(state, moves, spots, hold));
    expect(runs).not.toContain(null);
    // Which is why the text says "apply it again if it does not close".
    expect(Math.max(...(runs as number[]))).toBeLessThanOrEqual(3);
  });

  it('places the four edges, whatever the layer looks like', () => {
    const spots = { '0,1,1': 'F', '1,1,0': 'D', '0,1,-1': 'T', '-1,1,0': 'E' };
    const hold = { T: '', F: 'y2', D: "y'", E: 'y' };
    const moves = algorithm('posicionar-arestas');

    const runs = reachable(moves).map(state => follow(state, moves, spots, hold));
    expect(runs).not.toContain(null);
    expect(Math.max(...(runs as number[]))).toBeLessThanOrEqual(3);
  });
});
