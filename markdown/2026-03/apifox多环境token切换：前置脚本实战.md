# Apifox多环境Token切换：前置脚本实战

在本地联调里，我们经常会遇到：**服务端口相同，但环境不同（test-mysql / test-oracle / dev）且 Token 也不同**。这篇文章给你一套“约定大于配置”的 Apifox 前置脚本方案，做到**少改接口、快速切换、降低401误判**。适合经常切 Nacos 环境、手动复制线上 Token 的同学。

## 目录

- [问题背景：为什么总在重复改 Token](#问题背景为什么总在重复改-token)
- [方案目标：一套脚本适配多环境多用户](#方案目标一套脚本适配多环境多用户)
- [核心脚本实现（可直接使用）](#核心脚本实现可直接使用)
- [执行流程图（Mermaid）](#执行流程图mermaid)
- [变量约定与实战示例](#变量约定与实战示例)
- [边界与坑位（一定要看）](#边界与坑位一定要看)
- [进阶：多用户切换与自动回退](#进阶多用户切换与自动回退)
- [同类工具对比思路（Apifox / Postman / Insomnia）](#同类工具对比思路apifox--postman--insomnia)
- [总结](#总结)
- [延伸阅读](#延伸阅读)
- [一句话记忆](#一句话记忆)

## 问题背景：为什么总在重复改 Token

典型场景：

1. 本地服务端口固定（如 `localhost:8080`）
2. 你会切换 Nacos 配置环境（`test-mysql`、`test-oracle` 等）
3. 登录链路复杂，不方便每次调登录接口自动拿 Token
4. 实际做法常是“手动从线上复制 Token”

结果就是：每次切环境都去改请求头，费时且容易漏改。

## 方案目标：一套脚本适配多环境多用户

我们要达到：

- **不改每个接口的 Authorization**
- 用一个变量 `token-env` 决定当前环境
- 自动读取 `token-${token-env}` 的值注入通用变量 `token`
- 当 `token-env` 不存在时，**脚本直接跳过**（兼容旧流程）

## 核心脚本实现（可直接使用）

> 建议放在 Apifox 的「项目级前置脚本」，全接口复用。

```javascript
// 约定：
// token-env = test-mysql => 读取 token-test-mysql
// 若 token-env 不存在/为空：直接结束脚本（不设置token）

const env = (pm.environment.get("token-env") || "").trim();

// 1) 没有 token-env：直接结束
if (!env) {
  console.log("[Auth] token-env 未设置，跳过 token 注入。");
  return;
}

// 2) 按约定拼接变量名
const tokenVarName = `token-${env}`;
let tokenValue = (pm.environment.get(tokenVarName) || "").trim();

// 3) 有 env 但没 token：提示
if (!tokenValue) {
  console.log(`[Auth] 变量 ${tokenVarName} 为空，请先粘贴 token`);
  return;
}

// 4) 兼容手动复制时可能带 Bearer 前缀
tokenValue = tokenValue.replace(/^Bearer\s+/i, "").trim();

// 5) 输出通用变量，供请求头统一引用
pm.environment.set("token", tokenValue);
console.log(`[Auth] 使用 ${env}`);
```

请求头统一写法：

```text
Authorization: Bearer {{token}}
```

## 执行流程图（Mermaid）

```mermaid
flowchart TD
  A[读取 token-env] --> B{token-env 是否为空}
  B -- 是 --> C[跳过注入并结束]
  B -- 否 --> D[拼接变量名 token-${env}]
  D --> E[读取 tokenValue]
  E --> F{tokenValue 是否为空}
  F -- 是 --> G[日志提示后结束]
  F -- 否 --> H[去掉 Bearer 前缀]
  H --> I[设置环境变量 token]
  I --> J[请求头使用 Bearer {{token}}]
```

## 变量约定与实战示例

假设你有这些环境变量：

```text
token-env = test-mysql
token-test-mysql = Bearer eyJ...
token-test-oracle = Bearer eyJ...
token-dev = Bearer eyJ...
```

当 `token-env=test-mysql` 时，脚本会读取 `token-test-mysql`，并把结果写入 `token`。

### 多用户怎么做？

可以继续扩展“环境 + 用户”双维度：

```text
token-env = test-mysql
token-user = admin

token-test-mysql-admin = Bearer xxx
token-test-mysql-qa = Bearer yyy
```

脚本拼接改成：`token-${env}-${user}` 即可。

## 边界与坑位（一定要看）

### 1）不要在日志打印完整 Token

你原脚本里有：

```javascript
console.log(`[Auth] 使用 ${env} - ${tokenValue}`);
```

这会把敏感信息暴露到控制台日志，建议改成只打印环境名。

### 2）空 Token 时要不要中断请求？

两种策略：

- **宽松模式**（本文默认）：只提示并 `return`，不主动 throw
- **严格模式**：`throw new Error(...)`，直接阻断请求，避免无意义 401

团队联调推荐严格模式，个人调试可用宽松模式。

### 3）Bearer 前缀重复问题

有人会把变量值保存成：`Bearer xxx`，请求头又写 `Bearer {{token}}`，最终变成 `Bearer Bearer xxx`。本文脚本已做兼容，先去前缀再写入 `token`。

### 4）命名统一性

请统一使用一种命名风格，建议全小写：

- `token-env`
- `token-test-mysql`
- `token-test-oracle`

命名混乱会显著提高维护成本。

## 进阶：多用户切换与自动回退

可再加一个回退逻辑：

- 优先读 `token-${env}-${user}`
- 不存在时回退到 `token-${env}`

这对“同环境多个账号轮测”特别实用。

```javascript
const env = (pm.environment.get("token-env") || "").trim();
const user = (pm.environment.get("token-user") || "").trim();
if (!env) return;

const primary = user ? `token-${env}-${user}` : "";
const fallback = `token-${env}`;

let token = "";
if (primary) token = (pm.environment.get(primary) || "").trim();
if (!token) token = (pm.environment.get(fallback) || "").trim();
if (!token) return;

token = token.replace(/^Bearer\s+/i, "").trim();
pm.environment.set("token", token);
```

## 同类工具对比思路（Apifox / Postman / Insomnia）

- **Apifox**：项目协作与接口文档一体化强，前置脚本适合做“环境路由”
- **Postman**：生态成熟，脚本能力完整，团队协作同样可行
- **Insomnia**：轻量简洁，适合偏个人调试

核心思想一致：**通过环境变量命名约定 + 统一请求头变量，实现低成本切换**。

## 总结

这个方案的关键不是“魔法脚本”，而是三件事：

1. **命名约定固定**：`token-env` + `token-${env}`
2. **请求头统一引用**：`Authorization: Bearer {{token}}`
3. **脚本只做路由**：根据当前环境挑选 Token，而不是让每个接口自己管理

当你频繁切换 Nacos 环境、又依赖手工复制 Token 时，这套方式是最稳、最省认知负担的。

## 延伸阅读

- Apifox 官方文档（环境变量/前置脚本）
- JWT 官方介绍（RFC 7519）
- OWASP API Security Top 10（API 认证与日志安全）

## 一句话记忆

**把 Token 切换问题从“每个接口改一次”，变成“只改一个 `token-env` 变量”。**
