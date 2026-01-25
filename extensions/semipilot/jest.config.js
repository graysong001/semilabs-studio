/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/webview'],
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    'SemipilotWebviewProvider.test.ts' // 该测试需要 VS Code Extension Host 环境
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      isolatedModules: true,
    }],
  },
  collectCoverageFrom: [
    'src/webview/**/*.{ts,tsx}',
    '!src/webview/**/*.test.{ts,tsx}',
    '!src/webview/**/*.d.ts',
    '!src/webview/index.tsx'
  ],
};
