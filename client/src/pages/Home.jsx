import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import { Navbar } from '../components/Navbar.jsx';
import { ConfigBar } from '../components/ConfigBar.jsx';
import { TypingArea } from '../components/TypingArea.jsx';
import { ResultScreen } from '../components/ResultScreen.jsx';
import { Settings } from '../components/Settings.jsx';
import { AdSlot } from '../components/AdSlot.jsx';

export function Home() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const testStatus = useAppStore((s) => s.testStatus);
  const settings = useAppStore((s) => s.settings);
  const initializeTest = useAppStore((s) => s.initializeTest);
  const repeatTest = useAppStore((s) => s.repeatTest);

  // Initialize test and theme attributes
  useEffect(() => {
    initializeTest();
  }, [initializeTest]);

  useEffect(() => {
    document.body.dataset.theme = settings.theme;
    document.body.classList.toggle('blind-mode', settings.blindMode);
    document.documentElement.style.setProperty('--font-size-typing', `${settings.fontSize}px`);
  }, [settings.theme, settings.blindMode, settings.fontSize]);

  const isTyping = testStatus === 'running' && settings.focusMode;

  return (
    <>
      <Navbar onOpenSettings={() => setSettingsOpen(true)} />

      {/* Optional Top / Sidebar AdSlot placeholder - hidden while typing */}
      <AdSlot id="home-top" size="728x90" />

      <main className="main-content" id="main-content">
        {testStatus !== 'finished' ? (
          <>
            <ConfigBar />
            <TypingArea />
          </>
        ) : (
          <ResultScreen
            onNextTest={() => initializeTest()}
            onRepeatTest={() => repeatTest()}
          />
        )}
      </main>

      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <footer className={`site-footer ${isTyping ? 'hidden' : ''}`}>
        <div className="site-footer__inner">
          <span>made with ❤️ for fast typers</span>
          <span className="footer-sep">|</span>
          <span>JumpyType v1.0</span>
          <span className="footer-sep">|</span>
          <kbd>tab</kbd> to restart
        </div>
      </footer>
    </>
  );
}
