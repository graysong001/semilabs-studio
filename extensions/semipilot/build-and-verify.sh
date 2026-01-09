#!/bin/bash

# Phase 1 Week 1 Day 4 - Semipilot Extension 构建与验证脚本
# @SpecTrace cap-ui-semipilot

set -e  # Exit on error

echo "================================"
echo "Semipilot Extension - Build & Verify"
echo "Phase 1 Week 1 Day 4"
echo "================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/../.."

echo "📁 Project paths:"
echo "  - Script dir: $SCRIPT_DIR"
echo "  - Project root: $PROJECT_ROOT"
echo ""

# Step 1: Check Node.js environment
echo "🔍 Step 1: Checking Node.js environment..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "  ✅ Node.js found: $NODE_VERSION"
else
    echo "  ❌ Node.js not found!"
    echo "  Please install Node.js 22.x:"
    echo "    - Using nvm: nvm install 22 && nvm use 22"
    echo "    - Or download from: https://nodejs.org/"
    exit 1
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "  ✅ npm found: $NPM_VERSION"
else
    echo "  ❌ npm not found!"
    exit 1
fi
echo ""

# Step 2: Install dependencies
echo "📦 Step 2: Installing dependencies..."
cd "$SCRIPT_DIR"
if [ -d "node_modules" ]; then
    echo "  ⚠️  node_modules already exists, skipping npm install"
    echo "  (run 'rm -rf node_modules' to force reinstall)"
else
    echo "  Running: npm install..."
    npm install
    echo "  ✅ Dependencies installed"
fi
echo ""

# Step 3: Compile TypeScript
echo "🔨 Step 3: Compiling TypeScript..."
echo "  Running: npm run compile..."
npm run compile

if [ -d "out" ]; then
    echo "  ✅ TypeScript compiled successfully"
    echo "  Output directory: ./out"
    
    # Check key files
    if [ -f "out/extension.js" ]; then
        echo "    ✅ extension.js"
    else
        echo "    ❌ extension.js not found"
        exit 1
    fi
    
    if [ -f "out/context/SpecContextProvider.js" ]; then
        echo "    ✅ context/SpecContextProvider.js"
    else
        echo "    ❌ context/SpecContextProvider.js not found"
        exit 1
    fi
    
    if [ -f "out/webview/SemipilotWebviewProvider.js" ]; then
        echo "    ✅ webview/SemipilotWebviewProvider.js"
    else
        echo "    ❌ webview/SemipilotWebviewProvider.js not found"
        exit 1
    fi
else
    echo "  ❌ Compilation failed - 'out' directory not found"
    exit 1
fi
echo ""

# Step 4: Check for TypeScript errors
echo "🔍 Step 4: Checking for TypeScript errors..."
if npm run compile 2>&1 | grep -q "error TS"; then
    echo "  ⚠️  TypeScript errors found (check above)"
    echo "  You can still proceed, but fix them before production"
else
    echo "  ✅ No TypeScript errors"
fi
echo ""

# Step 5: Verify package.json configuration
echo "📋 Step 5: Verifying package.json configuration..."
if grep -q "\"main\": \"./out/extension.js\"" package.json; then
    echo "  ✅ Main entry point: ./out/extension.js"
else
    echo "  ❌ Main entry point not configured correctly"
    exit 1
fi

if grep -q "\"semipilot.chatView\"" package.json; then
    echo "  ✅ Webview view: semipilot.chatView"
else
    echo "  ❌ Webview view not configured"
    exit 1
fi

if grep -q "\"semipilot.openChat\"" package.json; then
    echo "  ✅ Command: semipilot.openChat"
else
    echo "  ❌ Command not configured"
    exit 1
fi
echo ""

# Step 6: Check workspace structure
echo "🗂️  Step 6: Checking workspace structure..."
WORKSPACE_ROOT="$PROJECT_ROOT"
SPECS_DIR="$WORKSPACE_ROOT/semilabs-squad/semilabs-specs"

if [ -d "$SPECS_DIR" ]; then
    echo "  ✅ Specs directory found: $SPECS_DIR"
    
    # Count spec files
    CAP_COUNT=$(find "$SPECS_DIR" -name "cap-*.md" -type f 2>/dev/null | wc -l | xargs)
    SPEC_COUNT=$(find "$SPECS_DIR" -name "spec-*.md" -type f 2>/dev/null | wc -l | xargs)
    INTENT_COUNT=$(find "$SPECS_DIR" -name "intent_*.md" -type f 2>/dev/null | wc -l | xargs)
    
    echo "  📊 Spec files found:"
    echo "    - cap-*.md: $CAP_COUNT files"
    echo "    - spec-*.md: $SPEC_COUNT files"
    echo "    - intent_*.md: $INTENT_COUNT files"
    echo "    - Total: $((CAP_COUNT + SPEC_COUNT + INTENT_COUNT)) files"
else
    echo "  ⚠️  Specs directory not found: $SPECS_DIR"
    echo "  SpecContextProvider will work but won't find any specs"
fi
echo ""

# Step 7: Generate launch configuration
echo "🚀 Step 7: Checking VS Code launch configuration..."
VSCODE_DIR="$PROJECT_ROOT/.vscode"
LAUNCH_JSON="$VSCODE_DIR/launch.json"

if [ -f "$LAUNCH_JSON" ]; then
    echo "  ✅ launch.json already exists: $LAUNCH_JSON"
else
    echo "  ⚠️  launch.json not found, would need to be created manually"
fi
echo ""

# Summary
echo "================================"
echo "✅ Build & Verification Complete!"
echo "================================"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Open VS Code in the semilabs-studio directory:"
echo "   $ cd $PROJECT_ROOT"
echo "   $ code ."
echo ""
echo "2. Press F5 to start Extension Development Host"
echo ""
echo "3. In the new window:"
echo "   - Look for Semipilot icon in Activity Bar (left sidebar)"
echo "   - Click the icon to open Chat Panel"
echo "   - Open Developer Tools (Help → Toggle Developer Tools)"
echo "   - Check Console for logs:"
echo "     [Semipilot] Activating extension..."
echo "     [ContextProviderManager] Initialized with providers: file, spec"
echo "     [SpecContextProvider] Building index..."
echo "     [SpecContextProvider] Index built: X specs found"
echo ""
echo "4. Verify checklist (see README.md):"
echo "   □ Extension loads without errors"
echo "   □ Semipilot icon appears in Activity Bar"
echo "   □ Chat Panel opens"
echo "   □ SpecContextProvider scans specs directory"
echo ""
echo "📚 Documentation:"
echo "   - README.md: $SCRIPT_DIR/README.md"
echo "   - Implementation Summary: $WORKSPACE_ROOT/semilabs-squad/semilabs-specs/_projects/proj-002-ide-native/PHASE1_WEEK1_DAY3-4_SUMMARY.md"
echo ""
echo "Happy coding! 🎉"
