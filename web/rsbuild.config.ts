import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig, loadEnv } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss'
import { tanstackRouter } from '@tanstack/router-plugin/rspack'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ envMode }) => {
  const env = loadEnv({ mode: envMode, prefixes: ['VITE_'] })
  const serverUrl =
    process.env.VITE_REACT_APP_SERVER_URL ||
    env.rawPublicVars.VITE_REACT_APP_SERVER_URL ||
    'http://localhost:3001'
  const devPort =
    Number(process.env.VITE_DEV_PORT || env.rawPublicVars.VITE_DEV_PORT) || 5173

  const isProd = envMode === 'production'
  const devProxy = Object.fromEntries(
    (['/api', '/v1', '/mj', '/pg'] as const).map((key) => [
      key,
      { target: serverUrl, changeOrigin: true },
    ])
  ) as Record<string, { target: string; changeOrigin: boolean }>

  return {
    plugins: [pluginReact(), pluginTailwindcss({ optimize: false })],
    // Rsbuild 2：替代已弃用的 performance.chunkSplit（与 RSPack 2 对齐）
    splitChunks: {
      preset: 'default',
      cacheGroups: {
        'vendor-react': {
          test: /node_modules[\\/](react|react-dom)[\\/]/,
          name: 'vendor-react',
          chunks: 'all',
          priority: 0,
          enforce: true,
        },
        'vendor-ui-primitives': {
          test: /node_modules[\\/](@base-ui|@radix-ui)[\\/]/,
          name: 'vendor-ui-primitives',
          chunks: 'all',
          priority: 0,
          enforce: true,
        },
        'vendor-tanstack': {
          test: /node_modules[\\/]@tanstack[\\/]/,
          name: 'vendor-tanstack',
          chunks: 'all',
          priority: 0,
          enforce: true,
        },
      },
    },
    source: {
      entry: {
        index: './src/main.tsx',
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    html: {
      template: './index.html',
      favicon: './public/favicon.ico',
    },
    server: {
      host: '0.0.0.0',
      port: devPort,
      strictPort: true,
      proxy: devProxy,
    },
    output: {
      // 生产构建优化
      minify: isProd,
      target: 'web',
      distPath: {
        root: 'dist',
      },
      // 所有模式都沿用 Rsbuild 默认的 legalComments（"linked"，即每个 chunk 生成 *.LICENSE.txt）。
      // 生产环境不要设置为 "none"：这会移除压缩器保留的第三方声明和提取出的许可证文件，
      // 部分开源合规场景要求保留这些内容。
    },
    performance: {
      // 生产环境移除 console.log
      removeConsole: isProd ? ['log'] : false,
      buildCache: false,
    },
    tools: {
      rspack: {
        plugins: [
          tanstackRouter({
            target: 'react',
            // 开发环境：不按路由拆分异步 chunk（减少页面切换白屏，HMR 反馈更快）。
            // 生产环境：保留基于路由的代码分割。
            autoCodeSplitting: isProd,
          }),
        ],
      },
    },
  }
})
