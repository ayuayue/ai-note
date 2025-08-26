const chokidar = require("chokidar");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

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
    console.log(`[${absWatchPath}] 变化: ${event} -> ${changedPath}`);
    const child = exec(task.command, { cwd: taskRoot }, (err, stdout, stderr) => {
      if (err) {
        console.error(`❌ 执行失败: ${err.message}`);
        return;
      }
      if (stderr) console.error(stderr.trim());
      if (stdout) console.log(stdout.trim());
    });
    // 实时输出
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  });

  console.log(`👀 正在监听: ${absWatchPath} -> 执行 "${task.command}" (cwd=${taskRoot})`);
});
