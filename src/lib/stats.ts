/**
 * Session times, penalties and WCA-style averages.
 */

export type Penalty = 'OK' | '+2' | 'DNF';

export interface Solve {
  id: string;
  /** Raw time in milliseconds, before penalties. */
  ms: number;
  penalty: Penalty;
  scramble: string;
  date: number;
}

/** `null` means DNF — i.e. the solve does not have a usable time. */
export function effectiveMs(solve: Solve): number | null {
  if (solve.penalty === 'DNF') {
    return null;
  }
  return solve.penalty === '+2' ? solve.ms + 2000 : solve.ms;
}

export function formatMs(ms: number): string {
  const total = Math.max(0, ms);
  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const hundredths = Math.floor((total % 1000) / 10);
  const pad = (value: number) => value.toString().padStart(2, '0');

  return minutes > 0
    ? `${minutes}:${pad(seconds)}.${pad(hundredths)}`
    : `${seconds}.${pad(hundredths)}`;
}

export function formatSolve(solve: Solve): string {
  if (solve.penalty === 'DNF') {
    return 'DNF';
  }
  const text = formatMs(effectiveMs(solve) as number);
  return solve.penalty === '+2' ? `${text}+` : text;
}

/** `null` = no result yet, `'DNF'` = the average itself is a DNF. */
export type AverageResult = number | 'DNF' | null;

export function formatAverage(value: AverageResult): string {
  if (value === null) {
    return '—';
  }
  return value === 'DNF' ? 'DNF' : formatMs(value);
}

export function bestSingle(solves: Solve[]): AverageResult {
  const times = solves
    .map(effectiveMs)
    .filter((ms): ms is number => ms !== null);
  if (times.length === 0) {
    return solves.length > 0 ? 'DNF' : null;
  }
  return Math.min(...times);
}

/** Mean of every solve in the session; a single DNF makes it a DNF. */
export function sessionMean(solves: Solve[]): AverageResult {
  if (solves.length === 0) {
    return null;
  }
  const times = solves.map(effectiveMs);
  if (times.some(ms => ms === null)) {
    return 'DNF';
  }
  const sum = (times as number[]).reduce((acc, ms) => acc + ms, 0);
  return sum / times.length;
}

/**
 * WCA average of the last `count` solves: drop the best and the worst, then
 * take the mean of the rest. A DNF is the worst time; two or more make the
 * whole average a DNF.
 */
export function averageOf(solves: Solve[], count: number): AverageResult {
  if (solves.length < count) {
    return null;
  }

  const window = solves.slice(-count);
  const dnfs = window.filter(solve => solve.penalty === 'DNF').length;
  if (dnfs > 1) {
    return 'DNF';
  }

  const times = window
    .map(effectiveMs)
    .filter((ms): ms is number => ms !== null)
    .sort((a, b) => a - b);

  // With one DNF the worst time is already gone, so only the best is dropped.
  const kept = dnfs === 1 ? times.slice(1) : times.slice(1, -1);
  const sum = kept.reduce((acc, ms) => acc + ms, 0);
  return sum / kept.length;
}

export function bestAverageOf(solves: Solve[], count: number): AverageResult {
  if (solves.length < count) {
    return null;
  }
  let best: number | null = null;
  for (let end = count; end <= solves.length; end++) {
    const value = averageOf(solves.slice(0, end), count);
    if (typeof value === 'number' && (best === null || value < best)) {
      best = value;
    }
  }
  return best ?? 'DNF';
}
