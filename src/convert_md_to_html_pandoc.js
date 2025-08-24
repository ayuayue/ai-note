const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to convert Markdown to HTML with feed-style layout using Pandoc
function markdownToHtmlWithPandoc(markdownFilePath, title, date, monthDir, filename) {
    try {
        // 使用 Pandoc 转换 Markdown 到 HTML
        // 注意：我们使用 --mathjax 来支持数学公式，--highlight-style 来设置代码高亮
        const pandocCommand = `pandoc "${markdownFilePath}" -f markdown -t html --mathjax --highlight-style=tango`;
        const htmlContent = execSync(pandocCommand, { encoding: 'utf8' });
        
        // Generate GitHub URL - placeholder that users can replace
        const githubUrl = `https://github.com/ayuayue/ai-note/blob/main/markdown/${monthDir}/${filename}`;
        
        // Read SEO template
        const templatePath = path.join(__dirname, '..', 'template_seo.html');
        let template = fs.readFileSync(templatePath, 'utf8');
        
        // Generate SEO description from first few sentences
        const plainText = htmlContent.replace(/<[^>]*>/g, '').trim();
        const description = plainText.substring(0, 160) + (plainText.length > 160 ? '...' : '');
        
        // Generate keywords from title
        const keywords = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, ' ').split(/\s+/).filter(word => word.length > 1).join(', ');
        
        // Generate URL
        const url = `https://your-domain.com/docs/${monthDir}/${path.basename(filename, '.md')}.html`;
        
        // Generate OG image URL (placeholder)
        const ogImage = 'https://your-domain.com/images/og-image.png';
        
        // Replace placeholders in template
        return template
            .replace('{{TITLE}}', title)
            .replace('{{DESCRIPTION}}', description)
            .replace('{{KEYWORDS}}', keywords)
            .replace('{{OG_IMAGE}}', ogImage)
            .replace('{{URL}}', url)
            .replace('{{DATE}}', date)
            .replace('{{CATEGORY}}', monthDir)
            .replace('{{CONTENT}}', htmlContent)
            // Replace any remaining placeholders
            .replace(/{{TITLE}}/g, title)
            .replace(/{{DESCRIPTION}}/g, description)
            .replace(/{{OG_IMAGE}}/g, ogImage)
            .replace(/{{URL}}/g, url);
    } catch (error) {
        console.error(`Error converting ${markdownFilePath} with Pandoc: ${error.message}`);
        throw error;
    }
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
    
    // Create docs directory if it doesn't exist
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir);
    }
    
    // Get all month directories
    const monthDirs = fs.readdirSync(markdownDir)
        .filter(file => fs.statSync(path.join(markdownDir, file)).isDirectory() && /^\d{4}-\d{2}$/.test(file));
    
    if (monthDirs.length === 0) {
        console.log("No month directories found in the markdown directory");
        return;
    }
    
    let totalFiles = 0;
    
    // Process each month directory
    monthDirs.forEach(monthDir => {
        const monthPath = path.join(markdownDir, monthDir);
        const docsMonthPath = path.join(docsDir, monthDir);
        
        // Create corresponding docs directory
        if (!fs.existsSync(docsMonthPath)) {
            fs.mkdirSync(docsMonthPath, { recursive: true });
        }
        
        // Get all Markdown files in the month directory
        const markdownFiles = fs.readdirSync(monthPath)
            .filter(file => path.extname(file) === '.md');
        
        if (markdownFiles.length === 0) {
            console.log(`No Markdown files found in ${monthPath}`);
            return;
        }
        
        // Convert each Markdown file to HTML
        markdownFiles.forEach(filename => {
            try {
                const filePath = path.join(monthPath, filename);
                
                // Extract title from first line (assuming it's a # heading)
                const markdownContent = fs.readFileSync(filePath, 'utf8');
                const titleLine = markdownContent.split('\n')[0];
                const title = titleLine.startsWith('# ') ? titleLine.substring(2) : path.basename(filename, '.md');
                
                // Get file date
                const fileStats = fs.statSync(filePath);
                const date = fileStats.mtime.toLocaleDateString('zh-CN');
                
                const htmlContent = markdownToHtmlWithPandoc(filePath, title, date, monthDir, filename);
                
                // Create HTML filename
                const htmlFilename = path.basename(filename, '.md') + '.html';
                const htmlPath = path.join(docsMonthPath, htmlFilename);
                
                fs.writeFileSync(htmlPath, htmlContent, 'utf8');
                console.log(`Converted ${monthDir}/${filename} to ${monthDir}/${htmlFilename}`);
                totalFiles++;
            } catch (error) {
                console.error(`Error converting ${monthDir}/${filename}: ${error.message}`);
            }
        });
    });
    
    console.log(`\nConversion complete! ${totalFiles} files converted.`);
}

// Run the main function
main();