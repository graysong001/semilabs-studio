@SpecTrace cap-ui-task-list v1.0.0
Feature: 任务列表展示与定位
  作为 开发者
  我想要 通过/tasks命令快速查看未完成任务并定位到文档
  以便 快速恢复工作上下文

  Background:
    Given VS Code Extension已加载
    And Chat Panel已打开

  # ========== Happy Path ==========
  
  Scenario: 输入/tasks展示任务列表
    Given 工作区包含3个未完成任务
    When 用户在输入框输入 "/tasks"
    And 按下Enter键
    Then 应该在Chat Panel中展示任务列表卡片
    And 卡片标题显示 "📋 未完成任务 (3个)"
    And 任务按智能排序展示
    And 每个任务显示优先级颜色标识（🔴/🟡/🟢）

  Scenario: 点击任务直接定位到文档
    Given 任务列表已展示
    And 任务 "kernel-001" 的文件路径存在
    When 用户点击任务 "kernel-001" 链接
    Then 应该在VS Code主编辑区打开该文件
    And 在新标签页打开（不覆盖当前文件）
    And 自动滚动到文件顶部（前10行可见）
    And 光标定位到第一行

  Scenario: 快速点击多个任务
    Given 任务列表已展示
    When 用户快速连续点击3个不同任务
    Then 应该打开3个新标签页
    And 每个标签页对应正确的任务文件
    And 每个标签页独立滚动到文件顶部
    And 不应该出现竞争条件或错误

  Scenario: 智能排序验证
    Given 存在以下任务
      | task_id      | priority | status      | blocked_count |
      | task-core    | HIGH     | PENDING     | 3             |
      | task-auth    | HIGH     | IN_PROGRESS | 0             |
      | task-ui      | MEDIUM   | PAUSED      | 0             |
    When 用户输入 "/tasks"
    Then 任务排序应该为 [task-auth, task-core, task-ui]
    And task-auth的score应该 >= task-core的score
    And task-core的score应该 >= task-ui的score

  # ========== Error Handling ==========

  Scenario: 工作区无未完成任务
    Given Chat Panel已打开
    And 工作区所有任务都已完成
    When 用户输入 "/tasks"
    Then 应该展示空状态卡片
    And 显示文本包含 "🎉 所有任务已完成！"
    And 不显示任务列表

  Scenario: 工作区未初始化
    Given Chat Panel已打开
    And 工作区不存在_projects目录
    When 用户输入 "/tasks"
    Then 应该展示友好提示
    And 显示文本包含 "💡 提示：未检测到任务目录"
    And 不应该报错

  Scenario: 任务文件不存在
    Given 任务列表已展示
    And 任务 "deleted-task" 的文件已被删除
    When 用户点击 "deleted-task" 链接
    Then 应该显示错误提示
    And 错误消息包含 "无法打开任务文档"

  Scenario: Frontmatter格式错误
    Given 存在任务文件 "spec-task-broken.md"
    And Frontmatter缺少必填字段 "task_id"
    When 系统扫描任务
    Then 应该跳过该文件
    And 记录警告日志
    And 继续扫描其他任务
    And 不应该中断整个扫描流程

  Scenario: VS Code API调用失败
    Given 任务列表已展示
    When VS Code文件系统API抛出异常
    Then 应该捕获错误
    And 显示友好的错误提示给用户
    And 记录错误日志

  # ========== Edge Cases ==========

  Scenario: 单个任务
    Given 工作区只有1个未完成任务
    When 用户输入 "/tasks"
    Then 应该展示任务列表
    And 标题显示 "📋 未完成任务 (1个)"
    And 任务信息正常显示

  Scenario: 大量任务（>20个）
    Given 工作区包含25个未完成任务
    When 用户输入 "/tasks"
    Then 应该展示所有25个任务
    And 扫描时间 < 2秒
    And Chat Panel支持滚动查看

  Scenario: 被依赖次数计算
    Given 存在以下任务
      | task_id      | dependencies                    |
      | task-auth    | cap-core: v1.0.0                |
      | task-ui      | cap-auth: v2.0.0                |
      | task-api     | cap-auth: v2.0.0                |
    And task-auth实现了cap-auth Spec
    When 系统计算task-auth的被依赖次数
    Then 应该识别到2个任务依赖cap-auth
    And task-auth的score增加 +20 (2 * 10)
    And task-auth排序优先级提升

  Scenario: 非命令输入处理
    Given Chat Panel已打开
    When 用户输入 "Hello, how are you?"
    Then 不应该触发/tasks命令
    And 应该识别为普通聊天消息
    And 正常发送到后端

  Scenario: /help命令
    Given Chat Panel已打开
    When 用户输入 "/help"
    Then 应该显示命令帮助列表
    And 包含 "/tasks - 显示未完成任务列表"
    And 包含 "/help - 显示帮助信息"
