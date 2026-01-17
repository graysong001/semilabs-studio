#!/bin/bash

# Semipilot Chat Panel 自动化测试脚本
# 执行冒烟测试和边界测试，输出详细报告

# 不使用 set -e，继续执行所有测试
set +e

echo "========================================"
echo "  Semipilot Chat Panel 自动化测试"
echo "========================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试结果函数
pass_test() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

fail_test() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    echo -e "${RED}   原因: $2${NC}"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

warn_test() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
}

# ============================================
# 第一部分：编译检查
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "第一部分：编译检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# TC-COMPILE-001: TypeScript 编译
echo "[TC-COMPILE-001] TypeScript 编译检查..."
if npm run compile > /tmp/compile.log 2>&1; then
    if grep -q "error" /tmp/compile.log; then
        fail_test "TC-COMPILE-001: TypeScript 编译" "编译输出包含 error"
        cat /tmp/compile.log | grep "error" | head -5
    else
        pass_test "TC-COMPILE-001: TypeScript 编译成功"
    fi
else
    fail_test "TC-COMPILE-001: TypeScript 编译" "编译命令执行失败"
    cat /tmp/compile.log | tail -10
fi
echo ""

# TC-COMPILE-002: Webview 编译
echo "[TC-COMPILE-002] Webview 编译检查..."
if npm run compile:webview > /tmp/compile-webview.log 2>&1; then
    if grep -q "error" /tmp/compile-webview.log; then
        fail_test "TC-COMPILE-002: Webview 编译" "编译输出包含 error"
        cat /tmp/compile-webview.log | grep "error" | head -5
    else
        pass_test "TC-COMPILE-002: Webview 编译成功"
    fi
else
    fail_test "TC-COMPILE-002: Webview 编译" "编译命令执行失败"
    cat /tmp/compile-webview.log | tail -10
fi
echo ""

# ============================================
# 第二部分：文件完整性检查
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "第二部分：文件完整性检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# TC-FILE-001: extension.js 存在性
echo "[TC-FILE-001] 检查 extension.js..."
if [ -f "out/extension.js" ]; then
    FILE_SIZE=$(ls -lh out/extension.js | awk '{print $5}')
    if [ -s "out/extension.js" ]; then
        pass_test "TC-FILE-001: extension.js 存在 ($FILE_SIZE)"
    else
        fail_test "TC-FILE-001: extension.js 存在" "文件为空"
    fi
else
    fail_test "TC-FILE-001: extension.js 存在" "文件不存在"
fi
echo ""

# TC-FILE-002: webview.js 存在性
echo "[TC-FILE-002] 检查 webview.js..."
if [ -f "out/webview.js" ]; then
    FILE_SIZE=$(ls -lh out/webview.js | awk '{print $5}')
    # 检查文件大小是否大于 1MB
    FILE_SIZE_BYTES=$(stat -f%z out/webview.js 2>/dev/null || stat -c%s out/webview.js 2>/dev/null)
    if [ "$FILE_SIZE_BYTES" -gt 1000000 ]; then
        pass_test "TC-FILE-002: webview.js 存在且大小正常 ($FILE_SIZE)"
    else
        fail_test "TC-FILE-002: webview.js 存在" "文件过小 ($FILE_SIZE)，可能编译不完整"
    fi
else
    fail_test "TC-FILE-002: webview.js 存在" "文件不存在"
fi
echo ""

# ============================================
# 第三部分：React 打包检查
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "第三部分：React 打包检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# TC-REACT-001: React 是否打包
echo "[TC-REACT-001] 检查 React 是否打包到 webview.js..."
REACT_COUNT=$(grep -o "React" out/webview.js | wc -l | tr -d ' ')
if [ "$REACT_COUNT" -gt 100 ]; then
    pass_test "TC-REACT-001: React 已打包 (出现 $REACT_COUNT 次)"
else
    fail_test "TC-REACT-001: React 打包" "React 出现次数过少 ($REACT_COUNT 次)"
fi
echo ""

# TC-REACT-002: TipTap 是否打包
echo "[TC-REACT-002] 检查 TipTap 是否打包到 webview.js..."
TIPTAP_COUNT=$(grep -o "tiptap" out/webview.js | wc -l | tr -d ' ')
if [ "$TIPTAP_COUNT" -gt 10 ]; then
    pass_test "TC-REACT-002: TipTap 已打包 (出现 $TIPTAP_COUNT 次)"
else
    fail_test "TC-REACT-002: TipTap 打包" "TipTap 出现次数过少 ($TIPTAP_COUNT 次)"
fi
echo ""

