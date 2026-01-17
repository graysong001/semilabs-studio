# 🚀 Phase 1 Week 1 Day 4 快速开始

**@SpecTrace**: cap-ui-semipilot

---

## 一键开始

```bash
# 1. 进入扩展目录
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot

# 2. 运行构建与验证脚本
./build-and-verify.sh

# 3. 如果成功，在 VS Code 中打开项目并按 F5
```

---

## 预期结果

### ✅ 构建成功

```
================================
✅ Build & Verification Complete!
================================

📝 Next Steps:
1. Open VS Code in the semilabs-studio directory
2. Press F5 to start Extension Development Host
3. Look for Semipilot icon in Activity Bar
```

### ✅ 扩展加载成功

**在 Extension Development Host 窗口中**:

1. **Activity Bar** 出现 Semipilot 图标（🤖）
2. **点击图标** → Chat Panel 打开
3. **Developer Tools Console** 显示：
   ```
   [Semipilot] Activating extension...
   [ContextProviderManager] Initialized with providers: file, spec
   [SpecContextProvider] Building index...
   [SpecContextProvider] Index built: X specs found
   ```

---

## 如果遇到问题

### ❌ npm 找不到

```bash
# 安装 Node.js 22
# 选项 1: 使用 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.zshrc  # 或 ~/.bashrc
nvm install 22
nvm use 22

# 选项 2: 从官网下载
# https://nodejs.org/
```

### ❌ 编译失败

```bash
# 清理并重新安装
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot
rm -rf node_modules out
npm install
npm run compile
```

### ❌ 扩展无法加载

**检查步骤**:
1. View → Output → 选择 "Extension Host"
2. 查找错误信息
3. 确认 `out/extension.js` 文件存在
4. 重新编译：`npm run compile`

---

## 验证清单

完成以下检查后，可以进入 Phase 1 Week 1 Day 5：

- [ ] `./build-and-verify.sh` 执行成功
- [ ] 扩展在 Extension Development Host 中加载成功
- [ ] Semipilot 图标出现在 Activity Bar
- [ ] Chat Panel 能打开并显示基础 UI
- [ ] Console 显示 SpecContextProvider 索引构建日志
- [ ] SpecContextProvider 扫描到至少 5 个 spec 文件

**详细验证步骤**: 参考 [`PHASE1_WEEK1_DAY4_VERIFICATION_CHECKLIST.md`](./PHASE1_WEEK1_DAY4_VERIFICATION_CHECKLIST.md)

---

## 下一步

**Phase 1 Week 1 Day 5: TipTap Editor 完整集成**

任务预览：
1. 创建 React Webview App
2. 复用 Continue 的 TipTap Editor 组件
3. 实现 @ Mention 下拉菜单
4. 连接 Context Providers
5. **验证 @spec:cap-persona-poe.md 能加载** ⭐

---

**更新日期**: 2026-01-09  
**维护者**: Cody
