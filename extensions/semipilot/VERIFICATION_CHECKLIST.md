# Semipilot Extension 验证清单

**@SpecTrace**: cap-ui-semipilot  
**更新日期**: 2026-01-09  
**当前阶段**: Phase 1 Week 1 Day 4

---

## 📋 当前阶段验证清单

### ✅ Phase 1 Week 1 Day 3-4: 基础架构（已完成）

#### 1. Extension 激活

**验证步骤**:
1. 在本地 VS Code 中打开 `semilabs-studio` 项目
2. 按 F5 启动 Extension Development Host
3. 新窗口打开后，查看左侧 Activity Bar

**预期结果**:
- ✅ 左侧 Activity Bar 出现 Semipilot 图标（🤖）
- ✅ Console 显示: `[Semipilot] Extension activated successfully`

**如果失败**:
- 查看 Console 是否有错误信息
- 参考 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

#### 2. Chat Panel 显示

**验证步骤**:
1. 点击左侧 Activity Bar 的 Semipilot 图标（🤖）
2. 侧边栏展开

**预期结果**:
- ✅ 侧边栏显示 "Semipilot Chat Panel" 标题
- ✅ 显示输入框（带 placeholder: "Type @ to mention context providers..."）
- ✅ 显示 "Send" 按钮
- ✅ 右下角短暂显示 "OK Webview Ready" 绿色提示（3秒后消失）
- ✅ VS Code 右下角通知: "Semipilot Chat Panel is ready!"

**如果失败**:
- 打开 Developer Tools (Cmd+Option+I)
- 查看 Console 中的 `[Webview]` 日志
- 查看是否有 CSP 错误

---

#### 3. Placeholder 行为

**验证步骤**:
1. 查看输入框，应该显示灰色提示文字
2. 点击输入框
3. 直接输入文字

**预期结果**:
- ✅ 初始状态显示灰色 placeholder: "Type @ to mention context providers..."
- ✅ 点击后不需要删除提示文字，可以直接输入 ✅
- ✅ 输入内容后，placeholder 自动消失
- ✅ 删除所有内容后，placeholder 自动重新显示

**如果失败**:
- 检查是否重新编译: `npm run compile`
- 检查是否重新加载窗口: Cmd+R

---

#### 4. @ 符号检测（当前阶段：仅日志）

**验证步骤**:
1. 打开 Developer Tools (Cmd+Option+I)
2. 切换到 Console 标签页
3. 在输入框中输入 @

**预期结果**:
- ✅ Console 显示: `[Webview] @ detected - TipTap will show dropdown here`
- ⚠️ **当前阶段不会显示下拉菜单**（这是正常的！）

**说明**:
- 当前只有基础检测，还没有实现 TipTap Editor
- @ 提及下拉菜单将在 **Phase 1 Week 1 Day 5** 实现

---

#### 5. SpecContextProvider 索引构建

**验证步骤**:
1. 在 Extension Development Host 中打开一个包含 spec 文档的工作区
   - File → Open Folder
   - 选择 `/Users/xingjian/work/projects/semilabs-ws/semilabs-squad`
2. 打开 Developer Tools (Cmd+Option+I)
3. 在 Console 的 Filter 输入框中输入 `[SpecContextProvider]`

**预期结果**:
- ✅ Console 显示: `[SpecContextProvider] Building index...`
- ✅ Console 显示: `[SpecContextProvider] Index built: X specs found`
  - X 是找到的 spec 文档数量（取决于工作区内容）

**如果没有日志**:
- 检查是否打开了工作区（不只是打开文件）
- 检查工作区中是否有 `cap-*.md`, `spec-*.md`, `intent_*.md` 文件
- 查看是否有警告: `[Semipilot] No workspace folder found`

---

#### 6. Send 按钮功能

**验证步骤**:
1. 在输入框中输入任意文本（如 "Hello World"）
2. 点击 "Send" 按钮
3. 打开 Developer Tools 查看 Console

**预期结果**:
- ✅ Console 显示: `[Webview] Sending message: Hello World`
- ✅ 输入框内容被清空
- ⚠️ **当前阶段不会发送到后端**（这是正常的！）

**说明**:
- 当前只是 Webview 内部的消息处理
- 与后端的通信将在 **Phase 1 Week 2** 实现

---

#### 7. SSE 连接（预期失败）

**验证步骤**:
1. 打开 Developer Tools (Cmd+Option+I)
2. 在 Console 的 Filter 输入框中输入 `[SseMessenger]`

**预期结果**:
- ✅ Console 显示: `[SseMessenger] Connecting to http://localhost:8080/api/v1/sse/events`
- ⚠️ Console 显示: `[SseMessenger] SSE connection error: ...`
- ⚠️ Console 显示: `[SseMessenger] Reconnecting...`

**说明**:
- **SSE 连接失败是正常的**，因为后端服务还未启动
- 这不会影响 Chat Panel 的显示和基础功能
- Extension 会自动尝试重新连接

---

## 🚧 下一阶段功能（未实现）

### ⏳ Phase 1 Week 1 Day 5: TipTap Editor 完整集成

以下功能**当前还未实现**，预计在 Day 5 完成：

#### 1. @ 提及下拉菜单
- ❌ 输入 @ 后显示 Context Provider 列表
- ❌ 列表显示: @spec, @file, @folder, @code
- ❌ 上下键选择，回车确认

