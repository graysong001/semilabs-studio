const esbuild = require('esbuild');
const path = require('path');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',

  setup(build) {
    build.onStart(() => {
      console.log('[watch] build started');
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(`    ${location.file}:${location.line}:${location.column}:`);
      });
      console.log('[watch] build finished');
    });
  },
};

async function main() {
  const ctx = await esbuild.context({
    entryPoints: [
      'src/webview/index.tsx',
    ],
    bundle: true,
    format: 'iife',
    minify: production,
    sourcemap: false,  // 暂时禁用 sourcemap 以便调试
    sourcesContent: false,
    platform: 'browser',
    outfile: 'out/webview.js',
    external: ['vscode'],
    logLevel: 'info',
    loader: {
      '.css': 'text',
    },
    plugins: [
      esbuildProblemMatcherPlugin,
      {
        name: 'css-inline',
        setup(build) {
          build.onLoad({ filter: /\.css$/ }, async (args) => {
            const fs = require('fs');
            const css = await fs.promises.readFile(args.path, 'utf8');
            return {
              contents: `
                const style = document.createElement('style');
                style.textContent = ${JSON.stringify(css)};
                document.head.appendChild(style);
              `,
              loader: 'js',
            };
          });
        },
      },
    ],
  });
  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
