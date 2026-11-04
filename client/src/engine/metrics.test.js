import { describe, it, expect } from 'vitest';
import {
  calculateWpm,
  calculateRawWpm,
  calculateAccuracy,
  calculateConsistency,
  calculateCharacterBreakdown,
  calculateWpmSeries,
} from './metrics.js';

describe('Typing Engine Metrics Tests', () => {
  describe('Known string and time calculation', () => {
    it('calculates net WPM: (correctChars / 5) / minutes', () => {
      // 300 correct characters in 60 seconds (1 minute): (300 / 5) / 1 = 60 WPM
      expect(calculateWpm(300, 60)).toBe(60);

      // 150 correct characters in 30 seconds (0.5 minute): (150 / 5) / 0.5 = 60 WPM
      expect(calculateWpm(150, 30)).toBe(60);

      // 225 correct characters in 15 seconds (0.25 minute): (225 / 5) / 0.25 = 180 WPM
      expect(calculateWpm(225, 15)).toBe(180);
    });

    it('calculates raw WPM: (allTypedChars / 5) / minutes', () => {
      // 350 typed keystrokes in 60 seconds (1 minute): (350 / 5) / 1 = 70 Raw WPM
      expect(calculateRawWpm(350, 60)).toBe(70);

      // 175 typed keystrokes in 30 seconds (0.5 minute): (175 / 5) / 0.5 = 70 Raw WPM
      expect(calculateRawWpm(175, 30)).toBe(70);
    });
  });

  describe('Backspace and typo handling', () => {
    it('charges corrected mistakes against accuracy because every keystroke is counted', () => {
      // User typed 90 correct keys and 10 mistaken keys (then backspaced and fixed):
      // total keystrokes = 100, correct keystrokes = 90 => accuracy = 90.0%
      const acc = calculateAccuracy(90, 100);
      expect(acc).toBe(90);

      // Even if the final text looks 100% correct, typos and backspaces penalize accuracy:
      const correctedMistakesAcc = calculateAccuracy(100, 120); // 20 errors were made and corrected
      expect(correctedMistakesAcc).toBe(83.3);
    });
  });

  describe('Consistency calculation', () => {
    it('returns 100 consistency for a flat series of per-second raw WPM', () => {
      const flatSeries = [60, 60, 60, 60, 60, 60];
      expect(calculateConsistency(flatSeries)).toBe(100);
    });

    it('clamps consistency between 0 and 100', () => {
      // Highly volatile series: stdDev is large relative to mean
      const erraticSeries = [10, 100, 10, 120, 5, 140];
      const consistency = calculateConsistency(erraticSeries);
      expect(consistency).toBeGreaterThanOrEqual(0);
      expect(consistency).toBeLessThanOrEqual(100);
    });
  });

  describe('Empty input and zero-division protection', () => {
    it('returns 0 or 100 and never divides by zero on 0 or empty inputs', () => {
      expect(calculateWpm(0, 0)).toBe(0);
      expect(calculateWpm(0, 30)).toBe(0);
      expect(calculateWpm(100, 0)).toBe(0);

      expect(calculateRawWpm(0, 0)).toBe(0);
      expect(calculateRawWpm(0, 30)).toBe(0);
      expect(calculateRawWpm(100, 0)).toBe(0);

      expect(calculateAccuracy(0, 0)).toBe(100);
      expect(calculateAccuracy(0, 10)).toBe(0);

      expect(calculateConsistency([])).toBe(100);
      expect(calculateConsistency([0])).toBe(100);
      expect(calculateConsistency([60])).toBe(100);
      expect(calculateConsistency([0, 0, 0])).toBe(100);
    });
  });

  describe('NaN never appears in any metric output', () => {
    it('ensures calculateWpm never returns NaN with undefined/null/negative inputs', () => {
      const wpm1 = calculateWpm(undefined, undefined);
      const wpm2 = calculateWpm(null, null);
      const wpm3 = calculateWpm(-50, -30);
      const wpm4 = calculateWpm(NaN, NaN);

      expect(isNaN(wpm1)).toBe(false);
      expect(isNaN(wpm2)).toBe(false);
      expect(isNaN(wpm3)).toBe(false);
      expect(isNaN(wpm4)).toBe(false);
      expect(wpm1).toBe(0);
      expect(wpm2).toBe(0);
      expect(wpm3).toBe(0);
      expect(wpm4).toBe(0);
    });

    it('ensures calculateRawWpm never returns NaN with invalid inputs', () => {
      const raw1 = calculateRawWpm(undefined, undefined);
      const raw2 = calculateRawWpm(null, 0);
      const raw3 = calculateRawWpm(NaN, 30);

      expect(isNaN(raw1)).toBe(false);
      expect(isNaN(raw2)).toBe(false);
      expect(isNaN(raw3)).toBe(false);
      expect(raw1).toBe(0);
      expect(raw2).toBe(0);
      expect(raw3).toBe(0);
    });

    it('ensures calculateAccuracy never returns NaN with invalid inputs', () => {
      const acc1 = calculateAccuracy(undefined, undefined);
      const acc2 = calculateAccuracy(NaN, NaN);
      const acc3 = calculateAccuracy(0, 0);

      expect(isNaN(acc1)).toBe(false);
      expect(isNaN(acc2)).toBe(false);
      expect(isNaN(acc3)).toBe(false);
      expect(acc1).toBe(100);
      expect(acc2).toBe(100);
      expect(acc3).toBe(100);
    });

    it('ensures calculateConsistency never returns NaN with invalid arrays', () => {
      const cons1 = calculateConsistency(null);
      const cons2 = calculateConsistency([NaN, NaN]);
      const cons3 = calculateConsistency([Infinity, -Infinity]);

      expect(isNaN(cons1)).toBe(false);
      expect(isNaN(cons2)).toBe(false);
      expect(isNaN(cons3)).toBe(false);
      expect(cons1).toBe(100);
      expect(cons2).toBe(100);
      expect(cons3).toBe(100);
    });

    it('ensures calculateWpmSeries never produces NaN values', () => {
      const series = calculateWpmSeries([0, NaN, 50], [0, undefined, 60]);
      series.wpmPerSecond.forEach((val) => {
        expect(isNaN(val)).toBe(false);
      });
      series.rawWpmPerSecond.forEach((val) => {
        expect(isNaN(val)).toBe(false);
      });
    });
  });

  describe('Character breakdown calculation', () => {
    it('correctly tracks correct, incorrect, extra, and missed characters', () => {
      const words = ['quick', 'brown'];
      // User typed 'quack' (4 correct, 1 incorrect) and 'brownies' (5 correct, 3 extra)
      const typed = [
        ['q', 'u', 'a', 'c', 'k'],
        ['b', 'r', 'o', 'w', 'n', 'i', 'e', 's'],
      ];

      const counts = calculateCharacterBreakdown(words, typed);
      expect(counts.correct).toBe(9); // 4 in word1 + 5 in word2
      expect(counts.incorrect).toBe(1); // 'a' vs 'i'
      expect(counts.extra).toBe(3); // 'i', 'e', 's'
      expect(counts.missed).toBe(0);
    });

    it('counts missed characters when word is submitted incomplete', () => {
      const words = ['complete'];
      // User only typed 'comp'
      const typed = [['c', 'o', 'm', 'p']];

      const counts = calculateCharacterBreakdown(words, typed);
      expect(counts.correct).toBe(4);
      expect(counts.incorrect).toBe(0);
      expect(counts.missed).toBe(4); // 'l', 'e', 't', 'e'
      expect(counts.extra).toBe(0);
    });

    it('counts space after correctly committed word as a correct character', () => {
      const words = ['hello', 'world'];
      const typed = [
        ['h', 'e', 'l', 'l', 'o'],
        ['w', 'o', 'r', 'l', 'd'],
      ];

      const counts = calculateCharacterBreakdown(words, typed);
      // 'hello' (5) + space (1) + 'world' (5) = 11 correct chars
      expect(counts.correct).toBe(11);
      expect(counts.incorrect).toBe(0);
      expect(counts.extra).toBe(0);
      expect(counts.missed).toBe(0);
    });
  });
});
