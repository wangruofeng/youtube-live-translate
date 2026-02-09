# Windows 平台 Loading 问题修复说明

## 问题描述

Windows 用户反馈插件一直处于 "Loading..." 状态，无法正常翻译字幕。

### 控制台日志显示
- ✅ 插件正常初始化
- ✅ 找到视频元素
- ✅ 找到字幕元素：`.ytp-caption-window-container`
- ✅ 开始监听字幕变化
- ❌ **没有翻译请求日志**
- ❌ **Loading 状态一直显示**

## 根本原因

### 字幕选择器优先级问题

代码中的字幕选择器列表：
```typescript
const selectors = [
  '.ytp-caption-segment',           // ✅ 正确的字幕文本选择器
  'caption-window.ytp-caption-window-bottom',
  '.captions-text',
  '.ytp-caption-window-container',  // ❌ 这是容器，不是内容！
];
```

**问题分析：**
1. Windows 上 YouTube 的 DOM 加载顺序不同
2. 先找到了 `.ytp-caption-window-container`（**外层容器**）
3. 容器元素本身没有 `textContent`，真正的文本在子元素里
4. 提取文本为空，直接 return，不触发翻译
5. Loading 状态无法清除

### 为什么 Windows 和 Mac 表现不同？

- **Mac 上**：可能先找到 `.ytp-caption-segment`（正确的）
- **Windows 上**：先找到 `.ytp-caption-window-container`（错误的容器）

## 修复方案

### 1. 移除有问题的容器选择器

```diff
  const selectors = [
    '.ytp-caption-segment',
    'caption-window.ytp-caption-window-bottom',
    '.captions-text',
-   '.ytp-caption-window-container',  // ❌ 移除
  ];
```

### 2. 添加备用选择器

针对 Windows 可能的 DOM 结构，添加更具体的子元素选择器：

```typescript
const selectors = [
  '.ytp-caption-segment',
  'caption-window.ytp-caption-window-bottom',
  '.captions-text',
  // 备用选择器：Windows 上可能使用的结构
  '.ytp-caption-window-container .caption-visual-line',
  '.ytp-caption-window-container span',
];
```

### 3. 添加文本验证逻辑

确保找到的元素真的包含文本内容：

```typescript
// 验证元素是否真的包含文本
let hasText = false;
elements.forEach((el) => {
  if (el.textContent?.trim()) {
    hasText = true;
  }
});

if (hasText) {
  console.log(`[YouTube Live Translate] 找到字幕元素: ${selector} (数量: ${elements.length})`);
  this.observeSubtitles(selector);
  return;
} else {
  console.log(`[YouTube Live Translate] 跳过无文本的选择器: ${selector}`);
}
```

### 4. 增强调试日志

添加详细的调试信息，帮助诊断问题：

```typescript
// 调试日志：显示提取的文本内容
if (currentText) {
  console.log(`[YouTube Live Translate] 字幕变化: "${currentText.substring(0, 50)}..."`);
} else {
  console.log(`[YouTube Live Translate] ⚠️ 找到元素但文本为空 (selector: ${selector}, elements: ${elements.length})`);
  // 调试：显示元素的 HTML 结构
  if (elements.length > 0) {
    console.log('[YouTube Live Translate] 元素 HTML:', elements[0].outerHTML.substring(0, 200));
  }
  return;
}
```

## 使用修复版本

1. 下载修复版本：`youtube-live-translate-fixed.zip` (13 MB)
2. 解压文件
3. 打开 Chrome/Edge 浏览器
4. 访问 `chrome://extensions/` 或 `edge://extensions/`
5. 开启"开发者模式"
6. 点击"加载已解压的扩展程序"
7. 选择解压后的文件夹
8. 刷新 YouTube 页面测试

## 验证修复

修复后，控制台应该显示：

```
[YouTube Live Translate] 找到字幕元素: .ytp-caption-segment (数量: 2)
[YouTube Live Translate] 字幕变化: "This is a subtitle..."
[YouTube Live Translate] 请求翻译 [seq=1]: This is a subtitle...
[YouTube Live Translate] 翻译完成 [seq=1]: 这是字幕...
```

## 兼容性确认

✅ **完全兼容 Windows**
- 使用标准 Web API
- 跨平台快捷键支持（Alt+E）
- 跨平台字体栈（Segoe UI for Windows）
- 无操作系统特定依赖

## 技术细节

### 修改的文件
- `src/content/index.tsx`
  - `startWatchingSubtitles()` 方法
  - `handleSubtitleChange()` 方法

### 代码行数
- 修改：约 40 行
- 新增：约 15 行调试代码

### 构建信息
- Webpack 5.105.0
- Manifest V3
- Content Script: 21 KB (minified)

## 后续建议

1. **收集更多用户反馈**：验证修复在不同 Windows 版本上的效果
2. **监控控制台日志**：新的调试日志能帮助快速定位问题
3. **考虑动态选择器**：如果问题持续，可以实现运行时 DOM 探测

## 修复时间
- 2025-02-09 22:04

## 修复版本
- youtube-live-translate-fixed.zip
- 基于 v1.0.0
