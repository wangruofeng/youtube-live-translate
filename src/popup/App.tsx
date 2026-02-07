import React, { useState, useEffect } from 'react';
import './popup.css';

interface PopupState {
  enabled: boolean;
  targetLang: string;
  showOriginal: boolean;
  hideOriginalSubtitles: boolean;
}

const TARGET_LANGUAGES = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ru', name: 'Русский' },
  { code: 'ar', name: 'العربية' },
];

const App: React.FC = () => {
  const [state, setState] = useState<PopupState>({
    enabled: true,
    targetLang: 'zh-CN',
    showOriginal: false,
    hideOriginalSubtitles: false,
  });

  useEffect(() => {
    // 加载保存的设置
    chrome.storage.sync.get(['enabled', 'targetLang', 'showOriginal', 'hideOriginalSubtitles'], (result) => {
      setState({
        enabled: result.enabled ?? true,
        targetLang: result.targetLang ?? 'zh-CN',
        showOriginal: result.showOriginal ?? false,
        hideOriginalSubtitles: result.hideOriginalSubtitles ?? false,
      });
    });
  }, []);

  const handleToggle = () => {
    const newState = { ...state, enabled: !state.enabled };
    setState(newState);
    chrome.storage.sync.set({ enabled: newState.enabled });
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    const newState = { ...state, targetLang: newLang };
    setState(newState);
    chrome.storage.sync.set({ targetLang: newLang });
  };

  const handleShowOriginalToggle = () => {
    const newState = { ...state, showOriginal: !state.showOriginal };
    setState(newState);
    chrome.storage.sync.set({ showOriginal: newState.showOriginal });
  };

  const handleHideOriginalSubtitlesToggle = () => {
    const newState = { ...state, hideOriginalSubtitles: !state.hideOriginalSubtitles };
    setState(newState);
    chrome.storage.sync.set({ hideOriginalSubtitles: newState.hideOriginalSubtitles });
  };

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>🎬 YouTube 字幕翻译</h1>
      </header>

      <main className="popup-main">
        <div className="setting-item">
          <div className="setting-label">
            <span>启用翻译</span>
            <span className={`status-badge ${state.enabled ? 'enabled' : 'disabled'}`}>
              {state.enabled ? '已启用' : '已禁用'}
            </span>
          </div>
          <button
            className={`toggle-button ${state.enabled ? 'active' : ''}`}
            onClick={handleToggle}
          >
            <div className="toggle-slider"></div>
          </button>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <span>显示原文</span>
            <span className={`status-badge ${state.showOriginal ? 'enabled' : 'disabled'}`}>
              {state.showOriginal ? '已启用' : '已禁用'}
            </span>
          </div>
          <button
            className={`toggle-button ${state.showOriginal ? 'active' : ''}`}
            onClick={handleShowOriginalToggle}
          >
            <div className="toggle-slider"></div>
          </button>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <span>隐藏 YouTube 原字幕</span>
            <span className={`status-badge ${state.hideOriginalSubtitles ? 'enabled' : 'disabled'}`}>
              {state.hideOriginalSubtitles ? '已启用' : '已禁用'}
            </span>
          </div>
          <button
            className={`toggle-button ${state.hideOriginalSubtitles ? 'active' : ''}`}
            onClick={handleHideOriginalSubtitlesToggle}
          >
            <div className="toggle-slider"></div>
          </button>
        </div>

        <div className="setting-item">
          <label className="setting-label" htmlFor="language-select">
            目标语言
          </label>
          <select
            id="language-select"
            className="language-select"
            value={state.targetLang}
            onChange={handleLanguageChange}
          >
            {TARGET_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="info-section">
          <p className="info-text">
            💡 在 YouTube 视频页面，字幕会自动显示翻译
          </p>
          <p className="info-text">
            ⌨️ 快捷键：Alt+T 显示/隐藏原文 | Alt+R 重置位置 | Alt+O 重新打开字幕
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;
