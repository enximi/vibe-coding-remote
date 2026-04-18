# App Design

## 定位

`packages/app` 是 Vibe Coding Remote 的通用前端应用层。

它负责：

- 编辑区输入体验
- 底部可滚动快捷面板
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
  - 连接 `Composer`、`ActionPanel`、`SettingsModal`
- [appShellState.ts](/D:/projects/vibe-coding-remote/packages/app/src/app/model/appShellState.ts)
  - 定义页面编排状态、action 和 reducer
- [useAppShellController.ts](/D:/projects/vibe-coding-remote/packages/app/src/app/model/useAppShellController.ts)
  - 连接页面级 reducer、composer imperative handle 和用户意图回调
- [useAppShellEffects.ts](/D:/projects/vibe-coding-remote/packages/app/src/app/model/useAppShellEffects.ts)
  - 承载页面级 DOM 订阅与发送反馈定时器

---

## 架构思想

当前前端按“声明式 UI + 模块级单向数据流 + 明确 effect 边界”组织。

对应原则：

- UI 组件只声明当前状态下应该显示什么
- 模块级状态通过 `state -> action -> reducer -> state` 更新
- 网络请求、localStorage、DOM 订阅、定时器、软键盘唤起等外部行为放在 hook effect 层
- 明确有阶段的流程使用小型状态机，而不是多个布尔值互相制约
- 展示组件只接收当前值和意图回调，不直接修改模块内部状态对象

这不是为了引入复杂框架，而是让每一类问题落在合适层次：

- 应用级：provider 装配和运行时上下文
- 模块级：偏好、连接、页面编排等 reducer / machine
- 流程级：连接检查状态机
- 组件级：组合式展示组件
- 副作用级：bridge、fetch、storage、DOM 生命周期

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
- [preferencesState.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/preferences/model/preferencesState.ts)
- [usePreferencesStore.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/preferences/model/usePreferencesStore.ts)

状态更新方式：

- `preferencesState.ts` 定义偏好领域状态、action 和 reducer
- `usePreferencesStore.ts` 负责把 UI 意图转换为 action
- localStorage 持久化和主题同步都通过 effect 执行，不进入 reducer
- 设置面板 section 不再接收通用 `setPrefs`，而是接收 `setTheme`、`setFontSize`、`placeActionPanelCell` 这类明确意图

当前持久化内容包括：

- 主题
- 回车行为
- 字体大小
- 震动开关
- 快捷面板网格大小与布局
- 快捷面板最大可见行数
- 历史记录
- server endpoint
- server auth token

### 3. 连接状态

由 [ConnectionContext.tsx](/D:/projects/vibe-coding-remote/packages/app/src/features/runtime/model/ConnectionContext.tsx) 提供，底层流程位于：

- [connectionMachine.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/runtime/model/connectionMachine.ts)
- [useConnectionState.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/runtime/model/useConnectionState.ts)
- [connectionTasks.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/runtime/model/connectionTasks.ts)

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

流程规则：

- `connectionMachine.ts` 负责合法状态迁移
- `useConnectionState.ts` 负责调度连接检查、取消旧请求、把异步结果折回状态机 event
- `connectionTasks.ts` 负责真正的 fetch task 执行
- 请求使用 request id 忽略过期结果，避免旧请求覆盖新配置的状态

### 4. 页面编排状态

由 [appShellState.ts](/D:/projects/vibe-coding-remote/packages/app/src/app/model/appShellState.ts)、[useAppShellController.ts](/D:/projects/vibe-coding-remote/packages/app/src/app/model/useAppShellController.ts) 和 [useAppShellEffects.ts](/D:/projects/vibe-coding-remote/packages/app/src/app/model/useAppShellEffects.ts) 管理。

当前负责：

- 设置面板开关
- 发送中锁定与成功反馈
- 当前输入是否为空
- composer ref 协调
- 点击页面空白重新聚焦输入框
- 历史记录回填后关闭设置并聚焦

职责划分：

- `appShellState.ts` 只保存页面编排视图状态和 reducer
- `useAppShellController.ts` 负责组合 reducer、composer imperative handle 和页面意图
- `useAppShellEffects.ts` 负责 DOM 订阅、全局聚焦和发送反馈定时器等副作用边界

---

## 功能模块

### Composer

文件：

- [Composer.tsx](/D:/projects/vibe-coding-remote/packages/app/src/features/composer/ui/Composer.tsx)
- [draft.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/composer/model/draft.ts)
- [composerState.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/composer/model/composerState.ts)
- [useComposerCommands.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/composer/model/useComposerCommands.ts)
- [useComposerEffects.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/composer/model/useComposerEffects.ts)
- [useComposerInput.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/composer/model/useComposerInput.ts)

当前职责：

