import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Cube3D from '../components/Cube3D';
import { useTabBarSpace } from '../components/TabBar';
import { invertMoves, parseMoves, type Move } from '../lib/cube';
import {
  TUTORIAL,
  type TutorialAlgorithm,
  type TutorialStep,
} from '../lib/tutorial';
import { colors } from '../theme';

/** Yellow on top, white underneath — the way the text describes the cube. */
const YELLOW_UP = parseMoves('x2');
const DEMO_SIZE = 150;

interface Demo {
  label: string;
  setup: Move[];
  moves: Move[];
}

export default function TutorialScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();

  const [demo, setDemo] = useState<Demo | null>(null);
  const [playToken, setPlayToken] = useState(0);

  const play = useCallback((algorithm: TutorialAlgorithm) => {
    const moves = parseMoves(algorithm.moves);
    setDemo({
      label: algorithm.label,
      // Starting from the case the algorithm undoes: run it backwards first,
      // then play it forwards and watch it tidy up.
      setup: [...YELLOW_UP, ...invertMoves(moves)],
      moves,
    });
    setPlayToken(token => token + 1);
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 8) + 8,
          paddingLeft: Math.max(insets.left, 16),
          paddingRight: Math.max(insets.right, 16),
        },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Voltar ao menu"
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Text style={styles.backText}>Menu</Text>
        </Pressable>
        <Text style={styles.title}>Como resolver</Text>
      </View>

      <View style={styles.demo}>
        <Cube3D
          size={DEMO_SIZE}
          setup={demo?.setup ?? YELLOW_UP}
          moves={demo?.moves ?? []}
          playToken={playToken}
          speed={0.7}
        />
        <View style={styles.demoText}>
          {demo === null ? (
            <Text style={styles.demoHint}>
              Toque em um algoritmo para vê-lo no cubo. Ele começa na situação
              que o algoritmo resolve.
            </Text>
          ) : (
            <>
              <Text style={styles.demoLabel}>{demo.label}</Text>
              <Pressable
                onPress={() => setPlayToken(token => token + 1)}
                style={({ pressed }) => [
                  styles.again,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.againText}>Ver de novo</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.steps, { paddingBottom: bottomSpace }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          O método iniciante resolve o cubo em camadas: primeiro a branca
          inteira, depois o meio, depois a amarela. São poucos algoritmos e
          todos curtos.
        </Text>

        {TUTORIAL.map((step, index) => (
          <Step key={step.id} step={step} number={index + 1} onPlay={play} />
        ))}
      </ScrollView>
    </View>
  );
}

function Step({
  step,
  number,
  onPlay,
}: {
  step: TutorialStep;
  number: number;
  onPlay: (algorithm: TutorialAlgorithm) => void;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.stepHeader}>
        <View style={styles.number}>
          <Text style={styles.numberText}>{number}</Text>
        </View>
        <View style={styles.stepTitles}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepGoal}>{step.goal}</Text>
        </View>
      </View>

      {step.body.map((paragraph, index) => (
        <Text key={index} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}

      {step.warning !== undefined && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>{step.warning}</Text>
        </View>
      )}

      {step.algorithms?.map(algorithm => (
        <Pressable
          key={algorithm.label}
          onPress={() => onPlay(algorithm)}
          accessibilityRole="button"
          accessibilityLabel={`Ver ${algorithm.label} no cubo`}
          style={({ pressed }) => [styles.algorithm, pressed && styles.pressed]}
        >
          <View style={styles.algorithmBody}>
            <Text style={styles.algorithmLabel}>{algorithm.label}</Text>
            <Text style={styles.algorithmMoves}>{algorithm.moves}</Text>
            {algorithm.note !== undefined && (
              <Text style={styles.algorithmNote}>{algorithm.note}</Text>
            )}
          </View>
          <Text style={styles.algorithmPlay}>ver</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  back: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  backText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  demo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 10,
  },
  demoText: {
    flex: 1,
    gap: 8,
  },
  demoHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  demoLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  again: {
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
  },
  againText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  steps: {
    gap: 22,
    paddingTop: 4,
  },
  intro: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  step: {
    gap: 8,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  number: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  stepTitles: {
    flex: 1,
  },
  stepTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  stepGoal: {
    color: colors.accent,
    fontSize: 12,
  },
  paragraph: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.9,
  },
  warning: {
    backgroundColor: colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    borderRadius: 8,
    padding: 10,
  },
  warningText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  algorithm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 12,
  },
  algorithmBody: {
    flex: 1,
    gap: 3,
  },
  algorithmLabel: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  algorithmMoves: {
    color: colors.text,
    fontSize: 16,
    letterSpacing: 1,
  },
  algorithmNote: {
    color: colors.muted,
    fontSize: 12,
  },
  algorithmPlay: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.7,
  },
});
