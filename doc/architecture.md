# 项目架构说明

本文档从整体视角解释声桥是如何运行的，以及 Web 壳、Tauri 壳、共享 React UI 和 Rust 本地服务分别负责什么。

## 1. 一句话概括

声桥现在由四层组成：

1. `packages/app`：共享 React 应用本体
2. `apps/web`：手机浏览器访问的 Web 壳
3. `apps/tauri`：桌面端 Tauri 壳
4. `crates/server`：真正负责 API 和桌面输入执行的 Rust 本地服务

整体原则是：

> 让产品交互集中在共享前端里，让平台差异停留在壳层和 Rust 系统层。

## 2. 目录职责

### `packages/app`

这里放的是产品真正的前端 UI：

- `App.tsx`
- `components/*`
- `hooks/*`
- `features/*`
- `styles/*`

它不关心自己运行在 Web 还是 Tauri，只依赖一个抽象出来的 `bridge` 接口。

### `packages/shared`

这里放跨壳共享的东西：

- 桥接接口类型
- 网络常量
- 本地存储 key

它的作用是让 Web 壳、Tauri 壳和共享 UI 对“平台能力”有一套统一约定。

### `apps/web`

Web 壳只负责：

- 挂载 React 应用
- 提供 Web 平台的 `platform/bridge.ts`
- 配置 Vite dev server
- 在开发时把 `/api` 代理到 Rust 本地服务

换句话说，它是“手机浏览器入口”，不是产品逻辑主体。

### `apps/tauri`

Tauri 壳只负责：

- 挂载同一套 React 应用
- 提供 Tauri 平台的 `platform/bridge.ts`
- 启动 Tauri 窗口
- 在桌面壳启动时拉起本地 Rust 服务

当前它仍然通过 HTTP 调用本地服务，而不是直接走 `invoke`。这样做的好处是：

- 先保持 Web 和 Tauri 两个壳复用同一套 API 语义
- 减少迁移期的分叉

### `crates/server`

这是当前桌面侧真正的执行核心。

它负责：

- 提供 `/api/type-text` 和 `/api/press-key`
- 在嵌入模式下托管前端构建产物
- 枚举局域网地址并打印二维码
- 通过系统剪贴板和 Win32 `SendInput` 把内容落到当前焦点位置

## 3. 运行时角色分工

### 共享前端

共享前端负责：

- 全屏输入区
- Dock 快捷操作
- 设置与历史记录
- 草稿自动保存和恢复
- 软键盘适配

### 平台桥接

桥接层负责把“发文本 / 发动作键 / 震动反馈”这几个能力映射到具体平台：

- `apps/web/src/platform/bridge.ts`
- `apps/tauri/src/platform/bridge.ts`

这就是现在的壳层边界。

### Rust 本地服务

Rust 负责：

- 解析 API 请求
- 决定调用哪一种输入动作
- 处理二维码和推荐访问地址
- 在发布模式下把前端资源直接从可执行文件里提供出来

## 4. 主要模块

### 4.1 共享前端侧

#### `packages/app/src/index.tsx`

共享应用入口。

它做两件事：

- 接收外部传入的 `bridge`
- 用 `BridgeProvider` 把平台能力注入给整个 React 应用

#### `packages/app/src/features/runtime/BridgeContext.tsx`

运行时依赖注入层。

它把壳层传入的 `VoiceBridgeBridge` 暴露给组件树，让共享 UI 不需要知道自己到底运行在浏览器还是 Tauri。

#### `packages/app/src/App.tsx`

前端根组件。

它负责把页面拼起来：

- `Composer`
- `Dock`
- `SettingsModal`

同时负责：

- 设置弹层开关
- 发送成功反馈
- `hasText` 这类跨组件共享状态

#### `packages/app/src/components/Composer.tsx`

主输入区。

它负责：

- 多行文本输入
- 自动聚焦
- 自动增高
- 回车逻辑
- 空文本时的回车 / 退格行为
- 草稿恢复与发送文本

#### `packages/app/src/components/Dock.tsx`

底部悬浮快捷操作栏。

它负责：

- 菜单入口
- 复制 / 粘贴 / Tab / 换行 / 退格
- 发送按钮
- 连续触发按钮的交互封装

#### `packages/app/src/components/SettingsModal.tsx`

设置与历史记录面板。

它负责：

- 主题切换
- 回车行为切换
- Dock 按钮显隐
- 历史记录复用
- 清空历史记录

#### `packages/app/src/hooks/usePreferences.ts`

偏好和历史记录状态层。

它负责：

- 从 `localStorage` 读取偏好
- 保存偏好
- 增加历史
- 清空历史
- 把主题状态同步到 `document.documentElement`

#### `packages/app/src/hooks/useContinuousTrigger.ts`

连续按压动作逻辑。

它负责：

- 单次触发
- 长按连发
- 计数反馈
- 触感反馈调用

#### `packages/app/src/hooks/useViewportOffset.ts`

软键盘适配逻辑。

它负责监听 `visualViewport`，并更新 CSS 变量 `--keyboard-offset`，让 Dock 在键盘弹出时抬升到可操作区域。

#### `packages/app/src/features/editor/draft.ts`

草稿持久化层。

它负责：

- 持久化当前输入草稿
- 页面恢复时自动回填
- 恢复后把光标放到文本末尾

