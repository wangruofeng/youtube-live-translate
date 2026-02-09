# GitHub Release Assets URL 视频托管方案

> 本文档介绍如何使用 GitHub Release Assets URL 托管和播放视频资源，实现零成本的视频托管解决方案。

## 目录

- [方案概述](#方案概述)
- [实现方式](#实现方式)
- [完整示例](#完整示例)
- [优缺点分析](#优缺点分析)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 方案概述

### 什么是 GitHub Release Assets URL？

GitHub Release Assets URL 是 GitHub 提供的文件托管服务，允许在以下场景上传文件：

- **Releases**：版本发布附件
- **Issues**：工单附件
- **Pull Requests**：PR 评论附件
- **Discussions**：讨论附件

上传后会获得一个稳定的 URL，格式如下：

```
https://github.com/user-attachments/assets/{unique-id}
```

### 为什么选择这种方式？

| 特性 | 说明 |
|------|------|
| **零成本** | 利用 GitHub 免费存储，无需额外付费 |
| **CDN 加速** | GitHub 自带全球 CDN 分发 |
| **稳定可靠** | GitHub 官方基础设施，可用性高 |
| **简单易用** | 直接通过网页拖拽上传，无需配置 |
| **版本管理** | 配合 Release 实现文件版本控制 |

---

## 实现方式

### 方法一：通过 Release 上传（推荐）

#### 步骤 1：创建 Release

1. 进入 GitHub 仓库
2. 点击 **Releases** → **Create a new release**
3. 填写版本标签（如 `v1.0.0`）和标题
4. 在 **Assets** 区域拖拽上传视频文件

#### 步骤 2：获取 URL

上传完成后，有两种获取 URL 的方式：

**方式 A：直接从 Release 页面复制**

```bash
# Release 页面会显示文件链接
# 格式：https://github.com/用户名/仓库名/releases/download/v1.0.0/video.mp4
```

**方式 B：转换为 user-attachments 格式（推荐）**

在 Issue/PR/Discussion 中评论时上传视频，会获得短 URL：

```
https://github.com/user-attachments/assets/4d94943b-facd-4794-a195-05ddfe22b840
```

#### 步骤 3：在 Markdown 中使用

**直接链接方式：**

```markdown
https://github.com/user-attachments/assets/4d94943b-facd-4794-a195-05ddfe22b840
```

GitHub 会自动识别并渲染为视频播放器。

**HTML video 标签方式：**

```markdown
<video src="https://github.com/user-attachments/assets/4d94943b-facd-4794-a195-05ddfe22b840" width="800" controls></video>
```

---

### 方法二：通过 Issue/PR 评论上传

#### 步骤

1. 创建或打开任意 Issue/PR
2. 在评论框中拖拽视频文件
3. 等待上传完成
4. 复制生成的链接

#### 生成的链接格式

```
https://github.com/user-attachments/assets/{unique-id}
```

---

### 方法三：通过 GitHub CLI 上传

```bash
# 安装 GitHub CLI
# macOS
brew install gh

# Linux
# sudo apt install gh  # Ubuntu/Debian
# sudo dnf install gh  # Fedora

# 登录
gh auth login

# 创建 Release 并上传
gh release create v1.0.0 ./demo-video.mp4 \
  --title "Demo Video" \
  --notes "Release version 1.0.0 with demo video"
```

---

## 完整示例

### 项目实战：YouTube Live Translate

**文件**：`README_ZH.md`

#### 实现过程

**阶段一：本地视频（不推荐）**

```markdown
### 演示视频

<video src="public/demo-video-with-music.mp4" width="800" controls></video>
```

**问题**：
- 视频文件占用仓库空间（37.5 MB）
- 克隆仓库时需要下载大文件
- 访问速度受限于 GitHub 代码仓库带宽

**阶段二：GitHub Release Assets URL（推荐）**

```markdown
### 演示视频

<div align="center">

Demo 视频演示

https://github.com/user-attachments/assets/4d94943b-facd-4794-a195-05ddfe22b840

</div>
```

**优势**：
- 视频文件与代码仓库分离
- 利用 GitHub CDN 加速
- README 文件保持简洁

---

### HTML 页面嵌入示例

```html
<!DOCTYPE html>
<html>
<head>
  <title>Demo Video</title>
</head>
<body>
  <h1>功能演示</h1>

  <!-- 方式一：GitHub 自动渲染 -->
  <p>直接链接（GitHub 会自动识别）：</p>
  <p>https://github.com/user-attachments/assets/4d94943b-facd-4794-a195-05ddfe22b840</p>

  <!-- 方式二：HTML video 标签 -->
  <p>Video 标签（更多控制选项）：</p>
  <video
    src="https://github.com/user-attachments/assets/4d94943b-facd-4794-a195-05ddfe22b840"
    width="800"
    controls
    preload="metadata">
    您的浏览器不支持 video 标签。
  </video>

  <!-- 方式三：带封面图 -->
  <p>带封面图：</p>
  <video
    src="https://github.com/user-attachments/assets/4d94943b-facd-4794-a195-05ddfe22b840"
    width="800"
    poster="https://github.com/user-attachments/assets/cover-image-id"
    controls>
  </video>
</body>
</html>
```

---

## 优缺点分析

### 优点

| 优点 | 说明 |
|------|------|
| **零成本** | 完全免费，无需购买云存储服务 |
| **简单易用** | 拖拽上传，无需编写代码 |
| **CDN 加速** | 全球分发，访问速度快 |
| **高可用性** | GitHub 官方基础设施 |
| **版本管理** | 配合 Release 实现版本控制 |
| **HTTPS 支持** | 自动提供 HTTPS 访问 |
| **跨平台** | 任何支持 Markdown 的平台都能使用 |

### 缺点与限制

| 限制项 | 说明 | 解决方案 |
|--------|------|----------|
| **文件大小限制** | 单文件最大 100 MB | 对于更大的文件，考虑使用 YouTube、Vimeo 等专业视频平台 |
| **流量限制** | 每月 100 GB 流量 | 超过后可能限速，高流量项目需自建 CDN |
| **无转码服务** | 不会自动转码为多分辨率 | 手动提供不同分辨率的版本 |
| **无播放统计** | 无法查看播放次数和用户行为 | 可使用第三方分析工具（需自行实现） |
| **可能被墙** | 部分地区可能无法访问 | 国内用户访问可能不稳定 |

---

## 最佳实践

### 1. 视频文件优化

上传前进行压缩以减少文件大小：

```bash
# 使用 FFmpeg 压缩视频
ffmpeg -i input.mp4 -vcodec h264 -acodec aac -crf 28 output.mp4

# 调整分辨率
ffmpeg -i input.mp4 -vf scale=1280:720 output.mp4

# 同时压缩和调整分辨率
ffmpeg -i input.mp4 -vcodec h264 -acodec aac -crf 28 -vf scale=1280:720 output.mp4
```

### 2. 提供封面图

提升用户体验，减少首屏加载时间：

```markdown
<video
  src="https://github.com/user-attachments/assets/video-id"
  poster="https://github.com/user-attachments/assets/poster-id"
  width="800"
  controls>
</video>
```

### 3. 多版本支持

为不同网络环境提供多个版本：

```markdown
## 高清版（1080p）
<video src="...assets/video-1080p-id" width="1200" controls></video>

## 标清版（720p）
<video src="...assets/video-720p-id" width="800" controls></video>
```

### 4. 添加备用链接

提供 YouTube/Bilibili 等平台的备用链接：

```markdown
### 演示视频

**GitHub 托管版**（直接播放，无需登录）：
https://github.com/user-attachments/assets/4d94943b-facd-4794-a195-05ddfe22b840

**Bilibili 备用版**（国内访问更快）：
[点击观看](https://www.bilibili.com/video/...)

**YouTube 备用版**：
[点击观看](https://www.youtube.com/watch?v=...)
```

### 5. 版本管理策略

使用 Release 进行版本管理：

```bash
# 每个版本对应一个 Release
v1.0.0 → demo-video-v1.mp4
v1.1.0 → demo-video-v1.1.mp4
v2.0.0 → demo-video-v2.mp4

# 在 README 中始终链接到最新版本
```

### 6. 性能优化

```markdown
<!-- 使用 preload="metadata" 仅加载元数据，节省流量 -->
<video
  src="https://github.com/user-attachments/assets/video-id"
  preload="metadata"
  controls>
</video>

<!-- 或者完全禁用预加载 -->
<video
  src="https://github.com/user-attachments/assets/video-id"
  preload="none"
  controls>
</video>
```

---

## 常见问题

### Q1：user-attachments URL 和 release download URL 有什么区别？

**user-attachments URL**：
```
https://github.com/user-attachments/assets/4d94943b-facd-4794-a195-05ddfe22b840
```
- 更短、更简洁
- 通过 Issue/PR/Discussion 评论上传获得
- 推荐用于文档和 README

**release download URL**：
```
https://github.com/wangruofeng/youtube-live-translate/releases/download/v1.0.0/demo.mp4
```
- 包含版本号和文件名
- 通过 Release 上传获得
- 适合需要版本控制的场景

### Q2：如何替换已上传的视频？

**方法 A：创建新 Release**
```bash
gh release create v1.0.1 ./new-demo.mp4
```

**方法 B：在 Issue 中上传新文件，获得新 URL**

**方法 C：删除旧 Release 并重新创建**
```bash
# 使用 GitHub CLI
gh release delete v1.0.0 --yes
gh release create v1.0.0 ./new-demo.mp4
```

### Q3：GitHub 会自动转码视频吗？

**不会**。GitHub 只是托管文件，不会进行任何转码处理。你需要：

1. 手动转码为 Web 友好格式（MP4 + H.264/AAC）
2. 提供多种分辨率供用户选择

### Q4：文件大小超限怎么办？

- **100 MB 限制**：GitHub 单文件上传限制
- **解决方案**：
  1. 压缩视频（降低分辨率、比特率）
  2. 分段上传（多个文件）
  3. 使用专业视频平台（YouTube、Vimeo、Bilibili）
  4. 使用自建服务器 + CDN

### Q5：如何在国内使用？

**问题**：GitHub 在国内访问可能不稳定

**解决方案**：
1. 提供国内镜像（如 Bilibili、Gitee）
2. 使用 CDN 加速服务
3. 提供多种托管平台的链接

```markdown
### 演示视频

**GitHub 托管**（国际版）：
https://github.com/user-attachments/assets/...

**Bilibili 托管**（国内版）：
[点击观看](https://www.bilibili.com/video/...)
```

### Q6：是否支持自动播放和循环播放？

支持，通过 HTML video 标签属性：

```markdown
<video
  src="https://github.com/user-attachments/assets/video-id"
  autoplay    <!-- 自动播放 -->
  muted       <!-- 静音（某些浏览器要求静音才能自动播放） -->
  loop        <!-- 循环播放 -->
  controls>
</video>
```

### Q7：如何获取上传文件的 ID？

上传后，链接格式为：
```
https://github.com/user-attachments/assets/{unique-id}
```

**方法**：
1. 在 Issue/PR 评论中上传后，复制完整链接
2. 使用 GitHub API 获取：
```bash
# 获取 Release assets
gh api repos/wangruofeng/youtube-live-translate/releases/latest
```

---

## 适用场景推荐

### 推荐使用 GitHub Release Assets URL 的场景

| 场景 | 说明 |
|------|------|
| **开源项目演示** | README、文档中的演示视频 |
| **小型项目** | 视频文件 < 100 MB，流量 < 100 GB/月 |
| **国际化项目** | 需要全球访问，GitHub CDN 有优势 |
| **版本管理需求** | 需要为每个版本保留对应的演示视频 |

### 不推荐使用的场景

| 场景 | 推荐方案 |
|------|----------|
| **大型视频项目** | 使用 YouTube、Vimeo |
| **高流量网站** | 使用专业 CDN（如 Cloudflare、阿里云 CDN） |
| **国内主要用户** | 使用 Bilibili、腾讯视频 |
| **需要播放统计** | 使用 YouTube Analytics、自建统计 |

---

## 替代方案对比

| 方案 | 成本 | 优势 | 劣势 |
|------|------|------|------|
| **GitHub Release Assets** | 免费 | 零成本、简单 | 100 MB 限制、可能被墙 |
| **YouTube** | 免费 | 全球 CDN、播放统计 | 部分地区需要翻墙 |
| **Bilibili** | 免费 | 国内访问快 | 仅限国内用户 |
| **Vimeo** | 付费/免费 | 高质量、无广告 | 免费版限制多 |
| **自建服务器 + CDN** | 按量付费 | 完全控制 | 需要技术维护 |
| **OSS + CDN** | 按量付费 | 稳定可靠 | 需要配置 |

---

## 代码示例

### 脚本化上传（Bash）

```bash
#!/bin/bash
# upload-video.sh

VIDEO_FILE="demo-video.mp4"
VERSION="v1.0.0"
REPO="wangruofeng/youtube-live-translate"

# 检查文件是否存在
if [ ! -f "$VIDEO_FILE" ]; then
  echo "Error: $VIDEO_FILE not found"
  exit 1
fi

# 创建 Release 并上传视频
gh release create "$VERSION" "$VIDEO_FILE" \
  --title "Demo Video $VERSION" \
  --notes "Demo video for version $VERSION"

echo "✓ Video uploaded successfully!"
echo "Release URL: https://github.com/$REPO/releases/tag/$VERSION"
```

使用方式：

```bash
chmod +x upload-video.sh
./upload-video.sh
```

---

## 参考资料

- [GitHub Releases 官方文档](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
- [GitHub CLI 文档](https://cli.github.com/manual/gh_release)
- [HTML video 标签 MDN 文档](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video)
- [FFmpeg 官方文档](https://ffmpeg.org/documentation.html)

---

## 更新日志

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-02-09 | 初始版本，完整介绍 GitHub Release Assets URL 视频托管方案 |

---

**文档版本**：v1.0
**更新日期**：2026-02-09
**维护者**：YouTube Live Translate 项目组
