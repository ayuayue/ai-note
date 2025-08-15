# 技术文档站点

这是一个包含 Java 和 JVM 技术深度解析文档的静态网站。

## 项目结构

```
.
├── index.html              # 主页，包含所有文档的链接
├── template.html           # 用于生成主页的模板
├── template_with_dates.html # 带日期功能的模板
├── package.json            # 项目依赖和脚本
├── markdown/              # Markdown 格式的文档源文件
├── docs/                  # 从 Markdown 生成的 HTML 文件
├── html/                  # 原始 HTML 文档
└── img/                   # 图片资源目录
```

## 工作流程

### 1. HTML 转 Markdown

将现有的 HTML 文档转换为 Markdown 格式，便于编辑和维护：

```bash
npm run convert-html
```

这将把 `html/` 目录中的所有 HTML 文件转换为 Markdown 格式，并保存在 `markdown/` 目录中。

### 2. Markdown 转 HTML

将 Markdown 文件转换为 HTML 格式，用于网站展示：

```bash
npm run convert-md
```

这将把 `markdown/` 目录中的所有 Markdown 文件转换为 HTML 格式，并保存在 `docs/` 目录中。

### 3. 生成索引页面

生成带有文档链接和更新日期的主页：

```bash
npm run generate-index
```

这将根据 `markdown/` 目录中的文件生成 `index.html`，包含每个文档的链接和最后修改日期。

### 4. 完整构建

执行完整的构建过程，包括 Markdown 转 HTML 和生成索引：

```bash
npm run build
```

## 自定义样式

主页使用了现代化的响应式设计，具有以下特性：

1. 响应式网格布局，适配不同屏幕尺寸
2. 卡片式设计，每个文档以独立卡片形式展示
3. 悬停动画效果
4. 自定义颜色主题
5. Google Fonts 字体优化
6. 显示文档更新日期

要自定义样式，可以修改 `template_with_dates.html` 文件中的 CSS 部分：

```css
:root {
    --primary-color: #2c3e50;     /* 主色调 */
    --secondary-color: #3498db;   /* 辅助色 */
    --accent-color: #e74c3c;      /* 强调色 */
    --bg-color: #ecf0f1;          /* 背景色 */
    --text-color: #34495e;        /* 文字颜色 */
}
```

## 部署

这是一个纯静态网站，可以直接部署到任何静态网站托管服务，如：

- GitHub Pages
- Netlify
- Vercel
- 或任何支持静态文件托管的服务

只需将整个项目目录上传到服务器即可。

## 编辑文档

现在您可以直接编辑 `markdown/` 目录中的 Markdown 文件，然后运行构建命令来更新网站：

1. 编辑 Markdown 文件
2. 运行 `npm run build`
3. 提交更改到 Git

这比直接编辑 HTML 文件要简单得多！