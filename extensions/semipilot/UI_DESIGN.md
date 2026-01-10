# Semipilot Chat Panel UI 设计说明

**@SpecTrace**: cap-ui-semipilot  
**更新日期**: 2026-01-09  
**设计灵感**: VS Code GitHub Copilot Chat Panel

---

## 🎨 设计理念

### 核心原则

1. **一体化** - 所有功能集成在一个流畅的界面中
2. **简洁** - 减少视觉噪音，突出核心功能
3. **现代** - 符合 VS Code 的设计语言
4. **高效** - 快捷键支持，减少鼠标操作

---

## 📐 布局结构

```
┌─────────────────────────────────────────┐
│ 🤖 SEMIPILOT    [+] [⚙️] [⋯]            │ ← 顶部标题栏 (Header)
├─────────────────────────────────────────┤
│                                         │
│  💬✨                                   │
│  Build with Semipilot                   │
│  Start a conversation...                │ ← 聊天消息区域 (Chat Messages)
│                                         │
│  [用户消息]                              │
│  [AI 回复]                              │
│  ...                                    │
│                                         │
├─────────────────────────────────────────┤
│ [📎 @spec:cap-persona-poe.md] [×]      │ ← 上下文附加区 (Context Area)
├─────────────────────────────────────────┤
│ [Ask Semipilot...              ] [✈️] │ ← 输入区域 (Editor Area)
├─────────────────────────────────────────┤
│ [Poe ▼] [Qwen ▼] [📎] [🎤]            │ ← 工具栏 (Toolbar)
└─────────────────────────────────────────┘
```

---

## 🧩 组件详解

### 1. Header（顶部标题栏）

**位置**: 最顶部  
**高度**: 32px  
**背景**: `var(--vscode-sideBarTitle-background)`

**元素**:
```html
<div class="header">
  <div class="header-title">🤖 SEMIPILOT</div>
  <div class="header-actions">
    <button id="newChatBtn">+</button>      <!-- New Chat -->
    <button id="settingsBtn">⚙️</button>   <!-- Settings -->
    <button id="moreBtn">⋯</button>        <!-- More Options -->
  </div>
</div>
```

**交互**:
- `+` 按钮 → 创建新对话
- `⚙️` 按钮 → 打开设置面板
- `⋯` 按钮 → 更多选项菜单

**样式特点**:
- 大写标题 + 小号字体（11px）
- 按钮透明背景，hover 时显示背景色
- 与 VS Code 原生设计一致

---

### 2. Chat Messages（聊天消息区域）

**位置**: Header 下方，占据剩余空间  
**高度**: `flex: 1`（自动填充）  
**背景**: `var(--vscode-sideBar-background)`

**空状态**:
```html
<div class="empty-state">
  <div class="empty-state-icon">💬✨</div>
  <div class="empty-state-title">Build with Semipilot</div>
  <div class="empty-state-subtitle">
    Start a conversation with your AI coding assistant
  </div>
</div>
```

**消息样式**（待 Phase 1 Week 1 Day 5 实现）:
```
[用户消息]
  - 背景: var(--vscode-input-background)
  - 圆角: 6px
  - 对齐: 右侧

[AI 回复]
  - 背景: transparent
  - Markdown 渲染
  - 对齐: 左侧
```

**特性**:
- 自动滚动到最新消息
- 支持 Markdown 渲染
- 代码高亮
- Streaming 逐字显示

---

### 3. Context Area（上下文附加区）

**位置**: 输入框上方  
**显示条件**: 有附加上下文时显示  
**背景**: `var(--vscode-input-background)`

**Chip 样式**:
```html
<div class="context-chip">
  📎 @spec:cap-persona-poe.md
  <button class="chip-remove">×</button>
</div>
```

**特点**:
- 圆角徽章样式（border-radius: 12px）
- Badge 颜色: `var(--vscode-badge-background)`
- 可点击删除
- 支持多个 Context

---

### 4. Editor Area（输入区域）

**位置**: 底部上方  
**布局**: Flex 横向排列

**输入框**:
- **类型**: `contenteditable div`（未来替换为 TipTap Editor）
- **最小高度**: 36px
- **最大高度**: 200px
- **自动调整**: 根据内容高度
- **Placeholder**: "Ask Semipilot..."
- **边框**: 1px solid，focus 时高亮

