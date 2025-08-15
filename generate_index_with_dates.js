const fs = require('fs');
const path = require('path');

// Function to extract title from Markdown file
function extractTitleFromMarkdown(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        // Look for first # heading
        const titleMatch = content.match(/^#\s+(.*?)$/m);
        if (titleMatch) {
            return titleMatch[1];
        }
        
        // If no # heading, use filename
        return path.basename(filePath, '.md');
    } catch (error) {
        console.error(`Error reading ${filePath}: ${error.message}`);
        return path.basename(filePath, '.md');
    }
}

// Function to get file modification date
function getFileDate(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.mtime;
    } catch (error) {
        return new Date();
    }
}

// Function to format date
function formatDate(date) {
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Function to generate a document card HTML snippet
function generateDocCard(filename, title, date) {
    // Simple preview text - in a real implementation, you might extract this from the file
    const previews = {
        "jvm-desc.md": "深入探讨JVM中所有类型的描述符，包括基础类型、对象类型、数组类型以及方法描述符，并提供详尽的示例。",
        "classloader.md": "从 JVM 启动到自定义实现的全景透视，详细解析类加载器的工作原理和双亲委派机制。",
        "springboot-start.md": "详细分析 Spring Boot/Cloud 应用的启动流程，包括上下文层级结构和环境属性源的优先级。",
        "report.md": "关于 JVM 类加载和执行子系统的详细技术报告。",
        "myclassloader.md": "自定义类加载器的实现方式和应用场景分析。",
        "loaderDemo.md": "类加载器工作原理的演示和实例分析。",
        "maven-report.md": "Maven 项目的依赖分析和技术报告。",
        "t6-manage-spring.context.md": "Spring 应用上下文的管理和配置分析。",
        "java.net.preferIPv4Stack.md": "Java 网络协议栈配置参数详解。"
    };
    
    const preview = previews[filename] || "技术文档内容";
    const htmlFilename = filename.replace('.md', '.html');
    
    return `            <div class="doc-card">
                <a href="docs/${htmlFilename}" class="doc-link">
                    <h2 class="doc-title">${title}</h2>
                    <p class="doc-preview">${preview}</p>
                    <div class="doc-meta">
                        <span class="doc-file">${htmlFilename}</span>
                        <span class="doc-date">${formatDate(date)}</span>
                    </div>
                </a>
            </div>`;
}

// Main function
function main() {
    const markdownDir = "markdown";
    
    // Check if markdown directory exists
    if (!fs.existsSync(markdownDir)) {
        console.error(`Directory ${markdownDir} does not exist`);
        return;
    }
    
    // Get all Markdown files in the markdown directory
    const markdownFiles = fs.readdirSync(markdownDir)
        .filter(file => path.extname(file) === '.md');
    
    if (markdownFiles.length === 0) {
        console.log("No Markdown files found in the markdown directory");
        return;
    }
    
    // Generate doc cards with dates
    const docCards = [];
    markdownFiles.sort().forEach(filename => {
        const filePath = path.join(markdownDir, filename);
        const title = extractTitleFromMarkdown(filePath);
        const date = getFileDate(filePath);
        docCards.push({
            filename,
            title,
            date,
            html: generateDocCard(filename, title, date)
        });
    });
    
    // Sort by date (newest first)
    docCards.sort((a, b) => b.date - a.date);
    
    // Read template
    let template;
    try {
        template = fs.readFileSync("template.html", "utf8");
    } catch (error) {
        console.error("template.html not found");
        return;
    }
    
    // Replace placeholder with doc cards
    const docCardsHtml = docCards.map(card => card.html).join('\n');
    const updatedContent = template.replace("{{DOC_CARDS}}", docCardsHtml);
    
    // Write to index.html
    fs.writeFileSync("index.html", updatedContent, "utf8");
    
    console.log(`Generated index.html with ${docCards.length} documents`);
    console.log("Files included:");
    docCards.forEach(card => {
        console.log(`  - ${card.filename} (${formatDate(card.date)})`);
    });
}

// Run the main function
main();