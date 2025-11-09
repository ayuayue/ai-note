const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Simple concurrency limiter
class ConcurrencyLimiter {
    constructor(limit) {
        this.limit = limit;
        this.running = 0;
        this.queue = [];
    }

    async run(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.tryNext();
        });
    }

    tryNext() {
        if (this.running >= this.limit || this.queue.length === 0) {
            return;
        }

        const { task, resolve, reject } = this.queue.shift();
        this.running++;

        task().then(resolve, reject).finally(() => {
            this.running--;
            this.tryNext();
        });
    }
}

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
        const url = `https://caoayu.top/docs/${monthDir}/${path.basename(filename, '.md')}.html`;
        
        // Generate OG image URL (placeholder)
        const ogImage = 'https://caoayu.top/images/og-image.png';
        
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

// Function to generate article detail fragment for SPA
function generateArticleDetailFragment(htmlContent, title, date, monthDir) {
    try {
        // Fix Mermaid code blocks - remove unnecessary code wrapper
        // Pandoc wraps mermaid code in <pre class="mermaid"><code>...</code></pre>
        // But Mermaid expects <pre class="mermaid">...</pre>
        let fixedContent = htmlContent.replace(
            /<pre class="mermaid"><code>([\s\S]*?)<\/code><\/pre>/g,
            '<pre class="mermaid">$1</pre>'
        );

        // Read article detail template
        const fragmentPath = path.join(__dirname, '..', 'pages', 'article-detail.html');
        let fragment = fs.readFileSync(fragmentPath, 'utf8');

        // Replace placeholders
        return fragment
            .replace('{{TITLE}}', title)
            .replace('{{DATE}}', date)
            .replace('{{CATEGORY}}', monthDir)
            .replace('{{CONTENT}}', fixedContent);
    } catch (error) {
        console.error(`Error generating article detail fragment: ${error.message}`);
        throw error;
    }
}

// Function to check if file needs to be converted (incremental build)
function shouldConvertFile(markdownPath, htmlPath) {
    // If HTML file doesn't exist, we need to convert
    if (!fs.existsSync(htmlPath)) {
        return true;
    }

    // Compare modification times
    const markdownStats = fs.statSync(markdownPath);
    const htmlStats = fs.statSync(htmlPath);

    // Convert if markdown file is newer than HTML file
    return markdownStats.mtime > htmlStats.mtime;
}

// Main function
async function main() {
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
    
    // Create a concurrency limiter with 4 concurrent processes
    const limiter = new ConcurrencyLimiter(4);
    
    let totalFiles = 0;
    let skippedFiles = 0;
    const conversionPromises = [];
    
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
        
        // Add each file conversion to the promise array
        markdownFiles.forEach(filename => {
            const conversionPromise = limiter.run(() => {
                return new Promise((resolve, reject) => {
                    try {
                        const filePath = path.join(monthPath, filename);

                        // Create HTML filename
                        const htmlFilename = path.basename(filename, '.md') + '.html';
                        const fragmentFilename = path.basename(filename, '.md') + '-fragment.html';
                        const fragmentPath = path.join(docsMonthPath, fragmentFilename);

                        // Check if we need to convert this file (incremental build)
                        if (!shouldConvertFile(filePath, fragmentPath)) {
                            skippedFiles++;
                            resolve();
                            return;
                        }

                        // Extract title from first line (assuming it's a # heading)
                        const markdownContent = fs.readFileSync(filePath, 'utf8');
                        const titleLine = markdownContent.split('\n')[0];
                        const title = titleLine.startsWith('# ') ? titleLine.substring(2) : path.basename(filename, '.md');

                        // Get file date
                        const fileStats = fs.statSync(filePath);
                        const date = fileStats.mtime.toLocaleDateString('zh-CN');

                        const htmlContent = markdownToHtmlWithPandoc(filePath, title, date, monthDir, filename);

                        // Generate ONLY fragment for SPA (no need for full HTML anymore)
                        try {
                            // Extract the post-content div content from the full HTML
                            // This is what will be displayed in the SPA
                            let contentToUse = htmlContent;

                            // Try to find and extract post-content div
                            const postContentRegex = /<div[^>]*class="post-content"[^>]*id="post-content"[^>]*>([\s\S]*?)<\/div>\s*<\/article>/;
                            const postMatch = htmlContent.match(postContentRegex);

                            if (postMatch) {
                                // Found post-content - use only its content
                                contentToUse = postMatch[1];
                                console.log(`Extracted post-content, size: ${contentToUse.length}`);
                            } else {
                                // Fallback: try to get everything after body tag
                                const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
                                if (bodyMatch) {
                                    contentToUse = bodyMatch[1];
                                    console.log(`Using body content, size: ${contentToUse.length}`);
                                }
                            }

                            const fragmentContent = generateArticleDetailFragment(contentToUse, title, date, monthDir);
                            fs.writeFileSync(fragmentPath, fragmentContent, 'utf8');
                            console.log(`Generated ${monthDir}/${fragmentFilename}`);
                        } catch (fragmentError) {
                            console.error(`Error generating fragment for ${monthDir}/${filename}: ${fragmentError.message}`);
                            reject(fragmentError);
                            return;
                        }

                        totalFiles++;
                        resolve();
                    } catch (error) {
                        console.error(`Error converting ${monthDir}/${filename}: ${error.message}`);
                        reject(error);
                    }
                });
            });
            
            conversionPromises.push(conversionPromise);
        });
    });
    
    // Wait for all conversions to complete
    try {
        await Promise.all(conversionPromises);
        console.log(`\nConversion complete! ${totalFiles} files converted, ${skippedFiles} files skipped (up to date).`);
    } catch (error) {
        console.error(`Error during conversion process: ${error.message}`);
    }
}

// Export the function for use in other scripts
module.exports = {
    markdownToHtmlWithPandoc,
    generateArticleDetailFragment,
    main,
    shouldConvertFile
};

// Run the main function if this script is executed directly
if (require.main === module) {
    main();
}