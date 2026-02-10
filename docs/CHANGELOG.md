# 更新日志

## [1.4.0] - 2026-02-10

### 功能优化 🎨

- **默认语言设置**
  - 插件默认语言从英语更改为简体中文
  - 首次安装用户可直接使用中文界面

- **原文字体优化**
  - 原文字体大小从 16px 增加到 18px
  - 提升原文可读性，与译文小字体大小一致

### 问题修复 🐛

- **字幕占位控件修复**
  - 修复视频不支持字幕时，翻译空白占位控件未自动隐藏的问题
  - 添加字幕消失检测机制，超过 3 秒无有效字幕时自动清理翻译控件
  - 改进字幕状态跟踪，避免无内容时显示空白占位

### 技术改进 ⚡

- 字幕超时检测机制（`SUBTITLE_TIMEOUT = 3000ms`）
- 有效字幕时间戳跟踪（`lastValidSubtitleTime`）
- 字幕元素和文本的双重验证逻辑

---

## [1.3.0] - 2026-02-09

### 项目配置与文档

- **Git 配置优化**
  - 更新 `.gitignore`：移除 `dist/` 忽略规则，允许构建产物提交到仓库
  - 新增本地开发工具目录忽略：`.agents/`、`.claude/`、`.cursor/`
  - 新增本地文档忽略：`docs/WEB_FOR_APP_DEVS.md`、`docs/IMAGE_PROCESSING_TOOLS.md`
  - 清理 Git 缓存，移除不应被跟踪的本地配置文件

- **新增文档**
  - `docs/GITHUB_VIDEO_HOSTING.md`：详细介绍使用 GitHub Release Assets URL 托管视频的方案
    - 三种上传方式（Release、Issue/PR、GitHub CLI）
    - 完整的项目实战示例
    - 优缺点分析和最佳实践
    - 常见问题解答（7 个 FAQ）
    - 替代方案对比表
    - 脚本化上传示例

---

## [1.0.2] - 2026-02-08

### 文档与资源（基于最新代码刷新）

- **README / README_ZH**
  - 修复 Preview 小节结构，统一使用 social-preview.png 预览图
  - 补充 30+ 目标语言与弹窗 UI 三语（en/zh-CN/zh-TW）
  - 补充界面语言设置说明
  - 补充脚本：`npm run icons`、`npm run social-preview`、`npm run clean`
  - 项目结构补充 scripts/、social-preview.png、icons 多尺寸、locales.ts
  - 仓库链接统一为 wangruofeng/youtube-live-translate

