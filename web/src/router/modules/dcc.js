/**
 * DCC 文控模块路由配置（导出给公司主路由 / 若依使用）。
 *
 * 接入示例（若依 Layout children）：
 *   import dccRouter, { dccChildren } from '@/router/modules/dcc'
 *   // 方式 A：整包挂载
 *   constantRoutes.push(dccRouter)
 *   // 方式 B：只取子路由挂到已有 /dcc 父级
 *   parent.children = [...parent.children, ...dccChildren]
 */
import { DCC_VIEWS } from "../../views/dcc/index.js";

const DCC_KEYS = Object.keys(DCC_VIEWS);

const DCC_TITLES = {
  dashboard: "DCC工作台",
  docs: "受控文件台账",
  myDocs: "我的受控文件",
  applies: "申请",
  todoApprove: "待我审批",
  changes: "变更单",
  notices: "变更通知",
  distributions: "分发单",
  receipts: "待我签收",
  hardCopies: "纸质受控/打印",
  borrows: "借阅申请",
  externalReleases: "外发申请",
  accessApplies: "打印/下载申请",
  trainings: "我的培训待办",
  cfgTraining: "岗位培训矩阵",
  externalDocs: "外来文件",
  reviews: "复审任务",
  reportDocs: "综合查询",
  records: "记录",
  config: "基础配置",
};

function toRouteName(dccKey) {
  return "Dcc" + dccKey.charAt(0).toUpperCase() + dccKey.slice(1);
}

/** 业务 key → 完整 path（侧栏 navigate 用） */
export const DCC_KEY_TO_PATH = Object.fromEntries(
  DCC_KEYS.map((k) => [k, `/dcc/${k}`])
);

/**
 * 子路由列表（path 相对父级 /dcc）
 * 公司主路由 / 若依：挂到 Layout 的 children
 */
export const dccChildren = [
  ...DCC_KEYS.map((dccKey) => ({
    path: dccKey,
    name: toRouteName(dccKey),
    component: DCC_VIEWS[dccKey],
    meta: {
      title: DCC_TITLES[dccKey] || dccKey,
      dccKey,
    },
  })),
  // 旧台账查询入口 → 记录 / 工作台
  { path: "reportChanges", redirect: "/dcc/records?type=changes" },
  { path: "reportDist", redirect: "/dcc/records?type=dist" },
  { path: "reportBorrow", redirect: "/dcc/records?type=borrow" },
  { path: "reportAccess", redirect: "/dcc/records?type=access" },
  { path: "complianceExport", redirect: "/dcc/dashboard" },
  // 旧申请入口 → 统一申请页
  { path: "applyCreate", redirect: "/dcc/applies?apply=CREATE" },
  { path: "applyRevise", redirect: "/dcc/applies?apply=REVISE" },
  { path: "applyObsolete", redirect: "/dcc/applies?apply=OBSOLETE" },
  { path: "myApplies", redirect: "/dcc/applies" },
  // 旧基础配置子页 → 配置中心
  { path: "cfgCategory", redirect: "/dcc/config?type=category" },
  { path: "cfgProduct", redirect: "/dcc/config?type=product" },
  { path: "cfgOwnerDept", redirect: "/dcc/config?type=ownerDept" },
  { path: "cfgNumber", redirect: "/dcc/config?type=number" },
  { path: "cfgApproval", redirect: "/dcc/config?type=approval" },
  { path: "cfgWatermark", redirect: "/dcc/config?type=watermark" },
];

/** @deprecated 兼容旧名，等同 dccChildren */
export const dccRuoYiChildren = dccChildren;

/**
 * DCC 模块根路由（默认导出，给公司主路由 import 后 push）
 * path: /dcc ，默认进工作台
 */
const dccRouter = {
  path: "/dcc",
  redirect: "/dcc/dashboard",
  name: "Dcc",
  meta: {
    title: "DCC文控",
  },
  children: dccChildren,
};

export default dccRouter;
