import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

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

      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={close}>
        {/* A Modal is a window of its own, so it needs its own provider to
            know where the system bars are. */}
        <SafeAreaProvider>
          <ActionSheet
            solve={selected}
            onClose={close}
            onPenalty={applyPenalty}
            onDelete={() => {
              if (selected) {
                onDelete(selected.id);
              }
              close();
            }}
          />
        </SafeAreaProvider>
      </Modal>
    </>
  );
}

function ActionSheet({
  solve,
  onClose,
  onPenalty,
  onDelete,
}: {
  solve: Solve | null;
  onClose: () => void;
  onPenalty: (penalty: Penalty) => void;
  onDelete: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable
        style={[
          styles.sheet,
          {
            // Clears the navigation buttons of the phone, which draw on top of
            // the sheet; 16 keeps some air under the last button on gesture
            // navigation, where the inset is small.
            paddingBottom: Math.max(insets.bottom, 16) + 12,
            paddingLeft: Math.max(insets.left, 20),
            paddingRight: Math.max(insets.right, 20),
          },
        ]}
        onPress={() => {}}>
        <View style={styles.grabber} />
        <Text style={styles.sheetTime}>{solve ? formatSolve(solve) : ''}</Text>
        <Text style={styles.sheetScramble}>{solve?.scramble}</Text>

        <View style={styles.sheetRow}>
          <SheetButton grow label="OK" onPress={() => onPenalty('OK')} />
          <SheetButton grow label="+2" onPress={() => onPenalty('+2')} />
          <SheetButton grow label="DNF" onPress={() => onPenalty('DNF')} />
        </View>

        <SheetButton label="Excluir tempo" danger onPress={onDelete} />
      </Pressable>
    </Pressable>
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
    paddingTop: 12,
    gap: 12,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 4,
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
