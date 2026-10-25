import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { MyCube } from '../lib/myCubes';
import { formatMs, type Penalty } from '../lib/stats';
import { colors } from '../theme';
import BottomSheet from './BottomSheet';

interface Props {
  visible: boolean;
  /** Raw time of the solve that just finished. */
  ms: number;
  /** Penalty inherited from the inspection, if any. */
  penalty: Penalty;
  cubes: MyCube[];
  selectedCubeId: string | null;
  onSelectCube: (id: string | null) => void;
  onSave: () => void;
  onDiscard: () => void;
}

export default function SaveSolveModal({
  visible,
  ms,
  penalty,
  cubes,
  selectedCubeId,
  onSelectCube,
  onSave,
  onDiscard,
}: Props) {
  const time =
    penalty === 'DNF' ? 'DNF' : formatMs(penalty === '+2' ? ms + 2000 : ms);

  return (
    // Saving or discarding has to be said out loud: no dismissing by tapping
    // outside and losing the time by accident.
    <BottomSheet
      visible={visible}
      onClose={onDiscard}
      dismissOnBackdrop={false}
    >
      <Text style={styles.question}>Salvar este tempo?</Text>
      <Text style={[styles.time, penalty === 'DNF' && styles.dnf]}>
        {time}
        {penalty === '+2' && <Text style={styles.penalty}>+2</Text>}
      </Text>

      {cubes.length === 0 ? (
        <Text style={styles.empty}>
          Cadastre seus cubos no Menu para registrar com qual deles você
          resolveu.
        </Text>
      ) : (
        <>
          <Text style={styles.label}>Qual cubo você usou?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            <Chip
              label="Nenhum"
              selected={selectedCubeId === null}
              onPress={() => onSelectCube(null)}
            />
            {cubes.map(cube => (
              <Chip
                key={cube.id}
                label={cube.name}
                selected={cube.id === selectedCubeId}
                onPress={() => onSelectCube(cube.id)}
              />
            ))}
          </ScrollView>
        </>
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={onDiscard}
          style={({ pressed }) => [
            styles.button,
            styles.discard,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.discardText}>Descartar</Text>
        </Pressable>
        <Pressable
          onPress={onSave}
          style={({ pressed }) => [
            styles.button,
            styles.save,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.saveText}>Salvar</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[styles.chipText, selected && styles.chipTextSelected]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  question: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  time: {
    color: colors.text,
    fontSize: 44,
    fontWeight: '600',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  penalty: {
    color: colors.warning,
    fontSize: 24,
  },
  dnf: {
    color: colors.danger,
  },
  empty: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  chips: {
    gap: 8,
    paddingVertical: 2,
    paddingRight: 8,
  },
  chip: {
    maxWidth: 180,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.text,
    fontSize: 14,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  discard: {
    backgroundColor: colors.surfaceAlt,
  },
  discardText: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '600',
  },
  save: {
    backgroundColor: colors.accent,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
