/**
 * Keystroke Logger (plain JavaScript, NO React imports).
 *
 * Records events of shape:
 * {
 *   expected: string,
 *   typed: string,
 *   t: number,           // performance.now()
 *   wordIndex: number,
 *   charIndex: number,
 *   correct: boolean
 * }
 *
 * Events are stored in a plain internal array (or can be passed via useRef),
 * never in React state.
 */

export function createKeystrokeLogger(initialStorage = []) {
  const events = Array.isArray(initialStorage) ? initialStorage : [];

  return {
    /**
     * Record a keystroke event.
     * @param {string} expected Expected character
     * @param {string} typed Typed character
     * @param {number} wordIndex Index of the word
     * @param {number} charIndex Index of the character within the word
     * @returns {object} The logged event
     */
    log(expected, typed, wordIndex, charIndex) {
      const correct = expected === typed;
      const t = typeof performance !== 'undefined' && performance.now
        ? performance.now()
        : Date.now();

      const event = {
        expected,
        typed,
        t,
        wordIndex,
        charIndex,
        correct,
      };

      events.push(event);
      return event;
    },

    /**
     * Get all recorded events.
     * @returns {Array<object>}
     */
    getEvents() {
      return events;
    },

    /**
     * Clear all recorded events.
     */
    clear() {
      events.length = 0;
    },

    /**
     * Return count of recorded events.
     */
    get count() {
      return events.length;
    },
  };
}
