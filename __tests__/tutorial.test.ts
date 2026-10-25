/**
 * @format
 *
 * The tutorial tells the reader which algorithm to use, how to hold the cube
 * and how many times to repeat. These tests check all three against the cube
 * engine: each procedure is walked over every position the last layer can be
 * in, so a wrong instruction cannot sit in the text unnoticed.
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
const AUF = ['', 'U', 'U2', "U'"];
const TURNS = ['', 'y', 'y2', "y'"];

function algorithm(stepId: string, index = 0): string {
  const step = TUTORIAL.find(candidate => candidate.id === stepId);
  if (!step?.algorithms?.[index]) {
    throw new Error(`O passo ${stepId} não tem algoritmo ${index}`);
  }
  return step.algorithms[index].moves;
}

function play(state: Sticker[], moves: string): Sticker[] {
  return applyMoves(state, parseMoves(moves), 3);
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
function order(moves: string): number | null {
  let state = solved;
  for (let count = 1; count <= 24; count++) {
    state = play(state, moves);
    if (isSolved(state)) {
      return count;
    }
  }
  return null;
}

/** Solved regardless of how the cube is being held. */
function uniform(state: Sticker[]): boolean {
  const byFace = new Map<string, string>();
  for (const sticker of state) {
    const key = sticker.normal.join(',');
    const seen = byFace.get(key);
    if (seen === undefined) {
      byFace.set(key, sticker.face);
    } else if (seen !== sticker.face) {
      return false;
    }
  }
  return true;
}

function signature(state: Sticker[]): string {
  return state
    .map(s => `${s.pos.join()}|${s.normal.join()}|${s.face}`)
    .join(';');
}

/** Every position reachable through these algorithms plus turns of U. */
function reachable(...algorithms: string[]): Sticker[][] {
  const seen = new Map<string, Sticker[]>([[signature(solved), solved]]);
  const queue = [solved];

  while (queue.length > 0) {
    const state = queue.shift() as Sticker[];
    for (const auf of AUF) {
      for (const moves of algorithms) {
        const next = play(play(state, auf), moves);
        if (!seen.has(signature(next))) {
          seen.set(signature(next), next);
          queue.push(next);
        }
      }
    }
  }
  return [...seen.values()];
}

function centreColour(state: Sticker[], normal: number[]): string | undefined {
  return state.find(
    candidate =>
      candidate.normal.join() === normal.join() &&
      candidate.pos.filter(value => Math.abs(value) === 1.5).length === 1 &&
      candidate.pos.every(value => Math.abs(value) === 1.5 || value === 0),
  )?.face;
}

function cubieKey(sticker: Sticker): string {
  return sticker.pos
    .map((value, axis) => value - sticker.normal[axis] * 0.5)
    .join(',');
}

const TOP_CORNERS = ['1,1,1', '-1,1,1', '1,1,-1', '-1,1,-1'];

/** Every top corner sitting between the centres of its own three colours. */
function cornersPlaced(state: Sticker[]): boolean {
  const pieces = new Map<
    string,
    { colours: string[]; centres: (string | undefined)[] }
  >();

  for (const sticker of state) {
    const key = cubieKey(sticker);
    if (!TOP_CORNERS.includes(key)) {
      continue;
    }
    const piece = pieces.get(key) ?? { colours: [], centres: [] };
    piece.colours.push(sticker.face);
    piece.centres.push(centreColour(state, sticker.normal));
    pieces.set(key, piece);
  }

  for (const { colours, centres } of pieces.values()) {
    if ([...colours].sort().join() !== [...centres].sort().join()) {
      return false;
    }
  }
  return true;
}

describe('every algorithm in the tutorial', () => {
  const all = TUTORIAL.flatMap(step =>
    (step.algorithms ?? []).map(
      entry => [step.id, entry.label, entry.moves] as const,
    ),
  );

  it('there is one in every step that needs it', () => {
    expect(all.length).toBeGreaterThanOrEqual(11);
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
    expect(isSolved(play(solved, moves))).toBe(false);
  });
});

describe('what each algorithm is allowed to disturb', () => {
  it.each([0, 1])(
    'the second layer algorithm %i spares the first layer',
    index => {
      expect(
        layersBelowUntouched(
          play(solved, algorithm('segunda-camada', index)),
          0,
        ),
      ).toBe(true);
    },
  );

  it.each([
    ['cruz-amarela', 0],
    ['face-amarela', 0],
    ['permutar-cantos', 0],
    ['permutar-meios', 0],
    ['permutar-meios', 1],
  ] as const)('%s (%i) spares both layers below', (step, index) => {
    expect(layersBelowUntouched(play(solved, algorithm(step, index)), 1)).toBe(
      true,
    );
  });

  it('the last two steps are three-cycles, so three goes undo them', () => {
    expect(order(algorithm('permutar-cantos'))).toBe(3);
    expect(order(algorithm('permutar-meios', 0))).toBe(3);
    expect(order(algorithm('permutar-meios', 1))).toBe(3);
  });

  it('the Sune comes back around after six goes', () => {
    expect(order(algorithm('face-amarela'))).toBe(6);
  });
});

