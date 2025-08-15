# 技术文档站点

这是一个包含 Java 和 JVM 技术深度解析文档的静态网站。

## 项目结构

```
.
├── index.html          # 主页，包含所有文档的链接
├── template.html       # 用于生成主页的模板
├── generate_index.js   # 自动生成主页的脚本
├── html/              # 所有技术文档
└── img/               # 图片资源目录
```

## 自动目录生成

当您添加新的 HTML 文档到 `html/` 目录时，可以运行以下命令自动更新主页链接：

```bash
node generate_index.js
```

这将根据 `html/` 目录中的文件自动更新 `index.html` 文件。

## 自定义样式

主页使用了现代化的响应式设计，具有以下特性：

1. 响应式网格布局，适配不同屏幕尺寸
2. 卡片式设计，每个文档以独立卡片形式展示
3. 悬停动画效果
4. 自定义颜色主题
5. Google Fonts 字体优化

要自定义样式，可以修改 `index.html` 或 `template.html` 文件中的 CSS 部分：

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