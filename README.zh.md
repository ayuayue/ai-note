# AI 技术笔记站点

这是一个包含 Java 和 JVM 技术深度解析文档的静态网站项目。

## 📁 项目结构

```
.
├── index.html          # 站点主页
├── markdown/          # Markdown 源文件（编辑这里）
├── docs/              # 生成的 HTML 文档（网站展示用）
├── html/              # 原始 HTML 文档
└── img/               # 图片资源
```

## 🚀 快速开始

### 编辑文档
1. 直接编辑 `markdown/` 目录中的 `.md` 文件
2. 运行构建命令：`npm run build`
3. 打开 `index.html` 查看更新结果

### 构建命令
```bash
# 完整构建（推荐）
npm run build

# 或者分步执行
npm run convert-md      # Markdown 转 HTML
npm run generate-index  # 生成主页索引
```

## 📝 编辑指南

### 添加新文档
1. 在 `markdown/` 目录创建新的 `.md` 文件
2. 使用一级标题作为文档标题：
   ```markdown
   # 我的新技术文档
   ```
3. 运行 `npm run build` 更新网站

### 文档格式示例
```markdown
# 文档标题

## 章节标题

正文内容...

### 小节标题

- 列表项1
- 列表项2

代码示例：
\```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
\```

| 表头1 | 表头2 |
|-------|-------|
| 内容1 | 内容2 |
```

## 🎨 自定义样式

修改 `template_with_dates.html` 中的 CSS 变量来自定义主题：

```css
:root {
    --primary-color: #2c3e50;    /* 主色调 */
    --secondary-color: #3498db;  /* 辅助色 */
    --accent-color: #e74c3c;     /* 强调色 */
    --bg-color: #ecf0f1;         /* 背景色 */
    --text-color: #34495e;       /* 文字颜色 */
}
```

## 🌐 部署

这是一个纯静态网站，可以部署到：
- GitHub Pages
- Netlify
- Vercel
- 任何支持静态文件托管的服务

只需上传整个项目目录即可。

## 🛠 技术栈

- HTML5 + CSS3 响应式设计
- Markdown 文档格式
- Node.js 构建工具
- Google Fonts 字体优化