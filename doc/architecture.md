# 项目架构说明

本文档从整体视角解释声桥是如何运行的，以及 Rust 与前端各自负责什么。

---

## 1. 一句话概括

声桥由两部分组成：

1. **手机网页前端**：负责输入、设置和交互
2. **Windows 本地服务**：负责接收请求，并把动作真正发送到电脑当前焦点位置

---

## 2. 运行时角色分工

### 前端（`frontend/`）

前端是一个 React + Vite 的移动网页。

它负责：

- 提供全屏输入区
- 调用 `/api/type-text` 发送文本
- 调用 `/api/press-key` 发送动作键
- 管理本地偏好设置
- 管理发送历史
- 处理移动端软键盘适配

### 后端（`src/`）

后端是一个 Rust + Axum 本地 HTTP 服务。

它负责：

- 提供 API
- 在生产模式下托管前端构建产物
- 根据请求模拟键盘事件
- 通过剪贴板 + 粘贴输入整段文本
- 打印推荐访问地址和二维码

---

## 3. 主要模块

### 3.1 Rust 侧

#### `src/main.rs`

程序入口。

它只做一件事：启动 Tokio 运行时，然后调用 `voice_bridge::run()`。

#### `src/lib.rs`

模块汇总入口。

目前包含：

- `input`
- `network`
- `server`
- `web_assets`

#### `src/server.rs`

HTTP 服务层。

它负责：

- 定义 API 路由
- 托管静态文件
- 解析请求参数
- 调用 `input` 模块执行输入动作
- 启动时打印访问说明

#### `src/input.rs`

桌面输入执行层。

这是整个项目的“落地动作”模块。

它负责两类事情：

1. **整段文本输入**
   - 写入剪贴板
   - 模拟 `Ctrl+V`

2. **动作键输入**
   - 模拟 Enter / Tab / Backspace / Ctrl+C / Ctrl+V

#### `src/network.rs`

网络信息展示层。

它负责：

- 枚举当前局域网可用 IPv4 地址
- 估算哪张网卡更像“主网卡”
- 打印推荐访问地址
- 生成二维码并打印到终端

#### `src/web_assets.rs`

前端构建产物路径层。

它负责告诉 Rust：

- `frontend/dist` 在哪里
- `frontend/dist/index.html` 在哪里

---

### 3.2 前端侧

#### `frontend/src/App.tsx`

前端根组件。

它负责把页面拼起来：

- `Composer`
- `Dock`
- `SettingsModal`

同时负责：

- 控制设置弹层开关
- 协调发送成功状态
- 维护 `hasText` 这种跨组件共享状态

#### `frontend/src/components/Composer.tsx`

主输入区。

它负责：

- 多行文本输入
- 自动聚焦
- 自动增高
- 回车逻辑
- 空文本时的回车/退格行为
- 发送文本

#### `frontend/src/components/Dock.tsx`

底部悬浮快捷操作栏。

它负责：

- 设置按钮
- 复制 / 粘贴 / Tab / 换行 / 退格
- 发送按钮
- 连续触发按钮的交互封装

#### `frontend/src/components/SettingsModal.tsx`

设置弹层。

它负责：

- 主题切换
- 回车行为切换
- Dock 按钮显隐
- 历史记录复用
- 清空历史记录

#### `frontend/src/hooks/usePreferences.ts`

偏好和历史记录状态。

它负责：

- 从 `localStorage` 读取偏好
- 保存偏好
- 增加历史
- 清空历史
- 设置主题属性到 `document.documentElement`

#### `frontend/src/hooks/useContinuousTrigger.ts`

连续按压动作逻辑。

它负责：

- 单次触发
- 长按后连发
- 触发计数反馈
- 振动反馈

#### `frontend/src/hooks/useViewportOffset.ts`

软键盘适配逻辑。

它负责：

- 监听 `visualViewport`
- 计算键盘遮挡高度
- 更新 CSS 变量 `--keyboard-offset`

#### `frontend/src/utils/api.ts`

前端 API 调用封装。

它负责：

- 发送文本请求
- 发送动作键请求
- 推导 `/api/type-text` 与 `/api/press-key` 的地址

---

## 4. 开发模式与生产模式的区别

### 开发模式

开发时前后端是分开的：

```text
手机浏览器 -> Vite (5173) -> /api -> Rust (8765)
```

特点：

- 页面资源由 Vite 提供
- 热更新由 Vite 负责
- `/api` 由 Vite 代理给 Rust

### 生产模式

生产时由 Rust 同时负责前端和 API：

```text
手机浏览器 -> Rust (8765)
                  ├─ /api/*
                  └─ frontend/dist
```

特点：

- 前端先构建成静态文件
- Rust 直接托管 `frontend/dist`
- 部署形态更简单

---

## 5. 最关键的一条调用链

### 场景：手机输入一段文字并发送到电脑

完整链路如下：

```text
手机输入 -> React 状态更新 -> 调用 /api/type-text
        -> Rust server 收到请求
        -> input::type_text()
        -> 写入系统剪贴板
        -> 模拟 Ctrl+V
        -> 文字出现在电脑当前焦点位置
```

这条链路里最重要的设计点是：

> 整段文本不逐字模拟键盘，而是通过“剪贴板写入 + 粘贴”完成。

这样更适合中文、语音输入和长文本。

---

## 6. 另一条动作链路

### 场景：点击 Dock 上的退格按钮

```text
手机点击 Dock 按钮
-> useContinuousTrigger 触发一次或多次 pressKey('backspace')
-> 调用 /api/press-key
-> Rust server 收到动作请求
-> input::perform_action(InputAction::Backspace)
-> Win32 SendInput 模拟退格
```

这条链路更适合：

- Enter
- Tab
- Backspace
- Copy
- Paste

---

## 7. 为什么前端与桌面输入要这样分层

### 前端擅长的事情

- 移动端交互
- 适配软键盘
- 复用手机输入法
- 管理本地偏好和历史

### Rust 擅长的事情

- 提供本地 HTTP 服务
- 控制桌面输入
- 调用系统 API
- 作为最终可发布的桌面侧入口

所以整个项目的设计不是“谁代替谁”，而是：

> 前端负责输入体验，Rust 负责把输入真正落到桌面系统里。

---

## 8. 当前架构的边界

当前这套架构有几个明确边界：

- 桌面端目前偏 Windows
- 输入目标依赖“当前焦点位置”
- 文本输入目前依赖剪贴板
- 前端仍然是一个网页，而不是原生 App

这意味着它的优点是实现简单、跨设备方便；
但也意味着它仍然受制于：

- 焦点窗口状态
- 剪贴板副作用
- 浏览器和移动端输入法差异

---

## 9. 后续扩展方向

如果项目继续往前演进，架构上可以继续扩展：

- 用 WebSocket 取代部分一次性请求
- 增加设备发现与配对层
- 增加认证层
- 抽象更多动作类型
- 允许多台桌面设备切换
- 给桌面端加 UI，而不仅仅是控制台服务

这些扩展都建立在当前“前端输入 + 本地服务执行”的基础上。
