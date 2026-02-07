import React, { useState, useEffect } from 'react';
import './popup.css';
import { type UiLocale, UI_LOCALE_OPTIONS, t, DEFAULT_UI_LOCALE } from './locales';

type TextAlignType = 'left' | 'center' | 'right';
type TranslatedFontSizeType = 'small' | 'medium' | 'large';

interface PopupState {
  uiLanguage: UiLocale;
  enabled: boolean;
  targetLang: string;
  showOriginal: boolean;
  hideOriginalSubtitles: boolean;
  textAlign: TextAlignType;
  translatedFontSize: TranslatedFontSizeType;
}

const TEXT_ALIGN_KEYS: { value: TextAlignType; key: 'alignLeft' | 'alignCenter' | 'alignRight' }[] = [
  { value: 'left', key: 'alignLeft' },
  { value: 'center', key: 'alignCenter' },
  { value: 'right', key: 'alignRight' },
];

const TRANSLATED_FONT_SIZE_KEYS: { value: TranslatedFontSizeType; key: 'sizeSmall' | 'sizeMedium' | 'sizeLarge' }[] = [
  { value: 'small', key: 'sizeSmall' },
  { value: 'medium', key: 'sizeMedium' },
  { value: 'large', key: 'sizeLarge' },
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
    uiLanguage: DEFAULT_UI_LOCALE,
    enabled: true,
    targetLang: 'zh-CN',
    showOriginal: false,
    hideOriginalSubtitles: false,
    textAlign: 'center',
    translatedFontSize: 'medium',
  });

  useEffect(() => {
    chrome.storage.sync.get(
      ['uiLanguage', 'enabled', 'targetLang', 'showOriginal', 'hideOriginalSubtitles', 'textAlign', 'translatedFontSize'],
      (result) => {
        const uiLang = UI_LOCALE_OPTIONS.some((o) => o.value === result.uiLanguage)
          ? (result.uiLanguage as UiLocale)
          : DEFAULT_UI_LOCALE;
        setState({
          uiLanguage: uiLang,
          enabled: result.enabled ?? true,
          targetLang: result.targetLang ?? 'zh-CN',
          showOriginal: result.showOriginal ?? false,
          hideOriginalSubtitles: result.hideOriginalSubtitles ?? false,
          textAlign: TEXT_ALIGN_KEYS.some((o) => o.value === result.textAlign) ? (result.textAlign as TextAlignType) : 'center',
          translatedFontSize: TRANSLATED_FONT_SIZE_KEYS.some((o) => o.value === result.translatedFontSize) ? (result.translatedFontSize as TranslatedFontSizeType) : 'medium',
        });
      }
    );
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
    const textAlign = TEXT_ALIGN_KEYS.some((o) => o.value === raw) ? (raw as TextAlignType) : 'center';
    setState({ ...state, textAlign });
    chrome.storage.sync.set({ textAlign });
  };

  const handleTranslatedFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = e.target.value;
    const translatedFontSize = TRANSLATED_FONT_SIZE_KEYS.some((o) => o.value === raw) ? (raw as TranslatedFontSizeType) : 'medium';
    setState({ ...state, translatedFontSize });
    chrome.storage.sync.set({ translatedFontSize });
  };

  const handleUiLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uiLanguage = UI_LOCALE_OPTIONS.some((o) => o.value === e.target.value) ? (e.target.value as UiLocale) : DEFAULT_UI_LOCALE;
    setState({ ...state, uiLanguage });
    chrome.storage.sync.set({ uiLanguage });
  };

  const L = state.uiLanguage;

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>🎬 {t(L, 'title')}</h1>
      </header>

      <main className="popup-main">
        <div className="setting-item">
          <label className="setting-label setting-label--stack" htmlFor="ui-language-select">
            {t(L, 'uiLanguage')}
          </label>
          <select
            id="ui-language-select"
            className="language-select"
            value={state.uiLanguage}
            onChange={handleUiLanguageChange}
          >
            {UI_LOCALE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="setting-item setting-item--row">
          <div className="setting-label-block">
            <span className="setting-title">{t(L, 'enableTranslation')}</span>
            <span className={`status-badge ${state.enabled ? 'enabled' : 'disabled'}`}>
              {state.enabled ? t(L, 'enabled') : t(L, 'disabled')}
            </span>
          </div>
          <button
            className={`toggle-button ${state.enabled ? 'active' : ''}`}
            onClick={handleToggle}
            type="button"
            aria-label={state.enabled ? t(L, 'ariaDisable') : t(L, 'ariaEnable')}
          >
            <div className="toggle-slider"></div>
          </button>
        </div>

        <div className="setting-item setting-item--row">
          <div className="setting-label-block">
            <span className="setting-title">{t(L, 'showOriginal')}</span>
            <span className={`status-badge ${state.showOriginal ? 'enabled' : 'disabled'}`}>
              {state.showOriginal ? t(L, 'enabled') : t(L, 'disabled')}
            </span>
          </div>
          <button
            className={`toggle-button ${state.showOriginal ? 'active' : ''}`}
            onClick={handleShowOriginalToggle}
            type="button"
            aria-label={t(L, 'ariaToggle')}
          >
            <div className="toggle-slider"></div>
          </button>
        </div>

        <div className="setting-item setting-item--row">
          <div className="setting-label-block">
            <span className="setting-title">{t(L, 'hideOriginalSubtitles')}</span>
            <span className={`status-badge ${state.hideOriginalSubtitles ? 'enabled' : 'disabled'}`}>
              {state.hideOriginalSubtitles ? t(L, 'enabled') : t(L, 'disabled')}
            </span>
          </div>
          <button
            className={`toggle-button ${state.hideOriginalSubtitles ? 'active' : ''}`}
            onClick={handleHideOriginalSubtitlesToggle}
            type="button"
            aria-label={t(L, 'ariaToggle')}
          >
            <div className="toggle-slider"></div>
          </button>
        </div>

        <div className="setting-item">
          <label className="setting-label setting-label--stack" htmlFor="language-select">
            {t(L, 'targetLanguage')}
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

        <div className="setting-item">
          <label className="setting-label setting-label--stack" htmlFor="text-align-select">
            {t(L, 'textAlign')}
          </label>
          <select
            id="text-align-select"
            className="language-select"
            value={state.textAlign}
            onChange={handleTextAlignChange}
          >
            {TEXT_ALIGN_KEYS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(L, opt.key)}
              </option>
            ))}
          </select>
        </div>

        <div className="setting-item setting-item--last">
          <label className="setting-label setting-label--stack" htmlFor="translated-font-size-select">
            {t(L, 'translatedFontSize')}
          </label>
          <select
            id="translated-font-size-select"
            className="language-select"
            value={state.translatedFontSize}
            onChange={handleTranslatedFontSizeChange}
          >
            {TRANSLATED_FONT_SIZE_KEYS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(L, opt.key)}
              </option>
            ))}
          </select>
        </div>

        <div className="info-section">
          <p className="info-text">💡 {t(L, 'tipSubtitle')}</p>
          <p className="info-text">⌨️ {t(L, 'tipShortcut')}</p>
        </div>
      </main>
    </div>
  );
};

export default App;
