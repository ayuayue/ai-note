const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

// Import the conversion function from the existing script
const {
    markdownToHtmlWithPandoc,
    generateArticleDetailFragment,
    shouldConvertFile
} = require('./convert_md_to_html_pandoc.js');

console.log('Starting Markdown file watcher...');

// Function to convert a single Markdown file to HTML
function convertSingleFile(filePath) {
    try {
        // Get the relative path from the markdown directory
        const relativePath = path.relative('markdown', filePath);
        const pathParts = relativePath.split(path.sep);
        
        if (pathParts.length < 2) {
            console.log(`Invalid file path: ${filePath}`);
            return;
        }
        
        const monthDir = pathParts[0];
        const filename = pathParts[1];
        
        // Check if it's a Markdown file
        if (path.extname(filename) !== '.md') {
            return;
        }
        
        // Create output filenames
        const htmlFilename = path.basename(filename, '.md') + '.html';
        const fragmentFilename = path.basename(filename, '.md') + '-fragment.html';
        const htmlPath = path.join('docs', monthDir, htmlFilename);
        const fragmentPath = path.join('docs', monthDir, fragmentFilename);
        
        // Check if we need to convert this file (incremental build for both outputs)
        if (!shouldConvertFile(filePath, [htmlPath, fragmentPath])) {
            console.log(`File ${monthDir}/${filename} is up to date, skipping conversion.`);
            return;
        }
        
        // Create corresponding docs directory
        const docsMonthPath = path.join('docs', monthDir);
        if (!fs.existsSync(docsMonthPath)) {
            fs.mkdirSync(docsMonthPath, { recursive: true });
        }
        
        // Read the Markdown file
        const markdownContent = fs.readFileSync(filePath, 'utf8');
        
        // Extract title from first line (assuming it's a # heading)
        const titleLine = markdownContent.split('\n')[0];
        const title = titleLine.startsWith('# ') ? titleLine.substring(2) : path.basename(filename, '.md');
        
        // Get file date
        const fileStats = fs.statSync(filePath);
        const date = fileStats.mtime.toLocaleDateString('zh-CN');
        
        // Convert to HTML using the existing function
        const htmlContent = markdownToHtmlWithPandoc(filePath, title, date, monthDir, filename);
        
        // Write full HTML file
        fs.writeFileSync(htmlPath, htmlContent, 'utf8');

        // Extract article content for fragment
        let contentToUse = htmlContent;
        const postContentRegex =
            /<div[^>]*class="post-content"[^>]*id="post-content"[^>]*>([\s\S]*?)<\/div>\s*<\/article>/;
        const postMatch = htmlContent.match(postContentRegex);
        if (postMatch && postMatch[1]) {
            contentToUse = postMatch[1].replace(/<tr class="header">/g, "<tr>");
        } else {
            const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
            if (bodyMatch && bodyMatch[1]) {
                contentToUse = bodyMatch[1];
            }
        }

        // Write fragment file
        const fragmentContent = generateArticleDetailFragment(contentToUse, title, date, monthDir);
        fs.writeFileSync(fragmentPath, fragmentContent, 'utf8');
        console.log(`Converted ${monthDir}/${filename} to ${monthDir}/${htmlFilename} and ${monthDir}/${fragmentFilename}`);
    } catch (error) {
        console.error(`Error converting ${filePath}: ${error.message}`);
    }
}

// Function to handle file deletion
function handleFileDeletion(filePath) {
    try {
        // Get the relative path from the markdown directory
        const relativePath = path.relative('markdown', filePath);
        const pathParts = relativePath.split(path.sep);
        
        if (pathParts.length < 2) {
            return;
        }
        
        const monthDir = pathParts[0];
        const filename = pathParts[1];
        
        // Check if it's a Markdown file
        if (path.extname(filename) !== '.md') {
            return;
        }
        
        // Create corresponding output filenames
        const htmlFilename = path.basename(filename, '.md') + '.html';
        const htmlPath = path.join('docs', monthDir, htmlFilename);
        const fragmentFilename = path.basename(filename, '.md') + '-fragment.html';
        const fragmentPath = path.join('docs', monthDir, fragmentFilename);
        
        // Delete the full HTML file if it exists
        if (fs.existsSync(htmlPath)) {
            fs.unlinkSync(htmlPath);
            console.log(`Deleted ${monthDir}/${htmlFilename}`);
        }

        // Delete fragment file if it exists
        if (fs.existsSync(fragmentPath)) {
            fs.unlinkSync(fragmentPath);
            console.log(`Deleted ${monthDir}/${fragmentFilename}`);
        }
    } catch (error) {
        console.error(`Error deleting file ${filePath}: ${error.message}`);
    }
}

// Function to handle directory creation
function handleDirCreation(dirPath) {
    try {
        // Get the relative path from the markdown directory
        const relativePath = path.relative('markdown', dirPath);
        
        if (relativePath && !relativePath.includes('..')) {
            const docsDirPath = path.join('docs', relativePath);
            if (!fs.existsSync(docsDirPath)) {
                fs.mkdirSync(docsDirPath, { recursive: true });
                console.log(`Created directory: ${docsDirPath}`);
            }
        }
    } catch (error) {
        console.error(`Error creating directory ${dirPath}: ${error.message}`);
    }
}

// Function to handle directory deletion
function handleDirDeletion(dirPath) {
    try {
        // Get the relative path from the markdown directory
        const relativePath = path.relative('markdown', dirPath);
        
        if (relativePath && !relativePath.includes('..')) {
            const docsDirPath = path.join('docs', relativePath);
            if (fs.existsSync(docsDirPath)) {
                // Note: We're not actually deleting directories to avoid accidental data loss
                console.log(`Directory deleted in source: ${dirPath} (docs directory not deleted for safety)`);
            }
        }
    } catch (error) {
        console.error(`Error handling directory deletion ${dirPath}: ${error.message}`);
    }
}

// Create the watcher
const watcher = chokidar.watch('markdown/**/*', {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true // Don't trigger events for files that already exist
});

// Add event listeners
watcher
    .on('add', filePath => {
        console.log(`File added: ${filePath}`);
        convertSingleFile(filePath);
    })
    .on('change', filePath => {
        console.log(`File changed: ${filePath}`);
        convertSingleFile(filePath);
    })
    .on('unlink', filePath => {
        console.log(`File removed: ${filePath}`);
        handleFileDeletion(filePath);
    })
    .on('addDir', dirPath => {
        console.log(`Directory added: ${dirPath}`);
        handleDirCreation(dirPath);
    })
    .on('unlinkDir', dirPath => {
        console.log(`Directory removed: ${dirPath}`);
        handleDirDeletion(dirPath);
    })
    .on('error', error => {
        console.error(`Watcher error: ${error}`);
    })
    .on('ready', () => {
        console.log('Initial scan complete. Ready for changes.');
        console.log('Watching for changes in the markdown directory...');
        console.log('Press Ctrl+C to stop watching.');
    });

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nStopping watcher...');
    watcher.close().then(() => {
        console.log('Watcher stopped.');
        process.exit(0);
    });
});

console.log('Markdown watcher started. Waiting for changes...');