- **docs/**
  - INDEX：设置项 7（含界面语言）、支持语言 30+、文档与联系方式更新
  - PRODUCT：界面语言控件说明、支持语言列表扩展、FAQ 更新
  - ARCHITECTURE：图标 16/32/48/128/512、scripts、locales、节流 60ms/防抖 180ms/限流 500ms、构建流程去掉 Babel
  - API：StorageData / PopupState / TranslationState 增加 uiLanguage、textAlign、translatedFontSize；时间常量与代码一致
  - TESTING：界面语言测试项、节流/防抖数值更新
  - 各文档「最后更新」统一为 2026-02-08

---

## [1.0.1] - 2026-02-07

### 文档与代码同步

- 译文字体大小与代码一致：小 18px / 中 22px / 大 26px
- 快捷键说明统一为仅保留 Modifier+E 开启/关闭插件
- 项目结构补充 popup/index.tsx、content/content.css
- 内容脚本行数、限流/节流/防抖/轮询参数与实现一致

---

## [1.0.0] - 2026-02-07

### 🎉 首次发布

#### 新增功能

**核心功能**
- ✨ 实时字幕翻译
  - 自动监听 YouTube 字幕变化
  - 调用 Google Translate API 翻译
  - 支持增量翻译（只翻译新增内容）

**双行显示**
- ✨ 原文和译文同时显示
  - 原文在上，译文在下
  - 原文半透明（rgba(255,255,255,0.6)）
  - 译文清晰可见（rgb(255,255,255)）
  - 最多显示 2 行，超出省略

**智能刷新策略**
- ✨ 避免频繁刷新
  - 新句子：刷新 UI + 翻译
  - 文本超长（>200字符）：截断 + 立即翻译
  - 内容不同：刷新 UI + 翻译
  - 追加文本（<200字符）：不刷新 UI

**拖拽定位**
- ✨ 自由拖拽字幕控件
  - 整个控件顶部区域可拖拽
  - 拖拽时有光标反馈（grab/grabbing）
  - 位置自动保存到 chrome.storage
  - 下次访问恢复位置

**广告检测**
- ✨ 自动隐藏广告期间字幕
  - 检测广告播放器元素
  - 检测播放器容器类名
  - 广告开始时自动隐藏
  - 广告结束后自动显示

**隐藏原字幕**
- ✨ 可选隐藏 YouTube 原生字幕
  - 设置开关控制
  - MutationObserver 持续监听
  - 动态隐藏新出现的字幕

**快捷键支持**
- ✨ 提高操作效率
  - `Modifier + E` - 开启/关闭插件（Windows: Alt+E，Mac: Option+E 或 Command+E）

**设置面板**
- ✨ 直观的用户界面
  - React 构建的现代化 UI
  - 启用/禁用翻译开关
  - 目标语言选择（10 种语言）
  - 显示原文、隐藏 YouTube 原字幕开关
  - 翻译内容对齐（左/中/右）、译文字体大小（小/中/大）

**性能优化**
- ⚡ 翻译缓存
  - LRU 缓存策略
  - 最多 500 条记录
  - 24 小时有效期

- ⚡ 限流与实时性
  - 翻译请求间隔 500ms
  - 字幕变化节流 60ms、防抖 180ms、轮询兜底 120ms
  - 避免高频操作同时保证实时性

- ⚡ 序列号机制
  - 防止旧翻译覆盖新翻译
  - 只接受最新的翻译结果

#### 支持语言

- 简体中文 (zh-CN)
- 繁體中文 (zh-TW)
- English (en)
- 日本語 (ja)
- 한국어 (ko)
- Español (es)
- Français (fr)
- Deutsch (de)
- Русский (ru)
- العربية (ar)

#### 技术栈

- Chrome Extension Manifest V3
- React 18
- TypeScript 5
- Webpack 5
- Google Translate API

#### 界面设计

- 半透明黑色背景 (rgba(0, 0, 0, 0.6))
- 圆角设计 (8px)
- 系统字体栈
- 关闭按钮 (✕)
- 拖拽区域提示
- 悬停效果

#### 已知限制

1. **YouTube Shorts**
   - 短视频字幕格式不同
   - 部分功能可能不稳定

2. **直播视频**
   - 实时字幕格式不同
   - 延迟可能较高

3. **翻译准确性**
   - 使用免费 Google Translate API
   - 准确性取决于 Google Translate

4. **字符限制**
   - 原文和译文最多显示 2 行
   - 超长文本会被截断为 150 字符

#### 安全性

- ✅ 遵守 Chrome Extension Manifest V3 规范
- ✅ 最小权限请求（storage, activeTab）
- ✅ 仅在 YouTube 页面运行
- ✅ 不收集用户数据
- ✅ 不上传到第三方服务器（除 Google Translate）

---

## 更新说明

### 版本号规则

遵循语义化版本 (Semantic Versioning)：

```
MAJOR.MINOR.PATCH

MAJOR    - 不兼容的 API 变更
MINOR    - 向下兼容的功能新增
PATCH    - 向下兼容的问题修复
```

### 变更类型图标

- ✨ 新增功能 (Added)
- 🐛 问题修复 (Fixed)
- 💥 破坏性变更 (Changed)
- ⚡ 性能优化 (Performance)
- 📝 文档更新 (Documentation)
- 🔒 安全更新 (Security)
- 🙃 废弃功能 (Deprecated)
- ⚠️ 移除功能 (Removed)
---

## 即将推出

### [1.1.0] - 计划中

#### 计划新增

- [ ] 多个翻译服务支持
  - DeepL API
  - Microsoft Translator
  - 百度翻译 API

- [ ] 自定义样式
  - 字体大小调节
  - 背景颜色调节
  - 位置预设

- [ ] 导出功能
  - 导出字幕到 .srt 文件
  - 导出双语字幕

- [ ] 历史记录
  - 翻译历史查看
  - 收藏夹功能

- [ ] 离线模式
  - 下载语言包
  - 本地翻译

#### 计划优化

- [ ] 性能优化
  - Web Worker 异步翻译
  - 虚拟列表优化
  - 内存占用降低

- [ ] 兼容性增强
  - 完善支持 YouTube Shorts
  - 完善支持直播视频
  - 支持嵌入式视频

---

## 贡献指南

### 报告问题

请通过 GitHub Issues 报告问题，包含：

1. **问题描述**
   - 清晰描述问题
   - 复现步骤
   - 预期行为
   - 实际行为

2. **环境信息**
   - Chrome 版本
   - 操作系统
   - 扩展版本
   - YouTube 视频链接（如适用）

3. **日志信息**
   - 控制台错误
   - 扩展日志

### 功能建议

欢迎提出功能建议，包含：

1. **功能描述**
   - 清晰描述建议的功能
   - 使用场景
   - 预期效果

2. **可行性分析**
   - 技术可行性
   - 实现难度
   - 预期工作量

3. **优先级**
   - 高/中/低
   - 影响范围
   - 紧急程度

---

## 致谢

感谢所有为这个项目做出贡献的人！

特别感谢：
- Google Translate API
- YouTube 平台
- Chrome Extensions 团队
- 开源社区

---

**文档版本**: 1.3.0
**最后更新**: 2026-02-09
**维护者**: YouTube Live Translate Team
