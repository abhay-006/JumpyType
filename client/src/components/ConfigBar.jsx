import React from 'react';
import { useAppStore } from '../store/useAppStore.js';

export function ConfigBar(){
  const settings = useAppStore((s) => s.settings);
  const updateSetting = useAppStore((s) => s.updateSetting);
  const initializeTest = useAppStore((s) => s.initializeTest);
  const testStatus = useAppStore((s) => s.testStatus);

  const isTyping = testStatus === 'running' && settings.focusMode;

  const handleDurationChange = (d) => {
    updateSetting('duration', d);
    setTimeout(() => initializeTest(), 0);
  };

  const handleWordCountChange = (c) => {
    updateSetting('wordCount', c);
    setTimeout(() => initializeTest(), 0);
  };

  const handleQuoteSizeChange = (q) => {
    updateSetting('quoteSize', q);
    setTimeout(() => initializeTest(), 0);
  };

  const togglePunctuation = () => {
    updateSetting('punctuation', !settings.punctuation);
    setTimeout(() => initializeTest(), 0);
  };

  const toggleNumbers = () => {
    updateSetting('numbers', !settings.numbers);
    setTimeout(() => initializeTest(), 0);
  };

  return (
    <div className={`config-bar ${isTyping ? 'hidden' : ''}`} id="config-bar">
      {/* Toggles */}
      <div className="config-group config-group--toggles">
        <button
          className={`config-btn toggle-btn ${settings.punctuation ? 'active' : ''}`}
          onClick={togglePunctuation}
        >
          @ punctuation
        </button>
        <button
          className={`config-btn toggle-btn ${settings.numbers ? 'active' : ''}`}
          onClick={toggleNumbers}
        >
          # numbers
        </button>
      </div>

      <div className="config-divider" />

      {/* Mode Sub-options */}
      {settings.mode === 'time' && (
        <div className="config-group config-group--time">
          {[15, 30, 60, 120].map((d) => (
            <button
              key={d}
              className={`config-btn option-btn ${settings.duration === d ? 'active' : ''}`}
              onClick={() => handleDurationChange(d)}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {settings.mode === 'words' && (
        <div className="config-group config-group--words">
          {[10, 25, 50, 100].map((c) => (
            <button
              key={c}
              className={`config-btn option-btn ${settings.wordCount === c ? 'active' : ''}`}
              onClick={() => handleWordCountChange(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {settings.mode === 'quote' && (
        <div className="config-group config-group--quote">
          {['short', 'medium', 'long'].map((q) => (
            <button
              key={q}
              className={`config-btn option-btn ${settings.quoteSize === q ? 'active' : ''}`}
              onClick={() => handleQuoteSizeChange(q)}
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

