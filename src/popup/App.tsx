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
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'th', name: 'ไทย' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Bahasa Melayu' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'pl', name: 'Polski' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'uk', name: 'Українська' },
  { code: 'he', name: 'עברית' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'ro', name: 'Română' },
  { code: 'hu', name: 'Magyar' },
  { code: 'sv', name: 'Svenska' },
  { code: 'cs', name: 'Čeština' },
  { code: 'da', name: 'Dansk' },
  { code: 'fi', name: 'Suomi' },
  { code: 'no', name: 'Norsk' },
  { code: 'bg', name: 'Български' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'ca', name: 'Català' },
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

  const AppIcon = () => (
    <span className="popup-header__icon popup-header__icon--youtube" aria-hidden>
      <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" className="popup-header__logo-svg">
        <g transform="translate(0.000000,1024.000000) scale(0.100000,-0.100000)" fill="#FF0000" stroke="none">
          <path d="M3135 8520 c-204 -41 -393 -183 -487 -366 -89 -173 -82 -37 -85 -1539 -3 -885 0 -1353 7 -1397 19 -124 68 -238 146 -339 82 -107 203 -191 341 -237 72 -23 97 -26 303 -31 l225 -6 5 -400 c3 -278 9 -406 17 -420 30 -53 113 -105 165 -105 81 0 84 2 558 476 l455 454 1135 0 c1278 0 1207 -4 1369 77 77 38 110 62 175 127 119 119 180 236 205 396 15 90 15 2630 0 2719 -37 229 -180 426 -382 526 -163 80 0 75 -2172 74 -1067 -1 -1958 -5 -1980 -9z m1348 -1295 c65 -45 92 -130 60 -197 -10 -20 -72 -92 -138 -160 -66 -68 -133 -138 -149 -155 l-28 -33 898 0 899 0 -157 158 c-86 86 -161 168 -168 181 -7 13 -12 46 -12 73 0 60 34 117 85 141 43 21 119 22 155 3 15 -8 163 -151 329 -318 343 -344 349 -353 322 -453 -9 -33 -62 -91 -317 -347 -168 -169 -320 -314 -338 -323 -126 -59 -266 58 -232 194 10 41 30 64 165 197 84 83 153 153 153 155 0 2 -400 4 -889 4 l-889 0 153 -156 c125 -127 156 -164 165 -198 15 -56 4 -106 -33 -148 -58 -66 -125 -80 -202 -43 -27 13 -146 126 -341 323 -269 270 -302 307 -312 347 -8 33 -8 56 0 89 10 39 45 78 317 352 168 169 320 315 336 323 48 25 124 21 168 -9z"/>
          <path d="M1685 3046 c-98 -45 -152 -138 -143 -249 3 -35 12 -76 21 -92 22 -42 74 -93 121 -118 l41 -22 3365 -3 c2437 -2 3379 0 3417 8 181 39 256 269 134 411 -19 23 -58 52 -85 65 l-51 24 -3385 0 -3385 0 -50 -24z"/>
          <path d="M1735 2041 c-156 -38 -239 -211 -171 -357 27 -59 90 -116 145 -132 57 -18 6767 -17 6825 0 59 18 141 100 156 158 19 70 8 162 -27 218 -32 53 -110 106 -170 116 -54 8 -6722 6 -6758 -3z"/>
        </g>
      </svg>
    </span>
  );

  return (
    <div className="popup-container">
      <header className="popup-header" role="banner">
        <AppIcon />
        <h1 className="popup-header__title">{t(L, 'title')}</h1>
      </header>

      <main className="popup-main" role="main">
        <section className="setting-group setting-group--toggles" aria-labelledby="group-toggles">
          <h2 id="group-toggles" className="setting-group__title">{t(L, 'groupToggles')}</h2>
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
          <div className="setting-item setting-item--row setting-item--last">
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
        </section>

        <section className="setting-group setting-group--options" aria-labelledby="group-options">
          <h2 id="group-options" className="setting-group__title">{t(L, 'groupOptions')}</h2>
          <div className="setting-item setting-item--inline">
            <label className="setting-label" htmlFor="ui-language-select">
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
          <div className="setting-item setting-item--inline">
            <label className="setting-label" htmlFor="language-select">
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
          <div className="setting-item setting-item--inline">
            <label className="setting-label" htmlFor="text-align-select">
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
          <div className="setting-item setting-item--last setting-item--inline">
            <label className="setting-label" htmlFor="translated-font-size-select">
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
        </section>

        <div className="info-section">
          <p className="info-text">💡 {t(L, 'tipSubtitle')}</p>
          <p className="info-text">⌨️ {t(L, 'tipShortcut')}</p>
        </div>
      </main>
    </div>
  );
};

export default App;
