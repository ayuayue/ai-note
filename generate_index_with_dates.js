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

// Function to generate a document card HTML snippet for feed style
function generateDocCard(monthDir, filename, title, date) {
    const htmlFilename = filename.replace('.md', '.html');
    const formattedDate = formatDate(date);
    
    return `            <div class="feed-item">
                <div class="feed-item-header">
                    <h2 class="feed-item-title"><a href="docs/${monthDir}/${htmlFilename}">${title}</a></h2>
                    <div class="feed-item-meta">
                        <span class="feed-item-date">${formattedDate}</span>
                        <span class="feed-item-category">${monthDir}</span>
                    </div>
                </div>
                <div class="feed-item-content">
                    <p>AI 协助生成的技术笔记内容，包含关于 ${title} 的详细解析。</p>
                </div>
                <div class="feed-item-footer">
                    <a href="docs/${monthDir}/${htmlFilename}" class="read-more">阅读更多 →</a>
                </div>
            </div>`;
}

// Main function
function main() {
    const markdownDir = "markdown";
    const docsDir = "docs";
    
    // Check if markdown directory exists
    if (!fs.existsSync(markdownDir)) {
        console.error(`Directory ${markdownDir} does not exist`);
        return;
    }
    
    // Get all month directories
    const monthDirs = fs.readdirSync(markdownDir)
        .filter(file => fs.statSync(path.join(markdownDir, file)).isDirectory() && /^\d{4}-\d{2}$/.test(file))
        .sort()
        .reverse(); // Sort by newest first
    
    if (monthDirs.length === 0) {
        console.log("No month directories found in the markdown directory");
        return;
    }
    
    // Collect all documents with their dates
    const allDocuments = [];
    
    // Process each month directory
    monthDirs.forEach(monthDir => {
        const monthPath = path.join(markdownDir, monthDir);
        
        // Get all Markdown files in the month directory
        const markdownFiles = fs.readdirSync(monthPath)
            .filter(file => path.extname(file) === '.md');
        
        if (markdownFiles.length === 0) {
            console.log(`No Markdown files found in ${monthPath}`);
            return;
        }
        
        // Collect document info
        markdownFiles.forEach(filename => {
            const filePath = path.join(monthPath, filename);
            const title = extractTitleFromMarkdown(filePath);
            const date = getFileDate(filePath);
            
            allDocuments.push({
                monthDir,
                filename,
                title,
                date
            });
        });
    });
    
    // Sort all documents by date (newest first)
    allDocuments.sort((a, b) => b.date - a.date);
    
    // Generate feed items
    const feedItems = allDocuments.map(doc => 
        generateDocCard(doc.monthDir, doc.filename, doc.title, doc.date)
    );
    
    // Read template
    let template;
    try {
        template = fs.readFileSync("template_with_dates.html", "utf8");
    } catch (error) {
        console.error("template_with_dates.html not found");
        return;
    }
    
    // Replace placeholder with feed items
    const feedItemsHtml = feedItems.join('\n');
    const updatedContent = template.replace("{{DOC_CARDS}}", feedItemsHtml);
    
    // Write to index.html
    fs.writeFileSync("index.html", updatedContent, "utf8");
    
    console.log(`Generated index.html with ${allDocuments.length} documents`);
    console.log("Files included:");
    allDocuments.forEach(doc => {
        console.log(`  - ${doc.monthDir}/${doc.filename} (${formatDate(doc.date)})`);
    });
}

// Run the main function
main();