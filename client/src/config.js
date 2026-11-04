export const config = {
  durations: [15, 30, 60, 120],
  wordCounts: [10, 25, 50, 100],
  defaultDuration: 30,
  defaultWordCount: 25,
  defaultMode: 'time',
  wpmSanityLimit: 350,
  defaultTheme: 'dark',
  defaultFontSize: 20,
  bufferWordsCount: 60,
  appendWordsThreshold: 15,
  appendWordsChunk: 30,
  ads: {
    enabled: false, // config.ads.enabled flag (Phase 3 readiness)
  },
};
