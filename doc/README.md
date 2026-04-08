# 文档索引

这个目录收纳和项目实现相关的设计文档与发布文档。

## 文档列表

- [architecture.md](./architecture.md)
  - 项目整体架构
  - Rust 服务、前端页面、输入链路之间如何配合

- [frontend-features.md](./frontend-features.md)
  - 手机网页的完整功能说明
  - 每个按钮、每个设置项、主要交互的设计意图

- [release-checklist.md](./release-checklist.md)
  - 发布到 GitHub / 开源前建议检查的项目

## 推荐阅读顺序

如果你是第一次了解这个仓库，推荐按下面顺序阅读：

1. 根目录 [README](../README.md)
2. [architecture.md](./architecture.md)
3. [frontend-features.md](./frontend-features.md)
4. `src/server.rs`
5. `src/input.rs`
6. `frontend/src/App.tsx`
7. `frontend/src/components/Composer.tsx`
