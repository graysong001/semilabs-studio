# Semipilot Extension - Development Guide

**@SpecTrace**: cap-ui-semipilot

## 📁 项目结构

```
extensions/semipilot/
├── src/
│   ├── context/                      # Context Providers
│   │   ├── IContextProvider.ts       # 接口定义
│   │   ├── FileContextProvider.ts    # @file 提供者
│   │   ├── SpecContextProvider.ts    # @spec 提供者 ⭐
│   │   └── ContextProviderManager.ts # 管理器
│   ├── messenger/                    # 通信层
│   │   ├── IMessenger.ts             # 接口定义
│   │   ├── SemilabsProtocol.ts       # 协议定义
│   │   └── SseMessenger.ts           # SSE 实现
│   ├── webview/                      # Webview UI
│   │   └── SemipilotWebviewProvider.ts
│   └── extension.ts                  # 扩展入口
├── package.json                      # 扩展配置
└── tsconfig.json                     # TypeScript 配置
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot
npm install
```

### 2. 编译 TypeScript

```bash
npm run compile
```

### 3. 运行扩展

在 VS Code 中：
1. 打开 `semilabs-studio` 工作区
2. 按 `F5` 启动 Extension Development Host
3. 在新窗口中查看 Semipilot 图标（侧边栏）
4. 点击图标打开 Chat Panel

## 🧪 验证清单

### Phase 1 Week 1 Day 4 验收标准

- [ ] **扩展加载成功**
  - Semipilot 图标出现在 VS Code 侧边栏
  - 无报错信息
  
- [ ] **Chat Panel 打开**
  - 点击侧边栏图标，Chat Panel 显示
  - 基础 HTML UI 渲染正常
  
- [ ] **Context Provider 初始化**
  - 打开 VS Code Developer Tools (Help → Toggle Developer Tools)
  - Console 中看到日志：
    ```
    [Semipilot] Activating extension...
    [ContextProviderManager] Initialized with providers: file, spec
    [SpecContextProvider] Building index...
    [SpecContextProvider] Index built: X specs found
    ```

- [ ] **@spec 索引验证**
  - 确认扫描到 `semilabs-specs` 目录中的 spec 文档
  - 验证 `cap-*.md` 文件被正确解析

### Phase 1 Week 1 Day 5 目标

- [ ] **TipTap Editor 集成**
  - 替换临时 HTML 为 React + TipTap
  - @ 触发下拉菜单
  - 显示 Context Providers 列表
  
- [ ] **@spec Mention 验证**
  - 输入 `@spec` 触发下拉菜单
  - 搜索 `poe` 显示 `cap-persona-poe.md`
  - 选择后加载 Spec 内容到 Chat 上下文

## 🐛 故障排查

### 问题 1: npm 找不到

**症状**: `zsh: command not found: npm`

**解决方案**:
```bash
# 使用 nvm 安装 Node.js
source ~/.nvm/nvm.sh
nvm install 22
nvm use 22
```

### 问题 2: TypeScript 编译错误

**症状**: `找不到模块"vscode"或其相应的类型声明`

**解决方案**:
```bash
npm install --save-dev @types/vscode @types/node
```

### 问题 3: 扩展无法加载

**检查步骤**:
1. 确认 `package.json` 中 `engines.vscode` 版本匹配
2. 确认 `activationEvents` 包含 `onStartupFinished`
3. 检查 VS Code 输出面板 (Output → Semipilot)

### 问题 4: @spec 扫描不到文件

**调试步骤**:
1. 打开 Developer Tools Console
2. 查找 `[SpecContextProvider]` 日志
3. 确认工作区路径正确：
   ```typescript
   // In extension.ts
   const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
   console.log('Workspace root:', workspaceRoot);
   ```

## 📊 性能监控

### SpecContextProvider 性能指标

在 Developer Tools Console 中添加性能测试：

```typescript
// In SpecContextProvider.ts buildIndex()
const startTime = performance.now();
// ... scanning logic ...
const endTime = performance.now();
console.log(`[SpecContextProvider] Index built in ${endTime - startTime}ms`);
```

**目标性能**:
- 启动扫描: < 2000ms (1000 文件)
- 搜索查询: < 50ms
- 增量更新: < 500ms

## 🔧 开发命令

```bash
# 编译 TypeScript
npm run compile

# 监听模式编译
npm run watch

# 运行测试（待添加）
npm run test

# 打包扩展
npm run package
```

## 📚 相关文档

- [SESSION_CONTEXT_EXPORT.md](../../SESSION_CONTEXT_EXPORT.md) - 项目上下文
- [PHASE1_WEEK1_DAY3-4_SUMMARY.md](./PHASE1_WEEK1_DAY3-4_SUMMARY.md) - 实施总结
- [implementation-roadmap.md](./implementation-roadmap.md) - 实施路线图
- [cap-ui-semipilot.md](../../capabilities/domain-ui/cap-ui-semipilot.md) - 主规格
- [cap-ui-semipilot-bdd.md](../../capabilities/domain-ui/cap-ui-semipilot-bdd.md) - BDD 验收场景

## 🎯 下一步开发任务

### Phase 1 Week 1 Day 5

**任务**: TipTap Editor 完整集成

1. 创建 React Webview App
2. 安装 React + TipTap 依赖
3. 复用 Continue 的 TipTap Editor 组件
4. 实现 Mention 扩展
5. 连接 Context Providers
6. 验证 @spec:cap-persona-poe.md 能加载

### Phase 1 Week 2

**任务**: Chat Panel UI + SSE 集成

- Day 6-7: 创建 MessageList、ThinkingBlock、PersonaSelector 组件
- Day 8-9: 实现 SSE 集成，订阅后端事件流
- Day 10: Slash Commands (/poe, /archi, /cody, /tess)

---

**更新日期**: 2026-01-09  
**维护者**: Cody (Code Generation Agent)