- `Composer.tsx` 只保留 textarea 渲染和说明文案
- `composerState.ts` 负责编辑区文本与输入法组合态
- `useComposerCommands.ts` 负责发送命令、远程按键与本地文本替换
- `useComposerEffects.ts` 负责草稿持久化、聚焦恢复、`enterkeyhint` 和 textarea 高度同步
- `useComposerInput.ts` 作为编排层，把状态、effect 与命令接到组件接口上
- 在空文本时把 `Backspace` 和 `Enter` 直接转发为远程动作
- 在非空文本时执行 `input-text`
- 发送成功后写入历史并清空草稿

### ActionPanel

文件：

- [ActionPanel.tsx](/D:/projects/vibe-coding-remote/packages/app/src/features/action-panel/ui/ActionPanel.tsx)
- [ActionPanelButton.tsx](/D:/projects/vibe-coding-remote/packages/app/src/features/action-panel/ui/ActionPanelButton.tsx)
- [actionPanelActions.tsx](/D:/projects/vibe-coding-remote/packages/app/src/features/action-panel/model/actionPanelActions.tsx)
- [useContinuousTrigger.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/action-panel/model/useContinuousTrigger.ts)

当前职责：

- `ActionPanel.tsx` 负责底部可滚动视窗、二维网格渲染和固定小齿轮入口
- `ActionPanelButton.tsx` 负责发送按钮和远程动作按钮的展示与交互
- `actionPanelActions.tsx` 负责定义面板里的动作清单与图标
- `useContinuousTrigger.ts` 负责连续按压型远程动作的重复触发

当前内置动作：

- `send`
- `enter`
- `tab`
- `shift-tab`
- `ctrl-c`
- `ctrl-v`
- `paste-newline`
- `backspace`

### Settings

文件：

- [useConnectionConfigController.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/settings/model/useConnectionConfigController.ts)
- [settingsConnectionState.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/settings/model/settingsConnectionState.ts)
- [SettingsModal.tsx](/D:/projects/vibe-coding-remote/packages/app/src/features/settings/ui/SettingsModal.tsx)
- [sections/](/D:/projects/vibe-coding-remote/packages/app/src/features/settings/ui/sections)
- [useSheetModal.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/settings/ui/hooks/useSheetModal.ts)
- [QrScannerModal.tsx](/D:/projects/vibe-coding-remote/packages/app/src/features/settings/ui/QrScannerModal.tsx)
- [importConfig.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/settings/model/importConfig.ts)
- [historyTime.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/settings/model/historyTime.ts)

当前设置面板采用 bottom sheet 形式，内部已拆成独立 section。

连接配置额外约束：

- `settingsConnectionState.ts` 只保存 endpoint/token 草稿和扫码弹层开关
- `useConnectionConfigController.ts` 负责把草稿保存到 preferences，并触发连接检查
- `SettingsModal.tsx` 只负责把连接控制器和各个 section 组合起来

设置面板 section 的约束：

- section 只接收当前值和明确意图回调
- section 不直接拿到通用偏好 setter
- 偏好更新统一回到 preferences reducer

当前包含：

- Server 配置
- 主题切换
- 回车行为切换
- 字体大小
- 震动反馈开关
- 快捷面板高度与网格编辑
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
- `composer.css` / `action-panel.css` / `modal.css` / `settings.css` / `history.css`
  - 按功能区域拆分
- [responsive.css](/D:/projects/vibe-coding-remote/packages/app/src/styles/responsive.css)
  - 响应式规则

字体当前使用本地打包的 `lxgw-wenkai-webfont`，不依赖外部 CDN。

---

## 当前实现原则

当前 app 设计遵循这些原则：

- 主界面保持单页，不拆出额外“错误页”
- 高频输入路径优先，设置与配置放进 sheet
- 运行时上下文尽量 provider 化，避免跨层 prop drilling
- 模块级状态统一走 action / reducer / machine，不让 UI 组件直接改状态对象
- 外部副作用只放在 hook effect 和 bridge/task 边界里
- feature 内部保留自己的 `model/` 与 `ui/` 边界
- 跨 feature 的通用资源放到更明确的基础层，不再保留模糊的 `shared/`

---

## 当前已知边界

当前 `packages/app` 仍然保留一些后续可继续优化的点：

- `styles/` 仍然主要按区域文件拆分，而不是严格按 feature 共置；这是当前有意保留的折中
- [ActionPanel.tsx](/D:/projects/vibe-coding-remote/packages/app/src/features/action-panel/ui/ActionPanel.tsx) 目前仍然同时承载了底部视窗、滚动网格和小齿轮入口，后续如果交互继续增加，可以再拆出更细的外壳组件
- [useComposerInput.ts](/D:/projects/vibe-coding-remote/packages/app/src/features/composer/model/useComposerInput.ts) 现在只做编排，但输入法兼容和软键盘策略若继续扩展，仍可能再拆出更细的移动端适配层
- `Composer` 的发送流程目前还没有单独状态机，因为它的阶段较少；如果后续增加排队、失败重试或发送取消，再拆成流程级 machine

---

## 文件名说明

本文档使用 `DESIGN.md`，原因是：

- 与 `crates/server/DESIGN.md` 保持一致
- 对编辑器、索引工具、跨平台协作更友好
- 避免中英文文件名混用
