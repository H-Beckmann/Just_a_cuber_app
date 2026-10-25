/**
 * @format
 */

import Cube from 'cubejs';

import {
  applyMove,
  applyMoves,
  faceletString,
  invertMoves,
  isSolved,
  moveSpec,
  movesToString,
  parseMoves,
  solvedCube,
  stickerLayer,
  type Move,
} from '../src/lib/cube';
import { randomMoveScramble } from '../src/lib/scramble';

const U: Move = { face: 'U', amount: 1, wide: 1 };
const R: Move = { face: 'R', amount: 1, wide: 1 };

describe('solved cube', () => {
  it('has 54 stickers, 9 per face', () => {
    const cube = solvedCube(3);
    expect(cube).toHaveLength(54);
    for (const face of ['U', 'R', 'F', 'D', 'L', 'B']) {
      expect(cube.filter(sticker => sticker.face === face)).toHaveLength(9);
    }
    expect(isSolved(cube)).toBe(true);
  });

  it('puts every sticker on the surface of the cube', () => {
    for (const sticker of solvedCube(3)) {
      const axis = sticker.normal.findIndex(value => value !== 0);
      expect(Math.abs(sticker.pos[axis])).toBe(1.5);
    }
  });
});

describe('moves', () => {
  it('turns the top layer the right way: the front goes to the left', () => {
    const cube = solvedCube(3);
    const frontTopLeft = cube.find(
      sticker =>
        sticker.face === 'F' &&
        sticker.pos[0] === -1 &&
        sticker.pos[1] === 1 &&
        sticker.pos[2] === 1.5,
    );
    expect(frontTopLeft).toBeDefined();

    const turned = applyMove(cube, U, 3);
    const moved = turned.find(sticker => sticker.id === frontTopLeft!.id)!;

    expect(moved.normal).toEqual([-1, 0, 0]); // now on the L face
    expect(moved.pos).toEqual([-1.5, 1, -1]);
    expect(moved.face).toBe('F'); // the colour travels with the sticker
  });

  it('only touches the stickers of the layer that turns', () => {
    const cube = solvedCube(3);
    const spec = moveSpec(R, 3);
    const touched = cube.filter(
      sticker => stickerLayer(sticker, spec.axis, 3) === 2,
    );
    expect(touched).toHaveLength(9 + 4 * 3); // the R face plus a strip on four faces

    const turned = applyMove(cube, R, 3);
    const changed = turned.filter((sticker, index) => sticker !== cube[index]);
    expect(changed).toHaveLength(touched.length);
  });

  it('comes back to solved after four quarter turns', () => {
    let cube = solvedCube(3);
    for (let i = 0; i < 4; i++) {
      cube = applyMove(cube, R, 3);
    }
    expect(isSolved(cube)).toBe(true);
  });

  it('comes back to solved after six sexy moves', () => {
    const sexy = parseMoves("R U R' U'");
    let cube = solvedCube(3);
    for (let i = 0; i < 6; i++) {
      cube = applyMoves(cube, sexy, 3);
    }
    expect(isSolved(cube)).toBe(true);
  });

  it('is undone by the inverse sequence', () => {
    const moves = parseMoves(
      "F2 L2 R2 B D2 L2 R2 B2 L2 U2 L2 F' R B' U L2 D B' R2 F'",
    );
    const scrambled = applyMoves(solvedCube(3), moves, 3);
    expect(isSolved(scrambled)).toBe(false);
    expect(isSolved(applyMoves(scrambled, invertMoves(moves), 3))).toBe(true);
  });

  it('keeps nine stickers of each colour', () => {
    const scrambled = applyMoves(
      solvedCube(3),
      parseMoves("R U2 F' D L B2 R' U"),
      3,
    );
    for (const face of ['U', 'R', 'F', 'D', 'L', 'B']) {
      expect(scrambled.filter(sticker => sticker.face === face)).toHaveLength(
        9,
      );
    }
  });

  it('treats a half turn as two quarter turns', () => {
    const half = applyMove(solvedCube(3), { face: 'F', amount: 2, wide: 1 }, 3);
    const twice = applyMoves(
      solvedCube(3),
      [
        { face: 'F', amount: 1, wide: 1 },
        { face: 'F', amount: 1, wide: 1 },
      ],
      3,
    );
    expect(half).toEqual(twice);
  });

  it('wide moves turn two layers', () => {
    const spec = moveSpec({ face: 'R', amount: 1, wide: 2 }, 3);
    expect([...spec.layers].sort()).toEqual([1, 2]);
  });
});