# ============================================
# 第四部分：CSS 内联检查
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "第四部分：CSS 内联检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# TC-CSS-001: CSS 是否内联
echo "[TC-CSS-001] 检查 CSS 是否内联到 webview.js..."
CSS_COUNT=$(grep -o "font-family" out/webview.js | wc -l | tr -d ' ')
if [ "$CSS_COUNT" -gt 3 ]; then
    pass_test "TC-CSS-001: CSS 已内联 (font-family 出现 $CSS_COUNT 次)"
else
    fail_test "TC-CSS-001: CSS 内联" "CSS 样式缺失 (font-family 出现 $CSS_COUNT 次)"
fi
echo ""

# TC-CSS-002: 关键样式类检查
echo "[TC-CSS-002] 检查关键 CSS 类..."
CRITICAL_CLASSES=("app-container" "input-container" "toolbar-send-btn" "tiptap-editor-wrapper")
MISSING_CLASSES=()

for CLASS in "${CRITICAL_CLASSES[@]}"; do
    if grep -q "$CLASS" out/webview.js; then
        echo -e "   ${GREEN}✓${NC} .$CLASS 存在"
    else
        echo -e "   ${RED}✗${NC} .$CLASS 缺失"
        MISSING_CLASSES+=("$CLASS")
    fi
done

