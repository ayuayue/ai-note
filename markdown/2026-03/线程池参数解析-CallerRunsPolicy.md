
## 线程池参数深度解析：固定线程数、有界队列与 CallerRunsPolicy

下面这段线程池代码在业务里很常见：固定大小、限流队列、拒绝时回压到调用方。  
但它到底“怎么运转”、什么时候会阻塞、会不会丢任务、会不会把调用线程拖慢？  
本文一次性讲清楚。

```java
private static final ExecutorService FUNDS_CARD_EXECUTOR = new ThreadPoolExecutor(
    FUNDS_CARD_PARALLELISM,  // 核心线程数
    FUNDS_CARD_PARALLELISM,  // 最大线程数
    0L,                     // 空闲线程存活时间
    TimeUnit.MILLISECONDS,  // 时间单位
    new ArrayBlockingQueue<>(FUNDS_CARD_PARALLELISM * 4), // 任务队列
    new ThreadPoolExecutor.CallerRunsPolicy() // 拒绝策略
);
```

### 先给结论：这是一套“可控并发 + 明确背压”的配置

- **线程数固定**：不会无限扩容线程
- **队列有界**：不会无限堆积任务
- **CallerRunsPolicy**：队列满时由提交方线程执行，形成“自然限流”

这套配置的核心目标：**稳**。它牺牲峰值吞吐，换取系统可预测性。

---

### 逐参数拆解

#### 1) `corePoolSize` = `maximumPoolSize` = `FUNDS_CARD_PARALLELISM`

这意味着线程池是**固定大小**：

- 线程数始终维持在 `FUNDS_CARD_PARALLELISM`
- 即使任务激增，也不会再创建新线程
- 等价于 `Executors.newFixedThreadPool(n)` 的行为

这是最常见的“可控并发”策略，适合：
- 受限资源（DB 连接、RPC 并发、第三方接口）
- 需要避免 CPU 过载或线程飙升

#### 2) `keepAliveTime = 0`

固定线程池的标准设置：

- 非核心线程不存在（因为 core == max）
- 线程不会回收
- 更稳定，但占用更固定

#### 3) `new ArrayBlockingQueue<>(FUNDS_CARD_PARALLELISM * 4)`

这是**有界队列**，容量是线程数的 4 倍。

队列满之前，任务会排队等待。  
队列满之后，才触发拒绝策略。

为什么容量是 `n * 4`？

- 太小：容易触发拒绝，吞吐下降
- 太大：任务堆积太多，延迟变大，风险不可控

`n * 4` 是一种折中：**允许一定缓冲，但不让延迟失控**。

#### 4) `CallerRunsPolicy`

当线程池和队列都满时：

- 任务**不会被丢弃**
- 任务**不会抛异常**
- **由提交任务的线程自己执行**

这就是“背压”的核心：  
**你提交得越快，你自己就越慢。**

这样可以把压力“反弹”给上游调用者，避免整个系统被打穿。

---

### 真实执行过程（用一句话描述）

当有任务提交时，线程池的行为是：

1. **线程未满** → 创建线程执行
2. **线程满了但队列未满** → 放入队列等待
3. **线程满了且队列满** → `CallerRunsPolicy`，调用方线程执行

这就是一套完整的“限流-缓冲-回压”链路。

---

### 这种配置的优点

- **不会无限创建线程**：避免 CPU 被打爆
- **不会无限堆积任务**：避免内存被打爆
- **不会丢任务**：拒绝时由调用方执行
- **自动形成流量自适应**：提交越快越慢

适合场景：
- 外部接口/数据库有强限制
- 任务必须执行，不允许丢
- 想在峰值时“平滑降速”

---

### 需要注意的隐患

#### 1) 调用线程可能被“拖慢”

如果你在 Web 请求线程里提交任务，  
一旦队列满，**请求线程会自己执行任务** → 响应时间飙升。

#### 2) 可能放大“雪崩链路”

如果调用线程是上游关键线程（如 Netty IO），  
它被占住会进一步阻塞更多请求。

**建议**：不要让 IO 线程直接提交这种池，最好有隔离层。

---

### 如何判断 `FUNDS_CARD_PARALLELISM` 取值

它不是“越大越好”，而是取决于瓶颈：

- **CPU 密集型**：接近 CPU 核心数
- **IO 密集型**：可适当放大，但要结合下游容量
- **第三方接口**：以对方限流为上限

最稳的方式：**用压测 + 监控调整**。

---

### 建议补充（工程实践）

为了可观测性和可运维性，建议加上：

```java
new ThreadPoolExecutor(
    FUNDS_CARD_PARALLELISM,
    FUNDS_CARD_PARALLELISM,
    0L, TimeUnit.MILLISECONDS,
    new ArrayBlockingQueue<>(FUNDS_CARD_PARALLELISM * 4),
    new ThreadFactoryBuilder()
        .setNameFormat("funds-card-%d")
        .setDaemon(false)
        .build(),
    new ThreadPoolExecutor.CallerRunsPolicy()
);
```

并配合：
- 监控队列长度、拒绝次数、任务耗时
- 系统退出时显式 `shutdown()` 或 `shutdownNow()`

---

### 总结

这段线程池配置的本质是：

- 固定线程数 → 控制并发  
- 有界队列 → 控制积压  
- CallerRunsPolicy → 触发背压  

它适合“必须执行但必须可控”的业务场景。  
只要理解它在高峰时的行为，你就能用它稳住系统的最关键部分。
