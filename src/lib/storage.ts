/**
 * Session persistence. Times survive closing the app; a storage failure is
 * never fatal — the session just starts empty.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Penalty, Solve } from './stats';

const SOLVES_KEY = 'justacuber:solves:333';
const SETTINGS_KEY = 'justacuber:settings';

export interface Settings {
  inspection: boolean;
}

export const defaultSettings: Settings = { inspection: false };

const PENALTIES: Penalty[] = ['OK', '+2', 'DNF'];

function isSolve(value: unknown): value is Solve {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const solve = value as Partial<Solve>;
  return (
    typeof solve.id === 'string' &&
    typeof solve.ms === 'number' &&
    typeof solve.date === 'number' &&
    typeof solve.scramble === 'string' &&
    PENALTIES.includes(solve.penalty as Penalty)
  );
}

export async function loadSolves(): Promise<Solve[]> {
  try {
    const raw = await AsyncStorage.getItem(SOLVES_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isSolve) : [];
  } catch {
    return [];
  }
}

export async function saveSolves(solves: Solve[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SOLVES_KEY, JSON.stringify(solves));
  } catch {
    // Not worth interrupting a solve over.
  }
}

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return defaultSettings;
    }
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { inspection: parsed.inspection === true };
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignored on purpose.
  }
}
