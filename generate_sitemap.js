const fs = require('fs');
const path = require('path');

// Function to get file modification date
function getFileDate(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.mtime;
    } catch (error) {
        return new Date();
    }
}

// Function to format date as ISO string for sitemap
function formatSitemapDate(date) {
    return date.toISOString();
}

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

// Main function
function main() {
    const markdownDir = "markdown";
    const docsDir = "docs";
    const htmlDir = "html";
    const baseUrl = "https://your-domain.com"; // TODO: Replace with your actual domain
    
    // Collect all documents with their dates
    const allDocuments = [];
    
    // Get all month directories for markdown files
    if (fs.existsSync(markdownDir)) {
        const monthDirs = fs.readdirSync(markdownDir)
            .filter(file => fs.statSync(path.join(markdownDir, file)).isDirectory() && /^\d{4}-\d{2}$/.test(file))
            .sort()
            .reverse(); // Sort by newest first
        
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
                const htmlFilename = filename.replace('.md', '.html');
                const url = `${baseUrl}/docs/${monthDir}/${htmlFilename}`;
                const date = getFileDate(filePath);
                
                allDocuments.push({
                    type: 'markdown',
                    url: url,
                    date: date
                });
            });
        });
    }
    
    // Process HTML files
    if (fs.existsSync(htmlDir)) {
        const htmlFiles = fs.readdirSync(htmlDir)
            .filter(file => path.extname(file) === '.html');
        
        htmlFiles.forEach(filename => {
            const filePath = path.join(htmlDir, filename);
            const url = `${baseUrl}/html/${filename}`;
            const date = getFileDate(filePath);
            
            allDocuments.push({
                type: 'html',
                url: url,
                date: date
            });
        });
    }
    
    // Generate sitemap XML
    let sitemapXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemapXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Add index page
    sitemapXml += '  <url>\n';
    sitemapXml += `    <loc>${baseUrl}/index.html</loc>\n`;
    sitemapXml += `    <lastmod>${formatSitemapDate(new Date())}</lastmod>\n`;
    sitemapXml += '    <changefreq>daily</changefreq>\n';
    sitemapXml += '    <priority>1.0</priority>\n';
    sitemapXml += '  </url>\n';
    
    // Add all documents
    allDocuments.forEach(doc => {
        sitemapXml += '  <url>\n';
        sitemapXml += `    <loc>${doc.url}</loc>\n`;
        sitemapXml += `    <lastmod>${formatSitemapDate(doc.date)}</lastmod>\n`;
        sitemapXml += '    <changefreq>monthly</changefreq>\n';
        sitemapXml += '    <priority>0.8</priority>\n';
        sitemapXml += '  </url>\n';
    });
    
    sitemapXml += '</urlset>\n';
    
    // Write sitemap.xml
    fs.writeFileSync("sitemap.xml", sitemapXml, "utf8");
    
    console.log(`Generated sitemap.xml with ${allDocuments.length + 1} URLs`);
}

// Run the main function
main();