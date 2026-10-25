/**
 * The solving session: the times, their penalties and the settings, shared by
 * every screen and kept on the device.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  createCube,
  findByName,
  normaliseName,
  type MyCube,
} from '../lib/myCubes';
import {
  loadCubes,
  loadSettings,
  loadSolves,
  saveCubes,
  saveSettings,
  saveSolves,
} from '../lib/storage';
import type { Penalty, Solve } from '../lib/stats';

/** Why a cube could not be added, for the screen to explain. */
export type AddCubeResult = 'ok' | 'empty' | 'duplicate';

interface SessionValue {
  solves: Solve[];
  /** The time to show on the timer when it is idle. */
  lastSolve: Solve | null;
  loaded: boolean;
  inspection: boolean;
  /** The cubes the user owns, oldest first. */
  cubes: MyCube[];
  /** The one picked last, offered first when saving a time. */
  lastCubeId: string | null;
  addCube: (name: string) => AddCubeResult;
  deleteCube: (id: string) => void;
  setLastCubeId: (id: string | null) => void;
  addSolve: (solve: Solve) => void;
  setPenalty: (id: string, penalty: Penalty) => void;
  deleteSolve: (id: string) => void;
  clearSession: () => void;
  setInspection: (value: boolean) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [solves, setSolves] = useState<Solve[]>([]);
  const [cubes, setCubes] = useState<MyCube[]>([]);
  const [inspection, setInspection] = useState(false);
  const [lastCubeId, setLastCubeId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [storedSolves, storedCubes, settings] = await Promise.all([
        loadSolves(),
        loadCubes(),
        loadSettings(),
      ]);
      if (!alive) {
        return;
      }
      setSolves(storedSolves);
      setCubes(storedCubes);
      setInspection(settings.inspection);
      setLastCubeId(settings.lastCubeId);
      setLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (loaded) {
      saveSolves(solves);
    }
  }, [solves, loaded]);

  useEffect(() => {
    if (loaded) {
      saveCubes(cubes);
    }
  }, [cubes, loaded]);

  useEffect(() => {
    if (loaded) {
      saveSettings({ inspection, lastCubeId });
    }
  }, [inspection, lastCubeId, loaded]);

  const addCube = useCallback(
    (name: string): AddCubeResult => {
      if (normaliseName(name).length === 0) {
        return 'empty';
      }
      if (findByName(cubes, name)) {
        return 'duplicate';
      }
      setCubes(previous => [...previous, createCube(name)]);
      return 'ok';
    },
    [cubes],
  );

  const deleteCube = useCallback((id: string) => {
    setCubes(previous => previous.filter(cube => cube.id !== id));
    // Times already saved keep pointing at it; the list just stops naming it.
    setLastCubeId(previous => (previous === id ? null : previous));
  }, []);

  const addSolve = useCallback((solve: Solve) => {
    setSolves(previous => [...previous, solve]);
  }, []);

  const setPenalty = useCallback((id: string, penalty: Penalty) => {
    setSolves(previous =>
      previous.map(solve => (solve.id === id ? { ...solve, penalty } : solve)),
    );
  }, []);

  const deleteSolve = useCallback((id: string) => {
    setSolves(previous => previous.filter(solve => solve.id !== id));
  }, []);

  const clearSession = useCallback(() => {
    setSolves([]);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      solves,
      lastSolve: solves.length > 0 ? solves[solves.length - 1] : null,
      loaded,
      inspection,
      cubes,
      lastCubeId,
      addCube,
      deleteCube,
      setLastCubeId,
      addSolve,
      setPenalty,
      deleteSolve,
      clearSession,
      setInspection,
    }),
    [
      solves,
      loaded,
      inspection,
      cubes,
      lastCubeId,
      addCube,
      deleteCube,
      addSolve,
      setPenalty,
      deleteSolve,
      clearSession,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession precisa estar dentro de <SessionProvider>');
  }
  return value;
}
