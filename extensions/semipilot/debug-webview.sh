#!/bin/bash

# Semipilot Webview 快速诊断脚本

cd /Users/xingjian/work/projects/semilabs-ws/semilabs-studio/extensions/semipilot

echo "🔍 Semipilot Webview 诊断"
echo "========================"
echo ""

echo "1️⃣  检查 webview.js 文件..."
if [ -f "out/webview.js" ]; then
    size=$(du -h out/webview.js | cut -f1)
    echo "   ✅ 文件存在: $size"
else
    echo "   ❌ 文件不存在！"
    exit 1
fi

echo ""
echo "2️⃣  检查 React 打包..."
react_count=$(grep -o "React" out/webview.js | wc -l | tr -d ' ')
echo "   React 出现次数: $react_count"
if [ "$react_count" -gt 100 ]; then
    echo "   ✅ React 已正确打包"
else
    echo "   ❌ React 可能未正确打包"
fi

echo ""
echo "3️⃣  检查 CSS 内联..."
css_count=$(grep -o "font-family" out/webview.js | wc -l | tr -d ' ')
echo "   CSS 样式出现次数: $css_count"
if [ "$css_count" -gt 0 ]; then
    echo "   ✅ CSS 已内联到 JS"
else
    echo "   ⚠️  CSS 可能未正确内联"
fi

echo ""
echo "4️⃣  检查打包内容摘要..."
echo "   - ReactDOM: $(grep -o "ReactDOM" out/webview.js | head -1)"
echo "   - TipTap: $(grep -o "tiptap" out/webview.js | head -1)"
echo "   - acquireVsCodeApi: $(grep -o "acquireVsCodeApi" out/webview.js | head -1)"

echo ""
echo "5️⃣  重新编译..."
npm run compile:webview

echo ""
echo "========================"
echo "✅ 诊断完成！"
echo ""
echo "📋 下一步操作:"
echo "   1. 在 Extension Development Host 中按 Cmd+R 重新加载"
echo "   2. 按 Cmd+Shift+P → 输入 'Developer: Open Webview Developer Tools'"
echo "   3. 选择 'Semipilot Chat' webview"
echo "   4. 查看 Console 标签页的错误信息"
echo ""
