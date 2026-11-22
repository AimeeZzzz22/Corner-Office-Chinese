import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// base './' so the built demo works from any folder or host.
// VITE_LANG=zh builds the Chinese site (see src/lang.ts); the page's lang and title follow it.
const zh = process.env.VITE_LANG === 'zh';
export default defineConfig({
  base: './',
  plugins: [react(), { name: 'lang', transformIndexHtml: (html) => (zh ? html.replace('<html lang="en">', '<html lang="zh-CN">').replace('<title>Corner Office</title>', '<title>角落办公室</title>') : html) }],
});
