const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to convert a single Markdown file to HTML using Pandoc
function convertSingleFileWithPandoc(markdownFilePath) {
    try {
        // Get the relative path from the markdown directory
        const relativePath = path.relative(process.cwd(), markdownFilePath);
        const pathParts = relativePath.split(path.sep);
        
        // Check if the file is in the markdown directory
        if (pathParts[0] !== 'markdown' || pathParts.length < 3) {
            console.log(`File not in markdown directory: ${markdownFilePath}`);
            return;
        }
        
        const monthDir = pathParts[1];
        const filename = pathParts[2];
        
        // Check if it's a Markdown file
        if (path.extname(filename) !== '.md') {
            return;
        }
        
        // Create corresponding docs directory
        const docsMonthPath = path.join('docs', monthDir);
        if (!fs.existsSync(docsMonthPath)) {
            fs.mkdirSync(docsMonthPath, { recursive: true });
        }
        
        // Read the Markdown file to extract title
        const markdownContent = fs.readFileSync(markdownFilePath, 'utf8');
        
        // Extract title from first line (assuming it's a # heading)
        const titleLine = markdownContent.split('\n')[0];
        const title = titleLine.startsWith('# ') ? titleLine.substring(2) : path.basename(filename, '.md');
        
        // Get file date
        const fileStats = fs.statSync(markdownFilePath);
        const date = fileStats.mtime.toLocaleDateString('zh-CN');
        
        // Use Pandoc to convert Markdown to HTML
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
        const finalHtmlContent = template
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
        
        // Create HTML filename
        const htmlFilename = path.basename(filename, '.md') + '.html';
        const htmlPath = path.join(docsMonthPath, htmlFilename);
        
        // Write the HTML file
        fs.writeFileSync(htmlPath, finalHtmlContent, 'utf8');
        console.log(`Converted ${monthDir}/${filename} to ${monthDir}/${htmlFilename}`);
    } catch (error) {
        console.error(`Error converting ${markdownFilePath}: ${error.message}`);
    }
}

// Main function - converts the file passed as command line argument
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('No file specified for conversion');
        return;
    }
    
    const filePath = args[0];
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        console.log(`File does not exist: ${filePath}`);
        return;
    }
    
    // Check if it's a Markdown file
    if (path.extname(filePath) === '.md') {
        console.log(`Converting: ${filePath}`);
        convertSingleFileWithPandoc(filePath);
    } else {
        console.log(`Not a Markdown file: ${filePath}`);
    }
}

// Run the main function
main();