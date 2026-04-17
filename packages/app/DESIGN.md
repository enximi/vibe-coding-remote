# App Design

## 定位

`packages/app` 是 Vibe Coding Remote 的通用前端应用层。

它负责：

- 编辑区输入体验
- 底部快捷动作区
- 设置面板与历史记录
- 本地偏好、草稿、连接状态
- 对上层壳层暴露稳定的 React 入口、类型与工具函数

它不负责：

- 平台壳层启动方式
- server 的 HTTP 实现
- 平台底层能力接入细节

---

## 当前入口

对外入口在 [src/index.tsx](/D:/projects/vibe-coding-remote/packages/app/src/index.tsx)。

当前导出内容包括：

- `VibeCodingRemoteApp`
- 网络与存储常量
- bridge / server 类型
- action / endpoint 工具函数

应用启动结构是：

1. 壳层传入 `bridge`
2. `AppProviders` 组装运行时上下文
3. `AppShell` 负责页面级编排

---

## 目录结构

当前 `src/` 采用“应用壳层 + feature + 基础资源”结构：

- `app/`
  - 应用壳层、provider 装配、页面级状态编排
- `features/`
  - 按功能拆分的 UI、状态和模型
- `constants/`
  - 网络路径、存储 key 等常量
- `types/`
  - bridge 与 server 协议类型
- `utils/`
  - action 构造、endpoint 推导等纯工具
- `ui/`
  - 当前仅放跨 feature 共用图标
- `styles/`
  - 全局样式与分区样式文件

当前主要文件边界：

- [AppProviders.tsx](/D:/projects/vibe-coding-remote/packages/app/src/app/providers/AppProviders.tsx)
  - 组装 `BridgeProvider`、`PreferencesProvider`、`ConnectionProvider`
- [AppShell.tsx](/D:/projects/vibe-coding-remote/packages/app/src/app/ui/AppShell.tsx)
  - 连接 `Composer`、`Dock`、`SettingsModal`
- [useAppShellState.ts](/D:/projects/vibe-coding-remote/packages/app/src/app/model/useAppShellState.ts)
  - 处理页面级编排状态，例如设置面板开关、发送成功反馈、输入框 ref 协调

---

## 状态分层

当前 app 的状态分为四层。

### 1. 平台桥接状态

由 [BridgeContext.tsx](/D:/projects/vibe-coding-remote/packages/app/src/features/runtime/model/BridgeContext.tsx) 提供。

用途：

- 发送动作
- 获取 server capabilities
- 触发振动反馈

### 2. 偏好与本地数据

由 [PreferencesContext.tsx](/D:/projects/vibe-coding-remote/packages/app/src/features/preferences/model/PreferencesContext.tsx) 提供，底层实现位于：

- [preferences.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/preferences/model/preferences.ts)
- [usePreferencesStore.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/preferences/model/usePreferencesStore.ts)

当前持久化内容包括：

- 主题
- 回车行为
- 字体大小
- 震动开关
- dock 按钮启用状态
- dock 按钮顺序
- 历史记录
- server endpoint
- server auth token

### 3. 连接状态

由 [ConnectionContext.tsx](/D:/projects/vibe-coding-remote/packages/app/src/features/runtime/model/ConnectionContext.tsx) 提供，底层检查逻辑位于 [useConnectionState.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/runtime/model/useConnectionState.ts)。

当前状态值：

- `checking`
- `unconfigured`
- `workable`
- `connection_error`
- `auth_error`

检查策略：

1. endpoint 或 token 缺失时，直接进入 `unconfigured`
2. 先请求 `/health`
3. 再请求 `/api/auth-check`
4. 根据结果映射为连接错误、认证错误或可工作

### 4. 页面编排状态

由 [useAppShellState.ts](/D:/projects/vibe-coding-remote/packages/app/src/app/model/useAppShellState.ts) 管理。

当前负责：

- 设置面板开关
- 发送成功反馈
- 当前输入是否为空
- dock 当前可直接显示的按钮数量
- composer ref 协调
- 点击页面空白重新聚焦输入框
- 历史记录回填后关闭设置并聚焦

---

## 功能模块

### Composer

文件：

- [Composer.tsx](/D:/projects/vibe-coding-remote/packages/app/src/features/composer/ui/Composer.tsx)
- [draft.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/composer/model/draft.ts)
- [useComposerInput.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/composer/model/useComposerInput.ts)

当前职责：

- `Composer.tsx` 只保留 textarea 渲染和说明文案
- `useComposerInput.ts` 集中处理编辑区文本、焦点恢复、`enterkeyhint` 同步、发送行为与草稿持久化
- 在空文本时把 `Backspace` 和 `Enter` 直接转发为远程动作
- 在非空文本时执行 `input-text`
- 发送成功后写入历史并清空草稿

### Dock

文件：

