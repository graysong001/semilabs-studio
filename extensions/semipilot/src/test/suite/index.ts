/**
 * Mocha测试套件入口
 */

import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

export async function run(): Promise<void> {
  // 创建Mocha测试实例
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 10000
  });

  const testsRoot = path.resolve(__dirname, '..');

  try {
    // 使用async/await方式调用glob
    const files = await glob('**/**.test.js', { cwd: testsRoot });
    
    // 添加测试文件到测试套件
    files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

    // 运行测试
    return new Promise<void>((resolve, reject) => {
      mocha.run((failures: number) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    });
  } catch (err) {
    throw err;
  }
}