**发送按钮**:
- **尺寸**: 36x36px
- **图标**: ✈️ 纸飞机
- **样式**: 
  - 圆角: 6px
  - 背景: `var(--vscode-button-background)`
  - Hover 时轻微上移（translateY(-1px)）
- **状态**:
  - 输入框为空时 `disabled`
  - 有内容时可点击

**交互**:
- `Enter` → 发送消息
- `Shift+Enter` → 换行
- 点击 ✈️ → 发送消息

---

### 5. Toolbar（工具栏）

**位置**: 最底部  
**高度**: 32px  
**背景**: 透明

**元素**:
```html
<div class="toolbar">
  <select id="agentSelect">      <!-- Agent 选择器 -->
    <option>Poe</option>
    <option>Archi</option>
    <option>Cody</option>
  </select>
  <select id="modelSelect">      <!-- Model 选择器 -->
    <option>Qwen</option>
    <option>Claude</option>
  </select>
  <button id="attachBtn">📎</button>  <!-- 附加上下文 -->
  <button id="micBtn">🎤</button>     <!-- 语音输入 -->
</div>
```

**样式特点**:
- 小号字体（11px）
- 紧凑布局（gap: 8px）
- Dropdown 样式与 VS Code 一致

---

## 🎨 设计系统

### 颜色方案

使用 VS Code 内置 CSS 变量，确保与主题一致：

```css
/* 背景色 */
--vscode-sideBar-background
--vscode-sideBarTitle-background
--vscode-input-background
--vscode-editor-background

/* 前景色 */
--vscode-foreground
--vscode-sideBarTitle-foreground
--vscode-input-placeholderForeground

/* 边框色 */
--vscode-panel-border
--vscode-input-border
--vscode-focusBorder

/* 按钮色 */
--vscode-button-background
--vscode-button-foreground
--vscode-button-hoverBackground

/* 徽章色 */
--vscode-badge-background
--vscode-badge-foreground
```

### 间距系统

```css
/* 微小间距 */
4px  - gap, padding-small

/* 标准间距 */
8px  - padding, margin

/* 中等间距 */
12px - padding-medium

/* 大间距 */
16px - section-spacing
```

### 圆角规范

```css
/* 小圆角 */
4px  - toolbar buttons, dropdowns

/* 中圆角 */
6px  - input, send button, messages

/* 大圆角 */
12px - context chips (badge style)
```

### 字体规范

```css
/* 超小字体 */
11px - toolbar, header title

/* 小字体 */
12px - secondary text, subtitles

/* 标准字体 */
13px - body text

/* 大字体 */
14px - message titles

/* 特大字体 */
48px - empty state icon
```

---

## 🔄 交互动效

### 按钮 Hover

```css
.header-btn:hover,
.toolbar-btn:hover {
  background-color: var(--vscode-toolbar-hoverBackground);
}
```

### 发送按钮动效

```css
.send-btn:hover {
  background-color: var(--vscode-button-hoverBackground);
  transform: translateY(-1px);  /* 轻微上移 */
}

.send-btn:active {
  transform: translateY(0);     /* 按下时回弹 */
}
```

### 输入框 Focus

```css
.editor-container:focus-within {
  border-color: var(--vscode-focusBorder);
}
```

### Placeholder 渐隐

```css
.editor-container[data-placeholder]:empty:before {
  content: attr(data-placeholder);
  color: var(--vscode-input-placeholderForeground);
  pointer-events: none;
  position: absolute;
}
```

---

## 📱 响应式设计

### 窗口尺寸适配

```css
/* 侧边栏宽度 < 300px 时 */
@media (max-width: 300px) {
  .header-title {
    display: none;  /* 隐藏标题 */
  }
  .toolbar {
    flex-wrap: wrap;  /* 工具栏换行 */
  }
}
```

### 输入框自适应

```css
.editor-container {
  min-height: 36px;   /* 单行 */
  max-height: 200px;  /* 最多 10 行 */
  overflow-y: auto;   /* 超出滚动 */
}
```

---

## 🚀 与 VS Code Copilot Chat 的对比

