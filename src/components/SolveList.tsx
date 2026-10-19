import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatSolve, type Penalty, type Solve } from '../lib/stats';
import { colors } from '../theme';

interface Props {
  solves: Solve[];
  onSetPenalty: (id: string, penalty: Penalty) => void;
  onDelete: (id: string) => void;
  /** Room left at the end of the list for the navigation bar. */
  bottomSpace?: number;
}

export default function SolveList({ solves, onSetPenalty, onDelete, bottomSpace = 0 }: Props) {
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
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => setSelected(item)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
            <Text style={styles.index}>{solves.length - index}</Text>
            <View style={styles.rowBody}>
              <Text style={[styles.time, item.penalty === 'DNF' && styles.dnf]}>
                {formatSolve(item)}
              </Text>
              <Text style={styles.scramble} numberOfLines={1}>
                {item.scramble}
              </Text>
            </View>
          </Pressable>
        )}
      />

      <Modal visible={selected !== null} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTime}>{selected ? formatSolve(selected) : ''}</Text>
            <Text style={styles.sheetScramble}>{selected?.scramble}</Text>

            <View style={styles.sheetRow}>
              <SheetButton label="OK" onPress={() => applyPenalty('OK')} />
              <SheetButton label="+2" onPress={() => applyPenalty('+2')} />
              <SheetButton label="DNF" onPress={() => applyPenalty('DNF')} />
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
          </Pressable>
        </Pressable>
      </Modal>
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
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.sheetButton,
        danger && styles.sheetButtonDanger,
        pressed && styles.sheetButtonPressed,
      ]}>
      <Text style={[styles.sheetButtonText, danger && styles.sheetButtonTextDanger]}>{label}</Text>
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
  time: {
    color: colors.text,
    fontSize: 20,
    fontVariant: ['tabular-nums'],
  },
  dnf: {
    color: colors.danger,
  },
  scramble: {
    color: colors.muted,
    fontSize: 11,
  },
  backdrop: {
    flex: 1,
    backgroundColor: '#000000AA',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
  },
  sheetTime: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '600',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
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
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
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
