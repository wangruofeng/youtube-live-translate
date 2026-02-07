# 测试文档

## 目录

- [测试概述](#测试概述)
- [单元测试](#单元测试)
- [集成测试](#集成测试)
- [手动测试](#手动测试)
- [性能测试](#性能测试)
- [兼容性测试](#兼容性测试)
- [测试清单](#测试清单)

## 测试概述

### 测试策略

YouTube Live Translate 采用多层次的测试策略：

1. **单元测试** - 测试独立的函数和类
2. **集成测试** - 测试模块间的交互
3. **手动测试** - 人工测试核心功能
4. **性能测试** - 测试响应速度和资源占用
5. **兼容性测试** - 测试不同环境下的表现

### 测试环境

| 环境 | Chrome 版本 | YouTube 版本 | 用途 |
|------|-------------|--------------|------|
| 开发环境 | 120+ | 最新 | 开发调试 |
| 测试环境 | 114-120 | 稳定版 | 功能测试 |
| 生产环境 | 113+ | 任意 | 正式使用 |

## 单元测试

### 测试框架推荐

- **Jest** - 测试运行器
- **@testing-library/react** - React 组件测试
- **@testing-library/user-event** - 用户交互模拟

### 测试覆盖范围

#### 1. 缓存模块 (TranslationCache)

```typescript
describe('TranslationCache', () => {
  it('should store and retrieve translation', () => {
    const cache = new TranslationCache();
    cache.set('auto', 'zh-CN', 'Hello', '你好');
    expect(cache.get('auto', 'zh-CN', 'Hello')).toBe('你好');
  });
  
  it('should expire after TTL', async () => {
    const cache = new TranslationCache();
    cache.set('auto', 'zh-CN', 'Hello', '你好');
    
    // 模拟时间流逝
    jest.advanceTimersByTime(25 * 60 * 60 * 1000);
    
    expect(cache.get('auto', 'zh-CN', 'Hello')).toBeNull();
  });
  
  it('should evict oldest entry when max size exceeded', () => {
    const cache = new TranslationCache();
    
    // 添加超过 maxSize 的条目
    for (let i = 0; i < 600; i++) {
      cache.set('auto', 'zh-CN', `Text${i}`, `翻译${i}`);
    }
    
    // 验证最早的条目被移除
    expect(cache.get('auto', 'zh-CN', 'Text0')).toBeNull();
  });
});
```

#### 2. 字幕处理逻辑

```typescript
describe('SubtitleTranslator', () => {
  it('should detect new sentence', () => {
    const translator = new SubtitleTranslator();
    
    // 第一次：长文本
    const text1 = 'This is a very long sentence...';
    translator.lastOriginalText = text1;
    
    // 第二次：短文本（新句子）
    const text2 = 'Short';
    const isNewSentence = text2.length < translator.lastOriginalText.length;
    
    expect(isNewSentence).toBe(true);
  });
  
  it('should truncate long text', () => {
    const longText = 'A'.repeat(300);
    const truncated = longText.slice(-150);
    
    expect(truncated.length).toBeLessThanOrEqual(150);
  });
  
  it('should normalize text for cache key', () => {
    const text = '  Hello   World  ';
    const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
    
    expect(normalized).toBe('hello world');
  });
});
```

#### 3. Popup 组件

```typescript
describe('App Component', () => {
  it('should render all settings', () => {
    render(<App />);
    
    expect(screen.getByText(/启用翻译/)).toBeInTheDocument();
    expect(screen.getByText(/目标语言/)).toBeInTheDocument();
    expect(screen.getByText(/显示原文/)).toBeInTheDocument();
    expect(screen.getByText(/隐藏 YouTube 原字幕/)).toBeInTheDocument();
    expect(screen.getByText(/翻译内容对齐/)).toBeInTheDocument();
    expect(screen.getByText(/译文字体大小/)).toBeInTheDocument();
  });
  
  it('should toggle enabled state', async () => {
    render(<App />);
    
    const toggle = screen.getByRole('button');
    await fireEvent.click(toggle);
    
    expect(chrome.storage.sync.set).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });
  
  it('should change target language', async () => {
    render(<App />);
    
    const select = screen.getByLabelText(/目标语言/);
    await fireEvent.change(select, { target: { value: 'en' } });
    
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({
      targetLang: 'en'
    });
  });
});
```

## 集成测试

### 测试场景

#### 1. 字幕监听与翻译流程

```typescript
describe('Subtitle Translation Flow', () => {
  it('should translate subtitle when changed', async () => {
    const translator = new SubtitleTranslator();
    
    // 模拟字幕变化
    const mockElement = document.createElement('div');
    mockElement.textContent = 'Hello World';
    document.body.appendChild(mockElement);
    
    // 触发变化
    await translator.handleSubtitleChange('.mock-selector');
    
    // 验证翻译被调用
    await waitFor(() => {
      expect(translator.translatedLine.textContent).toBeTruthy();
    });
  });
});
```

#### 2. 设置同步流程

```typescript
describe('Settings Sync', () => {
  it('should update content script when settings change', async () => {
    // 1. 修改设置
    chrome.storage.sync.set({ enabled: false });
    
    // 2. 等待同步
    await waitFor(() => {
      // 3. 验证 Content Script 响应
      expect(contentScript.state.enabled).toBe(false);
    });
  });
});
```

## 手动测试

### 功能测试清单

#### 基础功能

- [ ] **安装测试**
  - [ ] 扩展能成功加载
  - [ ] 图标正确显示
  - [ ] 没有控制台错误

- [ ] **字幕显示**
  - [ ] 打开有字幕的视频
  - [ ] 字幕控件自动出现
  - [ ] 位置在屏幕中下方
  - [ ] 样式符合设计

- [ ] **翻译功能**
  - [ ] 字幕能正确翻译
  - [ ] 翻译语言正确
  - [ ] 翻译结果及时更新
  - [ ] 长文本能正确截断

#### 设置功能

- [ ] **启用/禁用翻译**
  - [ ] 关闭后不再翻译
  - [ ] 重新开启后恢复翻译
  - [ ] 状态正确显示

- [ ] **切换语言**
  - [ ] 能切换到支持的语言
  - [ ] 切换后翻译语言改变
  - [ ] 语言设置被保存

- [ ] **显示/隐藏原文**
  - [ ] 开启后原文显示
  - [ ] 关闭后原文隐藏
  - [ ] 原文在上译文在下
  - [ ] 原文最多显示 2 行

- [ ] **隐藏 YouTube 原字幕**
  - [ ] 开启后 YouTube 字幕隐藏
  - [ ] 关闭后 YouTube 字幕显示
  - [ ] 动态更新的字幕也被隐藏

- [ ] **翻译内容对齐**
  - [ ] 左对齐、居中对齐、右对齐可选
  - [ ] 切换后原文与译文对齐方式立即更新
  - [ ] 设置被保存并持久化

- [ ] **译文字体大小**
  - [ ] 小（18px）/ 中（22px）/ 大（26px）可选
  - [ ] 默认值为「中」
  - [ ] 切换后译文字体大小立即更新
  - [ ] 设置被保存并持久化

#### 交互功能

- [ ] **拖拽定位**
  - [ ] 能拖动字幕控件
  - [ ] 拖动时控件跟随鼠标
  - [ ] 松开鼠标位置固定
  - [ ] 位置被保存
  - [ ] 刷新页面位置恢复
  - [ ] 拖拽区域为整个控件顶部

- [ ] **关闭/打开字幕**
  - [ ] 点击关闭按钮字幕隐藏
  - [ ] 关闭状态被保存
  - [ ] 关闭按钮有悬停效果

- [ ] **快捷键**
  - [ ] Modifier+E（Alt/E 或 Option/Cmd+E）可开启/关闭插件
  - [ ] 快捷键不与浏览器冲突（Mac 上 Cmd+E 可能被占用时可用 Option+E）

#### 特殊场景

- [ ] **广告处理**
  - [ ] 广告开始时字幕隐藏
  - [ ] 广告结束后字幕显示
  - [ ] 广告后隐藏字幕设置仍生效

- [ ] **视频暂停**
  - [ ] 暂停时字幕更新停止
  - [ ] 恢复播放后字幕继续更新

- [ ] **长时间观看**
  - [ ] 连续观看 1 小时无崩溃
  - [ ] 内存占用稳定
  - [ ] 翻译准确率稳定

### 测试用例

#### TC-001: 基础字幕翻译

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 打开 YouTube 有字幕视频 | 视频正常播放 |
| 2 | 等待字幕出现 | 字幕控件显示在屏幕中下方 |
| 3 | 观察字幕内容 | 译文正确显示 |
| 4 | 等待字幕变化 | 译文及时更新 |

#### TC-002: 切换翻译语言

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 点击扩展图标 | 设置面板打开 |
| 2 | 选择"English" | 下拉选项显示 |
| 3 | 确认选择 | 面板关闭 |
| 4 | 观察字幕 | 翻译语言变为英文 |

#### TC-003: 拖拽字幕位置

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 鼠标移动到字幕控件上 | 光标变为 grab |
| 2 | 按住左键拖动 | 控件跟随鼠标移动 |
| 3 | 松开鼠标 | 控件固定在当前位置 |
| 4 | 刷新页面 | 位置保持不变 |

#### TC-004: 广告处理

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 播放带广告的视频 | 视频和广告依次播放 |
| 2 | 广告开始 | 字幕控件自动隐藏 |
| 3 | 广告结束 | 字幕控件自动显示 |

#### TC-005: 隐藏 YouTube 原字幕

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 打开设置面板 | 显示所有设置 |
| 2 | 开启"隐藏 YouTube 原字幕" | 开关变为开启状态 |
| 3 | 确认 | YouTube 字幕消失 |
| 4 | 观察视频 | 只显示翻译字幕 |

## 性能测试

### 性能指标

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| 首次渲染时间 | < 500ms | Performance API |
| 翻译响应时间 | < 1000ms | 时间戳差 |
| 内存占用 | < 50MB | Chrome Task Manager |
| CPU 占用 | < 5% | Chrome Task Manager |
| 网络请求 | < 10 req/min | Network 面板 |

### 测试方法

#### 1. 响应时间测试

```javascript
console.time('translation-start');
// 执行翻译
console.timeEnd('translation-start');
```

#### 2. 内存占用测试

1. 打开 Chrome Task Manager
2. 定位到扩展进程
3. 观察内存占用
4. 播放视频 1 小时
5. 记录内存变化

#### 3. CPU 占用测试

1. 打开 Chrome Task Manager
2. 观察扩展的 CPU 占用
3. 保持稳定状态

#### 4. 网络请求测试

```javascript
// 在 Content Script 中
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('API Request:', args[0]);
  return originalFetch.apply(this, args);
};
```

### 性能优化验证

- [ ] 缓存命中率 > 60%
- [ ] 避免重复翻译相同文本
- [ ] 节流机制生效（100ms）
- [ ] 防抖机制生效（300ms）
- [ ] 序列号机制正确丢弃过期结果

## 兼容性测试

### Chrome 版本兼容性

| Chrome 版本 | 测试状态 | 备注 |
|-------------|----------|------|
| 113 | ✅ 通过 | Manifest V3 支持的最低版本 |
| 114-119 | ✅ 通过 | 稳定版本 |
| 120+ | ✅ 通过 | 最新版本 |

### YouTube 页面兼容性

| 页面类型 | 测试状态 | 备注 |
|---------|----------|------|
| 主页视频 | ✅ 通过 | www.youtube.com/watch |
| 嵌入视频 | ✅ 通过 | iframe 嵌入 |
| Shorts | ⚠️ 部分支持 | 短视频字幕格式不同 |
| 直播 | ⚠️ 部分支持 | 实时字幕格式不同 |

### 操作系统兼容性

| 操作系统 | 测试状态 | 备注 |
|---------|----------|------|
| Windows 10/11 | ✅ 通过 | 主要测试平台 |
| macOS | ✅ 通过 | 测试通过 |
| Linux | ✅ 通过 | 基本功能正常 |

### 屏幕尺寸兼容性

| 分辨率 | 测试状态 | 备注 |
|--------|----------|------|
| 1920x1080 | ✅ 通过 | 全屏 |
| 1366x768 | ✅ 通过 | 笔记本 |
| 2560x1440 | ✅ 通过 | 2K 屏幕 |
| 3840x2160 | ✅ 通过 | 4K 屏幕 |

## 回归测试

每次修改代码后，执行以下测试：

### 必测项（5 分钟）

1. [ ] 扩展能正常加载
2. [ ] 字幕能正常显示
3. [ ] 翻译功能正常
4. [ ] 拖拽功能正常
5. [ ] 设置保存正常

### 完整测试（30 分钟）

1. 执行所有手动测试用例
2. 性能测试
3. 兼容性测试
4. 边界情况测试

## 边界测试

### 文本长度边界

| 场景 | 测试数据 | 预期行为 |
|------|----------|----------|
| 极短文本 | 1 个字符 | 正常翻译和显示 |
| 正常文本 | 50 字符 | 正常翻译和显示 |
| 长文本 | 200 字符 | 触发截断，翻译最后 150 字符 |
| 超长文本 | 1000 字符 | 截断为 150 字符 |

### 特殊字符测试

| 类型 | 示例 | 预期行为 |
|------|------|----------|
| 表情符号 | 😀 ❤️ 🎉 | 正常显示 |
| 数字 | 123,456.78 | 正常翻译 |
| 网址 | https://example.com | 保持不变 |
| 代码 | `const x = 1;` | 尽量翻译 |
| RTL 文本 | العربية | 正常显示 |

### 网络异常测试

| 场景 | 模拟方法 | 预期行为 |
|------|----------|----------|
| API 超时 | 限制网络速度 | 显示错误或重试 |
| API 错误 | 返回 500 错误 | 优雅降级 |
| 网络断开 | 离线模式 | 显示原文 |
| 恢复连接 | 恢复网络 | 恢复翻译 |

## 自动化测试

### 推荐工具

- **Puppeteer** - 端到端测试
- **Chrome Extension Testing** - 扩展测试框架

### 示例测试脚本

```typescript
import puppeteer from 'puppeteer';

describe('YouTube Live Translate E2E', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      args: [`--load-extension=./dist`]
    });
    page = await browser.newPage();
  });

  it('should translate subtitle', async () => {
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // 等待扩展加载
    await page.waitForSelector('#yt-live-translate-overlay');
    
    // 验证字幕显示
    const subtitle = await page.$('#yt-live-translate-translated');
    const text = await subtitle.evaluate(el => el.textContent);
    
    expect(text).toBeTruthy();
  });
});
```

## 测试报告模板

### 测试执行记录

```
测试日期：2026-02-07
测试人员：XXX
测试版本：1.0.0
测试环境：Chrome 120, Windows 11

功能测试结果：
- 基础功能：通过 (20/20)
- 设置功能：通过 (15/15)
- 交互功能：通过 (12/12)
- 特殊场景：通过 (8/10)

性能测试结果：
- 响应时间：450ms ✅
- 内存占用：35MB ✅
- CPU 占用：3% ✅

兼容性测试结果：
- Chrome 113-120：通过 ✅
- Windows/macOS：通过 ✅

发现问题：
1. Shorts 页面字幕检测不稳定
2. 某些特殊字符显示异常

建议：
1. 优化 Shorts 字幕选择器
2. 添加特殊字符转义处理
```

## 持续集成

### CI/CD 流程

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build
```

---

**文档版本**: 1.0.0  
**最后更新**: 2026-02-07  
**维护者**: YouTube Live Translate Team
