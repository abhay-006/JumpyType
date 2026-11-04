/**
 * buildResult.js (plain JS, NO React or DOM imports).
 *
 * Produces the standard result object shape specified in Section 1 and Section 4:
 * {
 *   schemaVersion: 1,
 *   mode: string,
 *   duration: number,
 *   language: string,
 *   wpm: number,
 *   rawWpm: number,
 *   accuracy: number,
 *   consistency: number,
 *   chars: { correct: number, incorrect: number, extra: number, missed: number },
 *   keyStats: { [key: string]: { attempts: number, errors: number, avgLatencyMs: number } },
 *   bigramStats: { [pair: string]: { attempts: number, errors: number, avgLatencyMs: number } },
 *   wpmPerSecond: number[],
 *   timestamp: string
 * }
 *
 * Rules:
 * - keyStats/bigramStats: ignore latency gaps over 2000 ms (they are pauses, not slowness).
 * - A bigram is the expected previous character plus the expected current character (e.g. "th").
 */

import {
  calculateWpm,
  calculateRawWpm,
  calculateAccuracy,
  calculateConsistency,
  calculateCharacterBreakdown,
  calculateKeyAndBigramStats,
} from './metrics.js';

/**
 * Builds the standard result object.
 *
 * @param {object} params
 * @param {string} params.mode 'time' | 'words' | 'quote' | 'zen'
 * @param {number} params.duration Duration in seconds
 * @param {string} params.language Language identifier (e.g. 'english')
 * @param {string[]} params.words Target words array
 * @param {string[][]} params.typedWords Matrix of characters typed per word
 * @param {Array<{ expected: string, typed: string, t: number, correct: boolean }>} params.keystrokeEvents Keystroke event log
 * @param {number[]} params.wpmPerSecond Array of per-second net WPM
 * @param {number[]} params.rawWpmPerSecond Array of per-second raw WPM
 * @param {number} params.totalKeystrokes Total key count typed (including corrected mistakes)
 * @param {number} params.totalCorrectKeystrokes Total correct key count typed
 * @param {string} [params.timestamp] ISO date string (optional, defaults to now)
 * @returns {object} Standard result object
 */
export function buildResult({
  mode = 'time',
  duration = 30,
  language = 'english',
  words = [],
  typedWords = [],
  keystrokeEvents = [],
  wpmPerSecond = [],
  rawWpmPerSecond = [],
  totalKeystrokes = 0,
  totalCorrectKeystrokes = 0,
  timestamp,
}) {
  const chars = calculateCharacterBreakdown(words, typedWords);
  const wpm = calculateWpm(chars.correct, duration);
  const rawWpm = calculateRawWpm(totalKeystrokes, duration);
  const accuracy = calculateAccuracy(totalCorrectKeystrokes, totalKeystrokes);
  const consistency = calculateConsistency(rawWpmPerSecond);
  const { keyStats, bigramStats } = calculateKeyAndBigramStats(keystrokeEvents);

  return {
    schemaVersion: 1,
    mode,
    duration,
    language,
    wpm,
    rawWpm,
    accuracy,
    consistency,
    chars,
    keyStats,
    bigramStats,
    wpmPerSecond: Array.isArray(wpmPerSecond) ? wpmPerSecond : [],
    timestamp: timestamp || new Date().toISOString(),
  };
}

