/**
 * Self-updating clocks. They keep their own animation frame so a running
 * timer never re-renders the rest of the screen.
 */

import React, { useEffect, useState } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

import { formatMs } from '../lib/stats';

function useTicker(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) {
      return;
    }
    let frame = 0;
    const tick = () => {
      setNow(Date.now());
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  return now;
}

export function RunningClock({
  startedAt,
  style,
}: {
  startedAt: number;
  style?: StyleProp<TextStyle>;
}) {
  const now = useTicker(true);
  return <Text style={style}>{formatMs(now - startedAt)}</Text>;
}

export const INSPECTION_SECONDS = 15;
export const INSPECTION_DNF_SECONDS = 17;

export function inspectionPenaltyFor(elapsedMs: number): 'OK' | '+2' | 'DNF' {
  const seconds = elapsedMs / 1000;
  if (seconds > INSPECTION_DNF_SECONDS) {
    return 'DNF';
  }
  return seconds > INSPECTION_SECONDS ? '+2' : 'OK';
}

export function InspectionClock({
  startedAt,
  style,
}: {
  startedAt: number;
  style?: StyleProp<TextStyle>;
}) {
  const now = useTicker(true);
  const elapsed = now - startedAt;
  const penalty = inspectionPenaltyFor(elapsed);

  if (penalty === 'DNF') {
    return <Text style={style}>DNF</Text>;
  }
  if (penalty === '+2') {
    return <Text style={style}>+2</Text>;
  }

  const remaining = Math.max(1, Math.ceil((INSPECTION_SECONDS * 1000 - elapsed) / 1000));
  return <Text style={style}>{remaining}</Text>;
}