| 特性 | Copilot Chat | Semipilot |
|------|-------------|-----------|
| **顶部标题栏** | ✅ CHAT + 操作按钮 | ✅ SEMIPILOT + 操作按钮 |
| **New Chat 按钮** | ✅ + 按钮 | ✅ + 按钮 |
| **Settings 按钮** | ✅ ⚙️ 按钮 | ✅ ⚙️ 按钮 |
| **More 菜单** | ✅ ⋯ 按钮 | ✅ ⋯ 按钮 |
| **空状态提示** | ✅ Build with Agent | ✅ Build with Semipilot |
| **输入框位置** | ✅ 底部 | ✅ 底部 |
| **发送按钮** | ✅ 纸飞机 ✈️ | ✅ 纸飞机 ✈️ |
| **上下文附加** | ✅ Add Context... | ✅ Context Area |
| **Agent 选择** | ✅ Dropdown | ✅ Dropdown |
| **Model 选择** | ✅ Dropdown | ✅ Dropdown |
| **工具栏位置** | ✅ 输入框下方 | ✅ 输入框下方 |
| **差异化** | - | ✅ @spec 特有功能 |

---

## 🎯 设计优势

### 1. 符合 VS Code 设计语言

- 使用 VS Code 内置颜色变量
- 遵循 Fluent Design 风格
- 与原生组件保持一致

### 2. 简洁高效

- 所有功能在一屏内
- 减少滚动和点击
- 快捷键支持

### 3. 现代化

- 圆角设计
- 微动效
- 流畅过渡

### 4. 可扩展

- 组件化设计
- 易于添加新功能
- 支持主题切换

---

## 🛠️ 技术实现

### 当前版本（Phase 1 Week 1 Day 4）

- ✅ 基础 HTML 骨架
- ✅ CSS 样式完整
- ✅ 简单的 contenteditable 输入框
- ✅ JavaScript 基础交互
- ✅ @ 符号检测

### 下一版本（Phase 1 Week 1 Day 5）

- ⏳ React 重构
- ⏳ TipTap Editor 集成
- ⏳ @ 提及下拉菜单
- ⏳ Context Provider 连接
- ⏳ Markdown 渲染

### 未来版本（Phase 1 Week 2+）

- ⏳ SSE 流式响应
- ⏳ 代码高亮
- ⏳ 消息持久化
- ⏳ Slash Commands
- ⏳ 语音输入

---

## 📊 设计决策记录

### 为什么输入框在底部？

**决策**: 输入框固定在底部  
**原因**:
- ✅ 符合聊天应用惯例（微信、Telegram）
- ✅ 拇指友好（移动端）
- ✅ 视线自然落在底部
- ✅ 不会被消息列表遮挡

### 为什么用纸飞机图标？

**决策**: 发送按钮使用 ✈️  
**原因**:
- ✅ 国际通用符号
- ✅ 视觉识别性强
- ✅ 与 Telegram、WhatsApp 一致
- ✅ 比文字 "Send" 更简洁

### 为什么要 Context Area？

**决策**: 独立的上下文附加区域  
**原因**:
- ✅ 清晰展示已附加的上下文
- ✅ 易于删除和管理
- ✅ 不占用输入框空间
- ✅ 视觉上更醒目

### 为什么工具栏在输入框下方？

**决策**: Toolbar 位于 Editor Area 下方  
**原因**:
- ✅ 不遮挡输入内容
- ✅ 符合 VS Code Copilot 的布局
- ✅ 操作顺序合理（输入 → 选择 Agent/Model → 发送）
- ✅ 视觉上更平衡

---

## 🎨 未来优化方向

### 1. 主题支持

- 暗色主题优化
- 高对比度主题
- 自定义颜色

### 2. 动效增强

- 消息进入动画
- 打字机效果
- 按钮涟漪效果

### 3. 无障碍

- 键盘导航
- 屏幕阅读器支持
- 焦点管理

### 4. 性能优化

- 虚拟滚动（消息列表）
- 懒加载
- 防抖节流

---

**设计者**: Cody (Code Generation Agent)  
**设计日期**: 2026-01-09  
**设计版本**: 1.0.0  
**状态**: ✅ IMPLEMENTED
