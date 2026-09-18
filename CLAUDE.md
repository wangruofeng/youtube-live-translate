# youtube-live-translate — 项目规则

## 定位

YouTube 实时字幕翻译 Chrome 扩展（MV3）：监听字幕元素变化，调用翻译接口，双行显示原文与译文。MIT 协议，个人维护。

## 运行与构建

```bash
npm install
npm run build    # webpack --mode production，产物入 dist/
```

Chrome 加载「已解压的扩展程序」指向 `dist/`。`public/`（manifest、图标、demo 素材）由 CopyWebpackPlugin 复制进 `dist/`，popup.html 除外（HtmlWebpackPlugin 生成）。

## 技术栈与结构

- TypeScript + React（popup）、内容脚本 `src/content/`、后台 `src/background/`
- `public/manifest.json` — 扩展清单（权限、版本）
- `scripts/` — 图标与社交预览图生成脚本
- `docs/` — 文档；`README.md`（英）/ `README_ZH.md`（中）

## 版本发布约定（重要）

版本号出现在**三处**，发版时必须一起改：`package.json`、`public/manifest.json`（Chrome 以此为准）、双 README 的 version 徽章。2026-09 审计发现 v1.5.0–v1.6.x 期间只 bump 了 package.json，manifest 漏改停在 1.4.0——勿再犯。

## 约定

- 扩展真实版本以 `public/manifest.json` 为准；`dist/` 为构建产物（已提交，随源码一起更新）
- 翻译在后台脚本完成，内容脚本只负责字幕监听与渲染

## 当前状态

v1.7.0；Windows Loading 问题已修复（见根目录 FIX_WINDOWS_LOADING.md，历史记录可归档）。
