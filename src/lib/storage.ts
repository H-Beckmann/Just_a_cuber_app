/**
 * Session persistence. Times survive closing the app; a storage failure is
 * never fatal — the session just starts empty.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { MyCube } from './myCubes';
import type { Penalty, Solve } from './stats';

const SOLVES_KEY = 'justacuber:solves:333';
const SETTINGS_KEY = 'justacuber:settings';
const CUBES_KEY = 'justacuber:cubes';

export interface Settings {
  inspection: boolean;
  /** The cube picked last, offered first the next time. */
  lastCubeId: string | null;
}

export const defaultSettings: Settings = {
  inspection: false,
  lastCubeId: null,
};

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
    return {
      inspection: parsed.inspection === true,
      lastCubeId:
        typeof parsed.lastCubeId === 'string' ? parsed.lastCubeId : null,
    };
  } catch {
    return defaultSettings;
  }
}

function isCube(value: unknown): value is MyCube {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const cube = value as Partial<MyCube>;
  return (
    typeof cube.id === 'string' &&
    typeof cube.name === 'string' &&
    typeof cube.addedAt === 'number'
  );
}

export async function loadCubes(): Promise<MyCube[]> {
  try {
    const raw = await AsyncStorage.getItem(CUBES_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCube) : [];
  } catch {
    return [];
  }
}

export async function saveCubes(cubes: MyCube[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CUBES_KEY, JSON.stringify(cubes));
  } catch {
    // Ignored on purpose.
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignored on purpose.
  }
}
