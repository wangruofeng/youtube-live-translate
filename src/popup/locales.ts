/**
 * Popup UI 文案：英语（默认）、简体中文、繁体中文
 */
export type UiLocale = 'en' | 'zh-CN' | 'zh-TW';

export const UI_LOCALE_OPTIONS: { value: UiLocale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
];

const strings = {
  en: {
    title: 'YouTube Subtitle Translate',
    enableTranslation: 'Enable translation',
    enabled: 'On',
    disabled: 'Off',
    showOriginal: 'Show original',
    hideOriginalSubtitles: 'Hide YouTube captions',
    targetLanguage: 'Target language',
    textAlign: 'Text alignment',
    alignLeft: 'Left',
    alignCenter: 'Center',
    alignRight: 'Right',
    translatedFontSize: 'Translated font size',
    sizeSmall: 'Small',
    sizeMedium: 'Medium',
    sizeLarge: 'Large',
    uiLanguage: 'UI language',
    tipSubtitle: 'On YouTube video pages, subtitles are translated automatically.',
    tipShortcut: 'Shortcut: Alt/Option/Cmd + E to toggle (Mac / Windows).',
    ariaToggle: 'Toggle',
    ariaEnable: 'Enable',
    ariaDisable: 'Disable',
  },
  'zh-CN': {
    title: 'YouTube 字幕翻译',
    enableTranslation: '启用翻译',
    enabled: '已启用',
    disabled: '已禁用',
    showOriginal: '显示原文',
    hideOriginalSubtitles: '隐藏 YouTube 原字幕',
    targetLanguage: '目标语言',
    textAlign: '翻译内容对齐',
    alignLeft: '左对齐',
    alignCenter: '居中对齐',
    alignRight: '右对齐',
    translatedFontSize: '译文字体大小',
    sizeSmall: '小',
    sizeMedium: '中',
    sizeLarge: '大',
    uiLanguage: '界面语言',
    tipSubtitle: '在 YouTube 视频页面，字幕会自动显示翻译',
    tipShortcut: '快捷键：Alt/Option/Cmd + E 开启/关闭插件（兼容 Mac / Windows）',
    ariaToggle: '切换',
    ariaEnable: '启用',
    ariaDisable: '禁用',
  },
  'zh-TW': {
    title: 'YouTube 字幕翻譯',
    enableTranslation: '啟用翻譯',
    enabled: '已啟用',
    disabled: '已停用',
    showOriginal: '顯示原文',
    hideOriginalSubtitles: '隱藏 YouTube 原字幕',
    targetLanguage: '目標語言',
    textAlign: '翻譯內容對齊',
    alignLeft: '左對齊',
    alignCenter: '置中對齊',
    alignRight: '右對齊',
    translatedFontSize: '譯文字體大小',
    sizeSmall: '小',
    sizeMedium: '中',
    sizeLarge: '大',
    uiLanguage: '介面語言',
    tipSubtitle: '在 YouTube 影片頁面，字幕會自動顯示翻譯',
    tipShortcut: '快捷鍵：Alt/Option/Cmd + E 開啟/關閉外掛（相容 Mac / Windows）',
    ariaToggle: '切換',
    ariaEnable: '啟用',
    ariaDisable: '停用',
  },
} as const;

export type StringKey = keyof (typeof strings)['en'];

export function t(locale: UiLocale, key: StringKey): string {
  return strings[locale][key] ?? strings.en[key] ?? key;
}

export const DEFAULT_UI_LOCALE: UiLocale = 'en';
