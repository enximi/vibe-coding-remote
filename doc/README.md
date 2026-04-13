# 文档索引

这个目录收纳和声桥实现相关的设计文档、架构文档和发布文档。

## 文档列表

- [architecture.md](./architecture.md)
  - 项目整体架构
  - `apps / packages / crates` 的职责划分
  - Web 壳、Tauri 壳和 Rust 本地服务如何配合

- [frontend-features.md](./frontend-features.md)
  - 共享前端 UI 的完整功能说明
  - 每个按钮、每个设置项、主要交互背后的设计意图

- [release-checklist.md](./release-checklist.md)
  - 发布到 GitHub / Release 前建议检查的项目

- [product/](./product/README.md)
  - PRD、功能清单、实现计划、验收标准等产品文档骨架

## 推荐阅读顺序

如果你是第一次了解这个仓库，推荐按下面顺序阅读：

1. 根目录 [README](../README.md)
2. [architecture.md](./architecture.md)
3. [frontend-features.md](./frontend-features.md)
4. [crates/desktop-server/src/server.rs](../crates/desktop-server/src/server.rs)
5. [crates/desktop-server/src/input.rs](../crates/desktop-server/src/input.rs)
6. [packages/app/src/App.tsx](../packages/app/src/App.tsx)
7. [packages/app/src/components/Composer.tsx](../packages/app/src/components/Composer.tsx)
