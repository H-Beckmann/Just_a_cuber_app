import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { cubeLabel, type MyCube } from '../lib/myCubes';
import { formatSolve, type Penalty, type Solve } from '../lib/stats';
import { colors } from '../theme';
import BottomSheet from './BottomSheet';

interface Props {
  solves: Solve[];
  /** Used to name the cube each time was done with. */
  cubes: MyCube[];
  onSetPenalty: (id: string, penalty: Penalty) => void;
  onDelete: (id: string) => void;
  /** Room left at the end of the list for the navigation bar. */
  bottomSpace?: number;
}

export default function SolveList({
  solves,
  cubes,
  onSetPenalty,
  onDelete,
  bottomSpace = 0,
}: Props) {
  const [selected, setSelected] = useState<Solve | null>(null);
  const newestFirst = useMemo(() => [...solves].reverse(), [solves]);

  const close = () => setSelected(null);

  const applyPenalty = (penalty: Penalty) => {
    if (selected) {
      onSetPenalty(selected.id, penalty);
    }
    close();
  };

  return (
    <>
      <FlatList
        data={newestFirst}
        keyExtractor={solve => solve.id}
        contentContainerStyle={[styles.content, { paddingBottom: bottomSpace }]}
        ItemSeparatorComponent={Separator}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Nenhum tempo ainda. Volte para o cubo e faça a primeira resolução.
          </Text>
        }
        renderItem={({ item, index }) => {
          const cube = cubeLabel(cubes, item.cubeId);
          return (
            <Pressable
              onPress={() => setSelected(item)}
              style={({ pressed }) => [
                styles.row,
                pressed && styles.rowPressed,
              ]}
            >
              <Text style={styles.index}>{solves.length - index}</Text>
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text
                    style={[styles.time, item.penalty === 'DNF' && styles.dnf]}
                  >
                    {formatSolve(item)}
                  </Text>
                  {cube !== null && (
                    <Text style={styles.cube} numberOfLines={1}>
                      {cube}
                    </Text>
                  )}
                </View>
                <Text style={styles.scramble} numberOfLines={1}>
                  {item.scramble}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />

      <BottomSheet visible={selected !== null} onClose={close}>
        <Text style={styles.sheetTime}>
          {selected ? formatSolve(selected) : ''}
        </Text>
        {selected && cubeLabel(cubes, selected.cubeId) !== null && (
          <Text style={styles.sheetCube}>
            {cubeLabel(cubes, selected.cubeId)}
          </Text>
        )}
        <Text style={styles.sheetScramble}>{selected?.scramble}</Text>

        <View style={styles.sheetRow}>
          <SheetButton grow label="OK" onPress={() => applyPenalty('OK')} />
          <SheetButton grow label="+2" onPress={() => applyPenalty('+2')} />
          <SheetButton grow label="DNF" onPress={() => applyPenalty('DNF')} />
        </View>

        <SheetButton
          label="Excluir tempo"
          danger
          onPress={() => {
            if (selected) {
              onDelete(selected.id);
            }
            close();
          }}
        />
      </BottomSheet>
    </>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

function SheetButton({
  label,
  onPress,
  danger,
  grow,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  /** Share the width of a row with the other buttons. */
  grow?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.sheetButton,
        grow && styles.sheetButtonGrow,
        danger && styles.sheetButtonDanger,
        pressed && styles.sheetButtonPressed,
      ]}
    >
      <Text
        style={[styles.sheetButtonText, danger && styles.sheetButtonTextDanger]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 4,
  },
  empty: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 24,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 44,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingRight: 4,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  index: {
    width: 32,
    color: colors.muted,
    fontSize: 12,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  time: {
    color: colors.text,
    fontSize: 20,
    fontVariant: ['tabular-nums'],
  },
  dnf: {
    color: colors.danger,
  },
  cube: {
    flex: 1,
    color: colors.accent,
    fontSize: 12,
  },
  scramble: {
    color: colors.muted,
    fontSize: 11,
  },
  sheetTime: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '600',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  sheetCube: {
    color: colors.accent,
    fontSize: 14,
    textAlign: 'center',
  },
  sheetScramble: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 4,
  },
  sheetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sheetButton: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
  },
  // Only for the buttons sharing a row: in the column it would collapse the
  // height to zero and hide the label.
  sheetButtonGrow: {
    flex: 1,
  },
  sheetButtonPressed: {
    opacity: 0.6,
  },
  sheetButtonDanger: {
    backgroundColor: '#2A1718',
  },
  sheetButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  sheetButtonTextDanger: {
    color: colors.danger,
  },
});