### 4.2 壳层

#### `apps/web/src/main.tsx`

Web 壳入口。

它负责创建 Web 平台的 `bridge`，然后渲染 `VoiceBridgeApp`。

#### `apps/web/src/platform/bridge.ts`

Web 平台桥接。

它负责：

- 调用 `/api/type-text`
- 调用 `/api/press-key`
- 调用 `navigator.vibrate`
- 解析可选的自定义 endpoint

#### `apps/tauri/src/main.tsx`

Tauri 壳入口。

它负责创建 Tauri 平台的 `bridge`，然后渲染同一套共享应用。

#### `apps/tauri/src/platform/bridge.ts`

Tauri 平台桥接。

当前实现仍然直接请求本机 `http://127.0.0.1:8765/api/*`，这样共享 UI 不需要区分调用语义。

#### `apps/tauri/src-tauri/src/lib.rs`

Tauri Rust 壳启动逻辑。

它在应用启动时异步拉起 `voice_bridge_server::run_embedded()`，让桌面壳里也有同一个本地服务可用。

### 4.3 Rust 服务侧

#### `crates/server/src/main.rs`

Rust 可执行入口。

它解析命令行参数，然后启动 Tokio 运行时，最终进入 `run()`。

#### `crates/server/src/cli.rs`

命令行参数层。

当前最关键的参数是 `--frontend-mode`：

- `dev`
- `embedded`

#### `crates/server/src/lib.rs`

Rust 模块汇总入口。

它导出：

- `run()`
- `run_embedded()`

#### `crates/server/src/server.rs`

HTTP 服务层。

它负责：

- 定义 API 路由
- 解析请求参数
- 调用 `input` 模块执行输入动作
- 根据前端模式决定是否托管嵌入资源
- 启动时打印访问说明

#### `crates/server/src/input.rs`

桌面输入执行层。

这是整个项目的“最终落点”模块。

它负责两类事情：

1. 文本输入
   - 写入剪贴板
   - 模拟 `Ctrl+V`

2. 动作键输入
   - 模拟 `Enter / Tab / Backspace / Ctrl+C / Ctrl+V`
   - `newline` 走粘贴 `\n`

#### `crates/server/src/network.rs`

网络信息展示层。

它负责：

- 枚举局域网 IPv4 地址
- 估算哪张网卡更像主网卡
- 打印推荐访问地址
- 生成二维码并打印到终端

#### `crates/server/src/web_assets.rs`

嵌入前端资源层。

它负责：

- 读取并内嵌 `apps/web/dist`
- 为静态资源推断 MIME
- 处理 SPA fallback
- 返回带缓存头的 HTTP 响应

## 5. 开发模式与发布模式

### 开发模式

开发时前后端是分开的：

```text
手机浏览器 -> apps/web Vite (5173) -> /api -> Rust (8765)
```

特点：

- 页面资源由 Vite 提供
- 热更新由 Vite 负责
- `/api` 由 Vite 代理给 Rust

### 发布模式

发布时由 Rust 同时负责前端和 API：

```text
手机浏览器 -> Rust (8765)
                  ├─ /api/*
                  └─ embedded apps/web/dist
```

特点：

- 前端先构建成静态文件
- Rust 把产物嵌入进可执行文件
- 最终可以只分发单个可执行文件

## 6. 最关键的一条调用链

### 场景：手机输入一段文字并发送到电脑

完整链路如下：

```text
手机输入
-> React 状态更新
-> bridge.sendText()
-> /api/type-text
-> Rust server 收到请求
-> input::type_text()
-> 写入系统剪贴板
-> 模拟 Ctrl+V
-> 文字出现在电脑当前焦点位置
```

这里最关键的设计点是：

> 整段文本不逐字模拟键盘，而是通过“剪贴板写入 + 粘贴”完成。

这样更适合中文、语音输入和长文本。

## 7. 动作键链路

### 场景：点击 Dock 上的退格按钮

```text
手机点击 Dock 按钮
-> useContinuousTrigger 触发一次或多次 pressKey("backspace")
-> bridge.pressKey()
-> /api/press-key
-> Rust server 收到动作请求
-> input::perform_action(InputAction::Backspace)
-> Win32 SendInput 模拟退格
```

同一条链路也适用于：

- `enter`
- `tab`
- `copy`
- `paste`
- `newline`

## 8. 为什么要这样分层

### 共享 React 层擅长的事情

- 移动端交互
- 软键盘适配
- 复用手机输入法
- 管理偏好、历史、草稿

### 壳层擅长的事情

- 处理平台启动方式
- 封装平台桥接差异
- 保持共享 UI 的纯度

### Rust 层擅长的事情

- 提供本地 API
- 控制桌面输入
- 调用系统 API
- 作为最终发布入口

所以现在的设计不是“Web 和 Tauri 各写一套”，而是：

> 一套共享 UI，多个平台壳，一个真正负责桌面落点的 Rust 服务。

## 9. 当前边界

当前架构还有几个明确边界：

- 桌面输入执行仍偏 Windows
- 输入目标仍依赖“当前焦点位置”
- 文本输入目前仍依赖剪贴板
- Tauri 壳现在还是通过 HTTP 复用本地服务 API

这些都是刻意保留下来的边界，因为它们能让当前版本先把主体验做顺，同时保持结构清楚。
