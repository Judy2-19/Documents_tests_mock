/** Vite 配置：Vue 插件；开发服默认 5173 并自动打开浏览器 */
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    open: true,
  },
});
