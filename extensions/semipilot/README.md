# Semipilot Extension

> AI-Native Software Engineering - Spec-Driven Agent Squad for VS Code

## 📦 Phase 1 Week 1 Day 1 - IMessenger Integration

### ✅ Completed Tasks

1. **IMessenger Core** (200 lines) - Adapted from Continue (Apache 2.0)
   - `src/messenger/IMessenger.ts` - 核心消息协议
   - `src/messenger/SemilabsProtocol.ts` - Semilabs协议定义
   - `src/messenger/SseMessenger.ts` - HTTP/SSE通信层

2. **Extension Entry Point**
   - `src/extension.ts` - VS Code Extension激活入口
   - Hello World命令：`semipilot.openChat`

### 🚀 Quick Start

#### 1. Install Dependencies

```bash
cd extensions/semipilot
npm install
```

#### 2. Compile TypeScript

```bash
npm run compile
```

#### 3. Run in VS Code

1. Open `semilabs-studio` in VS Code
2. Press `F5` to launch Extension Development Host
3. In the new window, run command: `Semipilot: Open Chat`

### 🧪 Verification

**Expected Behavior**:
- Command `Semipilot: Open Chat` appears in Command Palette
- Clicking it shows "Semipilot Chat Panel (Coming Soon)"
- Background: Extension attempts to connect to Backend at `http://localhost:8080/api/v1`
- If Backend is running, displays "Domain Graph: X domains found"
- If Backend is down, displays error message

### 📁 Project Structure

```
extensions/semipilot/
├── src/
│   ├── messenger/
│   │   ├── IMessenger.ts              # 核心协议（从Continue复用）
│   │   ├── SemilabsProtocol.ts        # Semilabs协议定义
│   │   └── SseMessenger.ts            # HTTP/SSE通信
│   ├── context/                       # (Next: @file/@spec Context Providers)
│   ├── webview/                       # (Next: Chat Panel UI)
│   └── extension.ts                   # Extension入口
├── package.json
├── tsconfig.json
└── README.md
```

### 🔗 Related Specs

- [`spec-system-topology.md`](../../semilabs-squad/semilabs-specs/domain-infra/spec-system-topology.md) - Section 4.2: Extension Architecture
- [`cap-api-backend-ide-native.md`](../../semilabs-squad/semilabs-specs/capabilities/domain-core/cap-api-backend-ide-native.md) - Backend API Contract
- [`implementation-roadmap.md`](../../semilabs-squad/semilabs-specs/_projects/proj-002-ide-native/implementation-roadmap.md) - Phase 1 Week 1

### 📝 License

- IMessenger core adapted from [Continue](https://github.com/continuedev/continue) (Apache 2.0)
- Semipilot-specific code: Semilabs (Apache 2.0)

### 🐛 Known Issues

- TypeScript compilation errors expected until `npm install` is run
- SSE connection will fail until Backend implements `/sse/events` endpoint

### ⏭️ Next Steps (Phase 1 Week 1 Day 3-4)

- [ ] Implement TipTap Editor (from Continue)
- [ ] Implement @ Context Providers (@file, @folder, @code)
- [ ] Implement @spec Context Provider (custom)
- [ ] Build Chat Panel UI (React)
