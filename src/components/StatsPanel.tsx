import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { averageOf, bestSingle, formatAverage, sessionMean, type Solve } from '../lib/stats';
import { colors } from '../theme';

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

export default function StatsPanel({ solves }: { solves: Solve[] }) {
  const stats = useMemo(
    () => ({
      best: formatAverage(bestSingle(solves)),
      ao5: formatAverage(averageOf(solves, 5)),
      ao12: formatAverage(averageOf(solves, 12)),
      mean: formatAverage(sessionMean(solves)),
    }),
    [solves],
  );

  return (
    <View style={styles.row}>
      <Cell label="melhor" value={stats.best} />
      <Cell label="ao5" value={stats.ao5} />
      <Cell label="ao12" value={stats.ao12} />
      <Cell label="média" value={stats.mean} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  value: {
    color: colors.text,
    fontSize: 17,
    fontVariant: ['tabular-nums'],
  },
});
