# Semilabs-Studio 运行指南

**@SpecTrace**: cap-ui-semipilot  
**更新日期**: 2026-01-09

---

## 📖 Semilabs-Studio 是什么？

`semilabs-studio` 是基于 **code-server** 的项目，code-server 是在浏览器中运行的 VS Code。

**项目结构**:
```
semilabs-studio/
├── extensions/semipilot/          # Semipilot Extension（我们开发的）
├── src/                           # code-server 核心代码
├── lib/vscode/                    # VS Code 源码（作为 Git 子模块）
└── package.json                   # code-server 主配置
```

---

## 🚀 运行方式

### 方法 1: 在本地 VS Code 中调试 Extension（推荐）⭐

**适用场景**: 开发和测试 Semipilot Extension

#### Step 1: 确保已构建

```bash
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot

# 设置 Node.js 环境（如果还没设置）
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"

# 构建 Extension
./build-and-verify.sh
```

#### Step 2: 在 VS Code 中打开项目

```bash
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio
code .
```

#### Step 3: 启动调试

**方式 A: 使用快捷键（推荐）**
```
按 F5
```

**方式 B: 使用菜单**
```
Run → Start Debugging
```

**方式 C: 使用调试面板**
```
1. 点击左侧 Activity Bar 的调试图标（🐛）
2. 选择配置："Run Semipilot Extension (without build)"
3. 点击绿色播放按钮
```

#### Step 4: 验证

在新打开的 **Extension Development Host** 窗口中：

1. ✅ **查看 Activity Bar**: 左侧出现 Semipilot 图标（🤖）
2. ✅ **打开 Chat Panel**: 点击图标，侧边栏展开
3. ✅ **查看 Console**: Help → Toggle Developer Tools → Console 标签
   ```
   [Semipilot] Activating extension...
   [ContextProviderManager] Initialized with providers: file, spec
   [SpecContextProvider] Building index...
   [SpecContextProvider] Index built: X specs found
   ```

#### 调试技巧

**设置断点**:
- 在 `extension.ts` 或其他文件中点击行号左侧设置断点
- 断点会在 Extension Development Host 触发

**重新加载 Extension**:
- 在 Extension Development Host 窗口中按 `Cmd+R` (macOS) 或 `Ctrl+R` (Windows/Linux)
- 或使用命令面板：`Developer: Reload Window`

**查看变量**:
- 调试时，左侧 Debug 面板会显示 Variables、Watch、Call Stack

---

### 方法 2: 构建并运行完整的 code-server（生产模式）

**适用场景**: 部署到服务器，通过浏览器访问

#### 前提条件

```bash
# 检查依赖
node --version      # 需要 Node.js 22.x
npm --version       # 需要 npm 10.x
```

#### Step 1: 构建 code-server

```bash
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio

# 安装依赖
npm install

# 构建 VS Code
npm run build:vscode

# 构建 code-server
npm run build
```

**注意**: 完整构建可能需要 10-20 分钟

#### Step 2: 运行 code-server

```bash
# 启动 code-server（默认端口 8080）
node out/node/entry.js

# 或指定端口
node out/node/entry.js --port 3000

# 或使用绑定地址
node out/node/entry.js --bind-addr 0.0.0.0:8080
```

#### Step 3: 访问

打开浏览器访问:
```
http://localhost:8080
```

首次访问需要输入密码，密码在终端输出中：
```
[2026-01-09T10:30:00.000Z] info  HTTP server listening on http://0.0.0.0:8080 
[2026-01-09T10:30:00.000Z] info    - Authentication is enabled
[2026-01-09T10:30:00.000Z] info      - Using password from ~/.config/code-server/config.yaml
[2026-01-09T10:30:00.000Z] info    - Not serving HTTPS 
```

查看密码:
```bash
cat ~/.config/code-server/config.yaml
```

---

### 方法 3: 使用 Docker（推荐用于生产部署）

**适用场景**: 容器化部署，与后端服务一起运行

#### 创建 docker-compose.yml

根据记忆，项目采用**双容器部署模式**。让我创建配置文件：

```bash
cd /Users/xingjian/work/projects/semilabs-ws
```

创建 `docker-compose-dev.yml`:
```yaml
version: '3.8'

services:
  semilabs-studio:
    image: codercom/code-server:latest
    container_name: semilabs-studio
    ports:
      - "8080:8080"
    environment:
      - PASSWORD=semilabs-dev-password
      - SUDO_PASSWORD=semilabs-dev-password
    volumes:
      # 开发环境：Bind Mount（支持热重载）
      - ./semilabs-studio/extensions/semipilot:/home/coder/.local/share/code-server/extensions/semipilot
      - ./semilabs-squad/semilabs-specs:/workspace/semilabs-specs:ro
    command: --auth password --disable-telemetry

  semilabs-server:
    build: ./semilabs-squad/semilabs-server
    container_name: semilabs-server
    ports:
      - "8081:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=dev
    volumes:
      - ./semilabs-squad/semilabs-specs:/workspace/semilabs-specs:ro
    depends_on:
      - postgres

  postgres:
    image: postgres:16
    container_name: semilabs-postgres
    environment:
      - POSTGRES_DB=semilabs
      - POSTGRES_USER=semilabs
      - POSTGRES_PASSWORD=semilabs
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

#### 启动服务

```bash
# 启动所有服务
docker-compose -f docker-compose-dev.yml up -d

