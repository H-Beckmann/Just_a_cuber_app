/**
 * @format
 */

import {
  averageOf,
  bestSingle,
  effectiveMs,
  formatAverage,
  formatMs,
  formatSolve,
  sessionMean,
  type Penalty,
  type Solve,
} from '../src/lib/stats';

function solve(ms: number, penalty: Penalty = 'OK'): Solve {
  return { id: `${ms}-${penalty}`, ms, penalty, scramble: '', date: 0 };
}

describe('formatting', () => {
  it('shows hundredths, and minutes only when needed', () => {
    expect(formatMs(0)).toBe('0.00');
    expect(formatMs(9870)).toBe('9.87');
    expect(formatMs(12345)).toBe('12.34');
    expect(formatMs(83456)).toBe('1:23.45');
    expect(formatMs(600000)).toBe('10:00.00');
  });

  it('marks penalties', () => {
    expect(formatSolve(solve(12000))).toBe('12.00');
    expect(formatSolve(solve(12000, '+2'))).toBe('14.00+');
    expect(formatSolve(solve(12000, 'DNF'))).toBe('DNF');
  });
});

describe('penalties', () => {
  it('adds two seconds for +2 and voids a DNF', () => {
    expect(effectiveMs(solve(10000))).toBe(10000);
    expect(effectiveMs(solve(10000, '+2'))).toBe(12000);
    expect(effectiveMs(solve(10000, 'DNF'))).toBeNull();
  });
});

describe('averages', () => {
  const five = [solve(10000), solve(12000), solve(14000), solve(16000), solve(30000)];

  it('needs enough solves', () => {
    expect(averageOf(five.slice(0, 4), 5)).toBeNull();
    expect(formatAverage(null)).toBe('—');
  });

  it('drops the best and the worst', () => {
    // (12 + 14 + 16) / 3
    expect(averageOf(five, 5)).toBe(14000);
  });

  it('uses only the last N solves', () => {
    const six = [solve(60000), ...five];
    expect(averageOf(six, 5)).toBe(14000);
  });

  it('treats one DNF as the worst time', () => {
    const withDnf = [solve(10000), solve(12000), solve(14000), solve(16000), solve(20000, 'DNF')];
    // best (10) and the DNF are dropped: (12 + 14 + 16) / 3
    expect(averageOf(withDnf, 5)).toBe(14000);
  });

  it('is a DNF with two DNFs', () => {
    const twoDnf = [
      solve(10000),
      solve(12000),
      solve(14000),
      solve(16000, 'DNF'),
      solve(20000, 'DNF'),
    ];
    expect(averageOf(twoDnf, 5)).toBe('DNF');
    expect(formatAverage('DNF')).toBe('DNF');
  });

  it('counts a +2 with the penalty included', () => {
    const withPlusTwo = [solve(10000), solve(12000), solve(14000), solve(16000), solve(13000, '+2')];
    // times become 10, 12, 13+2=15, 14, 16 -> drop 10 and 16 -> (12 + 15 + 14) / 3
    expect(averageOf(withPlusTwo, 5)).toBeCloseTo(13666.67, 0);
  });
});

describe('session numbers', () => {
  it('finds the best single, penalties included', () => {
    expect(bestSingle([])).toBeNull();
    expect(bestSingle([solve(12000), solve(9000, '+2'), solve(10500)])).toBe(10500);
    expect(bestSingle([solve(12000, 'DNF')])).toBe('DNF');
  });

  it('means the whole session, and a single DNF voids it', () => {
    expect(sessionMean([solve(10000), solve(20000)])).toBe(15000);
    expect(sessionMean([solve(10000), solve(20000, 'DNF')])).toBe('DNF');
    expect(sessionMean([])).toBeNull();
  });
});
