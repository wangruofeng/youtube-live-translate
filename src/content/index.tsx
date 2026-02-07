// YouTube 实时字幕翻译 Content Script
// 基于双行结构、防闪烁、序列号机制的完整实现

interface TranslationState {
  enabled: boolean;
  targetLang: string;
  showOriginal: boolean;
}

interface SubtitlePosition {
  bottom: number;
  left: number;
}

interface SubtitleData {
  original: string;
  translated: string;
  timestamp: number;
  seq: number;
}

interface TranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
  seq: number;
}

interface TranslationResponse {
  translatedText: string;
  seq: number;
}

// 翻译缓存（LRU）
class TranslationCache {
  private cache = new Map<string, { text: string; timestamp: number }>();
  private readonly maxSize = 500;
  private readonly ttl = 1000 * 60 * 60 * 24; // 24小时

  private getKey(sourceLang: string, targetLang: string, text: string): string {
    return `${sourceLang}:${targetLang}:${this.normalize(text)}`;
  }

  private normalize(text: string): string {
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  get(sourceLang: string, targetLang: string, text: string): string | null {
    const key = this.getKey(sourceLang, targetLang, text);
    const item = this.cache.get(key);

    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.text;
  }

  set(sourceLang: string, targetLang: string, text: string, translatedText: string): void {
    const key = this.getKey(sourceLang, targetLang, text);

    if (this.cache.size >= this.maxSize) {
      // 删除最旧的项
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      text: translatedText,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

class SubtitleTranslator {
  private state: TranslationState = {
    enabled: true,
    targetLang: 'zh-CN',
    showOriginal: false,
  };

  // UI 元素
  private overlay: HTMLDivElement | null = null;
  private subtitleBox: HTMLDivElement | null = null;
  private originalLine: HTMLDivElement | null = null;
  private translatedLine: HTMLDivElement | null = null;

  // 字幕状态
  private currentSubtitle: SubtitleData | null = null;
  private lastOriginalText = '';
  private debounceTimer: number | null = null;
  private hideTimer: number | null = null;
  private readonly DEBOUNCE_DELAY = 500;
  private readonly HIDE_DELAY = 5000; // 5秒无字幕后隐藏
  private seq = 0;
  private latestSeq = 0;

  // 拖拽状态
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private position: SubtitlePosition = { bottom: 80, left: 50 };

  // 字幕监听
  private observer: MutationObserver | null = null;
  private checkInterval: number | null = null;
  private isVideoPaused = false;

  // 翻译
  private cache = new TranslationCache();
  private translationQueue = new Set<string>();
  private readonly TRANSLATION_INTERVAL = 1000; // 1秒限流

  constructor() {
    this.init();
  }

  private async init() {
    console.log('[YouTube Live Translate] 初始化中...');

    const result = await chrome.storage.sync.get(['enabled', 'targetLang', 'showOriginal', 'position']);
    this.state = {
      enabled: result.enabled ?? true,
      targetLang: result.targetLang ?? 'zh-CN',
      showOriginal: result.showOriginal ?? false,
    };

    // 读取保存的位置
    if (result.position) {
      this.position = result.position;
    }

    console.log('[YouTube Live Translate] 设置:', this.state);
    console.log('[YouTube Live Translate] 位置:', this.position);

    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
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
      }
    });

    this.setupVideoPauseDetection();
    this.setupKeyboardShortcuts();
    this.createOverlay();
    this.startWatchingSubtitles();
  }

  private setupVideoPauseDetection() {
    const checkVideo = () => {
      const video = document.querySelector('video');
      if (video) {
        console.log('[YouTube Live Translate] 找到视频元素');

        video.addEventListener('pause', () => {
          console.log('[YouTube Live Translate] 视频暂停');
          this.isVideoPaused = true;
        });

        video.addEventListener('play', () => {
          console.log('[YouTube Live Translate] 视频播放');
          this.isVideoPaused = false;
        });

        this.isVideoPaused = video.paused;
      } else {
        setTimeout(checkVideo, 1000);
      }
    };

    checkVideo();
  }

  private setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Alt+T 切换原文显示
      if (e.altKey && e.key === 't') {
        e.preventDefault();
        this.state.showOriginal = !this.state.showOriginal;
        chrome.storage.sync.set({ showOriginal: this.state.showOriginal });
        this.updateOriginalVisibility();
        console.log('[YouTube Live Translate] 原文显示:', this.state.showOriginal);
      }

      // Alt+R 重置位置
      if (e.altKey && e.key === 'r') {
        e.preventDefault();
        this.position = { bottom: 80, left: 50 };
        this.savePosition();
        this.updateOverlayPosition();
        console.log('[YouTube Live Translate] 位置已重置');
      }
    });
  }

  private createOverlay() {
    // 查找播放器容器
    const player = document.querySelector('#movie_player') || document.querySelector('ytd-player');
    if (!player) {
      console.error('[YouTube Live Translate] 未找到播放器容器');
      return;
    }

    // 创建 overlay 容器
    this.overlay = document.createElement('div');
    this.overlay.id = 'yt-live-translate-overlay';
    this.updateOverlayPosition();
    this.overlay.style.cssText += `
      width: 80%;
      max-width: 1000px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      pointer-events: none;
    `;

    // 创建字幕框
    this.subtitleBox = document.createElement('div');
    this.subtitleBox.id = 'yt-live-translate-box';
    this.subtitleBox.style.cssText = `
      background: rgba(0, 0, 0, 0.85);
      padding: 12px 20px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      pointer-events: auto;
      user-select: none;
    `;

    // 原文行（默认隐藏，不支持拖拽）
    this.originalLine = document.createElement('div');
    this.originalLine.id = 'yt-live-translate-original';
    this.originalLine.style.cssText = `
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
      line-height: 1.4;
      text-align: left;
      white-space: pre-wrap;
      word-wrap: break-word;
      display: ${this.state.showOriginal ? 'block' : 'none'};
      pointer-events: none;
      cursor: default;
    `;

    // 译文行（默认显示，支持拖拽）
    this.translatedLine = document.createElement('div');
    this.translatedLine.id = 'yt-live-translate-translated';
    this.translatedLine.style.cssText = `
      color: white;
      font-size: 18px;
      line-height: 1.4;
      font-weight: 500;
      text-align: left;
      white-space: pre-wrap;
      word-wrap: break-word;
      pointer-events: auto;
      cursor: move;
    `;

    // 添加拖拽事件到译文行
    this.translatedLine.addEventListener('mousedown', this.handleMouseDown.bind(this));

    // hover 显示原文
    this.subtitleBox.addEventListener('mouseenter', () => {
      if (this.originalLine && !this.state.showOriginal) {
        this.originalLine.style.display = 'block';
      }
    });

    this.subtitleBox.addEventListener('mouseleave', () => {
      if (this.originalLine && !this.state.showOriginal) {
        this.originalLine.style.display = 'none';
      }
    });

    this.subtitleBox.appendChild(this.originalLine);
    this.subtitleBox.appendChild(this.translatedLine);
    this.overlay.appendChild(this.subtitleBox);
    player.appendChild(this.overlay);

    console.log('[YouTube Live Translate] Overlay 已创建');
  }

  private updateOverlayPosition() {
    if (!this.overlay) return;
    this.overlay.style.bottom = `${this.position.bottom}px`;
    this.overlay.style.left = `${this.position.left}%`;
    this.overlay.style.transform = 'translateX(-50%)';
    this.overlay.style.position = 'absolute';
  }

  private savePosition() {
    chrome.storage.sync.set({ position: this.position });
  }

  private handleMouseDown(e: MouseEvent) {
    // 只响应左键
    if (e.button !== 0) return;

    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;

    // 添加全局事件监听
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);

    e.preventDefault();
  }

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isDragging || !this.overlay) return;

    const deltaX = e.clientX - this.dragStartX;
    const deltaY = e.clientY - this.dragStartY;

    // 计算新的位置
    const rect = this.overlay.getBoundingClientRect();
    const parentRect = this.overlay.parentElement?.getBoundingClientRect();

    if (parentRect) {
      // 计算新的 bottom 和 left
      const newBottom = parentRect.bottom - rect.bottom + deltaY;
      const newLeft = ((rect.left + deltaX) / parentRect.width) * 100;

      // 限制范围
      this.position.bottom = Math.max(20, Math.min(newBottom, parentRect.height - 100));
      this.position.left = Math.max(10, Math.min(newLeft, 90));

      this.updateOverlayPosition();
    }

    // 更新起始位置
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
  };

  private handleMouseUp = () => {
    if (this.isDragging) {
      this.isDragging = false;
      this.savePosition();
      console.log('[YouTube Live Translate] 位置已保存:', this.position);
    }

    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  };

  private updateOriginalVisibility() {
    if (!this.originalLine) return;
    this.originalLine.style.display = this.state.showOriginal ? 'block' : 'none';
  }

  private startWatchingSubtitles() {
    console.log('[YouTube Live Translate] 开始监听字幕...');

    const selectors = [
      '.ytp-caption-segment',
      'caption-window.ytp-caption-window-bottom',
      '.captions-text',
      '.ytp-caption-window-container',
    ];

    const checkForSubtitles = () => {
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`[YouTube Live Translate] 找到字幕元素: ${selector}`);
          this.observeSubtitles(selector);
          return;
        }
      }
      setTimeout(checkForSubtitles, 1000);
    };

    checkForSubtitles();
  }

  private observeSubtitles(selector: string) {
    // 使用 MutationObserver 监听字幕变化
    this.observer = new MutationObserver(() => {
      this.handleSubtitleChange(selector);
    });

    const targetNode = document.body;
    this.observer.observe(targetNode, {
      childList: true,
      subtree: true,
    });

    // 同时使用定时器作为兜底
    this.checkInterval = window.setInterval(() => {
      this.handleSubtitleChange(selector);
    }, 200) as unknown as number;

    console.log('[YouTube Live Translate] 开始监听字幕变化');
  }

  private handleSubtitleChange(selector: string) {
    if (!this.state.enabled || this.isVideoPaused) return;

    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) {
      // 启动隐藏定时器
      this.startHideTimer();
      return;
    }

    // 提取当前字幕文本
    let currentText = '';
    elements.forEach((el) => {
      const text = el.textContent?.trim();
      if (text) {
        currentText += (currentText ? ' ' : '') + text;
      }
    });

    if (!currentText) {
      // 启动隐藏定时器
      this.startHideTimer();
      return;
    }

    // 如果文本没有变化，不处理
    if (currentText === this.lastOriginalText) return;

    console.log('[YouTube Live Translate] 检测到字幕变化:', currentText);

    // 重置隐藏定时器
    this.resetHideTimer();

    // 更新原文（实时）
    this.lastOriginalText = currentText;
    if (this.originalLine) {
      this.originalLine.textContent = currentText;
    }

    // 显示 overlay
    if (this.overlay) {
      this.overlay.style.display = 'block';
      this.overlay.style.opacity = '1';
    }

    // 清除之前的 debounce 定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // 设置新的 debounce 定时器
    this.debounceTimer = window.setTimeout(() => {
      // 字幕稳定后，触发翻译
      if (currentText === this.lastOriginalText) {
        console.log('[YouTube Live Translate] 字幕稳定，触发翻译');
        this.requestTranslation(currentText);
      }
    }, this.DEBOUNCE_DELAY);
  }

  private async requestTranslation(text: string) {
    // 生成新的序列号
    this.seq++;
    const currentSeq = this.seq;
    this.latestSeq = currentSeq;

    console.log(`[YouTube Live Translate] 请求翻译 [seq=${currentSeq}]:`, text);

    // 检查缓存
    const cached = this.cache.get('auto', this.state.targetLang, text);
    if (cached) {
      console.log(`[YouTube Live Translate] 命中缓存 [seq=${currentSeq}]`);
      this.updateTranslation(text, cached, currentSeq);
      return;
    }

    // 检查是否已在队列中
    if (this.translationQueue.has(text)) {
      console.log(`[YouTube Live Translate] 已在翻译队列中 [seq=${currentSeq}]`);
      return;
    }

    // 限流：检查最近的翻译时间
    const now = Date.now();
    const lastTranslationTime = this.currentSubtitle?.timestamp || 0;
    if (now - lastTranslationTime < this.TRANSLATION_INTERVAL) {
      // 需要等待
      const waitTime = this.TRANSLATION_INTERVAL - (now - lastTranslationTime);
      setTimeout(() => {
        this.requestTranslation(text);
      }, waitTime);
      return;
    }

    // 添加到队列
    this.translationQueue.add(text);

    try {
      const translated = await this.translateText(text);
      this.translationQueue.delete(text);
      this.cache.set('auto', this.state.targetLang, text, translated);

      // 检查序列号，只接受最新的结果
      if (currentSeq === this.latestSeq) {
        console.log(`[YouTube Live Translate] 翻译完成 [seq=${currentSeq}]:`, translated);
        this.updateTranslation(text, translated, currentSeq);
      } else {
        console.log(`[YouTube Live Translate] 丢弃过期翻译 [seq=${currentSeq}, latest=${this.latestSeq}]`);
      }
    } catch (error) {
      console.error(`[YouTube Live Translate] 翻译失败 [seq=${currentSeq}]:`, error);
      this.translationQueue.delete(text);
    }
  }

  private async translateText(text: string): Promise<string> {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${this.state.targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data && data[0]) {
      return data[0].map((item: any) => item[0]).join('');
    }

    return text;
  }

  private updateTranslation(original: string, translated: string, seq: number) {
    if (!this.translatedLine) return;

    // 更新当前字幕
    this.currentSubtitle = {
      original,
      translated,
      timestamp: Date.now(),
      seq,
    };

    // 更新 UI - 新字幕替换旧字幕
    this.translatedLine.textContent = translated;

    // 确保显示
    if (this.overlay) {
      this.overlay.style.display = 'block';
      this.overlay.style.opacity = '1';
    }

    // 重置隐藏定时器
    this.resetHideTimer();
  }

  private startHideTimer() {
    // 清除旧定时器
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }

    // 启动新的隐藏定时器
    this.hideTimer = window.setTimeout(() => {
      this.hideSubtitle();
    }, this.HIDE_DELAY);
  }

  private resetHideTimer() {
    // 重置隐藏定时器
    this.startHideTimer();
  }

  private hideSubtitle() {
    console.log('[YouTube Live Translate] 隐藏字幕');

    if (this.overlay) {
      this.overlay.style.opacity = '0';

      setTimeout(() => {
        if (this.overlay && this.overlay.style.opacity === '0') {
          this.overlay.style.display = 'none';
        }
      }, 300);
    }

    // 清空字幕内容
    if (this.originalLine) {
      this.originalLine.textContent = '';
    }
    if (this.translatedLine) {
      this.translatedLine.textContent = '';
    }
    this.lastOriginalText = '';
  }

  private clearSubtitle() {
    this.lastOriginalText = '';

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // 启动隐藏定时器
    this.startHideTimer();
  }

  private toggleTranslation() {
    if (!this.state.enabled) {
      // 清理所有定时器
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }
      if (this.hideTimer) {
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }

      this.clearSubtitle();
      this.cache.clear();
      this.translationQueue.clear();
    }
  }
}

// 等待页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SubtitleTranslator();
  });
} else {
  new SubtitleTranslator();
}

export {};