#### 2. @spec 自动完成
- ❌ 输入 @spec 后显示 spec 文档列表
- ❌ 支持模糊搜索（按 ID、Title、Domain）
- ❌ 显示 spec 状态图标（✅ APPROVED, 📝 DRAFT, ⚠️ DEPRECATED）

#### 3. Mention Badge 渲染
- ❌ 选中的 @spec 渲染为彩色徽章
- ❌ 可以点击删除
- ❌ 可以悬停查看详情

#### 4. 富文本编辑
- ❌ 支持 Markdown 语法
- ❌ 代码高亮
- ❌ 多行输入

---

## 📊 完整验证脚本

### 自动化测试

```bash
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"

# 1. 编译
npm run compile

# 2. 运行自动化测试
node test-extension.js

# 3. 查看测试报告
cat test-report.json
```

**预期输出**:
```json
{
  "timestamp": "2026-01-09T...",
  "name": "semipilot",
  "version": "0.1.0",
  "checks": {
    "mainEntry": true,
    "webviewView": true,
    "command": true
  },
  "files": {
    "extensionJs": true,
    "webviewProvider": true,
    "specProvider": true
  }
}
```

---

### 手动验证（完整流程）

#### 步骤 1: 构建和编译

```bash
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
npm run compile
```

**预期**: 无错误输出

---

#### 步骤 2: 启动调试

```bash
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio
code .
# 按 F5
```

**预期**: Extension Development Host 窗口打开

---

#### 步骤 3: 验证 Extension 激活

在 Extension Development Host 中：
1. 查看左侧 Activity Bar → ✅ Semipilot 图标存在
2. 打开 Developer Tools (Cmd+Option+I)
3. 查看 Console → ✅ `[Semipilot] Extension activated successfully`

---

#### 步骤 4: 验证 Chat Panel

1. 点击 Semipilot 图标
2. 查看侧边栏 → ✅ 显示 "Semipilot Chat Panel"
3. 查看输入框 → ✅ 显示 placeholder
4. 查看右下角 → ✅ "OK Webview Ready" 提示（3秒后消失）

---

#### 步骤 5: 验证 Placeholder

1. 点击输入框
2. 直接输入 "test"
3. 删除所有文字
4. 查看 placeholder → ✅ 自动重新显示

---

#### 步骤 6: 验证 @ 检测

1. 确保 Developer Tools 已打开
2. 在输入框输入 @
3. 查看 Console → ✅ `[Webview] @ detected - TipTap will show dropdown here`

---

#### 步骤 7: 验证 SpecContextProvider

1. File → Open Folder → 选择 `/Users/xingjian/work/projects/semilabs-ws/semilabs-squad`
2. 重新加载窗口 (Cmd+R)
3. 打开 Developer Tools
4. Filter 输入 `[SpecContextProvider]`
5. 查看日志 → ✅ `Index built: X specs found`

---

#### 步骤 8: 验证 Send 按钮

1. 在输入框输入 "Hello World"
2. 点击 "Send"
3. 查看 Console → ✅ `[Webview] Sending message: Hello World`
4. 查看输入框 → ✅ 内容已清空

---

## 🎯 验证结果判定

### 全部通过 ✅

如果以上所有验证项都通过，说明 **Phase 1 Week 1 Day 4** 已完成！

可以继续进行 **Phase 1 Week 1 Day 5** 的开发：
- 创建 React Webview App 脚手架
- 集成 TipTap Editor
- 实现 @ 提及下拉菜单
- 连接 SpecContextProvider

---

### 部分失败 ⚠️

如果有验证项失败：

1. **查看 Console 日志**
   - Developer Tools → Console
   - 查找错误信息

2. **参考故障排除文档**
   - [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

3. **重新编译**
   ```bash
   npm run compile
   ```

4. **重新加载窗口**
   - 在 Extension Development Host 按 Cmd+R

5. **完全重置**
   ```bash
   cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot
   rm -rf node_modules out
   npm install
   npm run compile
   ```

---

## 📚 相关文档

- [HOW_TO_RUN.md](./HOW_TO_RUN.md) - 运行指南
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - 故障排除
- [GLOSSARY.md](./GLOSSARY.md) - 术语表
- [AUTO_TEST_GUIDE.md](./AUTO_TEST_GUIDE.md) - 自动化测试指南

---

## 📝 验证记录模板

复制以下模板记录验证结果：

```
## Semipilot Extension 验证记录

**日期**: 2026-01-09  
**验证人**: [你的名字]  
**阶段**: Phase 1 Week 1 Day 4

### 验证结果

- [ ] Extension 激活
- [ ] Chat Panel 显示
- [ ] Placeholder 行为
- [ ] @ 符号检测（日志）
- [ ] SpecContextProvider 索引
- [ ] Send 按钮功能
- [ ] SSE 连接（预期失败）

### 环境信息

- OS: macOS 15.5
- VS Code: 1.85.0
- Node.js: 22.21.1
- npm: 10.9.4

### 备注

[记录任何异常情况或注意事项]
```

---

**更新日期**: 2026-01-09  
**维护者**: Cody (Code Generation Agent)  
**状态**: ✅ READY FOR VERIFICATION
