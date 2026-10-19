import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SolveList from '../components/SolveList';
import StatsPanel from '../components/StatsPanel';
import { useTabBarSpace } from '../components/TabBar';
import { useSession } from '../state/session';
import { colors } from '../theme';

export default function TimesScreen() {
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const { solves, setPenalty, deleteSolve, clearSession } = useSession();

  const confirmClear = () => {
    Alert.alert(
      'Limpar sessão',
      `Isso apaga os ${solves.length} tempos desta sessão. Não dá para desfazer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpar', style: 'destructive', onPress: clearSession },
      ],
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 8) + 8,
          paddingLeft: Math.max(insets.left, 16),
          paddingRight: Math.max(insets.right, 16),
        },
      ]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tempos</Text>
          <Text style={styles.subtitle}>
            {solves.length === 0
              ? 'sessão vazia'
              : `${solves.length} ${solves.length === 1 ? 'resolução' : 'resoluções'} nesta sessão`}
          </Text>
        </View>
        {solves.length > 0 && (
          <Pressable
            onPress={confirmClear}
            hitSlop={8}
            style={({ pressed }) => [styles.clear, pressed && styles.pressed]}>
            <Text style={styles.clearText}>Limpar</Text>
          </Pressable>
        )}
      </View>

      <StatsPanel solves={solves} />

      <View style={styles.listHint}>
        <Text style={styles.hint}>toque em um tempo para marcar +2, DNF ou excluir</Text>
      </View>

      <SolveList
        solves={solves}
        onSetPenalty={setPenalty}
        onDelete={deleteSolve}
        bottomSpace={bottomSpace}
      />
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  clear: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  clearText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  listHint: {
    marginTop: 4,
  },
  hint: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.7,
  },
});
