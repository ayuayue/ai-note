const chokidar = require("chokidar");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const isQuiet =
  process.env.WATCH_QUIET === "1" ||
  process.env.QUIET === "1" ||
  process.argv.includes("--quiet");
const log = (...args) => {
  if (!isQuiet) console.log(...args);
};

// 读取配置
const configPath = path.join(__dirname, "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

config.tasks.forEach(task => {
  // 如果没写 root，就默认使用调用者运行的目录
  const taskRoot = task.root
    ? path.resolve(task.root)
    : process.cwd();

  // 监听路径，基于 root 解析
  const absWatchPath = path.resolve(taskRoot, task.watch);

  const watcher = chokidar.watch(absWatchPath, {
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on("all", (event, changedPath) => {
    const relativePath = path.relative(taskRoot, changedPath) || changedPath;
    if (isQuiet) {
      console.log(`[watch] ${event}: ${relativePath}`);
    } else {
      console.log(`[${absWatchPath}] 变化: ${event} -> ${changedPath}`);
    }

    const childEnv = { ...process.env };
    if (isQuiet) {
      childEnv.QUIET = "1";
    }

    const child = spawn(task.command, {
      cwd: taskRoot,
      env: childEnv,
      shell: true,
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code !== 0) {
        console.error(`❌ 执行失败: ${task.command} (code=${code})`);
        return;
      }

      if (isQuiet) {
        console.log("[watch] 构建完成");
      }
    });
  });

  log(`👀 正在监听: ${absWatchPath} -> 执行 "${task.command}" (cwd=${taskRoot})`);
});
