import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: {
      index: './src/index.ts',
      'cli/index': './src/cli/index.ts',
      'gateway/index': './src/gateway/index.ts',
      'plugin-sdk/index': './src/plugin-sdk/index.ts',
    },
    outDir: './dist',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    splitting: false,
    minify: false,
    treeshake: true,
  },
]);