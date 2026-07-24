/**
 * 入口：挂载 Vue 根组件，注册 Element Plus（中文）与 Vue Router。
 * 日常开发：在 web/ 下 npm run dev → http://localhost:5173
 */
import { createApp } from "vue";
import ElementPlus from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import "element-plus/dist/index.css";
import "./styles/layout.css";
import App from "./App.vue";
import router from "./router/index.js";

createApp(App).use(router).use(ElementPlus, { locale: zhCn }).mount("#app");
