# AI 个人技术笔记网站

这是一个基于 Node.js 的现代化静态博客生成器，使用 Pandoc 进行 Markdown 到 HTML 的转换，支持 SPA 架构和 SEO 优化。项目包含丰富的 Java、Spring、前端等技术主题的深度解析文档。

## 📖 目录

- [项目特点](#-项目特点)
- [项目结构](#-项目结构)
- [技术栈](#-技术栈)
- [快速开始](#-快速开始)
- [构建系统](#-构建系统)
- [开发工作流](#-开发工作流)
- [部署方式](#-部署方式)
- [架构设计](#-架构设计)

## 🌟 项目特点

### 🔄 现代化静态生成
- **双输出策略**：同时生成完整页面（SEO友好）和 Fragment 片段（SPA友好）
- **并发构建**：使用 4 个进程并行转换，大幅提升构建速度
- **增量构建**：仅转换修改过的文件，显著加速重复构建
- **Pandoc 驱动**：使用 Pandoc 提供更强大的 Markdown 解析和转换能力

### 🎨 用户体验优化
- **响应式设计**：完美适配桌面端、平板和移动设备
- **暗色模式**：支持明暗主题切换，用户偏好自动保存
- **智能搜索**：基于 overview.html 的前端搜索，无需后端支持
- **分页浏览**：每页 15 篇文章，流畅的翻页体验

### 🔍 SEO 全面优化
- **Sitemap 自动生成**：自动更新 sitemap.xml 提交搜索引擎
- **Meta 标签优化**：每页面独立 Open Graph、Twitter Card 标签
- **Canonical URL**：防止搜索引擎重复收录
- **语义化 HTML**：使用标准 HTML5 标签结构

### 📁 智能文档管理
- **按月归档**：Markdown 文件按 YYYY-MM 格式组织
- **混合文档支持**：同时支持 Markdown 和 HTML 文档
- **自动元数据提取**：标题、摘要、日期、分类自动识别
- **Git 集成**：基于文件修改时间进行增量构建

## 📁 项目结构

```
.
├── index.html                    # SPA 主页（第1页内容）
├── overview.html                 # 文档概览与搜索页面
├── sitemap.xml                   # SEO 站点地图
│
├── markdown/                     # Markdown 源文件目录
│   ├── 2025-08/                  # 按年月组织
│   │   ├── github-pages-深度使用分析报告.md
│   │   ├── git深度总结.md
│   │   └── ...
│   ├── 2025-09/
│   │   ├── javascript-async.md
│   │   └── ...
│   └── 2025-10/
│       ├── spring-assert.md
│       └── ...
│
├── docs/                         # 转换后的 HTML 文档
│   ├── 2025-08/                  # 与 markdown 目录对应
│   │   ├── github-pages-深度使用分析报告.html        # 完整页面(SEO)
│   │   ├── github-pages-深度使用分析报告-fragment.html  # SPA片段
│   │   └── ...
│   └── 2025-09/
│       ├── javascript-async.html
│       └── ...
│
├── pages/                        # 分页索引文件
│   ├── index.html                # 第1页 (文章1-15)
│   ├── index2.html               # 第2页 (文章16-30)
│   ├── index3.html               # 第3页 (文章31-45)
│   └── index4.html               # 第4页 (文章46+)
│
├── src/                          # Node.js 构建脚本
│   ├── convert_md_to_html_pandoc.js    # Pandoc 转换脚本
│   ├── generate_index_with_dates.js    # 主页生成脚本
│   ├── generate_sitemap.js            # Sitemap 生成脚本
│   ├── generate_overview.js           # 概览页生成脚本
│   ├── watch-md-chokidar.js           # 文件监听脚本(Chokidar)
│   └── ...
│
├── template_seo.html             # SEO 完整页面模板
├── article-detail.html           # SPA Fragment 模板
└── template_feed_list.html       # 列表页模板
```

## 🛠 技术栈

### 核心构建工具
- **Node.js**: 脚本运行环境
- **Pandoc**: Markdown 到 HTML 的转换引擎
- **marked**: JavaScript Markdown 解析器（备用方案）
- **cheerio**: HTML DOM 操作工具

### 开发工具
- **Chokidar**: 高性能文件监听
- **Nodemon**: 开发模式文件监控
- **concurrently**: 多进程并发执行
- **http-server**: 本地开发服务器
- **Husky**: Git Hooks 管理

### 前端特性
- **纯静态**: 无需服务器端渲染
- **SPA 兼容**: 支持单页应用架构
- **渐进增强**: 核心功能在无 JavaScript 环境下正常工作

## 🚀 快速开始

### 环境要求
- Node.js 16+ 
- npm 或 yarn
- Pandoc 2.0+（推荐）

### 安装依赖
```bash
npm install
```

### 基本构建
```bash
# 完整构建（推荐）
npm run build

# 分步执行构建
npm run convert-md-pandoc    # Markdown → HTML 转换
npm run generate-index       # 生成主页和分页
npm run generate-sitemap     # 生成站点地图
npm run generate-overview    # 更新概览页
```

### 开发模式
```bash
# 启动开发服务器 + 文件监听
npm run dev

# 仅文件监听模式
npm run watch-chokidar       # 使用 Chokidar（推荐）
npm run watch-nodemon        # 使用 Nodemon
```

### 创建新文档
```bash
# 创建 Markdown 文章
npm run new-md "文章标题"

# 创建 HTML 文档
npm run new-html "文档标题"
```

## 🔧 构建系统

### 构建命令详解

| 命令 | 功能 | 输出 | 耗时 |
|------|------|------|------|
| `convert-md-pandoc` | Markdown → HTML | `docs/{年月}/` | 10-15秒 |
| `generate-index` | 生成列表分页 | `pages/index{N}.html` | 0.5秒 |
| `generate-sitemap` | SEO 站点地图 | `sitemap.xml` | 0.2秒 |
| `generate-overview` | 更新搜索索引 | `overview.html` | 0.3秒 |

### 数据流向图
```
markdown/2025-10/article.md
    ↓ [convert-md-pandoc]
docs/2025-10/article.html (完整页) + article-fragment.html (片段)
    ↓ [generate-index]
pages/index.html (第1页)
    ↓ [generate-sitemap]
sitemap.xml
    ↓ [generate-overview]
overview.html (更新搜索数据)
```

### 双输出策略
- **完整页面** (`*.html`): 适用于 SEO 和直接访问
- **Fragment 片段** (`*-fragment.html`): 适用于 SPA 通过 AJAX 加载

## 🔄 开发工作流

### 自动文件监听
项目支持两种监听方案：

1. **Chokidar 方案** (`npm run watch-chokidar`)
   - 支持文件添加、修改、删除事件
   - 支持目录创建和删除事件  
   - 只转换发生变化的文件（增量构建）

2. **Nodemon 方案** (`npm run watch-nodemon`)
   - 监视 `.md` 文件的修改
   - 文件修改时自动调用转换脚本

### Git Hooks (Husky)
项目使用 Husky 管理 Git 钩子：
- **Pre-commit 钩子**: 提交前自动运行完整构建
- **自动暂存**: 构建结果自动添加到暂存区
- **构建检查**: 构建失败时阻止提交

### 开发建议
1. 使用 `npm run dev` 启动开发模式
2. 编辑 `markdown/` 目录下的 `.md` 文件
3. 浏览器自动刷新查看更新效果
4. 提交前确保构建成功

## 🌐 部署方式

### 静态文件托管
项目生成纯静态文件，可部署到任何静态托管服务：

- **GitHub Pages**: 免费，适合开源项目
- **Netlify**: 优秀性能，内置 CDN
- **Vercel**: 现代化平台，优秀开发者体验
- **传统虚拟主机**: 直接上传文件即可

### 部署配置
1. 运行 `npm run build` 生成静态文件
2. 将根目录所有文件上传到服务器
3. 配置 Web 服务器指向 `index.html`
4. 可选：启用 Gzip 压缩提升加载速度

### CDN 优化建议
- 启用浏览器缓存（静态资源长期缓存）
- 启用 Gzip/Brotli 压缩
- 使用 CDN 加速静态资源加载
- 图片使用 WebP 格式减少体积

## 🏗 架构设计

### 核心设计理念
1. **静态优先**: 所有页面预生成，无需运行时计算
2. **SEO 友好**: 每页面完整 HTML 结构，便于搜索引擎索引
3. **性能优化**: 最小化 JavaScript 使用，核心功能纯 HTML/CSS
4. **开发者友好**: 清晰的脚本分工，便于扩展和维护

### 页面架构
```
用户访问路径：
1. 用户访问 → index.html (SPA 容器)
2. JavaScript 加载 → pages/index.html (内容片段)
3. 用户点击文章 → docs/2025-10/article.html (完整页面)
4. 或通过 AJAX → docs/2025-10/article-fragment.html (SPA 片段)
```

### 模板系统
- **template_seo.html**: 生成完整 SEO 优化页面
- **article-detail.html**: 生成 SPA Fragment 内容片段
- **template_feed_list.html**: 生成分页列表页面

### 性能优化策略
1. **并发构建**: 4 进程并行转换，充分利用多核 CPU
2. **增量构建**: 只处理修改文件，大幅提升构建速度
3. **缓存策略**: 文件时间戳对比，避免重复转换
4. **资源优化**: CSS/JS 内联，减少 HTTP 请求

## 📊 项目统计

截至 2025-11-15，项目包含：

- **文档总数**: 40+ 篇技术文章
- **内容分类**: Java、Spring、前端、系统工具等
- **更新频率**: 每月 5-10 篇新文章
- **文章特点**: AI 协助生成，深度技术解析

## ⚠️ 重要提醒

本项目中的技术内容大多由 AI 协助生成，准确性未经严格验证，仅供参考学习使用。在实际项目中应用时，请务必进行充分验证。

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

**构建命令总览**:
```bash
# 开发模式
npm run dev              # 启动开发服务器 + 文件监听

# 构建命令  
npm run build            # 完整构建（推荐）
npm run convert-md-pandoc # 仅转换 Markdown

# 文件监听
npm run watch-chokidar   # Chokidar 监听（推荐）
npm run watch-nodemon    # Nodemon 监听

# 创建新文档
npm run new-md "标题"     # 创建 Markdown 文章
npm run new-html "标题"   # 创建 HTML 文档
```

**技术栈**: Node.js + Pandoc + 静态生成 + SPA + SEO