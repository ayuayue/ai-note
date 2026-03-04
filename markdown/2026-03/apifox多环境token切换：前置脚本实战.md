# Apifox 多环境 Token 切换实践：基于前置脚本的约定式方案

在本地联调场景中，服务地址通常保持不变，但运行环境（如 `test-mysql`、`test-oracle`、`dev`）和认证 Token 会频繁切换。若在每个接口中手动修改 `Authorization`，容易产生漏改、误用和调试噪音。本文给出一套可直接落地的 Apifox 前置脚本方案，用于统一管理多环境 Token。

## 摘要

本文通过“约定大于配置”的方式，将 Token 选择逻辑集中到项目级前置脚本：由 `token-env` 指定当前环境，脚本自动读取 `token-${env}` 并注入统一变量 `token`。该方案适用于手动复制 Token、登录链路复杂、且本地服务需频繁切换环境的团队。

## 目录

- [问题定义](#问题定义)
- [设计目标](#设计目标)
- [变量约定](#变量约定)
- [前置脚本实现](#前置脚本实现)
- [执行流程（文本版）](#执行流程文本版)
- [请求头统一策略](#请求头统一策略)
- [安全与边界处理](#安全与边界处理)
- [扩展：多用户并行切换](#扩展多用户并行切换)
- [对比与适用性分析](#对比与适用性分析)
- [结论](#结论)
- [参考资料](#参考资料)

## 问题定义

典型联调链路如下：

1. 本地服务端口固定（例如 `localhost:8080`）。
2. 本地启动参数切换到不同配置中心环境（如 Nacos 的 `test-mysql`、`test-oracle`）。
3. 认证 Token 通常通过线上系统手工复制，而非调用登录接口自动获取。
4. Token 与环境强绑定，切换环境后若未同步切换 Token，会直接触发 401 或误判后端问题。

该问题的本质不是“如何获取 Token”，而是“如何在请求发送前可靠选择正确 Token”。

## 设计目标

方案需满足以下目标：

- 不在每个接口重复维护 Token 逻辑。
- 仅通过环境变量切换当前 Token。
- 与现有流程兼容：`token-env` 缺失时不强制注入 Token。
- 对手工复制值中可能包含 `Bearer ` 前缀进行兼容处理。

## 变量约定

采用以下命名规则：

```text
token-env              // 当前环境标识，例如 test-mysql
token-test-mysql       // test-mysql 对应 Token
token-test-oracle      // test-oracle 对应 Token
token-dev              // dev 对应 Token
token                  // 前置脚本输出的统一变量
```

该约定的核心是：**由 `token-env` 计算目标变量名 `token-${env}`**。

## 前置脚本实现

建议放置于 Apifox 项目级前置脚本：

```javascript
// 约定：
// token-env = test-mysql => 读取 token-test-mysql
// 若 token-env 不存在/为空：直接结束脚本（不设置 token）

const env = (pm.environment.get("token-env") || "").trim();

// 1) token-env 为空：兼容现有流程，直接结束
if (!env) {
  console.log("[Auth] token-env 未设置，跳过 token 注入。");
  return;
}

// 2) 拼接目标变量名
const tokenVarName = `token-${env}`;
let tokenValue = (pm.environment.get(tokenVarName) || "").trim();

// 3) 未配置 token：记录提示并结束
if (!tokenValue) {
  console.log(`[Auth] 变量 ${tokenVarName} 为空，请先粘贴 token`);
  return;
}

// 4) 兼容手工复制场景（可能包含 Bearer 前缀）
tokenValue = tokenValue.replace(/^Bearer\s+/i, "").trim();

// 5) 写入统一变量，供请求头引用
pm.environment.set("token", tokenValue);
console.log(`[Auth] 使用环境: ${env}`);
```

## 执行流程（文本版）

由于部分渲染器对 Mermaid 支持不一致，流程使用文本描述：

1. 读取 `token-env`。
2. 若为空，脚本结束，不修改任何 Token 变量。
3. 若不为空，拼接变量名 `token-${env}`。
4. 读取该变量值。
5. 若为空，输出日志并结束。
6. 若非空，移除可能存在的 `Bearer ` 前缀。
7. 将结果写入统一变量 `token`。
8. 请求头统一读取 `{{token}}`。

## 请求头统一策略

所有需鉴权接口统一配置：

```text
Authorization: Bearer {{token}}
```

这样可将“鉴权值来源”与“接口定义”解耦：接口本身不再关注当前环境，只依赖统一变量输出。

## 安全与边界处理

### 1. 避免输出敏感信息

不建议打印完整 Token。日志应仅记录环境名或变量名，避免 Token 泄露到调试日志或共享截图。

### 2. 空 Token 的处理策略

当前实现为“宽松模式”（记录日志后返回）。若团队希望减少无效请求，可改为“严格模式”：

```javascript
throw new Error(`[Auth] 变量 ${tokenVarName} 为空`);
```

### 3. 前缀重复问题

若环境变量值已包含 `Bearer `，而请求头又写 `Bearer {{token}}`，会出现重复前缀。脚本中的正则清洗用于解决该问题。

### 4. 命名一致性

建议统一小写中划线风格（`token-env`、`token-test-mysql`），避免协作中出现同义变量并行。

## 扩展：多用户并行切换

若同一环境需要多个账号并行调试，可增加 `token-user`：

```text
token-env = test-mysql
token-user = admin
token-test-mysql-admin = Bearer xxx
token-test-mysql-qa = Bearer yyy
```

扩展读取策略：优先 `token-${env}-${user}`，缺失时回退 `token-${env}`。

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

## 对比与适用性分析

该方案适用于以下条件：

- 认证 Token 主要靠手工维护；
- 环境切换频繁；
- 期望在不改接口定义的前提下完成切换。

其优势是实现成本低、迁移成本低、可逐步升级；局限是 Token 生命周期管理仍依赖人工，需要配合有效期治理和最小权限控制。

## 结论

在多环境联调中，Token 管理的关键在于“路由统一”，而不是“在每个接口重复设置”。采用 `token-env + token-${env}` 的约定式前置脚本后，可将切换操作收敛到单一入口，显著降低维护成本和误操作概率。

## 参考资料

- Apifox 文档：环境变量与前置脚本
- RFC 7519：JSON Web Token (JWT)
- OWASP API Security Top 10
