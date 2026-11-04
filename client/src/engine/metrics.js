/**
 * metrics.js - Pure functions for typing test calculation (plain JS, NO React or DOM imports).
 *
 * Formulas strictly matching the workflow specification:
 * - WPM = (correctChars / 5) / minutes
 * - Raw WPM = (allTypedChars / 5) / minutes
 * - Accuracy = (correctKeystrokes / totalKeystrokes) * 100
 *   (Every keystroke including corrected typos counts toward totalKeystrokes, so fixing a typo still costs accuracy)
 * - Consistency = 100 minus the coefficient of variation (CV) of per-second raw WPM, clamped to 0 - 100
 * - wpmPerSecond array: calculated per second of test execution
 * - Characters breakdown: correct, incorrect, extra, missed
 */

/**
 * Net WPM: (correct characters / 5) / minutes
 * @param {number} correctChars
 * @param {number} durationSeconds
 * @returns {number}
 */
export function calculateWpm(correctChars, durationSeconds) {
  if (!durationSeconds || durationSeconds <= 0 || !correctChars || correctChars <= 0) {
    return 0;
  }
  const minutes = durationSeconds / 60;
  if (minutes <= 0) return 0;
  const result = (correctChars / 5) / minutes;
  return isNaN(result) || !isFinite(result) ? 0 : Math.round(result);
}

/**
 * Raw WPM: (all typed characters / 5) / minutes
 * @param {number} allTypedChars Total keystrokes / typed characters
 * @param {number} durationSeconds
 * @returns {number}
 */
export function calculateRawWpm(allTypedChars, durationSeconds) {
  if (!durationSeconds || durationSeconds <= 0 || !allTypedChars || allTypedChars <= 0) {
    return 0;
  }
  const minutes = durationSeconds / 60;
  if (minutes <= 0) return 0;
  const result = (allTypedChars / 5) / minutes;
  return isNaN(result) || !isFinite(result) ? 0 : Math.round(result);
}

/**
 * Accuracy: (correctKeystrokes / totalKeystrokes) * 100
 * Note: fixing a typo with backspace still costs accuracy because totalKeystrokes increments with every key.
 *
 * @param {number} correctKeystrokes
 * @param {number} totalKeystrokes
 * @returns {number} Accuracy percentage rounded to 1 decimal place, between 0 and 100
 */
export function calculateAccuracy(correctKeystrokes, totalKeystrokes) {
  if (!totalKeystrokes || totalKeystrokes <= 0) {
    return 100;
  }
  if (!correctKeystrokes || correctKeystrokes <= 0) {
    return 0;
  }
  const acc = (correctKeystrokes / totalKeystrokes) * 100;
  if (isNaN(acc) || !isFinite(acc)) return 100;
  return Math.min(100, Math.max(0, Math.round(acc * 10) / 10));
}

/**
 * Consistency: 100 minus the coefficient of variation (CV) of per-second raw WPM (clamped to 0-100)
 * CV = (stdDev / mean) * 100
 * Consistency = 100 - CV
 *
 * @param {number[]} perSecondRawWpm Array of raw WPM for each second
 * @returns {number} Integer between 0 and 100
 */
export function calculateConsistency(perSecondRawWpm) {
  if (!perSecondRawWpm || !Array.isArray(perSecondRawWpm)) return 100;

  const valid = perSecondRawWpm.filter((v) => typeof v === 'number' && !isNaN(v) && isFinite(v));
  if (valid.length < 2) return 100;

  const mean = valid.reduce((sum, v) => sum + v, 0) / valid.length;
  if (mean === 0) return 100;

  const variance = valid.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / valid.length;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / mean) * 100;

  const consistency = 100 - cv;
  if (isNaN(consistency) || !isFinite(consistency)) return 100;

  return Math.min(100, Math.max(0, Math.round(consistency)));
}

/**
 * Calculates character breakdown: correct, incorrect, extra, missed.
 * Count a space after a correctly committed word as a correct character.
 *
 * @param {string[]} words Target words
 * @param {string[][]} typedWords Matrix of typed characters per word
 * @returns {{ correct: number, incorrect: number, extra: number, missed: number }}
 */
