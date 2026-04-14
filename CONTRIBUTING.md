# Contributing

感谢你对声桥感兴趣。

仓库现在采用 monorepo 结构，所以在提 issue 或 PR 之前，建议先看一遍根目录 `README.md` 和 `doc/` 下的文档，先建立对 `apps / packages / crates` 的整体心智模型。

## 开发环境

### 前端

- Bun
- React
- Vite
- TypeScript

### 桌面侧

- Rust
- Windows（当前输入执行依赖 Win32）
- Tauri（桌面壳）

## 本地开发

### Web 壳 + Rust 本地服务

```powershell
bun install
just dev
```

默认效果：

- `apps/web` 在 `5173`
- Rust 本地服务在 `8765`
- `/api` 由 Vite 代理到 Rust

### Tauri 壳

```powershell
just dev-tauri
```

## 提交前建议检查

### Rust

```powershell
cargo fmt --all
cargo check --workspace
```

### Frontend

```powershell
bun run build:web
bun run build:tauri-ui
```

## 代码组织约定

### 目录职责

- `packages/app`：共享 UI、组件、hooks、样式
- `packages/shared`：共享类型、常量、桥接接口
- `apps/web`：Web 壳与 Web 平台桥接
- `apps/tauri`：Tauri 壳与桌面平台桥接
- `crates/server`：本地 HTTP API、输入执行、二维码与静态资源托管

### Rust

- 使用现代模块文件命名，不使用 `mod.rs`
- 优先让模块职责保持单一
- 能直接重构清楚的地方，不保留多余兼容层

### Frontend

- 平台差异优先放到壳层 `platform/bridge.ts`
- 共享交互逻辑优先放到 `packages/app`
- 样式与交互要优先考虑移动端输入法兼容性

## 文档

如果你的改动影响了：

- 功能行为
- 页面交互
- API
- 目录结构
- 开发流程
- 发布流程

请同步更新对应文档。

当前主要文档：

- `README.md`
- `doc/architecture.md`
- `doc/frontend-features.md`
- `doc/release-checklist.md`
- `doc/product/*`

## 许可证与贡献授权

本项目采用 **MIT / Apache-2.0 双授权**。

默认情况下，除非你明确声明否则，你提交到本仓库的代码、文档和其他贡献，都会按与项目相同的双授权方式发布。

## Issue / PR 建议

提交 issue 或 PR 时，建议尽量说明：

- 你遇到的问题是什么
- 预期行为是什么
- 当前行为是什么
- 复现步骤
- 如果和输入法 / 浏览器 / 设备相关，请说明环境信息
