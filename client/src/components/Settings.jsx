import React from 'react';
import { useAppStore } from '../store/useAppStore.js';

export function Settings({ isOpen, onClose }){
  const settings = useAppStore((s) => s.settings);
  const updateSetting = useAppStore((s) => s.updateSetting);

  if (!isOpen) return null;

  const themes = [
    { id: 'dark', name: 'dark', bg: '#323437', accent: '#e2b714' },
    { id: 'light', name: 'light', bg: '#e1e1e3', accent: '#db8f44' },
    { id: 'carbon', name: 'carbon', bg: '#1a1a1a', accent: '#36a3ff' },
    { id: 'rose', name: 'rose', bg: '#1e1e2e', accent: '#f38ba8' },
    { id: 'mint', name: 'mint', bg: '#1b2b2b', accent: '#88d4ab' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">⚙️ Settings</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <div className="modal__body">
          {/* Themes */}
          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-name">Theme</span>
              <span className="setting-desc">Choose from 5 custom themes</span>
            </div>
            <div className="theme-swatches">
              {themes.map((t) => (
                <button
                  key={t.id}
                  className={`swatch ${settings.theme === t.id ? 'active' : ''}`}
                  onClick={() => updateSetting('theme', t.id)}
                  style={{ '--sw-bg': t.bg, '--sw-accent': t.accent }}
                  title={t.name}
                >
                  <span className="swatch__dot" />
                  <span className="swatch__name">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-name">Font Size</span>
              <span className="setting-desc">Typing area font size</span>
            </div>
            <div className="setting-control">
              <div className="slider-wrap">
                <input
                  type="range"
                  min="14"
                  max="30"
                  step="2"
                  value={settings.fontSize}
                  onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                  className="slider"
                />
                <span className="slider-val">{settings.fontSize}px</span>
              </div>
            </div>
          </div>

          {/* Smooth Caret */}
          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-name">Smooth Caret</span>
              <span className="setting-desc">Animate caret movement smoothly</span>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.smoothCaret}
                  onChange={(e) => updateSetting('smoothCaret', e.target.checked)}
                />
                <span className="toggle-switch__track" />
              </label>
            </div>
          </div>

          {/* Sound Effects */}
          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-name">Sound Effects</span>
              <span className="setting-desc">Play click sounds on keystroke</span>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
                />
                <span className="toggle-switch__track" />
              </label>
            </div>
          </div>

          {/* Live WPM */}
          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-name">Live WPM</span>
              <span className="setting-desc">Display real-time WPM during test</span>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.showLiveWpm}
                  onChange={(e) => updateSetting('showLiveWpm', e.target.checked)}
                />
                <span className="toggle-switch__track" />
              </label>
            </div>
          </div>

          {/* Focus Mode */}
          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-name">Focus Mode</span>
              <span className="setting-desc">Hide UI elements while typing</span>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.focusMode}
                  onChange={(e) => updateSetting('focusMode', e.target.checked)}
                />
                <span className="toggle-switch__track" />
              </label>
            </div>
          </div>

          {/* Blind Mode */}
          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-name">Blind Mode</span>
              <span className="setting-desc">Hide error highlights until test ends</span>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.blindMode}
                  onChange={(e) => updateSetting('blindMode', e.target.checked)}
                />
                <span className="toggle-switch__track" />
              </label>
            </div>
          </div>

          {/* Language Selection */}
          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-name">Language</span>
              <span className="setting-desc">Word bank language</span>
            </div>
            <div className="setting-control">
              <select
                className="select-control"
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
              >
                <option value="english">English</option>
                <option value="english_1k">English 1K</option>
                <option value="spanish">Spanish</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