# 查看日志
docker-compose -f docker-compose-dev.yml logs -f semilabs-studio

# 停止服务
docker-compose -f docker-compose-dev.yml down
```

#### 访问

- **Code Server (Studio)**: http://localhost:8080
  - 密码: `semilabs-dev-password`
- **Backend API**: http://localhost:8081

---

## 🎯 推荐工作流

### 开发 Semipilot Extension（当前阶段）

```bash
# 1. 构建 Extension
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
npm run compile

# 2. 在 VS Code 中打开项目
cd ../..
code .

# 3. 按 F5 启动调试
# 4. 在 Extension Development Host 中测试
# 5. 修改代码后，在 Extension Development Host 中按 Cmd+R 重新加载
```

### 完整系统测试（前端 + 后端）

```bash
# 1. 启动后端
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-squad
./start-backend.sh

# 2. 在另一个终端启动 Extension Development Host
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio
code .
# 按 F5

# 3. 在 Extension Development Host 中测试完整功能
```

---

## 📊 运行方式对比

| 方式 | 适用场景 | 优点 | 缺点 |
|------|---------|------|------|
| **本地 VS Code 调试** | 开发 Extension | 断点调试、热重载 | 仅测试 Extension |
| **运行 code-server** | 测试浏览器版 | 接近生产环境 | 构建时间长 |
| **Docker Compose** | 完整系统测试 | 前后端一起运行 | 配置复杂 |

---

## 🐛 常见问题

### Q1: 按 F5 没有反应？

**检查**:
- 确认在 VS Code 中打开了 `semilabs-studio` 目录
- 检查 `.vscode/launch.json` 是否存在
- 尝试使用菜单：Run → Start Debugging

### Q2: Extension Development Host 窗口中没有 Semipilot 图标？

**排查**:
1. 打开 Developer Tools (Help → Toggle Developer Tools)
2. 查看 Console 是否有错误
3. 确认 `out/extension.js` 文件存在：
   ```bash
   ls -la /Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot/out/extension.js
   ```
4. 重新编译：
   ```bash
   cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot
   npm run compile
   ```

### Q3: SpecContextProvider 扫描不到 spec 文件？

**原因**: 工作区路径不正确

**解决**:
- Extension Development Host 的工作区应该是包含 `semilabs-squad/semilabs-specs` 的根目录
- 正确的工作区：`/Users/xingjian/work/projects/semilabs-ws`
- 错误的工作区：`/Users/xingjian/work/projects/semilabs-ws/semilabs-studio`

**修复**:
```bash
# 在正确的目录打开 VS Code
cd /Users/xingjian/work/projects/semilabs-ws
code .
```

### Q4: 如何查看 Extension 日志？

**方法**:
1. 在 Extension Development Host 窗口中
2. Help → Toggle Developer Tools（快捷键：`Cmd+Option+I` macOS 或 `Ctrl+Shift+I` Windows）
3. Console 标签页查看日志

**过滤日志**:
在 Console 的 Filter 输入框中输入关键词：
- `[Semipilot]` - 扩展主日志
- `[SpecContextProvider]` - Spec 文档索引日志 ⭐
- `[ContextProviderManager]` - Context Provider 管理日志
- `[SseMessenger]` - 后端通信日志
- `[Webview]` - Webview 初始化日志

**SpecContextProvider 日志示例**:
```
[SpecContextProvider] Building index...
[SpecContextProvider] Index built: 5 specs found
```

**如果看不到 SpecContextProvider 日志**:
1. 确认已打开工作区文件夹（File → Open Folder）
2. 确认工作区中有 `cap-*.md`、`spec-*.md` 或 `intent_*.md` 文件
3. 检查是否有警告：`[Semipilot] No workspace folder found`

---

## 📚 相关文档

- [QUICKSTART.md](./QUICKSTART.md) - 快速开始
- [TEST_RESULTS.md](./TEST_RESULTS.md) - 测试结果
- [GLOSSARY.md](./GLOSSARY.md) - 术语表
- [README.md](./README.md) - 开发指南

---

## 🎉 快速验证

确认 Semipilot Extension 正常运行：

```bash
# 1. 一键构建
cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
./build-and-verify.sh

# 2. 打开 VS Code
cd ../..
code .

# 3. 按 F5

# 4. 在 Extension Development Host 中验证：
#    ✅ Semipilot 图标出现
#    ✅ Chat Panel 打开
#    ✅ Console 显示日志
```

---

**更新日期**: 2026-01-09  
**维护者**: Cody (Code Generation Agent)  
**状态**: ✅ READY TO RUN
