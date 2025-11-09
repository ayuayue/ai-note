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

// Function to extract title from HTML file
function extractTitleFromHTML(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        // Look for title tag
        const titleMatch = content.match(/<title>(.*?)<\/title>/i);
        if (titleMatch) {
            return titleMatch[1];
        }
        
        // If no title tag, use filename
        return path.basename(filePath, '.html');
    } catch (error) {
        console.error(`Error reading ${filePath}: ${error.message}`);
        return path.basename(filePath, '.html');
    }
}

// Function to extract excerpt from Markdown file (first 30 characters)
function extractExcerptFromMarkdown(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        // Remove the first line (title) and get the next lines
        const contentWithoutTitle = content.split('\n').slice(1).join(' ');
        // Remove markdown formatting and extra whitespace
        const cleanContent = contentWithoutTitle.replace(/[#*\-_`]/g, '').trim();
        // Return first 30 characters
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

// Function to generate a document card HTML snippet for feed style
function generateDocCard(doc, currentPage) {
    const formattedDate = formatDate(doc.date);
    
    // Different handling for markdown and html files
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
        // Adjust path based on current page location
        const htmlPath = currentPage === 1 ? `/html/${doc.filename}` : `/html/${doc.filename}`;
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
        .reverse(); // Sort by newest first
    
    // Collect all documents with their dates
    const allDocuments = [];
    
    // Process each month directory for markdown files
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
    
    // Read template
    let template;
    try {
        template = fs.readFileSync("template_with_dates.html", "utf8");
    } catch (error) {
        console.error("template_with_dates.html not found");
        return;
    }
    
    // Generate each page
    for (let page = 1; page <= totalPages; page++) {
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageDocuments = allDocuments.slice(startIndex, endIndex);
        
        // Generate feed items for this page
        const feedItems = pageDocuments.map(doc => 
            generateDocCard(doc, page)
        );
        
        // Generate pagination HTML for this specific page
        let paginationHtml = '';
        if (totalPages > 1) {
            paginationHtml += '<div class="pagination">\n';
            // Previous page link
            if (page > 1) {
                const prevPage = page === 2 ? '../index.html' : `index${page-1}.html`;
                paginationHtml += `            <a href="${prevPage}">← 上一页</a>\n`;
            }
            
            // Page links
            for (let i = 1; i <= totalPages; i++) {
                if (i === page) {
                    paginationHtml += `            <a href="#" class="current">${i}</a>\n`;
                } else {
                    let pageLink;
                    if (i === 1) {
                        // First page is always index.html in root directory
                        pageLink = page > 1 ? '../index.html' : 'index.html';
                    } else {
                        // Other pages are in pages directory
                        // If we're on the first page, links to other pages need to go to pages/ directory
                        // If we're on other pages, links to other pages are relative to current directory
                        pageLink = page === 1 ? `pages/index${i}.html` : `index${i}.html`;
                    }
                    paginationHtml += `            <a href="${pageLink}">${i}</a>\n`;
                }
            }
            
            // Next page link
            if (page < totalPages) {
                const nextPage = page === 1 ? `pages/index${page+1}.html` : `index${page+1}.html`;
                paginationHtml += `            <a href="${nextPage}">下一页 →</a>\n`;
            }
            paginationHtml += '        </div>';
        } else {
            // This case shouldn't happen since we're generating multiple pages
            paginationHtml = '<div class="pagination">\n            <a href="../index.html" class="current">1</a>\n        </div>';
        }
        
        // Add SEO meta tags for index pages
        const seoMetaTags = `
    <!-- SEO Meta Tags -->
    <meta name="description" content="AI 个人笔记 - 记录 AI 协助解决的各种技术问题和学习笔记">
    <meta name="keywords" content="AI, 技术笔记, 学习笔记, 编程, 开发">
    <meta name="author" content="AI 个人笔记">
    <meta name="robots" content="index, follow">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="AI 个人笔记">
    <meta property="og:description" content="AI 个人笔记 - 记录 AI 协助解决的各种技术问题和学习笔记">
    <meta property="og:image" content="https://your-domain.com/images/og-image.png">
    <meta property="og:url" content="https://your-domain.com/index.html">
    <meta property="og:site_name" content="AI 个人笔记">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:title" content="AI 个人笔记">
    <meta property="twitter:description" content="AI 个人笔记 - 记录 AI 协助解决的各种技术问题和学习笔记">
    <meta property="twitter:image" content="https://your-domain.com/images/og-image.png">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://your-domain.com/index.html">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">`;
        
        // Replace placeholder with feed items
        let updatedContent = template.replace("{{DOC_CARDS}}", feedItems.join('\n'));
        
        // Add SEO meta tags
        updatedContent = updatedContent.replace('</title>', '</title>' + seoMetaTags);
        
        // Fix paths for pages in subdirectories
        if (page > 1) {
            // Fix logo path
            updatedContent = updatedContent.replace('src="img/logo.png"', 'src="../img/logo.png"');
            // Fix tools button path
            updatedContent = updatedContent.replace('href="tools.html"', 'href="../tools.html"');
            // Fix overview button path
            updatedContent = updatedContent.replace('href="overview.html"', 'href="../overview.html"');
        }
        
        // Replace pagination placeholder
        const paginationPlaceholder = '<div class="pagination">\n            <a href="#" class="current">1</a>\n            <a href="#">2</a>\n            <a href="#">3</a>\n            <a href="#">下一页 →</a>\n        </div>';
        // Also try with Windows line endings
        const paginationPlaceholderWindows = '<div class="pagination">\r\n            <a href="#" class="current">1</a>\r\n            <a href="#">2</a>\r\n            <a href="#">3</a>\r\n            <a href="#">下一页 →</a>\r\n        </div>';
        
        // Try both placeholders
        if (updatedContent.includes(paginationPlaceholder)) {
            updatedContent = updatedContent.replace(paginationPlaceholder, paginationHtml);
        } else if (updatedContent.includes(paginationPlaceholderWindows)) {
            updatedContent = updatedContent.replace(paginationPlaceholderWindows, paginationHtml);
        } else {
            console.log("Warning: Could not find pagination placeholder in template");
        }
        
        // Skip generating index.html (it's the SPA file)
        // Only generate feed pages in pages/ directory
        if (page === 1) {
            // For page 1, generate feed-content.html instead of index.html
            const feedFilename = "pages/feed-content.html";
            fs.writeFileSync(feedFilename, updatedContent, "utf8");
            console.log(`Generated ${feedFilename} with ${pageDocuments.length} documents`);
        } else {
            // Ensure pages directory exists
            if (!fs.existsSync("pages")) {
                fs.mkdirSync("pages");
            }
            const feedFilename = `pages/feed-page${page}.html`;
            fs.writeFileSync(feedFilename, updatedContent, "utf8");
            console.log(`Generated ${feedFilename} with ${pageDocuments.length} documents`);
        }
    }
    
    console.log(`Generated ${totalPages} pages with ${allDocuments.length} total documents`);
    console.log("Files included:");
    allDocuments.forEach(doc => {
        const dir = doc.type === 'markdown' ? `${doc.monthDir}/` : 'html/';
        console.log(`  - ${dir}${doc.filename} (${formatDate(doc.date)})`);
    });

    // index.html is now the primary file, no replacement needed
}

// Run the main function
main();