describe('facelets', () => {
  it('reads a solved cube in URFDLB order', () => {
    const solved = ['U', 'R', 'F', 'D', 'L', 'B']
      .map(face => face.repeat(9))
      .join('');
    expect(faceletString(solvedCube(3))).toBe(solved);
  });

  it('sends the top row of F to L after U', () => {
    expect(faceletString(applyMove(solvedCube(3), U, 3))).toBe(
      'UUUUUUUUU' +
        'BBBRRRRRR' +
        'RRRFFFFFF' +
        'DDDDDDDDD' +
        'FFFLLLLLL' +
        'LLLBBBBBB',
    );
  });

  it('agrees with an independent cube implementation', () => {
    for (let attempt = 0; attempt < 25; attempt++) {
      const moves = randomMoveScramble(15);
      const mine = faceletString(applyMoves(solvedCube(3), moves, 3));
      const reference = new Cube().move(movesToString(moves)).asString();
      expect(mine).toBe(reference);
    }
  });
});

describe('whole-cube rotations', () => {
  it('turns every layer at once', () => {
    const spec = moveSpec(parseMoves('x')[0], 3);
    expect([...spec.layers].sort()).toEqual([0, 1, 2]);
  });

  it('x2 brings the bottom face to the top', () => {
    const turned = applyMoves(solvedCube(3), parseMoves('x2'), 3);
    for (const sticker of turned.filter(s => s.face === 'D')) {
      expect(sticker.normal).toEqual([0, 1, 0]);
    }
  });

  it('leaves the cube solved: it only moves the point of view', () => {
    for (const rotation of ['x', "y'", 'z2', "x y' z"]) {
      expect(isSolved(applyMoves(solvedCube(3), parseMoves(rotation), 3))).toBe(
        false,
      );
    }
  });
});

describe('slice moves', () => {
  it('turns only the layer in the middle', () => {
    const spec = moveSpec(parseMoves('M')[0], 3);
    expect([...spec.layers]).toEqual([1]);
    // Cut open on both sides, unlike a face turn.
    expect(spec.cuts).toHaveLength(2);
  });

  it('M follows L: the top centre ends up at the front', () => {
    const turned = applyMoves(solvedCube(3), parseMoves('M'), 3);
    const centre = turned.find(
      sticker =>
        sticker.face === 'U' &&
        sticker.pos.filter(value => Math.abs(value) === 1.5).length === 1 &&
        sticker.pos.every(value => Math.abs(value) === 1.5 || value === 0),
    );
    expect(centre?.normal).toEqual([0, 0, 1]);
  });

  it('a face turn is cut open on one side only', () => {
    expect(moveSpec(parseMoves('R')[0], 3).cuts).toHaveLength(1);
    expect(moveSpec(parseMoves('L')[0], 3).cuts).toHaveLength(1);
  });
});

describe('notation', () => {
  it('round-trips through text', () => {
    const text = "R U2 F' Rw' B2 D";
    expect(movesToString(parseMoves(text))).toBe(text);
  });

  it('ignores tokens it does not understand', () => {
    expect(movesToString(parseMoves('R girar U'))).toBe('R U');
    expect(movesToString(parseMoves('R 2 U'))).toBe('R U');
  });

  it('round-trips slice moves', () => {
    expect(movesToString(parseMoves("M E' S2"))).toBe("M E' S2");
  });

  it('round-trips whole-cube rotations', () => {
    expect(movesToString(parseMoves("x y' z2"))).toBe("x y' z2");
  });
});
