const fs = require('fs');
const path = require('path');

// Get title from command line arguments
const title = process.argv[2];

if (!title) {
    console.error('请提供文章标题，例如: npm run new-md "我的新文章"');
    process.exit(1);
}

// Get current date
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const date = String(now.getDate()).padStart(2, '0');

// Create directory structure
const dirPath = path.join('markdown', `${year}-${month}`);
if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
}

// Create filename
const filename = `${title.replace(/\s+/g, '-').toLowerCase()}.md`;
const filePath = path.join(dirPath, filename);

// Check if file already exists
if (fs.existsSync(filePath)) {
    console.error(`文件 ${filePath} 已存在`);
    process.exit(1);
}

// Create content
const content = `# ${title}

请在此处编写您的文章内容。

## 章节标题

您可以在这里添加文章的详细内容。

### 小节标题

支持使用 Markdown 语法来格式化您的内容：

- 列表项1
- 列表项2

代码示例：
\`\`\`javascript
console.log("Hello, World!");
\`\`\`

> 这是一个引用块

| 表头1 | 表头2 |
|-------|-------|
| 内容1 | 内容2 |
`;

// Write file
fs.writeFileSync(filePath, content);

console.log(`✅ 已创建新 Markdown 文章: ${filePath}`);