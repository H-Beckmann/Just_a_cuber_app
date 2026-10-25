/**
 * A 3D Rubik's cube drawn with plain Views.
 *
 * Every sticker is a square View sitting in the centre of the stage and pushed
 * into place by a full 4x4 matrix (see `lib/projection`). While a layer turns,
 * only the stickers of that layer are recomputed — the rest keep the matrices
 * they already had, so a frame costs a handful of updates instead of 54.
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';

import {
  applyMove,
  applyMoves,
  moveSpec,
  solvedCube,
  stickersInMove,
  type Move,
  type MoveSpec,
  type Sticker,
} from '../lib/cube';
import { rotationAroundAxis } from '../lib/matrix';
import {
  buildLayout,
  cutQuads,
  stickerQuad,
  CUBE_SIZE,
  DEFAULT_CAMERA,
  MAX_PITCH,
  type CameraAngles,
  type Quad,
} from '../lib/projection';
import { cubeBody, faceColors } from '../theme';

const QUARTER_TURN_MS = 135;
const HALF_TURN_MS = 190;
/** Radians of camera movement per pixel dragged. */
const DRAG_SENSITIVITY = 0.01;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function durationFor(move: Move, speed: number): number {
  const base = move.amount === 2 ? HALF_TURN_MS : QUARTER_TURN_MS;
  return Math.max(40, base / speed);
}

interface ActiveMove {
  move: Move;
  spec: MoveSpec;
  ids: Set<number>;
  progress: number;
}

export interface Cube3DHandle {
  /** Drops the animation and jumps straight to the scrambled state. */
  finishNow: () => void;
  /** Puts the camera back where it started. */
  resetCamera: () => void;
}

interface Props {
  size: number;
  /** Moves played from the solved state whenever `playToken` changes. */
  moves: Move[];
  playToken: number;
  speed?: number;
}

const EMPTY_IDS: Set<number> = new Set();

