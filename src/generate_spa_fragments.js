const fs = require('fs');
const path = require('path');

// Function to extract title from Markdown file
function extractTitleFromMarkdown(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const titleMatch = content.match(/^#\s+(.*?)$/m);
        if (titleMatch) {
            return titleMatch[1];
        }
        return path.basename(filePath, '.md');
    } catch (error) {
        console.error(`Error reading ${filePath}: ${error.message}`);
        return path.basename(filePath, '.md');
    }
}

// Function to extract title from HTML file
function extractTitleFromHTML(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const titleMatch = content.match(/<title>(.*?)<\/title>/i);
        if (titleMatch) {
            return titleMatch[1];
        }
        return path.basename(filePath, '.html');
    } catch (error) {
        console.error(`Error reading ${filePath}: ${error.message}`);
        return path.basename(filePath, '.html');
    }
}

// Function to extract excerpt from Markdown file
function extractExcerptFromMarkdown(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const contentWithoutTitle = content.split('\n').slice(1).join(' ');
        const cleanContent = contentWithoutTitle.replace(/[#*\-_`]/g, '').trim();
        return cleanContent.substring(0, 30);
    } catch (error) {
        return "AI 协助生成的技术笔记内容";
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

// Function to generate a document card HTML snippet for feed
function generateDocCard(doc) {
    const formattedDate = formatDate(doc.date);

    if (doc.type === 'markdown') {
        const htmlFilename = doc.filename.replace('.md', '.html');
        return `            <div class="feed-item">
                <div class="feed-item-header">
                    <h2 class="feed-item-title"><a href="/docs/${doc.monthDir}/${htmlFilename}">${doc.title}</a></h2>
                    <div class="feed-item-meta">
                        <span class="feed-item-date">${formattedDate}</span>
                        <span class="feed-item-category">Markdown 文档</span>
                    </div>
                </div>
                <div class="feed-item-content">
                    <p>${doc.excerpt}...</p>
                </div>
                <div class="feed-item-footer">
                    <a href="docs/${doc.monthDir}/${htmlFilename}" class="read-more">阅读更多 →</a>
                </div>
            </div>`;
    } else {
        // HTML files
        const htmlPath = `/html/${doc.filename}`;
        return `            <div class="feed-item">
                <div class="feed-item-header">
                    <h2 class="feed-item-title"><a href="${htmlPath}">${doc.title}</a></h2>
                    <div class="feed-item-meta">
                        <span class="feed-item-date">${formattedDate}</span>
                        <span class="feed-item-category">HTML 文档</span>
                    </div>
                </div>
                <div class="feed-item-content">
                    <p>此文章为HTML格式内容，无特殊布局设计，阅读后请使用浏览器的返回功能回到首页。</p>
                </div>
                <div class="feed-item-footer">
                    <a href="${htmlPath}" class="read-more">阅读更多 →</a>
                </div>
            </div>`;
    }
}

// Main function
function main() {
    const markdownDir = "markdown";
    const docsDir = "docs";
    const htmlDir = "html";
    const ITEMS_PER_PAGE = 15;

    // Check if markdown directory exists
    if (!fs.existsSync(markdownDir)) {
        console.error(`Directory ${markdownDir} does not exist`);
        return;
    }

    // Get all month directories for markdown files
    const monthDirs = fs.readdirSync(markdownDir)
        .filter(file => fs.statSync(path.join(markdownDir, file)).isDirectory() && /^\d{4}-\d{2}$/.test(file))
        .sort()
        .reverse();

    // Collect all documents with their dates
    const allDocuments = [];

    // Process each month directory for markdown files
    monthDirs.forEach(monthDir => {
        const monthPath = path.join(markdownDir, monthDir);
        const markdownFiles = fs.readdirSync(monthPath)
            .filter(file => path.extname(file) === '.md');

        markdownFiles.forEach(filename => {
            const filePath = path.join(monthPath, filename);
            const title = extractTitleFromMarkdown(filePath);
            const excerpt = extractExcerptFromMarkdown(filePath);
            const date = getFileDate(filePath);

            allDocuments.push({
                type: 'markdown',
                monthDir,
                filename,
                title,
                excerpt,
                date
            });
        });
    });

    // Process HTML files
    if (fs.existsSync(htmlDir)) {
        const htmlFiles = fs.readdirSync(htmlDir)
            .filter(file => path.extname(file) === '.html');

        htmlFiles.forEach(filename => {
            const filePath = path.join(htmlDir, filename);
            const title = extractTitleFromHTML(filePath);
            const date = getFileDate(filePath);

            allDocuments.push({
                type: 'html',
                filename,
                title,
                date
            });
        });
    }

    // Sort all documents by date (newest first)
    allDocuments.sort((a, b) => b.date - a.date);

    // Calculate pagination
    const totalPages = Math.ceil(allDocuments.length / ITEMS_PER_PAGE);

    // Read feed content template
    let feedTemplate;
    try {
        feedTemplate = fs.readFileSync("pages/feed-content.html", "utf8");
    } catch (error) {
        console.error("pages/feed-content.html not found");
        return;
    }

    // Generate each page
    for (let page = 1; page <= totalPages; page++) {
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageDocuments = allDocuments.slice(startIndex, endIndex);

        // Generate feed items for this page
        const feedItems = pageDocuments.map(doc =>
            generateDocCard(doc)
        );

        // Generate pagination HTML for this specific page
        let paginationHtml = '';
        if (totalPages > 1) {
            paginationHtml += '<div class="pagination">\n';

            // Previous page link
            if (page > 1) {
                const prevPage = page === 2 ? 'feed-content.html' : `feed-page${page-1}.html`;
                paginationHtml += `                <a href="${prevPage}">← 上一页</a>\n`;
            }

            // Page links
            for (let i = 1; i <= totalPages; i++) {
                if (i === page) {
                    paginationHtml += `                <a href="#" class="current">${i}</a>\n`;
                } else {
                    let pageLink;
                    if (i === 1) {
                        pageLink = 'feed-content.html';
                    } else {
                        pageLink = `feed-page${i}.html`;
                    }
                    paginationHtml += `                <a href="${pageLink}">${i}</a>\n`;
                }
            }

            // Next page link
            if (page < totalPages) {
                const nextPage = `feed-page${page+1}.html`;
                paginationHtml += `                <a href="${nextPage}">下一页 →</a>\n`;
            }
            paginationHtml += '            </div>';
        } else {
            paginationHtml = '<div class="pagination">\n                <a href="feed-content.html" class="current">1</a>\n            </div>';
        }

        // Replace placeholders
        let updatedContent = feedTemplate.replace("{{DOC_CARDS}}", feedItems.join('\n'));
        updatedContent = updatedContent.replace("{{PAGINATION_LINKS}}", paginationHtml);

        // Write to pages directory
        let filename;
        if (page === 1) {
            filename = "pages/feed-content.html";
        } else {
            filename = `pages/feed-page${page}.html`;
        }

        fs.writeFileSync(filename, updatedContent, "utf8");
        console.log(`Generated ${filename} with ${pageDocuments.length} documents`);
    }

    console.log(`Generated ${totalPages} feed fragment pages with ${allDocuments.length} total documents`);
}

// Run the main function
main();