export function calculateCharacterBreakdown(words = [], typedWords = []) {
  let correct = 0;
  let incorrect = 0;
  let extra = 0;
  let missed = 0;

  typedWords.forEach((typedLetters, wIdx) => {
    const targetWord = words[wIdx] || '';
    const targetLetters = targetWord.split('');

    targetLetters.forEach((expectedChar, cIdx) => {
      if (cIdx < typedLetters.length) {
        if (typedLetters[cIdx] === expectedChar) {
          correct++;
        } else {
          incorrect++;
        }
      } else {
        missed++;
      }
    });

    if (typedLetters.length > targetLetters.length) {
      extra += typedLetters.length - targetLetters.length;
    }

    // A space after a correctly typed word counts as a correct character
    if (wIdx < typedWords.length - 1 && targetWord === typedLetters.join('')) {
      correct++;
    }
  });

  return { correct, incorrect, extra, missed };
}

/**
 * Builds array of per-second metrics over the duration.
 *
 * @param {number[]} perSecondCorrectChars Array of cumulative or per-second correct characters
 * @param {number[]} perSecondAllChars Array of cumulative or per-second all typed characters
 * @returns {{ wpmPerSecond: number[], rawWpmPerSecond: number[] }}
 */
export function calculateWpmSeries(perSecondCorrectChars = [], perSecondAllChars = []) {
  const wpmPerSecond = [];
  const rawWpmPerSecond = [];

  const maxLen = Math.max(perSecondCorrectChars.length, perSecondAllChars.length);

  for (let i = 0; i < maxLen; i++) {
    const elapsedSeconds = i + 1;
    const correctCount = perSecondCorrectChars[i] || 0;
    const allCount = perSecondAllChars[i] || 0;

    const wpm = calculateWpm(correctCount, elapsedSeconds);
    const raw = calculateRawWpm(allCount, elapsedSeconds);

    wpmPerSecond.push(wpm);
    rawWpmPerSecond.push(raw);
  }

  return { wpmPerSecond, rawWpmPerSecond };
}

/**
 * Aggregates keyStats and bigramStats from the keystroke events log.
 * @param {Array<{ expected: string, typed: string, t: number, correct: boolean }>} events
 * @returns {{ keyStats: object, bigramStats: object }}
 */
export function calculateKeyAndBigramStats(events = []) {
  const keyStats = {};
  const bigramStats = {};

  let prevEvent = null;

  events.forEach((ev) => {
    if (!ev || !ev.expected) return;
    const key = ev.expected.toLowerCase();
    const isError = !ev.correct;

    let latency = 0;
    if (prevEvent && typeof ev.t === 'number' && typeof prevEvent.t === 'number' && ev.t >= prevEvent.t) {
      const diff = ev.t - prevEvent.t;
      if (diff <= 2000) latency = diff; // ignore gaps over 2s
    }

    // Key Stats
    if (!keyStats[key]) {
      keyStats[key] = { attempts: 0, errors: 0, totalLatency: 0, countWithLatency: 0 };
    }
    keyStats[key].attempts++;
    if (isError) keyStats[key].errors++;
    if (latency > 0) {
      keyStats[key].totalLatency += latency;
      keyStats[key].countWithLatency++;
    }

    // Bigram Stats
    if (prevEvent && prevEvent.expected) {
      const bigram = (prevEvent.expected + ev.expected).toLowerCase();
      if (!bigramStats[bigram]) {
        bigramStats[bigram] = { attempts: 0, errors: 0, totalLatency: 0, countWithLatency: 0 };
      }
      bigramStats[bigram].attempts++;
      if (isError) bigramStats[bigram].errors++;
      if (latency > 0) {
        bigramStats[bigram].totalLatency += latency;
        bigramStats[bigram].countWithLatency++;
      }
    }

    prevEvent = ev;
  });

  const formattedKeyStats = {};
  Object.keys(keyStats).forEach((k) => {
    const item = keyStats[k];
    formattedKeyStats[k] = {
      attempts: item.attempts,
      errors: item.errors,
      avgLatencyMs: item.countWithLatency > 0 ? Math.round(item.totalLatency / item.countWithLatency) : 0,
    };
  });

  const formattedBigramStats = {};
  Object.keys(bigramStats).forEach((b) => {
    const item = bigramStats[b];
    formattedBigramStats[b] = {
      attempts: item.attempts,
      errors: item.errors,
      avgLatencyMs: item.countWithLatency > 0 ? Math.round(item.totalLatency / item.countWithLatency) : 0,
    };
  });

  return { keyStats: formattedKeyStats, bigramStats: formattedBigramStats };
}
