import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Cube3D, { type Cube3DHandle } from '../components/Cube3D';
import { InspectionClock, RunningClock, inspectionPenaltyFor } from '../components/LiveClock';
import { useTabBarSpace } from '../components/TabBar';
import { movesToString, type Move } from '../lib/cube';
import { generateScramble, initScrambler, isScramblerReady } from '../lib/scramble';
import { formatSolve, type Penalty, type Solve } from '../lib/stats';
import { useSession } from '../state/session';
import { colors } from '../theme';

/** How long the pad has to be held before the timer is armed. */
const HOLD_MS = 350;

type Phase = 'idle' | 'inspecting' | 'holding' | 'ready' | 'running';

export default function TimerScreen() {
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const { lastSolve, addSolve, inspection, setInspection } = useSession();

  const [scramble, setScramble] = useState<Move[]>([]);
  const [playToken, setPlayToken] = useState(0);
  const [scramblerReady, setScramblerReady] = useState(isScramblerReady);
  const [phase, setPhase] = useState<Phase>('idle');
  const [inspectionStartedAt, setInspectionStartedAt] = useState<number | null>(null);
  const [solveStartedAt, setSolveStartedAt] = useState<number | null>(null);
  const [stageSize, setStageSize] = useState(0);

  const cubeRef = useRef<Cube3DHandle>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreReleaseRef = useRef(false);
  const penaltyRef = useRef<Penalty>('OK');

  useEffect(
    () => () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    },
    [],
  );

  const newScramble = useCallback(() => {
    setScramble(generateScramble());
    setPlayToken(token => token + 1);
  }, []);

  // The solver tables block the JS thread for a few seconds, so they are built
  // after the first frame; the cube stays solved until the first scramble.
  useEffect(() => {
    let alive = true;
    initScrambler().then(() => {
      if (!alive) {
        return;
      }
      setScramblerReady(true);
      newScramble();
    });
    return () => {
      alive = false;
    };
  }, [newScramble]);

  const replayScramble = useCallback(() => {
    setPlayToken(token => token + 1);
  }, []);

  const startSolve = useCallback(() => {
    cubeRef.current?.finishNow();
    penaltyRef.current =
      inspectionStartedAt !== null ? inspectionPenaltyFor(Date.now() - inspectionStartedAt) : 'OK';
    setInspectionStartedAt(null);
    setSolveStartedAt(Date.now());
    setPhase('running');
  }, [inspectionStartedAt]);

  const stopSolve = useCallback(() => {
    const now = Date.now();
    const solve: Solve = {
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      ms: now - (solveStartedAt ?? now),
      penalty: penaltyRef.current,
      scramble: movesToString(scramble),
      date: now,
    };
    penaltyRef.current = 'OK';
    addSolve(solve);
    setSolveStartedAt(null);
    setPhase('idle');
    newScramble();
  }, [addSolve, newScramble, scramble, solveStartedAt]);

  const handlePressIn = useCallback(() => {
    if (phase === 'running') {
      ignoreReleaseRef.current = true;
      stopSolve();
      return;
    }

    cubeRef.current?.finishNow();

    if (phase === 'idle' && inspection) {
      ignoreReleaseRef.current = true;
      setInspectionStartedAt(Date.now());
      setPhase('inspecting');
      return;
    }

    setPhase('holding');
    holdTimerRef.current = setTimeout(() => setPhase('ready'), HOLD_MS);
  }, [inspection, phase, stopSolve]);

  const handlePressOut = useCallback(() => {
    if (ignoreReleaseRef.current) {
      ignoreReleaseRef.current = false;
      return;
    }
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (phase === 'ready') {
      startSolve();
      return;
    }
    if (phase === 'holding') {
      setPhase(inspectionStartedAt !== null ? 'inspecting' : 'idle');
    }
  }, [inspectionStartedAt, phase, startSolve]);

  const onStageLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    const next = Math.floor(Math.min(width, height));
    // Zero means the screen is hidden behind the other tab; keeping the last
    // good size stops the cube from being thrown away and rebuilt.
    if (next <= 0) {
      return;
    }
    setStageSize(previous => (Math.abs(previous - next) < 1 ? previous : next));
  }, []);

  const timeColor =
    phase === 'ready' ? colors.ready : phase === 'holding' ? colors.warning : colors.text;
  const cubeOpacity = phase === 'running' ? 0 : phase === 'idle' || phase === 'inspecting' ? 1 : 0.3;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 8) + 8,
          // Room for the floating navigation bar and, under it, the buttons of
          // the phone.
          paddingBottom: bottomSpace,
          paddingLeft: Math.max(insets.left, 16),
          paddingRight: Math.max(insets.right, 16),
        },
      ]}>
      <View style={styles.header}>
        <Text style={styles.title}>
          JustACuber <Text style={styles.titleAccent}>3x3</Text>
        </Text>
        <View style={styles.headerRight}>
          <Text style={styles.switchLabel}>Inspeção</Text>
          <Switch
            value={inspection}
            onValueChange={setInspection}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={colors.text}
          />
        </View>
      </View>

      <View style={styles.scrambleRow}>
        <Text style={[styles.scramble, !scramblerReady && styles.scramblePending]} numberOfLines={3}>
          {phase === 'running'
            ? ' '
            : scramblerReady
            ? movesToString(scramble)
            : 'preparando o gerador oficial…'}
        </Text>
        <Pressable
          onPress={replayScramble}
          hitSlop={10}
          disabled={scramble.length === 0}
          style={({ pressed }) => [styles.replay, pressed && styles.pressed]}>
          <Text style={styles.replayIcon}>↻</Text>
        </Pressable>
      </View>

      <Pressable style={styles.pad} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <View style={styles.timeRow}>
          {phase === 'running' && solveStartedAt !== null ? (
            <RunningClock startedAt={solveStartedAt} style={[styles.time, { color: timeColor }]} />
          ) : phase !== 'idle' && inspectionStartedAt !== null ? (
            <InspectionClock
              startedAt={inspectionStartedAt}
              style={[styles.time, { color: timeColor }]}
            />
          ) : (
            <Text style={[styles.time, { color: timeColor }]}>
              {lastSolve ? formatSolve(lastSolve) : '0.00'}
            </Text>
          )}
        </View>

        <View style={styles.stage} onLayout={onStageLayout}>
          {stageSize > 0 && (
            <View style={{ opacity: cubeOpacity }}>
              <Cube3D ref={cubeRef} size={stageSize} moves={scramble} playToken={playToken} />
            </View>
          )}
        </View>

        <Text style={styles.hint}>
          {phase === 'running'
            ? 'toque para parar'
            : phase === 'ready'
            ? 'solte para começar'
            : phase === 'holding'
            ? 'segure...'
            : phase === 'inspecting'
            ? 'segure para preparar'
            : inspection
            ? 'toque para iniciar a inspeção'
            : 'segure para preparar'}
        </Text>
      </Pressable>

      <Pressable
        onPress={newScramble}
        disabled={!scramblerReady}
        style={({ pressed }) => [
          styles.scrambleButton,
          !scramblerReady && styles.scrambleButtonDisabled,
          pressed && styles.pressed,
        ]}>
        <Text style={styles.scrambleButtonText}>Embaralhar</Text>
      </Pressable>
    </View>
  );
}

const monospace = Platform.select({ ios: 'Menlo', default: 'monospace' });

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  titleAccent: {
    color: colors.accent,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    color: colors.muted,
    fontSize: 13,
  },
  scrambleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
  },
  scramble: {
    flex: 1,
    color: colors.text,
    fontFamily: monospace,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.5,
  },
  scramblePending: {
    color: colors.muted,
    fontStyle: 'italic',
  },
  replay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  replayIcon: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 22,
  },
  pad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRow: {
    height: 62,
    justifyContent: 'center',
  },
  time: {
    fontSize: 46,
    fontWeight: '400',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  stage: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  scrambleButton: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  scrambleButtonDisabled: {
    backgroundColor: colors.surfaceAlt,
  },
  scrambleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.7,
  },
});
