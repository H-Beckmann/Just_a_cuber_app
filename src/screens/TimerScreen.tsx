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
import { CubeIcon, RecenterIcon } from '../components/icons';
import {
  InspectionClock,
  RunningClock,
  inspectionPenaltyFor,
} from '../components/LiveClock';
import { useTabBarSpace } from '../components/TabBar';
import { movesToString, type Move } from '../lib/cube';
import {
  generateScramble,
  initScrambler,
  isScramblerReady,
} from '../lib/scramble';
import { formatSolve, type Penalty, type Solve } from '../lib/stats';
import { useSession } from '../state/session';
import { colors } from '../theme';

/** How long the start button has to be held before the timer is armed. */
const HOLD_MS = 350;

type Phase = 'idle' | 'inspecting' | 'holding' | 'ready' | 'running';

interface Props {
  /** Lets the root hide the tab bar while a solve is being timed. */
  onRunningChange: (running: boolean) => void;
}

export default function TimerScreen({ onRunningChange }: Props) {
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const { lastSolve, addSolve, inspection, setInspection } = useSession();

  const [scramble, setScramble] = useState<Move[]>([]);
  const [playToken, setPlayToken] = useState(0);
  const [scramblerReady, setScramblerReady] = useState(isScramblerReady);
  const [phase, setPhase] = useState<Phase>('idle');
  const [inspectionStartedAt, setInspectionStartedAt] = useState<number | null>(
    null,
  );
  const [solveStartedAt, setSolveStartedAt] = useState<number | null>(null);
  const [stageSize, setStageSize] = useState(0);

  const cubeRef = useRef<Cube3DHandle>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const penaltyRef = useRef<Penalty>('OK');

  const running = phase === 'running';
  const hasScramble = scramble.length > 0;

  useEffect(() => {
    onRunningChange(running);
  }, [running, onRunningChange]);

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

  // The tables are parsed after the first frame, so the cube stays solved
  // until the first scramble is ready.
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

  /** Clears the scramble and leaves the cube solved. */
  const resetScramble = useCallback(() => {
    setScramble([]);
    setPlayToken(token => token + 1);
  }, []);

  /** Undoes the dragging: back to the angle the cube starts at. */
  const resetOrientation = useCallback(() => {
    cubeRef.current?.resetCamera();
  }, []);

  const startSolve = useCallback(() => {
    cubeRef.current?.finishNow();
    penaltyRef.current =
      inspectionStartedAt !== null
        ? inspectionPenaltyFor(Date.now() - inspectionStartedAt)
        : 'OK';
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

  const handleStartPressIn = useCallback(() => {
    cubeRef.current?.finishNow();

    if (phase === 'idle' && inspection) {
      setInspectionStartedAt(Date.now());
      setPhase('inspecting');
      return;
    }

    setPhase('holding');
    holdTimerRef.current = setTimeout(() => setPhase('ready'), HOLD_MS);
  }, [inspection, phase]);

  const handleStartPressOut = useCallback(() => {
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
    phase === 'ready'
      ? colors.ready
      : phase === 'holding'
      ? colors.warning
      : colors.text;

  const startLabel =
    phase === 'ready'
      ? 'Solte!'
      : phase === 'holding'
      ? 'Segure…'
      : phase === 'inspecting'
      ? 'Segure'
      : inspection
      ? 'Inspeção'
      : 'Iniciar';

  const hint = running
    ? 'toque em qualquer lugar para parar'
    : phase === 'ready'
    ? 'solte para começar'
    : phase === 'holding'
    ? 'segure…'
    : phase === 'inspecting'
    ? 'segure o botão para preparar'
    : 'arraste o cubo para girar';

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 8) + 8,
            // Room for the floating navigation bar and, under it, the buttons
            // of the phone.
            paddingBottom: bottomSpace,
            paddingLeft: Math.max(insets.left, 16),
            paddingRight: Math.max(insets.right, 16),
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            JustACuber <Text style={styles.titleAccent}>3x3</Text>
          </Text>
          <View style={styles.headerRight}>
            <Text style={styles.switchLabel}>Inspeção</Text>
            <Switch
              value={inspection}
              onValueChange={setInspection}
              disabled={running}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.text}
            />
          </View>
        </View>

        <View style={styles.scrambleRow}>
          <Text
            style={[
              styles.scramble,
              (!scramblerReady || !hasScramble) && styles.scramblePending,
            ]}
            numberOfLines={3}
          >
            {running
              ? ' '
              : !scramblerReady
              ? 'preparando o gerador oficial…'
              : hasScramble
              ? movesToString(scramble)
              : 'toque em Embaralhar para gerar'}
          </Text>
        </View>

        <View style={styles.timeRow}>
          {running && solveStartedAt !== null ? (
            <RunningClock
              startedAt={solveStartedAt}
              style={[styles.time, { color: timeColor }]}
            />
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
            <View style={running ? styles.hidden : undefined}>
              <Cube3D
                ref={cubeRef}
                size={stageSize}
                moves={scramble}
                playToken={playToken}
              />
            </View>
          )}
        </View>

        <View style={styles.toolRow}>
          <Text style={styles.hint}>{hint}</Text>

          <View style={[styles.toolButtons, running && styles.hidden]}>
            <ToolButton
              onPress={resetOrientation}
              disabled={running}
              label="Voltar o cubo para o ângulo inicial"
            >
              <RecenterIcon size={19} color={colors.text} />
            </ToolButton>

            <ToolButton
              onPress={resetScramble}
              disabled={!hasScramble || running}
              label="Deixar o cubo resolvido e limpar o embaralhamento"
            >
              <CubeIcon
                size={17}
                color={hasScramble ? colors.text : colors.muted}
              />
            </ToolButton>
          </View>
        </View>

        <View style={[styles.buttonRow, running && styles.hidden]}>
          <Pressable
            onPress={newScramble}
            disabled={!scramblerReady || running}
            style={({ pressed }) => [
              styles.button,
              styles.secondaryButton,
              !scramblerReady && styles.buttonDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Embaralhar</Text>
          </Pressable>

          <Pressable
            onPressIn={handleStartPressIn}
            onPressOut={handleStartPressOut}
            style={({ pressed }) => [
              styles.button,
              styles.startButton,
              phase === 'holding' && styles.startButtonHolding,
              phase === 'ready' && styles.startButtonReady,
              pressed && phase === 'idle' && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.startButtonText,
                (phase === 'holding' || phase === 'ready') &&
                  styles.startButtonTextArmed,
              ]}
            >
              {startLabel}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* While the timer runs the whole screen stops it — including over the
          tab bar, which the root hides. */}
      {running && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPressIn={stopSolve}
          accessibilityLabel="Parar o cronômetro"
        />
      )}
    </View>
  );
}

function ToolButton({
  onPress,
  disabled,
  label,
  children,
}: {
  onPress: () => void;
  disabled?: boolean;
  /** Read out loud in place of the icon. */
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.roundButton,
        disabled && styles.roundButtonDisabled,
        pressed && styles.pressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

const monospace = Platform.select({ ios: 'Menlo', default: 'monospace' });

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
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
    gap: 8,
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
  roundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  roundButtonDisabled: {
    opacity: 0.5,
  },
  timeRow: {
    height: 62,
    justifyContent: 'center',
    alignItems: 'center',
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
  hidden: {
    opacity: 0,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  hint: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: colors.accent,
  },
  startButtonHolding: {
    backgroundColor: colors.warning,
  },
  startButtonReady: {
    backgroundColor: colors.ready,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  startButtonTextArmed: {
    color: colors.background,
  },
  pressed: {
    opacity: 0.7,
  },
});
