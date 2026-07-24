# DCC 文控 · Vue 前端（可点测）

**Vite + Vue 3.5 + TypeScript 5.3 + Element Plus + Vue Router**。业务逻辑在 `composables/dccApp.js`，页面在 `views/dcc/`（按侧栏分组），路由模块 `router/modules/dcc.js` 可直接给公司主路由 / 若依引用。需求基线 **V1.5.18**（§8.8～§8.11 / §19.8～§19.9）。原型已对齐：借阅跨部门预览、外发令牌/水印包、外来附件、纸质两步回收与筛选、附件实装；双字段 + 三级轻量修订 `rN`。

## 启动

```powershell
cd C:\Users\EDY\Desktop\ds\dcc\web
npm install
npm run dev
```

浏览器打开：<http://127.0.0.1:5173/dcc/dashboard>

| 命令 | 说明 |
|---|---|
| `npm run dev` | 开发热更新 |
| `npm run build` | 打包到 `dist/` |
| `npm run preview` | 预览打包结果 |

依赖默认走 `registry.npmmirror.com`（见 `.npmrc`）。

## 目录

```text
web/
├── index.html
├── src/
│   ├── main.ts                      # 入口：router + Element Plus
│   ├── App.vue                      # 壳：侧栏 / 顶栏 / 页签 + <router-view>
│   ├── router/
│   │   ├── index.js                 # 本仓库独立运行路由入口
│   │   └── modules/dcc.js           # ★ DCC 路由配置（导出给主工程）
│   ├── views/dcc/
│   │   ├── overview/                # 总览
│   │   ├── library/                 # 文件库
│   │   ├── approval/                # 申请与审批
│   │   ├── change/                  # 变更管理
│   │   ├── distribution/            # 分发与签收
│   │   ├── borrow/                  # 借阅与外发
│   │   ├── training/                # 培训任务
│   │   ├── external/                # 外来与复审
│   │   ├── report/                  # 台账查询
│   │   ├── config/                  # 基础配置
│   │   ├── index.js                 # 视图汇总
│   │   ├── useDccPage.js            # inject('dcc')
│   │   └── DccOverlays.vue          # 全局抽屉 / 弹窗
│   ├── composables/dccApp.js        # 业务逻辑（Mock 演示动作）
│   ├── mock/data.js
│   └── styles/layout.css
└── package.json
```

## 挂公司主路由 / 若依

```js
import dccRouter, { dccChildren } from "@/router/modules/dcc";

// 方式 A：整包挂载（含 path: /dcc）
// constantRoutes.push(dccRouter)

// 方式 B：只把子路由挂到已有 Layout 的 /dcc 父级
// parent.children.push(...dccChildren)
```

路由约定：业务 path 前缀 `/dcc/*`；`meta.dccKey` 对齐侧栏 key；`meta.title` 供面包屑 / 页签。

## 说明

- 根目录 `index.html` + `assets/` 仍是旧 CDN 原型；**日常请用本目录 `npm run dev`**。  
- 原型不接后端；刷新后内存变更还原。  
- 嵌入现网时去掉 `App.vue` 原型壳，只迁 `views/dcc` + `router/modules/dcc.js` + 后续 `api/dcc`。  
- 从根目录 CDN 原型重新同步（会覆盖部分文件）：`node scripts/port-from-prototype.mjs`（若脚本仍存在时使用，拆分后结构已变化，慎用）。
