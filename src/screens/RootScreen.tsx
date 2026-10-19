/**
 * Holds the tabs. Both screens stay mounted and the inactive one is hidden, so
 * switching back does not reset the timer or rebuild the cube.
 *
 * To add a screen later: one entry in `TABS` and one line in the body.
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import TabBar, { type TabDefinition } from '../components/TabBar';
import { ClockIcon, CubeIcon } from '../components/icons';
import { colors } from '../theme';
import TimerScreen from './TimerScreen';
import TimesScreen from './TimesScreen';

type TabKey = 'timer' | 'times';

const TABS: TabDefinition<TabKey>[] = [
  { key: 'timer', label: 'Cronômetro', Icon: CubeIcon },
  { key: 'times', label: 'Tempos', Icon: ClockIcon },
];

export default function RootScreen() {
  const [active, setActive] = useState<TabKey>('timer');

  return (
    <View style={styles.root}>
      <Layer visible={active === 'timer'}>
        <TimerScreen />
      </Layer>
      <Layer visible={active === 'times'}>
        <TimesScreen />
      </Layer>

      <TabBar tabs={TABS} active={active} onChange={setActive} />
    </View>
  );
}

function Layer({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return (
    <View
      style={[StyleSheet.absoluteFill, !visible && styles.hidden]}
      pointerEvents={visible ? 'auto' : 'none'}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hidden: {
    display: 'none',
  },
});
