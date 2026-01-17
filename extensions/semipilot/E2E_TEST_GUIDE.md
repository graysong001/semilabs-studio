# Slice 1 Extension 端到端测试指南

## 前置条件

1. ✅ Backend运行：http://localhost:8080
2. ✅ PostgreSQL运行：semilabs-postgres容器
3. ✅ Extension编译完成：`npm run compile && npm run compile:webview`

## 测试步骤

### 1. 启动Extension开发模式

在VS Code中：
1. 打开 `semilabs-studio/extensions/semipilot` 文件夹
2. 按 `F5` 或选择 "Run Extension" launch配置
3. 等待Extension Host窗口打开

### 2. 打开Chat Panel

在Extension Host窗口中：
1. 按 `Cmd+Shift+P` 打开命令面板
2. 输入 "Semipilot: Open Chat"
3. 或点击侧边栏Semipilot图标

**预期结果**：
- ✅ Chat Panel在侧边栏显示
- ✅ 显示 "SEMIPILOT: CHAT" 标题
- ✅ 显示空状态 "Build with Semipilot"

### 3. 发送第一条消息

在Chat Panel输入框中：
1. 输入：`你好，我是测试用户`
2. 按 `Enter` 发送

**预期结果**：
- ✅ 用户消息立即显示在消息列表
- ✅ 1-2秒后显示Agent回复
- ✅ Agent回复内容包含 "Mock ChatModel Response"

**检查点**：
- 用户消息和Agent回复都显示在聊天区域
- 消息样式正确（用户/助手区分明显）
- 无JavaScript错误（打开Developer Tools查看Console）

### 4. 发送多轮对话

继续输入：
1. `请介绍Slice 1的功能`
2. `谢谢`

**预期结果**：
- ✅ 每条消息都能正常发送和接收
- ✅ 消息列表正确滚动
- ✅ 历史消息保留在界面上

### 5. 验证Backend通信

在Backend日志中查看：
```bash
cd /Users/chenguosong/dev/projects/semilabs-vscode-github/semilabs-squad/semilabs-server/semilabs-application
tail -f target/spring-boot.log | grep SimpleChatController
```

**预期日志**：
```
[SimpleChatController] Creating session: title=Semipilot Chat, specId=cap-ui-semipilot
[SimpleChatController] Sending message: sessionId=xxx, content length=xxx
```

### 6. 验证数据库持久化

连接PostgreSQL：
```bash
docker exec -it semilabs-postgres psql -U semilabs -d semilabs_squad
```

查询会话和消息：
```sql
SELECT id, title, spec_id, created_at FROM chat_sessions ORDER BY created_at DESC LIMIT 3;
SELECT id, role, persona, LEFT(content, 50) as content_preview FROM chat_messages ORDER BY created_at DESC LIMIT 6;
```

**预期结果**：
- ✅ 每次测试创建新的会话记录
- ✅ 用户消息和Agent回复都已保存
- ✅ role字段正确（user/assistant）
- ✅ persona字段为 "poe"

### 7. 错误处理测试

**测试场景A：Backend停止**
1. 停止Backend：`pkill -f SemilabsApplication`
2. 在Chat Panel发送消息

**预期结果**：
- ✅ 显示错误消息："❗ 错误：..."
- ✅ 错误提示包含连接失败信息

**测试场景B：恢复Backend**
1. 重启Backend：`cd semilabs-application && mvn spring-boot:run`
2. 在Chat Panel再次发送消息

**预期结果**：
- ✅ 消息正常发送和接收
- ✅ 功能恢复正常

## 验收标准

- ✅ Chat Panel UI正常显示
- ✅ 用户消息立即显示
- ✅ Agent回复1-2秒内返回
- ✅ 多轮对话流畅
- ✅ Backend日志正确记录
- ✅ 数据库持久化验证通过
- ✅ 错误处理优雅降级

## 已知限制（Slice 1）

1. **每次发送消息创建新会话**
   - 原因：未实现会话管理
   - 计划：Slice 2修复

2. **无SSE流式响应**
   - 原因：Slice 1使用同步API
   - 计划：Slice 3实现

3. **JSONB字段使用TEXT**
   - 原因：JPA Converter未实现
   - 计划：Slice 2修复

4. **无@spec上下文注入**
   - 原因：SpecContextProvider未集成
   - 计划：Slice 2实现

## 故障排查

### Extension未启动
- 检查：`npm run compile` 是否成功
- 检查：out目录是否存在compiled文件

### Chat Panel不显示
- 检查：F5启动的Extension Host窗口是否正确
- 检查：Developer Tools Console是否有错误

### 消息发送失败
- 检查：Backend是否运行（http://localhost:8080/api/v1/chat/sessions）
- 检查：Extension Console是否有网络错误
- 检查：Backend日志是否有异常

### 空响应或错误响应
- 检查：Backend DASHSCOPE_API_KEY是否配置
- 检查：数据库连接是否正常
- 检查：Backend日志的详细错误信息
