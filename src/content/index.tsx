// YouTube 实时字幕翻译 Content Script
// 基于双行结构、防闪烁、序列号机制的完整实现

interface TranslationState {
  enabled: boolean;
  targetLang: string;
  showOriginal: boolean;
  hideOriginalSubtitles: boolean;
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
    hideOriginalSubtitles: false,
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
  private readonly DEBOUNCE_DELAY = 300;
  private lastProcessTime = 0;
  private readonly THROTTLE_DELAY = 100; // 节流延迟，避免高频触发
  private lastTranslatedText = ''; // 记录上次翻译的文本
  private seq = 0;
  private latestSeq = 0;

  // 拖拽状态
  private isDragging = false;
  private isClosed = false; // 关闭状态
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private position: SubtitlePosition = { bottom: 120, left: 0 }; // 距视频底部 120px，left=0 时 createOverlay 会计算居中
  private overlayWidth = 800; // 固定宽度

  // 字幕监听
  private observer: MutationObserver | null = null;
  private checkInterval: number | null = null;
  private subtitleObserver: MutationObserver | null = null; // 用于隐藏原生字幕的 observer
  private isVideoPaused = false;

  // 广告检测
  private isAdPlaying = false;
  private adCheckInterval: number | null = null;

  // 翻译
  private cache = new TranslationCache();
  private translationQueue = new Set<string>();
  private readonly TRANSLATION_INTERVAL = 1000; // 1秒限流

  constructor() {
    this.init();
  }

