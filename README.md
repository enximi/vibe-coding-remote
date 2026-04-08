# 声桥 / Voice Bridge

声桥是一个把**手机输入**桥接到**电脑当前焦点位置**的小工具。

它的核心使用场景是：

- 在手机上打开一个网页输入器
- 使用手机熟悉的输入法，尤其是语音输入
- 把整理好的文字、换行和按键动作发送到电脑当前聚焦的位置

这个项目的重点不是“再做一个输入法”，而是**复用手机已经很好用的输入体验**，尤其是语音听写、联想输入和中文输入法生态。

---

## 目前能做什么

- 手机网页输入文本并发送到电脑
- 使用手机语音输入后，把结果发到电脑当前焦点位置
- 发送常用动作键：
  - `enter`
  - `tab`
  - `backspace`
  - `copy`
  - `paste`
  - `newline`
- 启动时打印推荐局域网访问地址
- 启动时在终端打印二维码，方便手机扫码
- 前端支持：
  - 深色 / 浅色 / 跟随系统主题
  - 回车直接发送 / 回车插入换行
  - Dock 按钮显隐
  - 最近发送历史记录
  - 连续触发按钮的连击反馈

---

## 平台说明

当前桌面端实现是 **Windows 优先** 的。

原因是桌面输入部分依赖：

- Win32 `SendInput`
- Windows 焦点窗口输入
- Windows 剪贴板

因此当前项目更准确的描述是：

> **一个由手机网页 + Windows 本地服务组成的输入桥接工具**

---

## 项目结构

```text
voice-bridge/
├─ frontend/                 # React + Vite 手机网页
│  ├─ public/                # 静态资源
│  ├─ src/
│  │  ├─ components/         # Composer / Dock / SettingsModal / icons
│  │  ├─ hooks/              # 偏好、连续触发、视口偏移
│  │  └─ utils/              # API、触感反馈
│  ├─ index.html
│  ├─ package.json
│  └─ vite.config.ts
├─ src/
│  ├─ main.rs                # 程序入口
│  ├─ lib.rs                 # 模块入口
│  ├─ server.rs              # HTTP 服务与 API
│  ├─ input.rs               # 文本输入与按键模拟
│  ├─ network.rs             # 局域网地址选择与二维码输出
│  └─ web_assets.rs          # 生产静态资源路径
├─ doc/
│  ├─ README.md              # 文档索引
│  ├─ architecture.md        # 架构说明
│  ├─ frontend-features.md   # 前端功能说明
│  └─ release-checklist.md   # 发布前检查清单
├─ CONTRIBUTING.md
├─ Cargo.toml
└─ README.md
```

---

## 快速开始

### 1. 启动桌面 API 服务

```powershell
cd D:\projects\voice-bridge
cargo run
```

默认端口：`8765`

### 2. 启动前端开发服务器

```powershell
cd D:\projects\voice-bridge\frontend
bun install
bun run dev
```

默认端口：`5173`

### 3. 开发时在手机上访问前端

```text
http://你的电脑局域网IP:5173
```

开发模式下：

- 页面由 **Vite** 提供
- `/api` 请求由 **Vite 代理到 Rust**

也就是说，**开发时访问 5173，生产时访问 8765**。

---

## 生产 / 单机运行

生产模式下，由 Rust 同时负责：

- 提供前端构建产物 `frontend/dist`
- 提供 `/api/*`

### 构建前端

```powershell
cd D:\projects\voice-bridge\frontend
bun install
bun run build
```

### 构建后端

```powershell
cd D:\projects\voice-bridge
cargo build --release
```

### 运行

```powershell
cd D:\projects\voice-bridge
cargo run --release
```

生产模式下访问：

```text
http://你的电脑局域网IP:8765
```

---

## API

### `POST /api/type-text`

把一段文本输入到当前焦点位置。

```json
{
  "text": "你好，世界"
}
```

### `POST /api/press-key`

发送一个动作键。

```json
{
  "key": "enter"
}
```

当前支持的 `key`：

- `enter`
- `tab`
- `backspace`
- `copy`
- `paste`
- `newline`

### `GET /health`

健康检查。

返回：

```text
ok
```

---

## 文字是怎么进入电脑的

当前实现并不是逐字模拟键盘输入，而是分成两类：

### 文本

当网页调用 `/api/type-text` 时：

1. Rust 收到文本
2. Rust 把文本写入系统剪贴板
3. 稍等一个很短的时间片
4. Rust 模拟一次 `Ctrl+V`
5. 文本出现在电脑当前焦点位置

也就是：

> **剪贴板写入 + 粘贴**

这样通常比逐字模拟键盘输入更稳，尤其是在中文、语音输入、大段文本的场景下。

### 动作键

像 Enter、Tab、Backspace、Copy、Paste 这些动作，则通过 Win32 `SendInput` 模拟键盘事件完成。

---

## 文档

- [文档索引](./doc/README.md)
- [架构说明](./doc/architecture.md)
- [前端功能说明](./doc/frontend-features.md)
- [发布前检查清单](./doc/release-checklist.md)
- [贡献说明](./CONTRIBUTING.md)

---

## 开发命令

### Rust

```powershell
cargo fmt
cargo check
cargo build --release
```

### Frontend

```powershell
cd frontend
bun run lint
bun run build
bun run preview
```

---

## 常见问题

### 为什么开发时改了 React 文件，`frontend/dist` 没变化？

因为：

- `bun run dev` 用的是 Vite 开发服务器，资源在内存里
- `frontend/dist` 只有在 `bun run build` 时才会生成/更新

所以开发时要看最新前端，请访问 `5173`，不要盯着 `dist`。

### 为什么手机打不开 `http://你的IP:5173`？

常见原因：

- 手机和电脑不在同一个局域网
- Windows 防火墙没有放行 Node / Vite 的入站连接
- 路由器或校园网启用了客户端隔离
- 电脑 IP 已经变化

### 为什么不直接把文字“灌进任意桌面输入框”？

因为对普通桌面应用而言，并没有一个统一、稳定、跨应用的“直接写入文本框”系统 API。

更通用的方式通常是：

- 模拟键盘输入
- 或者通过剪贴板 + 粘贴

当前项目选择了后者作为主要路径。

---

## 路线图

未来可以继续做的方向：

- 局域网设备发现与配对
- 设备认证
- WebSocket 实时状态同步
- 更细粒度的输入动作抽象
- macOS / Linux 支持
- 更可靠的剪贴板恢复策略
- 更完善的开源示例和截图

---

## License

本项目采用 **MIT / Apache-2.0 双授权**。

你可以任选其一使用：

- [LICENSE-MIT](./LICENSE-MIT)
- [LICENSE-APACHE](./LICENSE-APACHE)

除非你明确声明否则，提交到本仓库的贡献也将按相同的双授权方式发布。
