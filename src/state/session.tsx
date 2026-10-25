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
  loadSettings,
  loadSolves,
  saveSettings,
  saveSolves,
} from '../lib/storage';
import type { Penalty, Solve } from '../lib/stats';

interface SessionValue {
  solves: Solve[];
  /** The time to show on the timer when it is idle. */
  lastSolve: Solve | null;
  loaded: boolean;
  inspection: boolean;
  addSolve: (solve: Solve) => void;
  setPenalty: (id: string, penalty: Penalty) => void;
  deleteSolve: (id: string) => void;
  clearSession: () => void;
  setInspection: (value: boolean) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [solves, setSolves] = useState<Solve[]>([]);
  const [inspection, setInspection] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [storedSolves, settings] = await Promise.all([
        loadSolves(),
        loadSettings(),
      ]);
      if (!alive) {
        return;
      }
      setSolves(storedSolves);
      setInspection(settings.inspection);
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
      saveSettings({ inspection });
    }
  }, [inspection, loaded]);

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
