const fs = require('fs');
const path = require('path');

// Get title from command line arguments
const title = process.argv[2];

if (!title) {
    console.error('请提供文章标题，例如: npm run new-html "我的新HTML文章"');
    process.exit(1);
}

// Create directory path
const dirPath = 'html';
if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
}

// Create filename
const filename = `${title.replace(/\s+/g, '-').toLowerCase()}.html`;
const filePath = path.join(dirPath, filename);

// Check if file already exists
if (fs.existsSync(filePath)) {
    console.error(`文件 ${filePath} 已存在`);
    process.exit(1);
}

// Create content
const content = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2, h3 {
            color: #2c3e50;
        }
        code {
            background-color: #f4f4f4;
            padding: 2px 4px;
            border-radius: 3px;
        }
        pre {
            background-color: #f4f4f4;
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
        }
        blockquote {
            border-left: 4px solid #3498db;
            padding-left: 15px;
            color: #7f8c8d;
        }
        table {
            border-collapse: collapse;
            width: 100%;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    
    <p>请在此处编写您的HTML文章内容。</p>
    
    <h2>章节标题</h2>
    
    <p>您可以在这里添加文章的详细内容。</p>
    
    <h3>小节标题</h3>
    
    <p>支持使用HTML语法来格式化您的内容：</p>
    
    <ul>
        <li>列表项1</li>
        <li>列表项2</li>
    </ul>
    
    <p>代码示例：</p>
    <pre><code>console.log("Hello, World!");</code></pre>
    
    <blockquote>
        <p>这是一个引用块</p>
    </blockquote>
    
    <table>
        <thead>
            <tr>
                <th>表头1</th>
                <th>表头2</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>内容1</td>
                <td>内容2</td>
            </tr>
        </tbody>
    </table>
    
    <p><a href="../index.html">← 返回首页</a></p>
</body>
</html>
`;

// Write file
fs.writeFileSync(filePath, content);

console.log(`✅ 已创建新 HTML 文章: ${filePath}`);