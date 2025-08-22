const fs = require('fs');
const path = require('path');

// Function to extract title from HTML file
function extractTitleFromHtml(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Look for <title> tag
        const titleMatch = content.match(/<title>(.*?)<\/title>/i);
        if (titleMatch) {
            return titleMatch[1];
        }
        
        // If no title tag, look for first h1
        const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
        if (h1Match) {
            return h1Match[1];
        }
        
        // If no title or h1, use filename
        return path.basename(filePath, '.html');
    } catch (error) {
        console.error(`Error reading ${filePath}: ${error.message}`);
        return path.basename(filePath, '.html');
    }
}

// Function to generate a document card HTML snippet
function generateDocCard(filename, title) {
    // Simple preview text - in a real implementation, you might extract this from the file
    const previews = {
        "jvm-desc.html": "深入探讨JVM中所有类型的描述符，包括基础类型、对象类型、数组类型以及方法描述符，并提供详尽的示例。",
        "classloader.html": "从 JVM 启动到自定义实现的全景透视，详细解析类加载器的工作原理和双亲委派机制。",
        "springboot-start.html": "详细分析 Spring Boot/Cloud 应用的启动流程，包括上下文层级结构和环境属性源的优先级。",
        "report.html": "关于 JVM 类加载和执行子系统的详细技术报告。",
        "myclassloader.html": "自定义类加载器的实现方式和应用场景分析。",
        "loaderDemo.html": "类加载器工作原理的演示和实例分析。",
        "maven-report.html": "Maven 项目的依赖分析和技术报告。",
        "t6-manage-spring.context.html": "Spring 应用上下文的管理和配置分析。",
        "java.net.preferIPv4Stack.html": "Java 网络协议栈配置参数详解。"
    };
    
    const preview = previews[filename] || "技术文档内容";
    
    return `            <div class="doc-card">
                <a href="html/${filename}" class="doc-link">
                    <h2 class="doc-title">${title}</h2>
                    <p class="doc-preview">${preview}</p>
                    <span class="doc-file">${filename}</span>
                </a>
            </div>`;
}

// Main function
function main() {
    const htmlDir = "html";
    
    // Check if html directory exists
    if (!fs.existsSync(htmlDir)) {
        console.error(`Directory ${htmlDir} does not exist`);
        return;
    }
    
    // Get all HTML files in the html directory
    const htmlFiles = fs.readdirSync(htmlDir)
        .filter(file => path.extname(file) === '.html');
    
    if (htmlFiles.length === 0) {
        console.log("No HTML files found in the html directory");
        return;
    }
    
    // Generate doc cards
    const docCards = [];
    htmlFiles.sort().forEach(filename => {
        const filePath = path.join(htmlDir, filename);
        const title = extractTitleFromHtml(filePath);
        docCards.push(generateDocCard(filename, title));
    });
    
    // Read template
    let template;
    try {
        template = fs.readFileSync("template.html", "utf8");
    } catch (error) {
        console.error("template.html not found");
        return;
    }
    
    // Replace placeholder with doc cards
    const docCardsHtml = docCards.join('\n');
    const updatedContent = template.replace("{{DOC_CARDS}}", docCardsHtml);
    
    // Write to index.html
    fs.writeFileSync("index.html", updatedContent, "utf8");
    
    console.log(`Generated index.html with ${docCards.length} documents`);
    console.log("Files included:");
    htmlFiles.sort().forEach(filename => {
        console.log(`  - ${filename}`);
    });
}

// Run the main function
main();