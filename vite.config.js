import { defineConfig } from 'vite';
import htmlMinifierTerser from 'vite-plugin-html-minifier-terser';

export default defineConfig({
  plugins: [
    htmlMinifierTerser({
      collapseWhitespace: true,
      removeComments: true,
      removeAttributeQuotes: true,
      minifyCSS: true,
      minifyJS: false,
      keepClosingSlash: true,
      collapseBooleanAttributes: true,
      removeRedundantAttributes: true,
    }),
  ],
  build: {
    target: 'esnext',
    minify: true,
    cssMinify: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        compact: true,
      },
    },
    sourcemap: false,
    reportCompressedSize: true,
  },
});
