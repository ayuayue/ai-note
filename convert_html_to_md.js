const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Function to convert HTML to Markdown
function htmlToMarkdown(htmlContent) {
    // Load HTML content with cheerio
    const $ = cheerio.load(htmlContent);
    
    let markdown = '';
    
    // Extract title
    const title = $('title').text();
    if (title) {
        markdown += `# ${title}\n\n`;
    }
    
    // Process the content inside .container
    $('.container').children().each((i, elem) => {
        const tagName = elem.tagName;
        const text = $(elem).text().trim();
        
        if (!text) return;
        
        switch (tagName) {
            case 'h1':
                // Skip h1 as we already extracted title
                break;
            case 'h2':
                markdown += `\n## ${text}\n\n`;
                break;
            case 'h3':
                markdown += `\n### ${text}\n\n`;
                break;
            case 'p':
                // Handle paragraphs with special classes
                if ($(elem).hasClass('intro')) {
                    markdown += `> ${text}\n\n`;
                } else {
                    markdown += `${text}\n\n`;
                }
                break;
            case 'ul':
                $(elem).find('li').each((j, li) => {
                    markdown += `- ${$(li).text().trim()}\n`;
                });
                markdown += '\n';
                break;
            case 'table':
                // Convert tables
                markdown += '\n';
                const headers = [];
                $(elem).find('thead th').each((j, th) => {
                    headers.push($(th).text().trim());
                });
                
                if (headers.length > 0) {
                    // Add header row
                    markdown += `| ${headers.join(' | ')} |\n`;
                    // Add separator row
                    markdown += `| ${headers.map(() => '---').join(' | ')} |\n`;
                    
                    // Add data rows
                    $(elem).find('tbody tr').each((j, tr) => {
                        const row = [];
                        $(tr).find('td').each((k, td) => {
                            row.push($(td).text().trim());
                        });
                        markdown += `| ${row.join(' | ')} |\n`;
                    });
                    markdown += '\n';
                }
                break;
            default:
                // For other elements, just add the text
                if (text && !['div', 'span', 'style', 'head', 'meta'].includes(tagName)) {
                    markdown += `${text}\n\n`;
                }
        }
    });
    
    return markdown;
}

// Main function
function main() {
    const htmlDir = "html";
    const markdownDir = "markdown";
    
    // Check if html directory exists
    if (!fs.existsSync(htmlDir)) {
        console.error(`Directory ${htmlDir} does not exist`);
        return;
    }
    
    // Create markdown directory if it doesn't exist
    if (!fs.existsSync(markdownDir)) {
        fs.mkdirSync(markdownDir);
    }
    
    // Get all HTML files in the html directory
    const htmlFiles = fs.readdirSync(htmlDir)
        .filter(file => path.extname(file) === '.html');
    
    if (htmlFiles.length === 0) {
        console.log("No HTML files found in the html directory");
        return;
    }
    
    // Convert each HTML file to Markdown
    htmlFiles.forEach(filename => {
        try {
            const filePath = path.join(htmlDir, filename);
            const htmlContent = fs.readFileSync(filePath, 'utf8');
            
            const markdownContent = htmlToMarkdown(htmlContent);
            
            // Create markdown filename
            const markdownFilename = path.basename(filename, '.html') + '.md';
            const markdownPath = path.join(markdownDir, markdownFilename);
            
            fs.writeFileSync(markdownPath, markdownContent, 'utf8');
            console.log(`Converted ${filename} to ${markdownFilename}`);
        } catch (error) {
            console.error(`Error converting ${filename}: ${error.message}`);
        }
    });
    
    console.log(`\nConversion complete! ${htmlFiles.length} files converted.`);
}

// Run the main function
main();