  private async init() {
    console.log('[YouTube Live Translate] 初始化中...');

    const result = await chrome.storage.sync.get(['enabled', 'targetLang', 'showOriginal', 'hideOriginalSubtitles', 'position', 'isClosed']);
    this.state = {
      enabled: result.enabled ?? true,
      targetLang: result.targetLang ?? 'zh-CN',
      showOriginal: result.showOriginal ?? false,
      hideOriginalSubtitles: result.hideOriginalSubtitles ?? false,
    };

    // 读取保存的位置
    if (result.position) {
      this.position = result.position;
    } else {
      // 计算默认位置（屏幕中下方）
      // 需要等待播放器加载后再计算，这里先设置一个临时值
      this.position = { bottom: 120, left: 0 };
    }

    // 读取关闭状态
    this.isClosed = result.isClosed ?? false;

    console.log('[YouTube Live Translate] 设置:', this.state);
    console.log('[YouTube Live Translate] 位置:', this.position);
    console.log('[YouTube Live Translate] 关闭状态:', this.isClosed);

    // 应用隐藏原生字幕设置
    this.updateOriginalSubtitlesVisibility();

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
        if (changes.hideOriginalSubtitles) {
          this.state.hideOriginalSubtitles = changes.hideOriginalSubtitles.newValue;
          this.updateOriginalSubtitlesVisibility();
        }
      }
    });

    this.setupVideoPauseDetection();
    this.setupAdDetection();
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

  private setupAdDetection() {
    console.log('[YouTube Live Translate] 初始化广告检测...');

    const checkForAds = () => {
      // YouTube 广告的多个特征
      const adIndicators = [
        // 广告播放器覆盖层
        '.ytp-ad-player-overlay',
        // 广告预览图片
        '.ytp-ad-preview-image',
        // 广告徽章
        '.ytp-ad-badge',
        // 跳过广告按钮
        '.ytp-ad-skip-button',
        // 广告文本
        '.ytp-ad-text',
        // 广告进度条
        '.ytp-ad-progress',
      ];

      // 检查是否存在广告元素
      let hasAdElements = false;
      for (const selector of adIndicators) {
        const element = document.querySelector(selector) as HTMLElement;
        if (element && element.offsetParent !== null) { // 确保元素可见
          hasAdElements = true;
          break;
        }
      }

      // 另一种检测方式：检查视频容器的类名
      const player = document.querySelector('#movie_player');
      if (player) {
        const playerClasses = player.classList;
        // YouTube 会在广告播放时添加这些类
        if (
          playerClasses.contains('ad-showing') ||
          playerClasses.contains('ad-interrupting')
        ) {
          hasAdElements = true;
        }
      }

      // 检测广告状态变化
      if (hasAdElements && !this.isAdPlaying) {
        // 广告开始
        console.log('[YouTube Live Translate] 检测到广告开始，隐藏字幕');
        this.isAdPlaying = true;
        if (this.overlay) {
          this.overlay.style.display = 'none';
        }
      } else if (!hasAdElements && this.isAdPlaying) {
        // 广告结束
        console.log('[YouTube Live Translate] 广告结束，显示字幕');
        this.isAdPlaying = false;
        if (this.overlay && !this.isClosed) {
          this.overlay.style.display = 'block';
        }
        // 重新应用隐藏YouTube原生字幕的设置
        this.updateOriginalSubtitlesVisibility();
      }
    };

    // 每秒检查一次广告状态
    this.adCheckInterval = window.setInterval(checkForAds, 1000) as unknown as number;

    // 初始检查
    checkForAds();
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
        // 计算默认位置（距底部 120px，水平居中）
        const player = this.overlay?.parentElement;
        if (player) {
          const rect = player.getBoundingClientRect();
          this.position = {
            bottom: 120,
            left: rect.width / 2 - this.overlayWidth / 2
          };
        } else {
          this.position = { bottom: 120, left: 400 };
        }
        this.savePosition();
        this.updateOverlayPosition();
        console.log('[YouTube Live Translate] 位置已重置:', this.position);
      }

      // Alt+O 重新打开字幕
      if (e.altKey && e.key === 'o') {
        e.preventDefault();
        this.isClosed = false;
        chrome.storage.sync.set({ isClosed: false });
        if (this.overlay) {
          this.overlay.style.display = 'block';
        }
        console.log('[YouTube Live Translate] 字幕已重新打开');
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

    // 计算默认位置（如果没有保存的位置或位置是初始值）
    const playerRect = player.getBoundingClientRect();
    if (this.position.left === 0 && playerRect.width > 0) {
      // 居中显示在中下方
      this.position = {
        bottom: 120,
        left: Math.max(20, (playerRect.width - this.overlayWidth) / 2)
      };
      // 保存计算出的默认位置
      this.savePosition();
    }

    // 创建 overlay 容器
    this.overlay = document.createElement('div');
    this.overlay.id = 'yt-live-translate-overlay';
    this.updateOverlayPosition();
    this.overlay.style.cssText = `
      width: ${this.overlayWidth}px;
      height: auto;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      pointer-events: none;
      position: absolute;
      display: none;
    `;

    // 创建字幕框
    this.subtitleBox = document.createElement('div');
    this.subtitleBox.id = 'yt-live-translate-box';
    this.subtitleBox.style.cssText = `
      background: rgba(0, 0, 0, 0.6);
      padding: 12px 20px;
      padding-top: 8px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      pointer-events: auto;
      position: relative;
      cursor: grab;
    `;

    // 拖拽事件绑定到整个字幕框
    this.subtitleBox.addEventListener('mousedown', (e) => this.handleMouseDown(e));

    // 关闭按钮
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';
    closeButton.style.cssText = `
      position: absolute;
      top: 6px;
      right: 10px;
      width: 24px;
      height: 24px;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.7);
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      user-select: none;
      z-index: 10;
    `;
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.background = 'rgba(255, 100, 100, 0.3)';
      closeButton.style.color = 'white';
    });
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.background = 'rgba(255, 255, 255, 0.1)';
      closeButton.style.color = 'rgba(255, 255, 255, 0.7)';
    });
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isClosed = true;
      if (this.overlay) {
        this.overlay.style.display = 'none';
      }
      // 保存关闭状态
      chrome.storage.sync.set({ isClosed: true });
      console.log('[YouTube Live Translate] 字幕已关闭');
    });
    closeButton.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    this.subtitleBox.appendChild(closeButton);

    // 原文行（默认隐藏）
    this.originalLine = document.createElement('div');
    this.originalLine.id = 'yt-live-translate-original';
    this.originalLine.style.cssText = `
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
      line-height: 1.4;
      text-align: left;
      white-space: pre-wrap;
      word-wrap: break-word;
      display: ${this.state.showOriginal ? '-webkit-box' : 'none'};
      pointer-events: none;
      user-select: none;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    `;

    // 译文行（默认显示）
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
      pointer-events: none;
      user-select: none;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    `;

    // 组装 DOM
    this.subtitleBox.appendChild(this.originalLine);
    this.subtitleBox.appendChild(this.translatedLine);
    this.overlay.appendChild(this.subtitleBox);
    player.appendChild(this.overlay);

    console.log('[YouTube Live Translate] Overlay 已创建');
  }

  private updateOverlayPosition() {
    if (!this.overlay) return;
    this.overlay.style.left = `${this.position.left}px`;
    this.overlay.style.bottom = `${this.position.bottom}px`;
  }

  private savePosition() {
    chrome.storage.sync.set({ position: this.position });
  }

  private handleMouseDown(e: MouseEvent) {
    // 检查点击目标是否是关闭按钮或文本区域
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.id === 'yt-live-translate-original' || target.id === 'yt-live-translate-translated') {
      return; // 不触发拖拽
    }

    e.preventDefault();
    e.stopPropagation();

    console.log('[YouTube Live Translate] 开始拖拽');

    this.isDragging = true;

    // 计算鼠标点击位置相对于 overlay 的偏移
    if (this.overlay) {
      const rect = this.overlay.getBoundingClientRect();
      // 记录鼠标在 overlay 内部的偏移
      this.dragOffsetX = e.clientX - rect.left;
      this.dragOffsetY = rect.bottom - e.clientY; // 注意：这里用 bottom - clientY
    }

    // 改变光标样式
    if (this.subtitleBox) {
      this.subtitleBox.style.cursor = 'grabbing';
    }

    // 添加全局事件监听
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isDragging || !this.overlay) return;

    const parent = this.overlay.parentElement;
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();

    // 计算新的位置
    // left: 鼠标位置 - offset
    // bottom: 父容器底部 - (鼠标位置 + offset的修正)
    let newLeft = e.clientX - parentRect.left - this.dragOffsetX;
    let newBottom = parentRect.bottom - e.clientY - this.dragOffsetY;

    // 限制范围
    const maxLeft = parentRect.width - this.overlayWidth;
    const minLeft = 0;
    const maxBottom = parentRect.height - 50;
    const minBottom = 20;

    this.position.left = Math.max(minLeft, Math.min(newLeft, maxLeft));
    this.position.bottom = Math.max(minBottom, Math.min(newBottom, maxBottom));

    this.updateOverlayPosition();
  };

  private handleMouseUp = () => {
    if (this.isDragging) {
      this.isDragging = false;
      this.savePosition();
      console.log('[YouTube Live Translate] 拖拽结束，位置已保存:', this.position);

      // 恢复光标样式
      if (this.subtitleBox) {
        this.subtitleBox.style.cursor = 'grab';
      }
    }

    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  };

  private updateOriginalVisibility() {
    if (!this.originalLine) return;
    this.originalLine.style.display = this.state.showOriginal ? '-webkit-box' : 'none';
  }

  private updateOriginalSubtitlesVisibility() {
    // 隐藏/显示 YouTube 原生字幕
    const hideShowSubtitles = () => {
      // YouTube 原生字幕的选择器
      const youtubeSubtitles = [
        '.ytp-caption-segment',
        'caption-window.ytp-caption-window-bottom',
        '.captions-text',
        '.ytp-caption-window-container',
      ];

      youtubeSubtitles.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
          if (this.state.hideOriginalSubtitles) {
            (element as HTMLElement).style.opacity = '0';
            (element as HTMLElement).style.visibility = 'hidden';
          } else {
            (element as HTMLElement).style.opacity = '';
            (element as HTMLElement).style.visibility = '';
          }
        });
      });

      // 同时处理字幕容器
      const player = document.querySelector('#movie_player') || document.querySelector('ytd-player');
      if (player) {
        const captionContainers = player.querySelectorAll('.caption-visual-line');
        captionContainers.forEach((container) => {
          if (this.state.hideOriginalSubtitles) {
            (container as HTMLElement).style.display = 'none';
          } else {
            (container as HTMLElement).style.display = '';
          }
        });
      }
    };

    // 立即执行一次
    hideShowSubtitles();

    // 如果启用了隐藏原生字幕，使用MutationObserver持续监听新出现的字幕元素
    if (this.state.hideOriginalSubtitles) {
      if (this.subtitleObserver) {
        this.subtitleObserver.disconnect();
      }

      this.subtitleObserver = new MutationObserver(() => {
        hideShowSubtitles();
      });

      this.subtitleObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    } else {
      if (this.subtitleObserver) {
        this.subtitleObserver.disconnect();
        this.subtitleObserver = null;
      }
    }
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
    if (!this.state.enabled || this.isVideoPaused || this.isAdPlaying) return;

    // 节流检查：避免高频触发
    const now = Date.now();
    if (now - this.lastProcessTime < this.THROTTLE_DELAY) {
      return;
    }

    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) {
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
      return;
    }

    // 如果文本没有变化，不处理
    if (currentText === this.lastOriginalText) return;

    // 检测是否是新句子（文本变短说明是新句子）
    const isNewSentence = currentText.length < this.lastOriginalText.length;

    let textToTranslate = currentText;
    let shouldRefreshUI = false;
    let shouldTranslateImmediately = false; // 是否立即翻译

    // 如果是新句子，直接使用
    if (isNewSentence) {
      textToTranslate = currentText;
      shouldRefreshUI = true;
      this.lastTranslatedText = ''; // 清空已翻译记录
      console.log('[YouTube Live Translate] 新句子，刷新UI');
    } else if (currentText.length > 200) {
      // 如果文本太长（超过200字符），截断并立即翻译
      const maxLength = 150;
      const truncated = currentText.slice(-maxLength);
      const firstSpace = truncated.indexOf(' ');
      if (firstSpace > 0 && firstSpace < 50) {
        textToTranslate = truncated.slice(firstSpace + 1);
      } else {
        textToTranslate = truncated;
      }
      shouldRefreshUI = true;
      shouldTranslateImmediately = true; // 立即翻译
      console.log('[YouTube Live Translate] 文本过长，截断并立即翻译');
    } else if (!currentText.includes(this.lastOriginalText)) {
      // 如果当前文本不包含之前的文本，说明是完全不同的内容
      textToTranslate = currentText;
      shouldRefreshUI = true;
      console.log('[YouTube Live Translate] 内容不同，刷新UI');
    } else {
      // 是追加的文本且未超过长度限制，不刷新UI
      textToTranslate = currentText;
      shouldRefreshUI = false;
      console.log('[YouTube Live Translate] 追加文本，不刷新UI');
    }

    // 如果处理后的文本还是和上次相同，不处理
    if (textToTranslate === this.lastOriginalText && !shouldRefreshUI) {
      return;
    }

    // 更新原文（根据是否需要刷新决定是否更新UI）
    this.lastOriginalText = textToTranslate;
    this.lastProcessTime = now;

    if (shouldRefreshUI) {
      if (this.originalLine) {
        this.originalLine.textContent = this.lastOriginalText;
      }

      // 仅当未关闭字幕时显示 overlay
      if (this.overlay && !this.isClosed) {
        this.overlay.style.display = 'block';
        this.overlay.style.opacity = '1';
      }

      // 如果需要立即翻译，直接请求
      if (shouldTranslateImmediately) {
        // 检查是否和上次翻译的文本相同，避免重复翻译
        if (textToTranslate !== this.lastTranslatedText) {
          console.log('[YouTube Live Translate] 立即触发翻译');
          this.lastTranslatedText = textToTranslate;
          this.requestTranslation(textToTranslate);
        } else {
          console.log('[YouTube Live Translate] 文本已翻译过，跳过');
        }
      } else {
        // 否则使用 debounce 等待字幕稳定
        // 清除之前的 debounce 定时器
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }

        // 设置新的 debounce 定时器
        const textForTranslation = this.lastOriginalText;
        this.debounceTimer = window.setTimeout(() => {
          if (textForTranslation === this.lastOriginalText) {
            console.log('[YouTube Live Translate] 字幕稳定，触发翻译');
            this.requestTranslation(textForTranslation);
          }
        }, this.DEBOUNCE_DELAY);
      }
    }
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
    if (!response.ok) {
      throw new Error(`翻译请求失败: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    if (data && Array.isArray(data[0])) {
      const parts = data[0]
        .map((item: unknown) => (item && Array.isArray(item) ? item[0] : null))
        .filter((s): s is string => s != null && typeof s === 'string');
      return parts.length > 0 ? parts.join('') : text;
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

    // 记录已翻译的文本
    this.lastTranslatedText = original;

    // 更新 UI - 新字幕替换旧字幕
    this.translatedLine.textContent = translated;

    // 仅当未关闭字幕时显示 overlay
    if (this.overlay && !this.isClosed) {
      this.overlay.style.display = 'block';
      this.overlay.style.opacity = '1';
    }

    console.log('[YouTube Live Translate] 译文已更新');
  }

  private clearSubtitle() {
    this.lastOriginalText = '';

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.originalLine) {
      this.originalLine.textContent = '';
    }
    if (this.translatedLine) {
      this.translatedLine.textContent = '';
    }
  }

  private toggleTranslation() {
    if (!this.state.enabled) {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }

      this.clearSubtitle();
      this.cache.clear();
      this.translationQueue.clear();

      // 禁用翻译时隐藏 overlay
      if (this.overlay) {
        this.overlay.style.display = 'none';
      }
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

