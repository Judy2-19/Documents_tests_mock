/**
 * 本仓库独立运行时的主路由入口。
 * 业务模块路由在 modules/ 下维护；公司主工程可直接 import modules/dcc.js。
 */
import { createRouter, createWebHistory } from "vue-router";
import dccRouter, { dccChildren, DCC_KEY_TO_PATH } from "./modules/dcc.js";

/** 独立原型：扁平注册 /dcc/:key（App 壳内单一 router-view） */
const standaloneDccRoutes = dccChildren.map((r) => ({
  ...r,
  path: `/dcc/${r.path}`,
}));

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/dcc/dashboard" },
    { path: "/dcc", redirect: "/dcc/dashboard" },
    ...standaloneDccRoutes,
    { path: "/:pathMatch(.*)*", redirect: "/dcc/dashboard" },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

export { dccRouter, dccChildren, DCC_KEY_TO_PATH };
export default router;
