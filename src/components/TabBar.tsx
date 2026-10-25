/**
 * Floating bottom navigation. Adding a screen is one entry in the `tabs`
 * array passed in from the root.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme';
import type { IconProps } from './icons';

export const TAB_BAR_HEIGHT = 58;
/** Gap between the bar and the navigation buttons of the phone. */
const BAR_MARGIN = 12;

export interface TabDefinition<Key extends string> {
  key: Key;
  label: string;
  Icon: (props: IconProps) => React.ReactElement;
}

/**
 * Room a screen has to leave at the bottom so its content is never covered by
 * the bar — or, below it, by the navigation buttons of the phone.
 */
export function useTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + Math.max(insets.bottom, BAR_MARGIN) + BAR_MARGIN + 8;
}

interface Props<Key extends string> {
  tabs: TabDefinition<Key>[];
  active: Key;
  onChange: (key: Key) => void;
}

export default function TabBar<Key extends string>({
  tabs,
  active,
  onChange,
}: Props<Key>) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, BAR_MARGIN) }]}
    >
      <View style={styles.bar}>
        {tabs.map(tab => {
          const selected = tab.key === active;
          const color = selected ? colors.accent : colors.muted;

          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={tab.label}
              onPress={() => onChange(tab.key)}
              style={({ pressed }) => [
                styles.item,
                selected && styles.itemSelected,
                pressed && styles.itemPressed,
              ]}
            >
              <tab.Icon size={21} color={color} />
              <Text style={[styles.label, { color }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    paddingHorizontal: 8,
    borderRadius: TAB_BAR_HEIGHT / 2,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 6,
    // Lifts the bar off the content behind it.
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  item: {
    minWidth: 92,
    height: TAB_BAR_HEIGHT - 16,
    paddingHorizontal: 18,
    borderRadius: (TAB_BAR_HEIGHT - 16) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  itemSelected: {
    backgroundColor: colors.surfaceAlt,
  },
  itemPressed: {
    opacity: 0.6,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
