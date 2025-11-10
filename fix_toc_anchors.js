const fs = require('fs');
const path = require('path');

// 查找所有HTML文件
function findHtmlFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            findHtmlFiles(fullPath, files);
        } else if (item.endsWith('.html')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

// 修复HTML文件中的TOC链接
function fixHtmlFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // 替换 generateTableOfContents 函数中的ID处理逻辑
        const oldPattern = /headings\.forEach\(\(heading, index\) => \{\s*\/\/ 为标题添加ID（如果没有的话）\s*if \(!heading\.id\) \{\s*heading\.id = 'heading-' \+ index;\s*\}\s*\}/;
        const newCode = `headings.forEach((heading, index) => {
            // 强制为每个标题设置标准化的ID（始终重写现有ID）
            const normalizedId = 'heading-' + index;
            heading.id = normalizedId;`;
        
        if (oldPattern.test(content)) {
            content = content.replace(oldPattern, newCode);
            modified = true;
        }
        
        // 如果修改了文件，写回
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`修复文件: ${filePath}`);
        }
    } catch (error) {
        console.error(`处理文件失败: ${filePath}`, error.message);
    }
}

// 主函数
function main() {
    const startDir = process.argv[2] || process.cwd();
    const htmlFiles = findHtmlFiles(startDir);
    
    console.log(`找到 ${htmlFiles.length} 个HTML文件`);
    
    htmlFiles.forEach(file => {
        fixHtmlFile(file);
    });
    
    console.log('修复完成！');
}

if (require.main === module) {
    main();
}