if [ ${#MISSING_CLASSES[@]} -eq 0 ]; then
    pass_test "TC-CSS-002: 所有关键 CSS 类存在"
else
    fail_test "TC-CSS-002: 关键 CSS 类检查" "缺失: ${MISSING_CLASSES[*]}"
fi
echo ""

# ============================================
# 第五部分：代码完整性检查
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "第五部分：代码完整性检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# TC-CODE-001: forwardRef 实现检查
echo "[TC-CODE-001] 检查 TipTapEditor forwardRef 实现..."
if grep -q "React.forwardRef" src/webview/TipTapEditor.tsx; then
    if grep -q "useImperativeHandle" src/webview/TipTapEditor.tsx; then
        pass_test "TC-CODE-001: forwardRef 和 useImperativeHandle 正确实现"
    else
        fail_test "TC-CODE-001: forwardRef 实现" "缺少 useImperativeHandle"
    fi
else
    fail_test "TC-CODE-001: forwardRef 实现" "未使用 React.forwardRef"
fi
echo ""

# TC-CODE-002: onContentChange 回调检查
echo "[TC-CODE-002] 检查 onContentChange 回调实现..."
if grep -q "onContentChange" src/webview/TipTapEditor.tsx; then
    if grep -q "onContentChange\?" src/webview/App.tsx; then
        pass_test "TC-CODE-002: onContentChange 回调已实现"
    else
        fail_test "TC-CODE-002: onContentChange 回调" "App.tsx 未使用回调"
    fi
else
    fail_test "TC-CODE-002: onContentChange 回调" "TipTapEditor 未定义回调"
fi
echo ""

# TC-CODE-003: hasContent 状态追踪检查
echo "[TC-CODE-003] 检查 hasContent 状态追踪..."
if grep -q "const \[hasContent, setHasContent\]" src/webview/App.tsx; then
    if grep -q "disabled={!hasContent}" src/webview/App.tsx; then
        pass_test "TC-CODE-003: hasContent 状态追踪正确实现"
    else
        fail_test "TC-CODE-003: hasContent 状态追踪" "发送按钮未使用 hasContent"
    fi
else
    fail_test "TC-CODE-003: hasContent 状态追踪" "App.tsx 未定义 hasContent 状态"
fi
echo ""

# ============================================
# 第六部分：CSS 布局检查（边界场景）
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "第六部分：CSS 布局检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# TC-CSS-003: toolbar-right flex-shrink 检查
echo "[TC-CSS-003] 检查 toolbar-right flex-shrink 设置..."
if grep -A 5 "\.toolbar-right" src/webview/styles.css | grep -q "flex-shrink: 0"; then
    pass_test "TC-CSS-003: toolbar-right 正确设置 flex-shrink: 0"
else
    fail_test "TC-CSS-003: toolbar-right flex-shrink" "未设置 flex-shrink: 0，窄屏时按钮会消失"
fi
echo ""

# TC-CSS-004: toolbar-send-btn min-width 检查
echo "[TC-CSS-004] 检查 toolbar-send-btn min-width 设置..."
if grep -B 2 -A 5 "min-width: 32px" src/webview/styles.css | grep -q "toolbar-send-btn"; then
    pass_test "TC-CSS-004: toolbar-send-btn 正确设置 min-width: 32px"
else
    fail_test "TC-CSS-004: toolbar-send-btn min-width" "未设置 min-width: 32px，可能导致按钮过小"
fi
echo ""

# TC-CSS-005: disabled 状态样式检查
echo "[TC-CSS-005] 检查发送按钮 disabled 状态样式..."
if grep -A 15 "\.toolbar-send-btn" src/webview/styles.css | grep -q ":disabled"; then
    pass_test "TC-CSS-005: 发送按钮定义了 :disabled 状态样式"
else
    fail_test "TC-CSS-005: 发送按钮 disabled 样式" "未定义 :disabled 状态"
fi
echo ""

# ============================================
# 第七部分：VS Code API 检查
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "第七部分：VS Code API 检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# TC-API-001: acquireVsCodeApi 单例检查
echo "[TC-API-001] 检查 acquireVsCodeApi 单例模式..."
# 只匹配实际调用，排除注释中的文本
ACQUIRE_COUNT=$(grep -r "acquireVsCodeApi()" src/webview/*.tsx | grep -v "//" | grep -v "\*" | wc -l | tr -d ' ')
if [ "$ACQUIRE_COUNT" -eq 1 ]; then
    pass_test "TC-API-001: acquireVsCodeApi 只调用一次（单例模式，不含注释）"
else
    fail_test "TC-API-001: acquireVsCodeApi 单例" "调用了 $ACQUIRE_COUNT 次，应该只调用 1 次"
fi
echo ""

# TC-API-002: window.__vscodeApi 使用检查
echo "[TC-API-002] 检查 window.__vscodeApi 全局变量..."
if grep -q "window.__vscodeApi" src/webview/index.tsx; then
    if grep -q "window.__vscodeApi" src/webview/App.tsx; then
        pass_test "TC-API-002: 正确使用 window.__vscodeApi 全局变量"
    else
        warn_test "TC-API-002: App.tsx 未从 window.__vscodeApi 读取"
    fi
else
    fail_test "TC-API-002: window.__vscodeApi" "index.tsx 未保存到全局变量"
fi
echo ""

# ============================================
# 第八部分：SSE Messenger 检查
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "第八部分：SSE Messenger 检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# TC-SSE-001: autoConnect 配置检查
echo "[TC-SSE-001] 检查 SseMessenger autoConnect 配置..."
if grep -A 5 "new SseMessenger" src/extension.ts | grep -q "autoConnect: false"; then
    pass_test "TC-SSE-001: SseMessenger 设置 autoConnect: false"
else
    fail_test "TC-SSE-001: SseMessenger autoConnect" "未设置 autoConnect: false，会自动连接后端"
fi
echo ""

# ============================================
# 第九部分：HTML 生成检查
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "第九部分：HTML 生成检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# TC-HTML-001: <title> 标签移除检查
echo "[TC-HTML-001] 检查 HTML <title> 标签是否移除..."
if grep -q "<title>" src/webview/SemipilotWebviewProvider.ts; then
    fail_test "TC-HTML-001: <title> 标签移除" "仍然包含 <title> 标签，会重复显示"
else
    pass_test "TC-HTML-001: <title> 标签已移除"
fi
echo ""

# TC-HTML-002: CSP console.log 移除检查
echo "[TC-HTML-002] 检查 CSP console.log 是否移除..."
if grep "console.log.*CSP" src/webview/SemipilotWebviewProvider.ts; then
    fail_test "TC-HTML-002: CSP console.log 移除" "仍然输出 CSP，会导致语法错误"
else
    pass_test "TC-HTML-002: CSP console.log 已移除"
fi
echo ""

# ============================================
# 测试报告总结
# ============================================
echo ""
echo "========================================"
echo "  测试报告总结"
echo "========================================"
echo ""
echo "总测试数: $TOTAL_TESTS"
echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
echo -e "${RED}失败: $FAILED_TESTS${NC}"
echo ""

# 计算通过率
if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo "通过率: $PASS_RATE%"
    echo ""
    
    if [ $PASS_RATE -eq 100 ]; then
        echo -e "${GREEN}🎉 所有测试通过！代码质量优秀！${NC}"
        exit 0
    elif [ $PASS_RATE -ge 90 ]; then
        echo -e "${YELLOW}⚠️  部分测试失败，但整体质量良好${NC}"
        exit 1
    elif [ $PASS_RATE -ge 70 ]; then
        echo -e "${YELLOW}⚠️  多项测试失败，需要修复${NC}"
        exit 1
    else
        echo -e "${RED}❌ 大量测试失败，代码存在严重问题！${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ 没有执行任何测试！${NC}"
    exit 1
fi
