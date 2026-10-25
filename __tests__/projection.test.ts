/**
 * @format
 */

import {
  moveSpec,
  solvedCube,
  stickersInMove,
  type Face,
} from '../src/lib/cube';
import { rotationAroundAxis } from '../src/lib/matrix';
import {
  buildLayout,
  cutQuads,
  quadScreenCentre,
  stickerQuad,
  DEFAULT_CAMERA,
  MAX_PITCH,
  type Quad,
} from '../src/lib/projection';

const SIZE = 300;
const layout = buildLayout(SIZE);
const cube = solvedCube(3);

function quadsFor(face?: Face): Quad[] {
  return cube
    .filter(sticker => (face ? sticker.face === face : true))
    .map(sticker => stickerQuad(layout, sticker, '#fff', null))
    .filter((quad): quad is Quad => quad !== null);
}

/** Centre of the only sticker in the middle of a face. */
function faceCentre(face: Face) {
  const centre = cube.find(
    sticker =>
      sticker.face === face &&
      sticker.pos.filter(value => Math.abs(value) === 1.5).length === 1 &&
      sticker.pos.every(value => Math.abs(value) === 1.5 || value === 0),
  )!;
  return quadScreenCentre(stickerQuad(layout, centre, '#fff', null)!);
}

describe('camera', () => {
  it('shows exactly three faces of a solved cube', () => {
    const visible = quadsFor();
    expect(visible).toHaveLength(27);

    const faces = new Set(
      visible.map(quad => cube[Number(quad.key.slice(1))].face),
    );
    expect([...faces].sort()).toEqual(['F', 'R', 'U']);
  });

  it('puts U above F, and R to the right of F', () => {
    const u = faceCentre('U');
    const f = faceCentre('F');
    const r = faceCentre('R');

    expect(u.y).toBeLessThan(f.y); // the screen Y axis points down
    expect(r.x).toBeGreaterThan(f.x);
    expect(Math.abs(f.x)).toBeLessThan(SIZE / 2);
  });

  it('shows the other three faces when dragged around', () => {
    const turned = buildLayout(SIZE, {
      yaw: DEFAULT_CAMERA.yaw + Math.PI,
      pitch: -DEFAULT_CAMERA.pitch,
    });
    const visible = cube.filter(
      sticker => stickerQuad(turned, sticker, '#fff', null) !== null,
    );
    expect(visible).toHaveLength(27);
    expect([...new Set(visible.map(sticker => sticker.face))].sort()).toEqual([
      'B',
      'D',
      'L',
    ]);
  });

  it('never loses the cube, whatever angle it is dragged to', () => {
    for (const yaw of [0, 1, 2, 3, 4, 5, 6]) {
      for (const pitch of [-MAX_PITCH, -0.6, 0, 0.6, MAX_PITCH]) {
        const dragged = buildLayout(SIZE, { yaw, pitch });
        const quads = cube
          .map(sticker => stickerQuad(dragged, sticker, '#fff', null))
          .filter((quad): quad is Quad => quad !== null);

        // Three faces from a corner, two from an edge, one from straight on.
        expect(quads.length).toBeGreaterThanOrEqual(9);
        expect(quads.length).toBeLessThanOrEqual(27);
        for (const quad of quads) {
          const { x, y } = quadScreenCentre(quad);
          expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
          expect(Math.abs(x) + quad.sizePx / 2).toBeLessThan(SIZE / 2);
          expect(Math.abs(y) + quad.sizePx / 2).toBeLessThan(SIZE / 2);
        }
      }
    }
  });

  it('keeps the whole cube inside the stage', () => {
    for (const quad of quadsFor()) {
      const { x, y } = quadScreenCentre(quad);
      expect(Math.abs(x) + quad.sizePx / 2).toBeLessThan(SIZE / 2);
      expect(Math.abs(y) + quad.sizePx / 2).toBeLessThan(SIZE / 2);
    }
  });

  it('draws nearer stickers on top', () => {
    const f = stickerQuad(
      layout,
      cube.find(s => s.face === 'F')!,
      '#fff',
      null,
    )!;
    const b = cube.find(s => s.face === 'B')!;
    expect(stickerQuad(layout, b, '#fff', null)).toBeNull(); // culled
    expect(f.zIndex).toBeGreaterThan(1000); // in front of the centre of the cube
  });
});

describe('turning a layer', () => {
  const spec = moveSpec({ face: 'R', amount: 1, wide: 1 }, 3);
  const halfway = rotationAroundAxis(spec.axis, spec.angle / 2);
  const moving = stickersInMove(cube, spec, 3);

  it('sweeps the stickers of the layer across the screen', () => {
    const front = cube.find(
      sticker => sticker.face === 'F' && moving.has(sticker.id),
    )!;
    const before = quadScreenCentre(stickerQuad(layout, front, '#fff', null)!);
    const after = quadScreenCentre(
      stickerQuad(layout, front, '#fff', halfway)!,
    );
    expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeGreaterThan(
      5,
    );
  });

  it('leaves the other layers alone', () => {
    const leftColumn = cube.filter(
      sticker => sticker.face === 'F' && sticker.pos[0] === -1,
    );
    expect(leftColumn).toHaveLength(3);
    for (const sticker of leftColumn) {
      expect(moving.has(sticker.id)).toBe(false);
    }
  });

  it('hides a sticker once it has tilted away from the camera', () => {
    const top = cube.find(
      sticker => sticker.face === 'U' && moving.has(sticker.id),
    )!;
    expect(stickerQuad(layout, top, '#fff', halfway)).toBeNull();
  });

  it('closes the cut with exactly one face', () => {
    const quads = cutQuads(layout, spec, halfway, '#000');
    expect(quads).toHaveLength(1);
    expect(quads[0].sizePx).toBeCloseTo(3 * layout.k);
  });
});
