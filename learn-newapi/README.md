# new-api 源码入门教学

这套文档面向"没跑过这份代码"的新手，目标是让你能回答四个问题：

1. 这个项目整体怎么分层？
2. 后端一个接口从 URL 到数据库经过哪些文件？
3. 前端一个页面从浏览器到调用接口经过哪些文件？
4. 前后端到底在哪里"接"起来？

## 阅读顺序

| 顺序 | 文档 | 你会得到什么 |
| --- | --- | --- |
| 1 | [01-整体架构.md](./01-整体架构.md) | 目录职责、两条主链路、模块边界 |
| 2 | [02-后端接口链路.md](./02-后端接口链路.md) | router → middleware → controller → service/model，含响应格式 |
| 3 | [03-前端页面与请求.md](./03-前端页面与请求.md) | TanStack Router 文件路由、feature 目录、axios 封装 |
| 4 | [04-前后端如何连接.md](./04-前后端如何连接.md) | 开发代理、生产 embed、鉴权头、同源策略 |
| 5 | [05-动手改代码.md](./05-动手改代码.md) | 5 个常见修改场景的完整步骤 |

## 先把项目跑起来

需要：Go 1.25+、Bun、Air（后端热重载）。

```powershell
# 一次性安装 Air
go install github.com/air-verse/air@latest

# 终端 1：仓库根目录，后端 3001，改 .go 自动重启
air

# 终端 2：前端 5173，改 .tsx 自动热更新
cd web
bun install
bun run dev
```

浏览器打开 `http://localhost:5173`。

- `5173` 是前端开发服务器，负责页面和热更新
- `3001` 是 Go 后端，负责所有 `/api` 和 `/v1` 请求
- 前端的 `/api`、`/v1`、`/mj`、`/pg` 会被代理到 3001

> 不要用 `http://localhost:3001` 开发页面。3001 提供的是编译后的 `web/dist`，改代码不会热更新。

## 生产模式（了解即可）

```powershell
cd web
bun run build     # 产物在 web/dist
cd ..
go build -o new-api.exe .
```

生产构建时 `web/dist` 会被 [main.go](../main.go) 的 `//go:embed web/dist` 打进二进制，最终只暴露一个端口。

## 三条必须知道的项目规则

来自仓库根目录 [AGENTS.md](../AGENTS.md)：

1. 改动任何计费相关代码前，必须先完整阅读 [.agents/rules/billing.md](../.agents/rules/billing.md)。
2. 数据库改动必须同时兼容并实测 SQLite、MySQL、PostgreSQL。
3. Go 里的 JSON 序列化统一用 `common.Marshal` / `common.Unmarshal`，不要直接调 `encoding/json`。

## 建议的第一次阅读路径

按这个顺序打开文件，只读不写：

1. [main.go](../main.go) —— 看 `main()` 和 `InitResources()`，知道启动做了什么
2. [router/main.go](../router/main.go) —— 看 `SetRouter`，知道路由分成几组
3. [router/api-router.go](../router/api-router.go) —— 随便找一组，比如 `/api/redemption`
4. [controller/redemption.go](../controller/redemption.go) —— 看一个最简单的增删改查
5. [model/redemption.go](../model/redemption.go) —— 看 GORM 模型
6. [web/src/routes/_authenticated/redemption-codes/index.tsx](../web/src/routes/_authenticated/redemption-codes/index.tsx)
7. [web/src/features/redemption-codes/api.ts](../web/src/features/redemption-codes/api.ts)

这七份文件串起来，就是一次完整的前后端往返。
