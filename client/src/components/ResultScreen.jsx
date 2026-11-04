import React, { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import { WpmChart } from './WpmChart.jsx';
import { AdSlot } from './AdSlot.jsx';

export function ResultScreen({ onNextTest, onRepeatTest }){
  const lastResult = useAppStore((s) => s.lastResult);

  // Keyboard shortcuts on result screen: Tab or Enter for next test, r for repeat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        onNextTest();
      } else if (e.key.toLowerCase() === 'r' && (e.ctrlKey || e.metaKey || e.altKey)) {
        e.preventDefault();
        onRepeatTest();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNextTest, onRepeatTest]);

  if (!lastResult) return null;

  // Chart data from wpmPerSecond
  const chartData = (lastResult.wpmPerSecond || []).map((w, idx) => ({
    second: idx + 1,
    wpm: w,
    rawWpm: lastResult.rawWpmPerSecond ? lastResult.rawWpmPerSecond[idx] : w,
  }));

  const { correct = 0, incorrect = 0, extra = 0, missed = 0 } = lastResult.chars || {};

  return (
    <section className="results-section" aria-label="Test results">
      <div className="results-card">
        {/* Large WPM and Accuracy Hero */}
        <div className="results-hero">
          <div className="results-hero__stat">
            <span className="results-hero__value">{lastResult.wpm}</span>
            <span className="results-hero__label">wpm</span>
          </div>
          <div className="results-hero__stat">
            <span className="results-hero__value">{lastResult.accuracy}%</span>
            <span className="results-hero__label">acc</span>
          </div>
        </div>

        {/* Detailed Stats: raw WPM, characters, consistency, time, mode */}
        <div className="results-stats">
          <div className="result-stat">
            <span className="result-stat__label">raw</span>
            <span className="result-stat__value">{lastResult.rawWpm}</span>
          </div>
          <div className="result-stat">
            <span className="result-stat__label">characters</span>
            <span className="result-stat__value" title="correct / incorrect / extra / missed">
              {correct}/{incorrect}/{extra}/{missed}
            </span>
          </div>
          <div className="result-stat">
            <span className="result-stat__label">consistency</span>
            <span className="result-stat__value">{lastResult.consistency}%</span>
          </div>
          <div className="result-stat">
            <span className="result-stat__label">time</span>
            <span className="result-stat__value">{lastResult.duration}s</span>
          </div>
          <div className="result-stat">
            <span className="result-stat__label">mode</span>
            <span className="result-stat__value">
              {lastResult.mode} {lastResult.duration}s
            </span>
          </div>
        </div>

        {/* Recharts Line Chart for wpmPerSecond */}
        <WpmChart data={chartData} />

        {/* Action Buttons with shortcuts info */}
        <div className="results-actions">
          <button
            className="action-btn action-btn--primary"
            onClick={onNextTest}
            title="Next test (Tab or Enter)"
          >
            <span>🔄 next test</span>
            <kbd style={{ fontSize: '0.7em', opacity: 0.8, marginLeft: '6px' }}>tab</kbd>
          </button>
          <button
            className="action-btn"
            onClick={onRepeatTest}
            title="Repeat current test"
          >
            <span>🔁 repeat test</span>
          </button>
        </div>
      </div>

      {/* AdSlot below result screen with fixed min-height; hidden during typing */}
      <AdSlot id="result-screen-bottom" size="728x90" />
    </section>
  );
}
