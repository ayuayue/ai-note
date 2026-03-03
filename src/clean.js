const fs = require("fs");
const path = require("path");

function removePath(target) {
  const resolved = path.resolve(target);

  if (!fs.existsSync(resolved)) {
    console.log(`Skip (not found): ${target}`);
    return;
  }

  fs.rmSync(resolved, { recursive: true, force: true });
  console.log(`Removed: ${target}`);
}

function main() {
  const targets = process.argv.slice(2);

  if (targets.length === 0) {
    console.log("No targets provided.");
    process.exit(0);
  }

  targets.forEach(removePath);
}

main();
