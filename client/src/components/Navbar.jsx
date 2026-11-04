import React from 'react';
import { useAppStore } from '../store/useAppStore.js';
import logo from '../../public/jumpytype.png';

export function Navbar({ onOpenSettings }) {
  const settings = useAppStore((s) => s.settings);
  const updateSetting = useAppStore((s) => s.updateSetting);
  const initializeTest = useAppStore((s) => s.initializeTest);
  const testStatus = useAppStore((s) => s.testStatus);

  const isTyping = testStatus === 'running' && settings.focusMode;

  const handleModeChange = (mode) => {
    updateSetting('mode', mode);
    setTimeout(() => initializeTest(), 0);
  };

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'light' ? 'dark' : 'light';
    updateSetting('theme', nextTheme);
  };

  return (
    <header className={`navbar ${isTyping ? 'hidden' : ''}`} id="navbar">
      <div className="navbar__inner">
        <a
          href="#"
          className="navbar__logo"
          onClick={(e) => {
            e.preventDefault();
            initializeTest();
          }}
          title="Restart test"
        >
          <span className="logo-icon">
            <img src={logo} alt="JumpyType Logo" />
          </span>
          <span className="logo-text">JumpyType</span>
          <span className="logo-icon">⌨</span>
        </a>

        <nav className="navbar__nav" aria-label="Primary navigation">
          {['time', 'words', 'quote', 'zen'].map((m) => (
            <button
              key={m}
              className={`nav-btn ${settings.mode === m ? 'active' : ''}`}
              onClick={() => handleModeChange(m)}
            >
              <span>{m}</span>
            </button>
          ))}
        </nav>

        <div className="navbar__actions">
          <button
            className="icon-btn"
            onClick={toggleTheme}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {settings.theme === 'light' ? '☀️' : '🌙'}
          </button>
          <button
            className="icon-btn"
            onClick={onOpenSettings}
            title="Settings"
            aria-label="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>
    </header>
  );
}