/**
 * The three steps that tell the reader to hold a piece somewhere and repeat.
 * Each is walked over every position of the last layer.
 */
describe('following the written procedure finishes the job', () => {
  it('the Sune rule fills the yellow face', () => {
    const sune = algorithm('face-amarela');
    const top = [0, 1, 0];

    const topColour = (state: Sticker[]) => centreColour(state, top) as string;

    /** Corners already showing the last layer's colour on top. */
    const oriented = (state: Sticker[]) =>
      state.filter(
        sticker =>
          TOP_CORNERS.includes(cubieKey(sticker)) &&
          sticker.face === topColour(state) &&
          sticker.normal.join() === top.join(),
      ).length;

    /** Where that colour points on the front-left corner: the reference. */
    const reference = (state: Sticker[]) => {
      const sticker = state.find(
        candidate =>
          cubieKey(candidate) === '-1,1,1' &&
          candidate.face === topColour(state),
      );
      const normal = sticker?.normal.join();
      return normal === top.join()
        ? 'cima'
        : normal === '-1,0,0'
        ? 'esquerda'
        : normal === '0,0,1'
        ? 'frente'
        : 'outro';
    };

    const runs = reachable(sune).map(start => {
      let state = start;
      for (let round = 0; round < 6; round++) {
        const done = oriented(state);
        if (done === 4) {
          return round;
        }
        // The text: none up, point it left; two up, point it front; one up,
        // bring that corner here.
        const wanted = done === 0 ? 'esquerda' : done === 2 ? 'frente' : 'cima';
        for (const auf of AUF) {
          const turned = play(state, auf);
          if (reference(turned) === wanted) {
            state = turned;
            break;
          }
        }
        state = play(state, sune);
      }
      return null;
    });

    expect(runs).not.toContain(null);
    expect(Math.max(...(runs as number[]))).toBeLessThanOrEqual(3);
  });

  it('the corner step places the four corners, with the pair held at the front', () => {
    const moves = algorithm('permutar-cantos');
    const front = [0, 0, 1];

    /** The two top corners of that face showing the same colour. */
    const pairOnFront = (state: Sticker[]) => {
      const colours = state
        .filter(
          sticker =>
            sticker.normal.join() === front.join() &&
            sticker.pos[1] === 1 &&
            Math.abs(sticker.pos[0]) + Math.abs(sticker.pos[2]) > 1.5,
        )
        .map(sticker => sticker.face);
      return colours.length === 2 && colours[0] === colours[1];
    };

    const runs = reachable(moves).map(start => {
      let state = start;
      for (let round = 0; round < 6; round++) {
        // Done when a turn of U lines the corners up with the centres.
        if (AUF.some(auf => cornersPlaced(play(state, auf)))) {
          return round;
        }
        // The turn is searched for, not worked out, so a wrong guess about
        // which way y goes cannot creep into the test.
        for (const turn of TURNS) {
          const turned = play(state, turn);
          if (pairOnFront(turned)) {
            state = turned;
            break;
          }
        }
        state = play(state, moves);
      }
      return null;
    });

    expect(runs).not.toContain(null);
    expect(Math.max(...(runs as number[]))).toBeLessThanOrEqual(2);
  });

  it('the edge step solves the cube, with the finished face held at the back', () => {
    const clockwise = algorithm('permutar-meios', 0);
    const anticlockwise = algorithm('permutar-meios', 1);
    const back = [0, 0, -1];

    const backFaceDone = (state: Sticker[]) => {
      const centre = centreColour(state, back);
      return state
        .filter(sticker => sticker.normal.join() === back.join())
        .every(sticker => sticker.face === centre);
    };

    const runs = reachable(clockwise, anticlockwise).map(start => {
      let state = start;
      for (let round = 0; round < 6; round++) {
        if (uniform(state)) {
          return round;
        }
        for (const auf of AUF) {
          const aligned = play(state, auf);
          const turn = TURNS.find(candidate =>
            backFaceDone(play(aligned, candidate)),
          );
          if (turn !== undefined) {
            state = play(aligned, turn);
            break;
          }
        }
        // The reader picks the direction by looking at where the pieces go.
        const forwards = play(state, clockwise);
        state = uniform(forwards) ? forwards : play(state, anticlockwise);
      }
      return null;
    });

    expect(runs).not.toContain(null);
    expect(Math.max(...(runs as number[]))).toBeLessThanOrEqual(2);
  });
});
