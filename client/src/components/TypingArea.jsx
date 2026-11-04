import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import { Word } from './Word.jsx';
import { Caret } from './Caret.jsx';
import { createKeystrokeLogger } from '../engine/keystrokeLogger.js';
import { calculateCharacterBreakdown, calculateWpm, calculateRawWpm } from '../engine/metrics.js';
import { buildResult } from '../engine/buildResult.js';
import { saveResult } from '../services/storage.js';

export function TypingArea(){
  const settings = useAppStore((s) => s.settings);
  const words = useAppStore((s) => s.words);
  const currentWordIndex = useAppStore((s) => s.currentWordIndex);
  const typedWords = useAppStore((s) => s.typedWords);
  const testStatus = useAppStore((s) => s.testStatus);
  const timeRemaining = useAppStore((s) => s.timeRemaining);
  const liveWpm = useAppStore((s) => s.liveWpm);

  const setTestStatus = useAppStore((s) => s.setTestStatus);
  const setCurrentWordIndex = useAppStore((s) => s.setCurrentWordIndex);
  const setTypedWords = useAppStore((s) => s.setTypedWords);
  const setTimeRemaining = useAppStore((s) => s.setTimeRemaining);
  const setLiveWpm = useAppStore((s) => s.setLiveWpm);
  const pushPerSecondWpm = useAppStore((s) => s.pushPerSecondWpm);
  const checkAndAppendWords = useAppStore((s) => s.checkAndAppendWords);
  const setLastResult = useAppStore((s) => s.setLastResult);
  const initializeTest = useAppStore((s) => s.initializeTest);

  // Keep latest state in refs so the interval & finish handlers never read stale closure state
  const wordsRef = useRef(words);
  wordsRef.current = words;

  const typedWordsRef = useRef(typedWords);
  typedWordsRef.current = typedWords;

  const currentWordIndexRef = useRef(currentWordIndex);
  currentWordIndexRef.current = currentWordIndex;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const inputRef = useRef(null);
  const wordsDisplayRef = useRef(null);
  const activeWordLetterRefs = useRef({});

  // Keystrokes stored in a useRef array (NEVER in React state)
  const keystrokeEventsRef = useRef([]);
  const keystrokeLoggerRef = useRef(createKeystrokeLogger(keystrokeEventsRef.current));

  const startTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const perSecondSamplesRef = useRef({ wpm: [], rawWpm: [] });
  const totalCorrectKeystrokesRef = useRef(0);
  const totalKeystrokesRef = useRef(0);

  const [isFocused, setIsFocused] = useState(false);
  const [caretPosition, setCaretPosition] = useState(null);
  const [capsLockActive, setCapsLockActive] = useState(false);

  // Audio Context for key sounds
  const audioCtxRef = useRef(null);
  const playSound = (correct) => {
    if (!settingsRef.current.soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = correct ? 600 : 250;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  };

  // Focus helper
  const focusInput = () => {
    inputRef.current?.focus();
    setIsFocused(true);
  };

  // Stable callback for active Word to mount letter refs
  const handleLetterMount = useCallback((charIdx, el) => {
    activeWordLetterRefs.current[charIdx] = el;
  }, []);

  // Update Caret position based on DOM elements
  const updateCaretPosition = useCallback(() => {
    if (!wordsDisplayRef.current) return;
    const currentTyped = typedWords[currentWordIndex] || [];
    const charIndex = currentTyped.length;

    const displayRect = wordsDisplayRef.current.getBoundingClientRect();
    const letterEl = activeWordLetterRefs.current[charIndex];

    if (letterEl) {
      const rect = letterEl.getBoundingClientRect();
      setCaretPosition({
        left: rect.left - displayRect.left,
        top: rect.top - displayRect.top + wordsDisplayRef.current.scrollTop,
        height: rect.height,
      });
    } else {
      const prevLetterEl = activeWordLetterRefs.current[charIndex - 1];
      if (prevLetterEl) {
        const rect = prevLetterEl.getBoundingClientRect();
        setCaretPosition({
          left: rect.right - displayRect.left,
          top: rect.top - displayRect.top + wordsDisplayRef.current.scrollTop,
          height: rect.height,
        });
      } else {
        const activeWordEl = wordsDisplayRef.current.querySelector(
          `[data-word-index="${currentWordIndex}"]`
        );
        if (activeWordEl) {
          const rect = activeWordEl.getBoundingClientRect();
          setCaretPosition({
            left: rect.left - displayRect.left,
            top: rect.top - displayRect.top + wordsDisplayRef.current.scrollTop,
            height: rect.height || 28,
          });
        }
      }
    }
  }, [currentWordIndex, typedWords]);

  useEffect(() => {
    updateCaretPosition();
  }, [updateCaretPosition]);

  // Finish test using latest state from refs
  const finishTest = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTestStatus('finished');

    const currSettings = settingsRef.current;
    const currWords = wordsRef.current;
    const currTypedWords = typedWordsRef.current;

    const durationSec =
      currSettings.mode === 'time'
        ? currSettings.duration
        : Math.max(
            1,
            Math.round(
              ((typeof performance !== 'undefined' ? performance.now() : Date.now()) -
                (startTimeRef.current || 0)) /
                1000
            )
          );

    // Standard Result Object built using buildResult()
    const resultObject = buildResult({
      mode: currSettings.mode,
      duration: durationSec,
      language: currSettings.language,
      words: currWords,
      typedWords: currTypedWords,
      keystrokeEvents: keystrokeLoggerRef.current.getEvents(),
      wpmPerSecond: perSecondSamplesRef.current.wpm,
      rawWpmPerSecond: perSecondSamplesRef.current.rawWpm,
      totalKeystrokes: totalKeystrokesRef.current,
      totalCorrectKeystrokes: totalCorrectKeystrokesRef.current,
    });

    setLastResult(resultObject);
    saveResult(resultObject);
  }, [setTestStatus, setLastResult]);

  // Lifecycle: Starts timer on the FIRST keystroke (not when page loads)
  const startTimerOnFirstKeystroke = useCallback(() => {
    if (testStatus === 'running') return;

    setTestStatus('running');
    startTimeRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
    keystrokeLoggerRef.current.clear();
    totalCorrectKeystrokesRef.current = 0;
    totalKeystrokesRef.current = 0;
    perSecondSamplesRef.current = { wpm: [], rawWpm: [] };

    let elapsed = 0;
    let remaining = settingsRef.current.duration;

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      elapsed++;
      const currentChars = calculateCharacterBreakdown(wordsRef.current, typedWordsRef.current);
      const instantWpm = calculateWpm(currentChars.correct, elapsed);
      const instantRawWpm = calculateRawWpm(totalKeystrokesRef.current, elapsed);

      perSecondSamplesRef.current.wpm.push(instantWpm);
      perSecondSamplesRef.current.rawWpm.push(instantRawWpm);
      pushPerSecondWpm(instantWpm, instantRawWpm);
      setLiveWpm(instantWpm);

      if (settingsRef.current.mode === 'time') {
        remaining--;
        setTimeRemaining(remaining);
        if (remaining <= 0) {
          clearInterval(timerIntervalRef.current);
          finishTest();
        }
      } else {
        setTimeRemaining(elapsed);
      }
    }, 1000);
  }, [
    testStatus,
    setTestStatus,
    pushPerSecondWpm,
    setLiveWpm,
    setTimeRemaining,
    finishTest,
  ]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Global Tab key to restart at any moment
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        initializeTest();
        setTimeout(focusInput, 10);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [initializeTest]);

  // Handle keystroke input
  const handleKeyDown = (e) => {
    if (testStatus === 'finished') return;

    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }

    // Tab: Restart test
    if (e.key === 'Tab') {
      e.preventDefault();
      initializeTest();
      return;
    }

    // Ctrl + Backspace: Delete the current word
    if (e.key === 'Backspace' && (e.ctrlKey || e.altKey || e.metaKey)) {
      e.preventDefault();
      const nextTyped = [...typedWords];
      nextTyped[currentWordIndex] = [];
      setTypedWords(nextTyped);
      return;
    }

    // Backspace: Works within current word; does NOT allow backspacing into committed correct word
    if (e.key === 'Backspace') {
      e.preventDefault();
      const currentTyped = [...(typedWords[currentWordIndex] || [])];

      if (currentTyped.length > 0) {
        currentTyped.pop();
        const nextTyped = [...typedWords];
        nextTyped[currentWordIndex] = currentTyped;
        setTypedWords(nextTyped);
      }
      return;
    }

    // Space: Commits word
    if (e.key === ' ') {
      e.preventDefault();
      const currentTyped = typedWords[currentWordIndex] || [];
      if (currentTyped.length === 0) return; // Prevent skipping without typing

      startTimerOnFirstKeystroke();

      // Words mode: Check if last word is committed
      if (
        (settings.mode === 'words' || settings.mode === 'quote') &&
        currentWordIndex >= words.length - 1
      ) {
        finishTest();
        return;
      }

      // Time / zen mode: Check and append words so time mode never runs out
      checkAndAppendWords();

      // Clear letter refs for previous active word before moving
      activeWordLetterRefs.current = {};
      setCurrentWordIndex(currentWordIndex + 1);
      return;
    }

    // Printable Character: start timer on first keystroke & record event
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      startTimerOnFirstKeystroke();

      const targetWord = words[currentWordIndex] || '';
      const currentTyped = [...(typedWords[currentWordIndex] || [])];

      // Limit extra letters to word length + 10
      if (currentTyped.length >= targetWord.length + 10) return;

      const charIndex = currentTyped.length;
      const expectedChar = targetWord[charIndex] || '';
      const typedChar = e.key;

      // Keystroke logger: record event in useRef array
      keystrokeLoggerRef.current.log(expectedChar, typedChar, currentWordIndex, charIndex);
      totalKeystrokesRef.current++;
      if (expectedChar === typedChar) {
        totalCorrectKeystrokesRef.current++;
      }

      playSound(expectedChar === typedChar);

      currentTyped.push(typedChar);
      const nextTyped = [...typedWords];
      nextTyped[currentWordIndex] = currentTyped;
      setTypedWords(nextTyped);
    }
  };

  return (
    <section className="test-section" id="test-section" onClick={focusInput}>
      {/* Live Stats */}
      {testStatus === 'running' && (
        <div className="live-stats">
          {settings.showLiveWpm && (
            <div className="live-stat">
              <span className="live-stat__value">{liveWpm}</span>
              <span className="live-stat__label">wpm</span>
            </div>
          )}
          <div className="live-stat live-timer">
            <span className="live-stat__value">{timeRemaining}</span>
            <span className="live-stat__label">sec</span>
          </div>
        </div>
      )}

      {/* Words Area */}
      <div className={`words-wrapper ${isFocused ? 'focused' : ''}`}>
        <div className="words-display" ref={wordsDisplayRef}>
          {words.map((word, wIdx) => {
            const isActive = wIdx === currentWordIndex;
            return (
              <Word
                key={wIdx}
                word={word}
                typedLetters={typedWords[wIdx]}
                isActive={isActive}
                wordIndex={wIdx}
                onLetterMount={isActive ? handleLetterMount : null}
              />
            );
          })}
        </div>

        {/* Caret */}
        <Caret
          position={caretPosition}
          smooth={settings.smoothCaret}
          isBlinking={!isFocused || testStatus === 'idle'}
        />
      </div>

      {/* Hidden input kept focused for capturing keystrokes */}
      <input
        ref={inputRef}
        type="text"
        className="hidden-input"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        aria-label="Typing input field"
      />

      {/* Tap to focus for mobile */}
      {!isFocused && (
        <div className="tap-to-focus">
          <span>⌨️ tap or click to focus</span>
        </div>
      )}

      {/* Caps lock warning */}
      {capsLockActive && (
        <div className="caps-lock-warning">
          <span>🔒 Caps Lock is ON</span>
        </div>
      )}

      {/* Footer controls */}
      <div className="test-footer">
        <button
          className="restart-btn"
          onClick={initializeTest}
          title="Restart test (Tab)"
          aria-label="Restart test"
        >
          🔄
        </button>
      </div>
    </section>
  );
}
