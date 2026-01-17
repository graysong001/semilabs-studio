/**
 * VS Code Extension E2E测试运行器
 */

import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    // Extension开发目录
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // 测试文件目录
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    // 下载并运行VS Code测试
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        '--disable-extensions', // 禁用其他扩展
        '--disable-gpu'
      ]
    });
  } catch (err) {
    console.error('Failed to run tests:', err);
    process.exit(1);
  }
}

main();
