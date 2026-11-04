import { describe, it, expect, beforeEach } from 'vitest';
import { buildResult } from './buildResult.js';
import { saveResult, getResults } from '../services/storage.js';

// Mock localStorage for node test environment
const mockStorage = {};
globalThis.localStorage = {
  getItem: (key) => (key in mockStorage ? mockStorage[key] : null),
  setItem: (key, val) => {
    mockStorage[key] = String(val);
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  },
  removeItem: (key) => {
    delete mockStorage[key];
  },
};

describe('buildResult & storage adapter tests', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it('buildResult returns exact required shape with schemaVersion: 1', () => {
    const mockEvents = [
      { expected: 't', typed: 't', t: 100, correct: true },
      { expected: 'h', typed: 'h', t: 250, correct: true }, // latency = 150ms
      { expected: 'e', typed: 'r', t: 400, correct: false }, // latency = 150ms
      { expected: 'y', typed: 'y', t: 3000, correct: true }, // gap > 2000ms -> ignored
    ];

    const result = buildResult({
      mode: 'time',
      duration: 30,
      language: 'english',
      words: ['the', 'quick'],
      typedWords: [['t', 'h', 'r'], ['q', 'u', 'i', 'c', 'k']],
      keystrokeEvents: mockEvents,
      wpmPerSecond: [45, 50, 55],
      rawWpmPerSecond: [50, 55, 60],
      totalKeystrokes: 8,
      totalCorrectKeystrokes: 7,
      timestamp: '2026-11-03T10:30:00Z',
    });

    // Verify exact required properties
    expect(result.schemaVersion).toBe(1);
    expect(result.mode).toBe('time');
    expect(result.duration).toBe(30);
    expect(result.language).toBe('english');
    expect(typeof result.wpm).toBe('number');
    expect(typeof result.rawWpm).toBe('number');
    expect(typeof result.accuracy).toBe('number');
    expect(typeof result.consistency).toBe('number');

    // Chars breakdown
    expect(result.chars).toEqual({
      correct: 7,
      incorrect: 1,
      extra: 0,
      missed: 0,
    });

    // keyStats and bigramStats ignore > 2000ms
    expect(result.keyStats).toHaveProperty('t');
    expect(result.keyStats).toHaveProperty('h');
    expect(result.keyStats).toHaveProperty('e');
    expect(result.keyStats).toHaveProperty('y');
    expect(result.keyStats.y.avgLatencyMs).toBe(0); // ignored because diff was 2600ms > 2000ms

    expect(result.bigramStats).toHaveProperty('th');
    expect(result.bigramStats.th.avgLatencyMs).toBe(150);

    // wpmPerSecond & timestamp
    expect(result.wpmPerSecond).toEqual([45, 50, 55]);
    expect(result.timestamp).toBe('2026-11-03T10:30:00Z');
  });

  it('storage adapter saves and retrieves results, keeping maximum 500 entries', async () => {
    const res1 = buildResult({ duration: 15, mode: 'time' });
    const res2 = buildResult({ duration: 30, mode: 'time' });

    await saveResult(res1);
    await saveResult(res2);

    const all = await getResults();
    expect(all.length).toBe(2);
    expect(all[0].duration).toBe(15);
    expect(all[1].duration).toBe(30);

    // Test 500 limit
    for (let i = 0; i < 505; i++) {
      await saveResult({ id: i });
    }
    const finalStored = await getResults();
    expect(finalStored.length).toBe(500);
    expect(finalStored[finalStored.length - 1].id).toBe(504);
  });
});
