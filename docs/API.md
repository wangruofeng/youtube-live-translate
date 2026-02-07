# API 文档

## 目录

- [API 概述](#api-概述)
- [Chrome Storage API](#chrome-storage-api)
- [Content Script API](#content-script-api)
- [Popup API](#popup-api)
- [消息传递](#消息传递)
- [配置接口](#配置接口)

## API 概述

YouTube Live Translate 提供以下 API：

1. **Chrome Storage API** - 存储和同步用户设置
2. **Content Script API** - 字幕监听和翻译
3. **Popup API** - 用户界面交互
4. **消息传递** - 模块间通信

## Chrome Storage API

### 存储结构

```typescript
interface StorageData {
  // 启用状态
  enabled?: boolean;
  
  // 目标语言
  targetLang?: string;
  
  // 显示原文
  showOriginal?: boolean;
  
  // 隐藏 YouTube 原字幕
  hideOriginalSubtitles?: boolean;
  
  // 翻译内容对齐：'left' | 'center' | 'right'
  textAlign?: string;
  
  // 译文字体大小：'small' | 'medium' | 'large'，默认 'medium'
  translatedFontSize?: string;
  
  // 字幕位置
  position?: {
    bottom: number;
    left: number;
  };
  
  // 关闭状态
  isClosed?: boolean;
}
```

### 读取数据

```typescript
// 读取单个键
chrome.storage.sync.get('enabled', (result) => {
  console.log(result.enabled);
});

// 读取多个键
chrome.storage.sync.get(['enabled', 'targetLang'], (result) => {
  console.log(result.enabled, result.targetLang);
});

// 读取所有键
chrome.storage.sync.get(null, (result) => {
  console.log(result);
});

// Promise 版本
const result = await chrome.storage.sync.get(['enabled']);
```

### 写入数据

```typescript
// 写入单个键值
chrome.storage.sync.set({ enabled: true });

// 写入多个键值
chrome.storage.sync.set({
  enabled: true,
  targetLang: 'zh-CN'
});

// Promise 版本
await chrome.storage.sync.set({ enabled: true });
```

### 监听变化

```typescript
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes.enabled) {
      const { oldValue, newValue } = changes.enabled;
      console.log('enabled changed from', oldValue, 'to', newValue);
    }
  }
});
```

### 使用示例

```typescript
// Content Script 中监听设置变化
class SubtitleTranslator {
  private setupStorageListener() {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace !== 'sync') return;
      
      if (changes.enabled) {
        this.state.enabled = changes.enabled.newValue;
        this.toggleTranslation();
      }
      
      if (changes.targetLang) {
        this.state.targetLang = changes.targetLang.newValue;
        this.cache.clear();
      }
      
      if (changes.showOriginal) {
        this.state.showOriginal = changes.showOriginal.newValue;
        this.updateOriginalVisibility();
      }
      
      if (changes.hideOriginalSubtitles) {
        this.state.hideOriginalSubtitles = changes.hideOriginalSubtitles.newValue;
        this.updateOriginalSubtitlesVisibility();
      }
      
      if (changes.textAlign) {
        this.state.textAlign = changes.textAlign.newValue;
        this.updateTextAlign();
      }
      
      if (changes.translatedFontSize) {
        this.state.translatedFontSize = changes.translatedFontSize.newValue;
        this.updateTranslatedFontSize();
      }
    });
  }
}
```

## Content Script API

### 类：SubtitleTranslator

Content Script 的核心类，负责字幕监听、翻译和 UI 渲染。

#### 构造函数

```typescript
constructor()
```

**说明**：创建 SubtitleTranslator 实例并初始化。

**示例**：
```typescript
const translator = new SubtitleTranslator();
```

#### 方法

##### 初始化相关

```typescript
private async init(): Promise<void>
```

**说明**：初始化翻译器，加载设置、设置监听器。

**调用时机**：构造函数自动调用

```typescript
private setupVideoPauseDetection(): void
```

**说明**：监听视频暂停/播放事件。

```typescript
private setupAdDetection(): void
```

**说明**：设置广告检测，每秒检查一次。

```typescript
private setupKeyboardShortcuts(): void
```

**说明**：注册全局快捷键。

**快捷键**：
- `Modifier + E` - 开启/关闭插件（切换翻译启用状态）；Modifier 为 Alt（Windows/Linux）或 Option/Command（Mac）

##### 字幕监听

```typescript
private startWatchingSubtitles(): void
```

**说明**：开始监听字幕变化。

```typescript
private observeSubtitles(selector: string): void
```

**参数**：
- `selector` - CSS 选择器

**说明**：使用 MutationObserver 监听字幕元素。

```typescript
private handleSubtitleChange(selector: string): void
```

**参数**：
- `selector` - CSS 选择器

**说明**：处理字幕变化事件。

**处理流程**：
1. 节流检查（60ms）
2. 去重检查
3. 场景判断（新句子/超长/不同/追加）
4. 翻译决策

##### 翻译相关

```typescript
private async requestTranslation(text: string): Promise<void>
```

**参数**：
- `text` - 待翻译文本

**说明**：请求翻译，包含缓存、限流、队列管理。

**流程**：
```
1. 生成序列号
2. 检查缓存
3. 检查队列
4. 限流检查（500ms）
5. 调用翻译 API
6. 序列号验证
7. 更新 UI
```

```typescript
private async translateText(text: string): Promise<string>
```

**参数**：
- `text` - 待翻译文本

**返回**：翻译后的文本

**说明**：调用 Google Translate API。

**API 端点**：
```
https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl={targetLang}&dt=t&q={text}
```

```typescript
private updateTranslation(original: string, translated: string, seq: number): void
```

**参数**：
- `original` - 原文
- `translated` - 译文
- `seq` - 序列号

**说明**：更新翻译显示，只接受最新的序列号。

##### UI 相关

```typescript
private createOverlay(): void
```

**说明**：创建字幕 DOM 结构。

**DOM 结构**：
```html
<div id="yt-live-translate-overlay">
  <div id="yt-live-translate-box">
    <button>✕</button>
    <div id="yt-live-translate-original"></div>
    <div id="yt-live-translate-translated"></div>
  </div>
</div>
```

```typescript
private updateOverlayPosition(): void
```

**说明**：更新字幕位置。

```typescript
private updateOriginalVisibility(): void
```

**说明**：更新原文可见性。

```typescript
private updateOriginalSubtitlesVisibility(): void
```

**说明**：更新 YouTube 原生字幕可见性。

```typescript
private updateTextAlign(): void
```

**说明**：更新原文与译文的文本对齐方式（左/中/右）。

```typescript
private updateTranslatedFontSize(): void
```

**说明**：更新译文字体大小（小 14px / 中 18px / 大 22px）。

##### 拖拽相关

```typescript
private handleMouseDown(e: MouseEvent): void
```

**参数**：
- `e` - 鼠标事件

**说明**：处理鼠标按下事件，开始拖拽。

```typescript
private handleMouseMove: (e: MouseEvent) => void
```

**参数**：
- `e` - 鼠标事件

**说明**：处理鼠标移动事件，更新位置。

```typescript
private handleMouseUp: () => void
```

**说明**：处理鼠标抬起事件，结束拖拽并保存位置。

### 类：TranslationCache

LRU 缓存实现，用于存储翻译结果。

#### 方法

```typescript
get(sourceLang: string, targetLang: string, text: string): string | null
```

**参数**：
- `sourceLang` - 源语言
- `targetLang` - 目标语言
- `text` - 原文

**返回**：翻译文本，如果不存在或已过期返回 `null`

```typescript
set(sourceLang: string, targetLang: string, text: string, translatedText: string): void
```

**参数**：
- `sourceLang` - 源语言
- `targetLang` - 目标语言
- `text` - 原文
- `translatedText` - 译文

**说明**：存储翻译结果，如果超过最大大小则移除最早的条目。

```typescript
clear(): void
```

**说明**：清空缓存。

## Popup API

### React 组件：App

主设置组件。

#### State

```typescript
interface PopupState {
  enabled: boolean;
  targetLang: string;
  showOriginal: boolean;
  hideOriginalSubtitles: boolean;
}
```

#### 方法

```typescript
const handleToggle: () => void
```

**说明**：切换启用/禁用状态。

```typescript
const handleLanguageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
```

**说明**：更改目标语言。

```typescript
const handleShowOriginalToggle: () => void
```

**说明**：切换原文显示。

```typescript
const handleHideOriginalSubtitlesToggle: () => void
```

**说明**：切换隐藏 YouTube 原字幕。

### 支持的语言列表

```typescript
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
```

## 消息传递

### 从 Popup 发送消息到 Content Script

```typescript
// Popup 中
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, {
    type: 'UPDATE_SETTINGS',
    data: { enabled: true }
  });
});

// Content Script 中
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_SETTINGS') {
    // 处理消息
    sendResponse({ success: true });
  }
});
```

### 从 Content Script 发送消息到 Background

```typescript
// Content Script 中
chrome.runtime.sendMessage({
  type: 'TRANSLATE',
  data: { text: 'Hello' }
}, (response) => {
  console.log(response.translated);
});

// Background 中
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRANSLATE') {
    // 处理翻译
    sendResponse({ translated: '你好' });
  }
  return true; // 保持消息通道开启
});
```

## 配置接口

### 接口定义

#### TranslationState

```typescript
interface TranslationState {
  enabled: boolean;              // 启用状态
  targetLang: string;            // 目标语言代码
  showOriginal: boolean;         // 显示原文
  hideOriginalSubtitles: boolean; // 隐藏 YouTube 原字幕
}
```

#### SubtitlePosition

```typescript
interface SubtitlePosition {
  bottom: number;  // 距离底部像素
  left: number;    // 距离左侧像素
}
```

#### SubtitleData

```typescript
interface SubtitleData {
  original: string;     // 原文
  translated: string;   // 译文
  timestamp: number;    // 时间戳
  seq: number;         // 序列号
}
```

#### TranslationRequest

```typescript
interface TranslationRequest {
  text: string;        // 待翻译文本
  sourceLang: string;  // 源语言
  targetLang: string;  // 目标语言
  seq: number;        // 序列号
}
```

#### TranslationResponse

```typescript
interface TranslationResponse {
  translatedText: string;  // 翻译文本
  seq: number;           // 序列号
}
```

## 常量定义

### 时间常量

```typescript
const DEBOUNCE_DELAY = 300;        // 防抖延迟（毫秒）
const THROTTLE_DELAY = 100;        // 节流延迟（毫秒）
const TRANSLATION_INTERVAL = 1000;  // 翻译间隔（毫秒）
```

### 尺寸常量

```typescript
const OVERLAY_WIDTH = 800;   // 字幕控件宽度（像素）
const MAX_TEXT_LENGTH = 200; // 最大文本长度（字符）
const TRUNCATE_LENGTH = 150; // 截断长度（字符）
```

### 缓存常量

```typescript
const CACHE_MAX_SIZE = 500;           // 最大缓存条目
const CACHE_TTL = 24 * 60 * 60 * 1000; // 缓存有效期（24小时）
```

## 错误处理

### 错误类型

```typescript
// 翻译错误
class TranslationError extends Error {
  constructor(message: string, public readonly originalText: string) {
    super(message);
  }
}

// 网络错误
class NetworkError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
  }
}
```

### 错误处理示例

```typescript
try {
  const translated = await this.translateText(text);
  this.updateTranslation(text, translated, seq);
} catch (error) {
  if (error instanceof TranslationError) {
    console.error('翻译失败:', error.message);
    // 降级处理：显示原文
    this.translatedLine.textContent = error.originalText;
  } else {
    console.error('未知错误:', error);
  }
}
```

## 扩展开发指南

### 添加新的翻译服务

```typescript
// 1. 修改 translateText 方法
private async translateText(text: string): Promise<string> {
  // 使用新的 API
  const response = await fetch('https://api.example.com/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: text,
      source: 'auto',
      target: this.state.targetLang
    })
  });
  
  const data = await response.json();
  return data.translatedText;
}
```

### 添加新的语言支持

```typescript
// 在 src/popup/App.tsx 中添加
const TARGET_LANGUAGES = [
  // ... 现有语言
  { code: 'pt', name: 'Português' },
  { code: 'it', name: 'Italiano' },
];
```

### 自定义样式

```typescript
// 在 createOverlay 方法中修改
this.subtitleBox.style.cssText = `
  background: rgba(0, 0, 0, 0.8);  /* 修改背景透明度 */
  padding: 16px 24px;              /* 修改内边距 */
  border-radius: 12px;            /* 修改圆角 */
`;
```

## 最佳实践

### 性能优化

1. **使用缓存**：避免重复翻译相同内容
2. **节流和防抖**：限制高频操作
3. **序列号机制**：防止旧结果覆盖新结果
4. **队列管理**：避免并发翻译

### 代码规范

1. **使用 TypeScript**：提供类型安全
2. **错误处理**：优雅降级
3. **日志记录**：便于调试
4. **模块化**：保持代码清晰

### 安全建议

1. **CSP**：遵守内容安全策略
2. **权限最小化**：只请求必要的权限
3. **数据隐私**：不上传敏感信息
4. **输入验证**：验证用户输入

---

**文档版本**: 1.0.0  
**最后更新**: 2026-02-07  
**维护者**: YouTube Live Translate Team
