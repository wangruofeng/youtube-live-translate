# YouTube Live Translate

YouTube 实时字幕翻译 Chrome 扩展

## 功能特点

- 🎬 实时翻译 YouTube 视频字幕
- 🌍 支持多种目标语言
- ⚙️ 可自定义翻译开关
- 🎨 精美的 UI 设计
- 🚀 快速响应，性能优化

## 安装方法

### 开发模式安装

1. 克隆项目并安装依赖：

```bash
npm install
```

2. 构建项目：

```bash
npm run dev
```

或

```bash
npm run build
```

3. 在 Chrome 浏览器中：

   - 打开 `chrome://extensions/`
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目的 `dist` 目录

## 使用方法

1. 打开 YouTube 视频
2. 确保视频有字幕（开启 YouTube 字幕功能）
3. 点击浏览器工具栏的扩展图标
4. 选择目标语言
5. 翻译会自动显示在视频下方

## 技术栈

- React 18
- TypeScript
- Webpack 5
- Chrome Extension Manifest V3

## 开发

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 生产构建
npm run build

# 清理构建文件
npm run clean
```

## 项目结构

```
youtube-live-translate/
├── public/              # 静态资源和 manifest
├── src/
│   ├── popup/          # 弹出页面
│   ├── content/        # Content Script
│   └── background/     # Background Service Worker
├── dist/               # 构建输出目录
├── webpack.config.js   # Webpack 配置
├── tsconfig.json       # TypeScript 配置
└── package.json        # 项目配置
```

## 注意事项

⚠️ 本项目使用的 Google Translate API 仅供演示使用。在生产环境中，请使用官方的 Google Cloud Translation API 或其他授权的翻译服务。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
