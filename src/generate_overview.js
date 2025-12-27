const fs = require("fs");
const path = require("path");

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
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// Function to extract title from Markdown file
function extractTitleFromMarkdown(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    // Look for first # heading
    const titleMatch = content.match(/^#\s+(.*?)$/m);
    if (titleMatch) {
      return titleMatch[1];
    }

    // If no # heading, use filename
    return path.basename(filePath, ".md");
  } catch (error) {
    console.error(`Error reading ${filePath}: ${error.message}`);
    return path.basename(filePath, ".md");
  }
}

// Function to extract title from HTML file
function extractTitleFromHTML(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    // Look for title tag
    const titleMatch = content.match(/<title>(.*?)<\/title>/i);
    if (titleMatch) {
      return titleMatch[1];
    }

    // If no title tag, use filename
    return path.basename(filePath, ".html");
  } catch (error) {
    console.error(`Error reading ${filePath}: ${error.message}`);
    return path.basename(filePath, ".html");
  }
}

// Main function
function main() {
  const markdownDir = "markdown";
  const docsDir = "docs";
  const htmlDir = "html";

  // Collect all documents with their dates
  const allDocuments = [];

  // Get all month directories for markdown files
  if (fs.existsSync(markdownDir)) {
    const monthDirs = fs
      .readdirSync(markdownDir)
      .filter(
        (file) =>
          fs.statSync(path.join(markdownDir, file)).isDirectory() &&
          /^\d{4}-\d{2}$/.test(file),
      )
      .sort()
      .reverse(); // Sort by newest first

    // Process each month directory for markdown files
    monthDirs.forEach((monthDir) => {
      const monthPath = path.join(markdownDir, monthDir);

      // Get all Markdown files in the month directory
      const markdownFiles = fs
        .readdirSync(monthPath)
        .filter((file) => path.extname(file) === ".md");

      if (markdownFiles.length === 0) {
        console.log(`No Markdown files found in ${monthPath}`);
        return;
      }

        // Collect document info
      markdownFiles.forEach((filename) => {
        const filePath = path.join(monthPath, filename);
        const htmlFilename = filename.replace(".md", "-fragment.html");
        const title = extractTitleFromMarkdown(filePath);
        const date = getFileDate(filePath);
        const formattedDate = formatDate(date);

        allDocuments.push({
          type: "markdown",
          url: `./index.html#/docs/${monthDir}/${htmlFilename}`,
          title: title,
          date: formattedDate,
          category: "Markdown 文档",
        });
      });
    });
  }

  // Process HTML files
  if (fs.existsSync(htmlDir)) {
    const htmlFiles = fs
      .readdirSync(htmlDir)
      .filter((file) => path.extname(file) === ".html");

    htmlFiles.forEach((filename) => {
      const filePath = path.join(htmlDir, filename);
      const title = extractTitleFromHTML(filePath);
      const date = getFileDate(filePath);
      const formattedDate = formatDate(date);

      allDocuments.push({
        type: "html",
        url: `html/${filename}`,
        title: title,
        date: formattedDate,
        category: "HTML 文档",
      });
    });
  }

  // Sort all documents by date (newest first)
  allDocuments.sort((a, b) => {
    // Convert date strings back to Date objects for comparison
    const dateA = new Date(a.date.replace(/(\d+)\/(\d+)\/(\d+)/, "$1-$2-$3"));
    const dateB = new Date(b.date.replace(/(\d+)\/(\d+)\/(\d+)/, "$1-$2-$3"));
    return dateB - dateA;
  });

  // Generate JavaScript array for the overview page
  const articlesJs = `const articles = ${JSON.stringify(allDocuments, null, 2)};`;

  // Read the overview.html file
  let overviewHtml = fs.readFileSync("overview.html", "utf8");

  // Replace the placeholder script with the actual data
  const placeholderScriptStart = "const articles = [";
  const placeholderScriptEnd = "];";

  const newScript = `${articlesJs}`;

  // Find the articles array in the existing script and replace it
  const scriptStartIndex = overviewHtml.indexOf(placeholderScriptStart);
  const scriptEndIndex = overviewHtml.indexOf(
    placeholderScriptEnd,
    scriptStartIndex,
  );

  if (scriptStartIndex !== -1 && scriptEndIndex !== -1) {
    // Extract the part before and after the articles array
    const beforeScript = overviewHtml.substring(0, scriptStartIndex);
    const afterScript = overviewHtml.substring(
      scriptEndIndex + placeholderScriptEnd.length,
    );

    // Reconstruct the HTML with the new articles array
    overviewHtml = beforeScript + newScript + afterScript;
  } else {
    console.log("Warning: Could not find placeholder script in overview.html");
  }

  // Write the updated overview.html file
  fs.writeFileSync("overview.html", overviewHtml, "utf8");

  console.log(`Generated overview.html with ${allDocuments.length} articles`);
  console.log("Articles included:");
  allDocuments.forEach((doc) => {
    console.log(`  - ${doc.title} (${doc.date})`);
  });
}

// Run the main function
main();
