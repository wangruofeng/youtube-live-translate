import React, { useState, useEffect } from 'react';
import './popup.css';

type TextAlignType = 'left' | 'center' | 'right';

interface PopupState {
  enabled: boolean;
  targetLang: string;
  showOriginal: boolean;
  hideOriginalSubtitles: boolean;
  textAlign: TextAlignType;
}

const TEXT_ALIGN_OPTIONS: { value: TextAlignType; name: string }[] = [
  { value: 'left', name: '左对齐' },
  { value: 'center', name: '居中对齐' },
  { value: 'right', name: '右对齐' },
];

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
    textAlign: 'center',
  });

  useEffect(() => {
    // 加载保存的设置
    chrome.storage.sync.get(['enabled', 'targetLang', 'showOriginal', 'hideOriginalSubtitles', 'textAlign'], (result) => {
      setState({
        enabled: result.enabled ?? true,
        targetLang: result.targetLang ?? 'zh-CN',
        showOriginal: result.showOriginal ?? false,
        hideOriginalSubtitles: result.hideOriginalSubtitles ?? false,
        textAlign: TEXT_ALIGN_OPTIONS.some((o) => o.value === result.textAlign) ? (result.textAlign as TextAlignType) : 'center',
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

  const handleTextAlignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = e.target.value;
    const textAlign = TEXT_ALIGN_OPTIONS.some((o) => o.value === raw) ? (raw as TextAlignType) : 'center';
    setState({ ...state, textAlign });
    chrome.storage.sync.set({ textAlign });
  };

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>🎬 YouTube 字幕翻译</h1>
      </header>

      <main className="popup-main">
        <div className="setting-item setting-item--row">
          <div className="setting-label-block">
            <span className="setting-title">启用翻译</span>
            <span className={`status-badge ${state.enabled ? 'enabled' : 'disabled'}`}>
              {state.enabled ? '已启用' : '已禁用'}
            </span>
          </div>
          <button
            className={`toggle-button ${state.enabled ? 'active' : ''}`}
            onClick={handleToggle}
            type="button"
            aria-label={state.enabled ? '禁用翻译' : '启用翻译'}
          >
            <div className="toggle-slider"></div>
          </button>
        </div>

        <div className="setting-item setting-item--row">
          <div className="setting-label-block">
            <span className="setting-title">显示原文</span>
            <span className={`status-badge ${state.showOriginal ? 'enabled' : 'disabled'}`}>
              {state.showOriginal ? '已启用' : '已禁用'}
            </span>
          </div>
          <button
            className={`toggle-button ${state.showOriginal ? 'active' : ''}`}
            onClick={handleShowOriginalToggle}
            type="button"
            aria-label={state.showOriginal ? '隐藏原文' : '显示原文'}
          >
            <div className="toggle-slider"></div>
          </button>
        </div>

        <div className="setting-item setting-item--row">
          <div className="setting-label-block">
            <span className="setting-title">隐藏 YouTube 原字幕</span>
            <span className={`status-badge ${state.hideOriginalSubtitles ? 'enabled' : 'disabled'}`}>
              {state.hideOriginalSubtitles ? '已启用' : '已禁用'}
            </span>
          </div>
          <button
            className={`toggle-button ${state.hideOriginalSubtitles ? 'active' : ''}`}
            onClick={handleHideOriginalSubtitlesToggle}
            type="button"
            aria-label={state.hideOriginalSubtitles ? '显示原字幕' : '隐藏原字幕'}
          >
            <div className="toggle-slider"></div>
          </button>
        </div>

        <div className="setting-item">
          <label className="setting-label setting-label--stack" htmlFor="language-select">
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

        <div className="setting-item setting-item--last">
          <label className="setting-label setting-label--stack" htmlFor="text-align-select">
            翻译内容对齐
          </label>
          <select
            id="text-align-select"
            className="language-select"
            value={state.textAlign}
            onChange={handleTextAlignChange}
          >
            {TEXT_ALIGN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.name}
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
