/**
 * Word Generator (plain JavaScript, NO React imports).
 *
 * Supports modes:
 * - time: 15, 30, 60 seconds (generates initial buffer and appends dynamically so time mode never runs out)
 * - words: 10, 25, 50 (or custom word count)
 * - quotes / custom
 *
 * Loads 200 to 1000 common English words from JSON.
 */

import englishWords from '../data/words_english.json';
import english1kWords from '../data/words_english_1k.json';
import spanishWords from '../data/words_spanish.json';
import quotesData from '../data/quotes.json';

export const WORD_LISTS = {
  english: englishWords,
  english_1k: english1kWords,
  spanish: spanishWords,
};

export const QUOTES = quotesData;

export const SUPPORTED_MODES = {
  TIME: 'time',
  WORDS: 'words',
  QUOTE: 'quote',
  ZEN: 'zen',
};

export const TIME_DURATIONS = [15, 30, 60];
export const WORD_COUNTS = [10, 25, 50];

/**
 * Return random words from selected language pool.
 * @param {string} lang Language key
 * @param {number} count Number of words to generate
 * @param {boolean} withPunctuation Whether to include punctuation
 * @param {boolean} withNumbers Whether to include digits
 * @returns {string[]}
 */
export function getRandomWords(
  lang = 'english',
  count = 30,
  withPunctuation = false,
  withNumbers = false
) {
  const list = WORD_LISTS[lang] || WORD_LISTS.english;
  const words = [];
  const punctuation = [',', '.', '!', '?', ';', ':'];
  const addNumberEvery = 7;

  for (let i = 0; i < count; i++) {
    let word = list[Math.floor(Math.random() * list.length)];

    if (withNumbers && i > 0 && i % addNumberEvery === 0) {
      word = String(Math.floor(Math.random() * 100));
    }

    if (withPunctuation && i > 0 && Math.random() < 0.12) {
      const prev = words[words.length - 1];
      const punct = punctuation[Math.floor(Math.random() * punctuation.length)];
      words[words.length - 1] = prev + punct;
      if ('.!?'.includes(punct)) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
    }

    words.push(word);
  }

  return words;
}

/**
 * Generates initial word array based on mode configuration.
 * For time mode (15/30/60s), generates a sufficiently large buffer.
 * For words mode (10/25/50), generates exact count.
 *
 * @param {object} options
 * @param {'time'|'words'|'quote'|'zen'} options.mode
 * @param {number} [options.duration=30] 15, 30, 60
 * @param {number} [options.wordCount=25] 10, 25, 50
 * @param {string} [options.language='english']
 * @param {boolean} [options.punctuation=false]
 * @param {boolean} [options.numbers=false]
 * @param {'short'|'medium'|'long'} [options.quoteSize='medium']
 * @returns {string[]}
 */
export function generateTestWords({
  mode = 'time',
  duration = 30,
  wordCount = 25,
  language = 'english',
  punctuation = false,
  numbers = false,
  quoteSize = 'medium',
} = {}) {
  if (mode === 'words') {
    return getRandomWords(language, wordCount, punctuation, numbers);
  }

  if (mode === 'quote') {
    const pool = QUOTES[quoteSize] || QUOTES.medium;
    const randomQuote = pool[Math.floor(Math.random() * pool.length)];
    return randomQuote.text.split(' ');
  }

  if (mode === 'time' || mode === 'zen') {
    // Generate initial buffer (at least 70 words or ~3x duration in seconds)
    const initialCount = Math.max(70, duration * 3);
    return getRandomWords(language, initialCount, punctuation, numbers);
  }

  return getRandomWords(language, 30, punctuation, numbers);
}

/**
 * Appends additional words to the current words list so time/zen mode never runs out.
 *
 * @param {string[]} existingWords
 * @param {object} options
 * @param {number} [options.chunkSize=30]
 * @param {string} [options.language='english']
 * @param {boolean} [options.punctuation=false]
 * @param {boolean} [options.numbers=false]
 * @returns {string[]} New array with additional words appended
 */
export function appendWords(
  existingWords = [],
  { chunkSize = 30, language = 'english', punctuation = false, numbers = false } = {}
) {
  const more = getRandomWords(language, chunkSize, punctuation, numbers);
  return [...existingWords, ...more];
}

/**
 * Determines whether more words should be appended based on user progress.
 *
 * @param {number} currentIndex
 * @param {number} totalWords
 * @param {number} [threshold=15]
 * @returns {boolean}
 */
export function shouldAppendWords(currentIndex, totalWords, threshold = 15) {
  return currentIndex >= totalWords - threshold;
}

export function getRandomQuote(size = 'medium') {
  const pool = QUOTES[size] || QUOTES.medium;
  return pool[Math.floor(Math.random() * pool.length)];
}
