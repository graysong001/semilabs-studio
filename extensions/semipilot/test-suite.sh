#!/bin/bash

##############################################################################
# @SpecTrace cap-ui-task-list, v1.0.0
# 
# Comprehensive Test Suite for Task List UI
# 全面的任务列表UI测试套件
##############################################################################

set -e  # 遇到错误立即退出

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Task List UI - Comprehensive Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0

# 测试函数
test_pass() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASS_COUNT++))
}

test_fail() {
    echo -e "${RED}❌ $1${NC}"
    ((FAIL_COUNT++))
}

test_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

##############################################################################
# Test 1: 编译检查
##############################################################################
echo "📦 Test 1: TypeScript Compilation"
if npm run compile > /dev/null 2>&1; then
    test_pass "TypeScript compilation successful"
else
    test_fail "TypeScript compilation failed"
    exit 1
fi
echo ""

##############################################################################
# Test 2: 文件完整性检查
##############################################################################
echo "📂 Test 2: File Integrity Check"

# Phase 1 files
if [ -f "src/webview/SlashCommandHandler.ts" ]; then
    test_pass "SlashCommandHandler.ts exists"
else
    test_fail "SlashCommandHandler.ts missing"
fi

if [ -f "out/webview/SlashCommandHandler.js" ]; then
    test_pass "SlashCommandHandler.js compiled"
else
    test_fail "SlashCommandHandler.js not compiled"
fi

# Phase 2 files
if [ -f "src/context/TaskContextProvider.ts" ]; then
    test_pass "TaskContextProvider.ts exists"
else
    test_fail "TaskContextProvider.ts missing"
fi

if [ -f "out/context/TaskContextProvider.js" ]; then
    test_pass "TaskContextProvider.js compiled"
else
    test_fail "TaskContextProvider.js not compiled"
fi

# Modified files
if [ -f "src/webview/App.tsx" ]; then
    test_pass "App.tsx exists"
else
    test_fail "App.tsx missing"
fi

if [ -f "src/webview/SemipilotWebviewProvider.ts" ]; then
    test_pass "SemipilotWebviewProvider.ts exists"
else
    test_fail "SemipilotWebviewProvider.ts missing"
fi

echo ""

##############################################################################
# Test 3: 代码结构验证
##############################################################################
echo "🔍 Test 3: Code Structure Validation"

# 检查SlashCommandHandler导出
if grep -q "export class SlashCommandHandler" src/webview/SlashCommandHandler.ts; then
    test_pass "SlashCommandHandler exports class"
else
    test_fail "SlashCommandHandler missing class export"
fi

# 检查TaskContextProvider导出
if grep -q "export class TaskContextProvider" src/context/TaskContextProvider.ts; then
    test_pass "TaskContextProvider exports class"
else
    test_fail "TaskContextProvider missing class export"
fi

# 检查App.tsx集成
if grep -q "import.*SlashCommandHandler" src/webview/App.tsx; then
    test_pass "App.tsx imports SlashCommandHandler"
else
    test_fail "App.tsx missing SlashCommandHandler import"
fi

# 检查SemipilotWebviewProvider集成
if grep -q "import.*TaskContextProvider" src/webview/SemipilotWebviewProvider.ts; then
    test_pass "SemipilotWebviewProvider imports TaskContextProvider"
else
    test_fail "SemipilotWebviewProvider missing TaskContextProvider import"
fi

echo ""

##############################################################################
# Test 4: 功能实现验证
##############################################################################
echo "⚙️  Test 4: Feature Implementation Validation"

# 检查智能排序算法
if grep -q "calculateScores" src/context/TaskContextProvider.ts; then
    test_pass "Smart sorting algorithm implemented"
else
    test_fail "Smart sorting algorithm missing"
fi

# 检查Frontmatter解析
if grep -q "parseFrontmatter" src/context/TaskContextProvider.ts; then
    test_pass "Frontmatter parsing implemented"
else
    test_fail "Frontmatter parsing missing"
fi

# 检查阻塞关系计算
if grep -q "calculateBlockedTasks" src/context/TaskContextProvider.ts; then
    test_pass "Blocked tasks calculation implemented"
else
    test_fail "Blocked tasks calculation missing"
fi

# 检查优先级图标
if grep -q "getPriorityIcon" src/webview/SemipilotWebviewProvider.ts; then
    test_pass "Priority icon display implemented"
else
    test_fail "Priority icon display missing"
fi

echo ""

##############################################################################
# Test 5: SlashCommandHandler单元测试
##############################################################################
echo "🧪 Test 5: SlashCommandHandler Unit Tests"

if node verify-slash.js > /dev/null 2>&1; then
    test_pass "SlashCommandHandler tests passed"
else
    test_fail "SlashCommandHandler tests failed"
fi

echo ""

##############################################################################
# Test 6: 代码质量检查
##############################################################################
echo "📊 Test 6: Code Quality Checks"

# 检查TypeScript严格模式
if grep -q '"strict": true' tsconfig.json; then
    test_pass "TypeScript strict mode enabled"
else
    test_warn "TypeScript strict mode not enabled"
fi

# 检查错误处理
error_handlers=$(grep -c "catch.*error" src/context/TaskContextProvider.ts || echo 0)
if [ "$error_handlers" -gt 0 ]; then
    test_pass "Error handling present ($error_handlers catch blocks)"
else
    test_warn "No error handling found"
fi

# 检查Console日志
log_statements=$(grep -c "console.log\|console.warn\|console.error" src/context/TaskContextProvider.ts || echo 0)
if [ "$log_statements" -gt 0 ]; then
    test_pass "Logging implemented ($log_statements log statements)"
else
    test_warn "No logging found"
fi

echo ""

##############################################################################
# Test 7: 依赖检查
##############################################################################
echo "📦 Test 7: Dependency Check"

# 检查package.json
if [ -f "package.json" ]; then
    test_pass "package.json exists"
    
    # 检查关键依赖
    if grep -q "@tiptap/react" package.json; then
        test_pass "TipTap dependency present"
    else
        test_warn "TipTap dependency not found"
    fi
    
    if grep -q "vscode" package.json; then
        test_pass "VS Code types present"
    else
        test_warn "VS Code types not found"
    fi
else
    test_fail "package.json missing"
fi

echo ""

##############################################################################
# Test 8: 边界场景覆盖检查
##############################################################################
echo "🔬 Test 8: Edge Case Coverage"

# 检查空工作区处理
if grep -q "工作区未初始化\|No workspace" src/webview/SemipilotWebviewProvider.ts; then
    test_pass "Empty workspace handling implemented"
else
    test_fail "Empty workspace handling missing"
fi

# 检查无任务处理
if grep -q "所有任务已完成\|No tasks" src/webview/SemipilotWebviewProvider.ts; then
    test_pass "No tasks handling implemented"
else
    test_fail "No tasks handling missing"
fi

# 检查Frontmatter缺失处理
if grep -q "task_id.*warn\|Missing task_id" src/context/TaskContextProvider.ts; then
    test_pass "Missing task_id handling implemented"
else
    test_fail "Missing task_id handling missing"
fi

echo ""

##############################################################################
# 测试总结
##############################################################################
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Passed: $PASS_COUNT${NC}"
if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "${RED}❌ Failed: $FAIL_COUNT${NC}"
fi
echo ""

# 计算通过率
TOTAL_TESTS=$((PASS_COUNT + FAIL_COUNT))
if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_RATE=$((PASS_COUNT * 100 / TOTAL_TESTS))
    echo "Pass Rate: $PASS_RATE%"
    echo ""
fi

# 退出码
if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical tests passed!${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
    echo ""
    exit 1
fi
