import { create } from 'zustand';
import { generateTestWords, appendWords, shouldAppendWords } from '../engine/wordGenerator.js';

const SETTINGS_KEY = 'jumpytype_settings';

const defaultSettings = {
  theme: 'dark',
  fontSize: 20,
  smoothCaret: true,
  soundEnabled: false,
  showLiveWpm: true,
  blindMode: false,
  focusMode: true,
  language: 'english',
  mode: 'time',
  duration: 30, // 15, 30, 60
  wordCount: 25, // 10, 25, 50
  quoteSize: 'medium',
  punctuation: false,
  numbers: false,
};

function loadStoredSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch (e) {
    // ignore
  }
  return defaultSettings;
}

export const useAppStore = create((set, get) => ({
  // Settings
  settings: loadStoredSettings(),

  updateSetting: (key, value) => {
    set((state) => {
      const nextSettings = { ...state.settings, [key]: value };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
      } catch (e) {}
      return { settings: nextSettings };
    });
  },

  // Test Lifecycle: 'idle' -> 'running' -> 'finished'
  testStatus: 'idle',
  setTestStatus: (status) => set({ testStatus: status }),

  // Words & State
  words: [],
  previousTestWords: [], // Cache to repeat identical test
  currentWordIndex: 0,
  typedWords: [], // Matrix of characters per word: [['h','e','l','l','o'], ['w']]

  // Live Timer & Stats
  timeRemaining: 30,
  elapsedSeconds: 0,
  liveWpm: 0,
  perSecondWpm: [],
  perSecondRawWpm: [],

  // Final Result Object
  lastResult: null,
  setLastResult: (result) => set({ lastResult: result }),

  // Actions
  initializeTest: () => {
    const { settings } = get();
    const initialWords = generateTestWords({
      mode: settings.mode,
      duration: settings.duration,
      wordCount: settings.wordCount,
      language: settings.language,
      punctuation: settings.punctuation,
      numbers: settings.numbers,
      quoteSize: settings.quoteSize,
    });

    set({
      testStatus: 'idle',
      words: initialWords,
      previousTestWords: [...initialWords],
      currentWordIndex: 0,
      typedWords: initialWords.map(() => []),
      timeRemaining: settings.duration,
      elapsedSeconds: 0,
      liveWpm: 0,
      perSecondWpm: [],
      perSecondRawWpm: [],
      lastResult: null,
    });
  },

  repeatTest: () => {
    const { settings, previousTestWords } = get();
    const repeated = previousTestWords.length > 0
      ? [...previousTestWords]
      : generateTestWords({
          mode: settings.mode,
          duration: settings.duration,
          wordCount: settings.wordCount,
          language: settings.language,
          punctuation: settings.punctuation,
          numbers: settings.numbers,
          quoteSize: settings.quoteSize,
        });

    set({
      testStatus: 'idle',
      words: repeated,
      currentWordIndex: 0,
      typedWords: repeated.map(() => []),
      timeRemaining: settings.duration,
      elapsedSeconds: 0,
      liveWpm: 0,
      perSecondWpm: [],
      perSecondRawWpm: [],
      lastResult: null,
    });
  },

  checkAndAppendWords: () => {
    const { settings, words, typedWords, currentWordIndex } = get();
    if (settings.mode !== 'time' && settings.mode !== 'zen') return;

    if (shouldAppendWords(currentWordIndex, words.length, 15)) {
      const updatedWords = appendWords(words, {
        chunkSize: 30,
        language: settings.language,
        punctuation: settings.punctuation,
        numbers: settings.numbers,
      });

      const additionalSlots = updatedWords.length - words.length;
      set({
        words: updatedWords,
        typedWords: [...typedWords, ...Array(additionalSlots).fill(null).map(() => [])],
      });
    }
  },

  setTypedWords: (typedWords) => set({ typedWords }),
  setCurrentWordIndex: (currentWordIndex) => set({ currentWordIndex }),
  setTimeRemaining: (timeRemaining) => set({ timeRemaining }),
  setElapsedSeconds: (elapsedSeconds) => set({ elapsedSeconds }),
  setLiveWpm: (liveWpm) => set({ liveWpm }),
  pushPerSecondWpm: (wpm, rawWpm) =>
    set((state) => ({
      perSecondWpm: [...state.perSecondWpm, wpm],
      perSecondRawWpm: [...state.perSecondRawWpm, rawWpm],
    })),
}));
