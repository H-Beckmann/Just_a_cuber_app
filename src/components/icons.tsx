/**
 * Icons drawn with plain Views — no icon font, no SVG dependency, no rebuild
 * needed to add one.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

export interface IconProps {
  size?: number;
  color: string;
}

/** A 3x3 grid of stickers: the cube, seen head on. */
export function CubeIcon({ size = 22, color }: IconProps) {
  const gap = size * 0.13;
  // Rounded down so three cells plus two gaps never exceed the width and
  // wrap onto a fourth row.
  const cell = Math.floor(((size - gap * 2) / 3) * 100) / 100;

  return (
    <View style={[styles.grid, { width: size, height: size, gap }]}>
      {Array.from({ length: 9 }).map((_, index) => (
        <View
          key={index}
          style={{
            width: cell,
            height: cell,
            borderRadius: cell * 0.3,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}

/** A clock face showing three o'clock. */
export function ClockIcon({ size = 22, color }: IconProps) {
  const stroke = Math.max(1.5, size * 0.09);
  const inner = size - stroke * 2;
  const centre = inner / 2;
  const minuteHand = inner * 0.34;
  const hourHand = inner * 0.26;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: stroke,
        borderColor: color,
      }}
    >
      <View
        style={[
          styles.hand,
          {
            width: stroke,
            height: minuteHand,
            left: centre - stroke / 2,
            top: centre - minuteHand,
            borderRadius: stroke,
            backgroundColor: color,
          },
        ]}
      />
      <View
        style={[
          styles.hand,
          {
            width: hourHand,
            height: stroke,
            left: centre,
            top: centre - stroke / 2,
            borderRadius: stroke,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

/** A crosshair: puts the cube back to the angle it started at. */
export function RecenterIcon({ size = 22, color }: IconProps) {
  const stroke = Math.max(1.5, size * 0.09);
  const ring = size * 0.6;
  const dot = size * 0.18;
  const tick = size * 0.15;

  return (
    <View style={[styles.centred, { width: size, height: size }]}>
      <View
        style={{
          width: ring,
          height: ring,
          borderRadius: ring / 2,
          borderWidth: stroke,
          borderColor: color,
        }}
      />
      <View
        style={[
          styles.overlay,
          {
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            backgroundColor: color,
          },
        ]}
      />
      {[
        { width: stroke, height: tick, top: 0 },
        { width: stroke, height: tick, bottom: 0 },
        { width: tick, height: stroke, left: 0 },
        { width: tick, height: stroke, right: 0 },
      ].map((position, index) => (
        <View
          key={index}
          style={[styles.overlay, position, { backgroundColor: color }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  centred: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hand: {
    position: 'absolute',
  },
});