const Cube3D = forwardRef<Cube3DHandle, Props>(function CubeRenderer(
  { size, moves, playToken, speed = 1 },
  ref,
) {
  const [stickers, setStickers] = useState<Sticker[]>(() =>
    solvedCube(CUBE_SIZE),
  );
  const [active, setActive] = useState<ActiveMove | null>(null);

  const [camera, setCamera] = useState<CameraAngles>(DEFAULT_CAMERA);

  const cameraRef = useRef(camera);
  const dragStartRef = useRef(camera);
  const pendingCameraRef = useRef<CameraAngles | null>(null);
  const dragFrameRef = useRef<number | null>(null);

  const stickersRef = useRef(stickers);
  const queueRef = useRef<Move[]>([]);
  const indexRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  // Touch events arrive faster than the screen refreshes, and every one of
  // them would recompute all 27 matrices; this keeps it to one per frame.
  const moveCamera = useCallback((next: CameraAngles) => {
    pendingCameraRef.current = next;
    if (dragFrameRef.current !== null) {
      return;
    }
    dragFrameRef.current = requestAnimationFrame(() => {
      dragFrameRef.current = null;
      const pending = pendingCameraRef.current;
      if (pending) {
        cameraRef.current = pending;
        setCamera(pending);
      }
    });
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
        onPanResponderGrant: () => {
          dragStartRef.current = cameraRef.current;
        },
        onPanResponderMove: (_event, gesture) => {
          const start = dragStartRef.current;
          moveCamera({
            // Dragging takes the front face with it: to the side it turns, and
            // downwards it tips the top towards the viewer.
            yaw: start.yaw + gesture.dx * DRAG_SENSITIVITY,
            pitch: clamp(
              start.pitch + gesture.dy * DRAG_SENSITIVITY,
              -MAX_PITCH,
              MAX_PITCH,
            ),
          });
        },
      }),
    [moveCamera],
  );

  const cancelFrame = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const playNext = useCallback(() => {
    const queue = queueRef.current;
    const index = indexRef.current;

    if (index >= queue.length) {
      setActive(null);
      return;
    }

    const move = queue[index];
    const spec = moveSpec(move, CUBE_SIZE);
    startedAtRef.current = null;
    setActive({
      move,
      spec,
      ids: stickersInMove(stickersRef.current, spec, CUBE_SIZE),
      progress: 0,
    });

    const step = (now: number) => {
      if (startedAtRef.current === null) {
        startedAtRef.current = now;
      }
      const progress = Math.min(
        1,
        (now - startedAtRef.current) / durationFor(move, speed),
      );

      if (progress < 1) {
        setActive(previous =>
          previous ? { ...previous, progress } : previous,
        );
        frameRef.current = requestAnimationFrame(step);
        return;
      }

      const next = applyMove(stickersRef.current, move, CUBE_SIZE);
      stickersRef.current = next;
      indexRef.current = index + 1;
      setStickers(next);
      playNext();
    };

    frameRef.current = requestAnimationFrame(step);
  }, [speed]);

  const finishNow = useCallback(() => {
    cancelFrame();
    const remaining = queueRef.current.slice(indexRef.current);
    if (remaining.length > 0) {
      const next = applyMoves(stickersRef.current, remaining, CUBE_SIZE);
      stickersRef.current = next;
      indexRef.current = queueRef.current.length;
      setStickers(next);
    }
    setActive(null);
  }, [cancelFrame]);

  const resetCamera = useCallback(() => {
    cameraRef.current = DEFAULT_CAMERA;
    setCamera(DEFAULT_CAMERA);
  }, []);

  useImperativeHandle(ref, () => ({ finishNow, resetCamera }), [
    finishNow,
    resetCamera,
  ]);

  useEffect(
    () => () => {
      if (dragFrameRef.current !== null) {
        cancelAnimationFrame(dragFrameRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    cancelFrame();
    const solved = solvedCube(CUBE_SIZE);
    stickersRef.current = solved;
    queueRef.current = moves;
    indexRef.current = 0;
    setStickers(solved);
    setActive(null);
    if (moves.length > 0) {
      playNext();
    }
    return cancelFrame;
    // A new playToken means "replay from the start", even with the same moves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playToken, cancelFrame, playNext]);

  const layout = useMemo(() => buildLayout(size, camera), [size, camera]);
  const movingIds = active ? active.ids : EMPTY_IDS;

  // Recomputed when a move starts or ends, not on every frame.
  const staticQuads = useMemo(() => {
    const map = new Map<number, Quad>();
    for (const sticker of stickers) {
      if (movingIds.has(sticker.id)) {
        continue;
      }
      const quad = stickerQuad(layout, sticker, faceColors[sticker.face], null);
      if (quad) {
        map.set(sticker.id, quad);
      }
    }
    return map;
  }, [stickers, layout, movingIds]);

  const rotation = active
    ? rotationAroundAxis(
        active.spec.axis,
        active.spec.angle * easeInOut(active.progress),
      )
    : null;

  const quads: Quad[] = [];
  for (const sticker of stickers) {
    const quad = movingIds.has(sticker.id)
      ? stickerQuad(layout, sticker, faceColors[sticker.face], rotation)
      : staticQuads.get(sticker.id);
    if (quad) {
      quads.push(quad);
    }
  }

  if (active && rotation) {
    quads.push(...cutQuads(layout, active.spec, rotation, cubeBody));
  }

  return (
    <View
      {...panResponder.panHandlers}
      style={[styles.stage, { width: size, height: size }]}
    >
      {quads.map(quad => (
        <Facelet key={quad.key} quad={quad} stageSize={size} />
      ))}
    </View>
  );
});

const Facelet = React.memo(function FaceletQuad({
  quad,
  stageSize,
}: {
  quad: Quad;
  stageSize: number;
}) {
  const offset = (stageSize - quad.sizePx) / 2;
  return (
    <View
      style={[
        styles.facelet,
        {
          left: offset,
          top: offset,
          width: quad.sizePx,
          height: quad.sizePx,
          borderRadius: quad.radius,
          backgroundColor: quad.color,
          zIndex: quad.zIndex,
          transform: [{ matrix: quad.matrix }],
        },
      ]}
    />
  );
});

const styles = StyleSheet.create({
  stage: {
    position: 'relative',
  },
  facelet: {
    position: 'absolute',
  },
});

export default Cube3D;