- [Dock.tsx](/D:/projects/vibe-coding-remote/packages/app/src/features/dock/ui/Dock.tsx)
- [dockActions.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/dock/model/dockActions.ts)
- [useContinuousTrigger.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/dock/model/useContinuousTrigger.ts)
- [useDockLayout.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/dock/model/useDockLayout.ts)
- [DockActionButton.tsx](/D:/projects/vibe-coding-remote/packages/app/src/features/dock/ui/DockActionButton.tsx)
- [dockActionConfigs.tsx](/D:/projects/vibe-coding-remote/packages/app/src/features/dock/ui/dockActionConfigs.tsx)

当前职责：

- `Dock.tsx` 负责编排设置入口、动作区、overflow 和发送按钮
- `useDockLayout.ts` 负责根据当前宽度测量可直接显示的动作数量
- `DockActionButton.tsx` 负责单个动作按钮和连续触发计数展示
- `dockActionConfigs.tsx` 负责把偏好中的 dock 配置映射成可渲染按钮

当前内置动作：

- `enter`
- `tab`
- `shift-tab`
- `ctrl-c`
- `ctrl-v`
- `paste-newline`
- `backspace`

### Settings

文件：

- [SettingsModal.tsx](/D:/projects/vibe-coding-remote/packages/app/src/features/settings/ui/SettingsModal.tsx)
- [sections/](/D:/projects/vibe-coding-remote/packages/app/src/features/settings/ui/sections)
- [useSheetModal.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/settings/ui/hooks/useSheetModal.ts)
- [QrScannerModal.tsx](/D:/projects/vibe-coding-remote/packages/app/src/features/settings/ui/QrScannerModal.tsx)
- [importConfig.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/settings/model/importConfig.ts)
- [historyTime.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/settings/model/historyTime.ts)

当前设置面板采用 bottom sheet 形式，内部已拆成独立 section。

当前包含：

- Server 配置
- 主题切换
- 回车行为切换
- 字体大小
- 震动反馈开关
- dock 动作启用与排序
- 历史记录查看、回填、删除单条、清空全部
- 扫码导入配置

---

## 交互规则

### 编辑区

- 页面初始化后尽量自动聚焦
- 页面空白点击后重新聚焦
- 草稿自动保存与恢复
- 恢复后光标移动到末尾

### 回车与删除

- 文本为空时：
  - `Enter` 发送远程回车
  - `Backspace` 发送远程退格
- 文本非空时：
  - `Backspace` 只删除本地文本
  - `Enter` 根据偏好执行发送或换行

### 设置面板自动展开

当前逻辑：

- `status !== workable && status !== checking` 时，自动打开设置面板

也就是：

- 未配置
- 连接失败
- 认证失败

都会直接把用户带到修复入口。

### 历史记录

当前已实现：

- 时间展示
- 点击回填
- 单条删除
- 清空全部
- 相同文本去重并保留最近一次发送时间

---

## 样式组织

样式集中在 `styles/`：

- [index.css](/D:/projects/vibe-coding-remote/packages/app/src/styles/index.css)
  - 样式入口
- [tokens.css](/D:/projects/vibe-coding-remote/packages/app/src/styles/tokens.css)
  - 颜色、字号、字体等 token
- [base.css](/D:/projects/vibe-coding-remote/packages/app/src/styles/base.css)
  - 基础布局
- `composer.css` / `dock.css` / `modal.css` / `settings.css` / `history.css`
  - 按功能区域拆分
- [responsive.css](/D:/projects/vibe-coding-remote/packages/app/src/styles/responsive.css)
  - 响应式规则

字体当前使用本地打包的 `lxgw-wenkai-webfont`，不依赖外部 CDN。

---

## 当前实现原则

当前 app 设计遵循这些原则：

- 主界面保持单页，不拆出额外“错误页”
- 高频输入路径优先，设置与配置放进 sheet
- 运行时状态尽量 provider 化，避免跨层 prop drilling
- feature 内部保留自己的 `model/` 与 `ui/` 边界
- 跨 feature 的通用资源放到更明确的基础层，不再保留模糊的 `shared/`

---

## 当前已知边界

当前 `packages/app` 仍然保留一些后续可继续优化的点：

- `styles/` 仍然主要按区域文件拆分，而不是严格按 feature 共置；这是当前有意保留的折中
- [Dock.tsx](/D:/projects/vibe-coding-remote/packages/app/src/features/dock/ui/Dock.tsx) 仍然保留 overflow popover 与发送按钮编排，暂未继续拆成更细的 `ui/` 组件
- [useComposerInput.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/composer/model/useComposerInput.ts) 现在已经是编辑区行为中心，后续若继续扩展输入法兼容逻辑，可以再按“焦点管理 / 发送执行 / 草稿持久化”进一步分层

---

## 文件名说明

本文档使用 `DESIGN.md`，原因是：

- 与 `crates/server/DESIGN.md` 保持一致
- 对编辑器、索引工具、跨平台协作更友好
- 避免中英文文件名混用
