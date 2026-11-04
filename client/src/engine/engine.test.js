import { describe, it, expect } from 'vitest';
import { createKeystrokeLogger } from './keystrokeLogger.js';
import {
  generateTestWords,
  appendWords,
  shouldAppendWords,
  TIME_DURATIONS,
  WORD_COUNTS,
} from './wordGenerator.js';

describe('src/engine Module Tests', () => {
  describe('keystrokeLogger.js', () => {
    it('records events with { expected, typed, t, wordIndex, charIndex, correct } in a plain array', () => {
      const storage = [];
      const logger = createKeystrokeLogger(storage);

      const ev1 = logger.log('t', 't', 0, 0);
      expect(ev1.expected).toBe('t');
      expect(ev1.typed).toBe('t');
      expect(ev1.correct).toBe(true);
      expect(typeof ev1.t).toBe('number');
      expect(ev1.wordIndex).toBe(0);
      expect(ev1.charIndex).toBe(0);

      const ev2 = logger.log('h', 'j', 0, 1);
      expect(ev2.expected).toBe('h');
      expect(ev2.typed).toBe('j');
      expect(ev2.correct).toBe(false);

      expect(logger.getEvents().length).toBe(2);
      expect(storage.length).toBe(2);

      logger.clear();
      expect(logger.getEvents().length).toBe(0);
      expect(storage.length).toBe(0);
    });
  });

  describe('wordGenerator.js', () => {
    it('supports time mode durations 15, 30, 60 with ample buffer', () => {
      expect(TIME_DURATIONS).toEqual([15, 30, 60]);

      const words15 = generateTestWords({ mode: 'time', duration: 15 });
      expect(words15.length).toBeGreaterThanOrEqual(70);

      const words30 = generateTestWords({ mode: 'time', duration: 30 });
      expect(words30.length).toBeGreaterThanOrEqual(90);

      const words60 = generateTestWords({ mode: 'time', duration: 60 });
      expect(words60.length).toBeGreaterThanOrEqual(180);
    });

    it('supports words mode 10, 25, 50', () => {
      expect(WORD_COUNTS).toEqual([10, 25, 50]);

      const words10 = generateTestWords({ mode: 'words', wordCount: 10 });
      expect(words10.length).toBe(10);

      const words25 = generateTestWords({ mode: 'words', wordCount: 25 });
      expect(words25.length).toBe(25);

      const words50 = generateTestWords({ mode: 'words', wordCount: 50 });
      expect(words50.length).toBe(50);
    });

    it('appends words dynamically so time mode never runs out', () => {
      const initial = ['one', 'two', 'three'];
      const appended = appendWords(initial, { chunkSize: 20 });
      expect(appended.length).toBe(23);
      expect(appended.slice(0, 3)).toEqual(initial);

      expect(shouldAppendWords(15, 20, 10)).toBe(true);
      expect(shouldAppendWords(5, 20, 10)).toBe(false);
    });
  });
});

