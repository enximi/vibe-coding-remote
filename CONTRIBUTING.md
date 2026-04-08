# Contributing

感谢你对声桥感兴趣。

这个项目目前仍在快速迭代阶段，所以在提 issue 或 PR 之前，建议先看一遍根目录 `README.md` 和 `doc/` 下的文档。

---

## 开发环境

### 后端

- Rust
- Windows（当前桌面输入实现依赖 Win32）

### 前端

- Bun
- React
- Vite
- TypeScript

---

## 本地开发

### 启动 Rust API

```powershell
cargo run
```

默认端口：`8765`

### 启动前端开发服务器

```powershell
cd frontend
bun install
bun run dev
```

默认端口：`5173`

开发模式下：

- 页面访问 `5173`
- `/api` 代理到 Rust `8765`

---

## 提交前建议检查

### Rust

```powershell
cargo fmt
cargo check
```

### Frontend

```powershell
cd frontend
bun run lint
bun run build
```

---

## 代码风格

### Rust

- 使用现代模块文件命名，不使用 `mod.rs`
- 优先保持模块职责清晰
- 尽量让函数名直观表达用途

### Frontend

- 优先使用清晰的组件边界
- 样式尽量通过 class 管理，避免大量内联样式
- 保持移动端交互和输入法兼容性优先

---

## 文档

如果你的改动影响了：

- 功能行为
- 页面交互
- API
- 开发流程
- 发布流程

请同步更新对应文档。

目前文档主要在：

- `README.md`
- `doc/architecture.md`
- `doc/frontend-features.md`
- `doc/release-checklist.md`

---
## 许可证与贡献授权

本项目采用 **MIT / Apache-2.0 双授权**。

默认情况下，除非你明确声明否则，你提交到本仓库的代码、文档和其他贡献，都会按与项目相同的双授权方式发布。

---

## Issue / PR 建议

提交 issue 或 PR 时，建议尽量说明：

- 你遇到的问题是什么
- 预期行为是什么
- 当前行为是什么
- 复现步骤
- 如果和输入法/设备相关，请说明机型、浏览器、系统版本

---

## 目前最适合的贡献方向

- 改善移动端输入体验
- 提升桌面端输入稳定性
- 完善局域网连接体验
- 补充文档与示例
- 增加跨平台支持
