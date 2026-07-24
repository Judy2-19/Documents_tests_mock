/**
 * DCC 前端核心逻辑（createDccSetup）。
 * 职责：路由/菜单、角色切换、列表筛选分页、审批/分发/借阅/外发等演示动作、
 * 水印预览与导出 Excel/合规包。无真实后端，变更写在内存 Mock 上。
 *
 * 视图模板在 views/dcc/*.vue；App.vue provide('dcc') 后由各页面 inject 使用。
 */
import { ref, computed, reactive, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import DCC_DATA from "../mock/data.js";
import { DCC_KEY_TO_PATH } from "../router/modules/dcc.js";
import { downloadWorkbook, downloadSheet, parseWorkbookFile, isExcelFile } from "../utils/excel.js";

const STATUS_MAP = {
  EFFECTIVE: { text: "现行有效", cls: "tag-green" },
  REVISING: { text: "修订中", cls: "tag-orange" },
  OBSOLETE: { text: "已废止", cls: "tag-gray" },
  SUPERSEDED: { text: "已替代", cls: "tag-gray" },
  APPROVED_PENDING: { text: "待生效", cls: "tag-blue" },
  DRAFTING: { text: "起草中", cls: "tag-blue" },
  DRAFT: { text: "草稿", cls: "tag-gray" },
  IN_APPROVAL: { text: "审批中", cls: "tag-blue" },
  APPROVED: { text: "已批准", cls: "tag-green" },
  REJECTED: { text: "已驳回", cls: "tag-red" },
  REVOKED: { text: "已撤销", cls: "tag-gray" },
  PUBLISHED: { text: "已发布", cls: "tag-green" },
  CANCELLED: { text: "已取消", cls: "tag-gray" },
  OPEN: { text: "进行中", cls: "tag-blue" },
  NOTIFYING: { text: "通知中", cls: "tag-orange" },
  RECYCLING: { text: "回收中", cls: "tag-orange" },
  CLOSED: { text: "已关闭", cls: "tag-green" },
  SENT: { text: "已发送", cls: "tag-blue" },
  PARTIAL: { text: "部分签收", cls: "tag-orange" },
  COMPLETED: { text: "已完成", cls: "tag-green" },
  PENDING: { text: "待处理", cls: "tag-orange" },
  RECEIVED: { text: "已签收", cls: "tag-green" },
  IN_USE: { text: "在用", cls: "tag-green" },
  RECYCLE_PENDING: { text: "待回收", cls: "tag-red" },
  RECYCLED: { text: "已回收", cls: "tag-gray" },
  VOID_STAMPED: { text: "已盖作废章", cls: "tag-orange" },
  LOST: { text: "已丢失确认", cls: "tag-red" },
  LOST_CONFIRMED: { text: "已丢失确认", cls: "tag-red" },
  BORROWED: { text: "借阅中", cls: "tag-blue" },
  OVERDUE: { text: "已逾期", cls: "tag-red" },
  RETURNED: { text: "已归还", cls: "tag-green" },
  EXPIRED: { text: "已过期", cls: "tag-gray" },
  DONE: { text: "已完成", cls: "tag-green" },
  KEEP: { text: "维持有效", cls: "tag-green" },
  USED: { text: "已使用", cls: "tag-gray" },
  SUCCESS: { text: "已生成", cls: "tag-green" },
  PUBLIC: { text: "一般", cls: "tag-gray" },
  INTERNAL: { text: "内部", cls: "tag-blue" },
  SECRET: { text: "机密", cls: "tag-red" },
  CREATE: { text: "新建", cls: "tag-blue" },
  REVISE: { text: "修订", cls: "tag-orange" },
  OBSOLETE_T: { text: "作废", cls: "tag-red" },
  ELECTRONIC: { text: "电子", cls: "tag-blue" },
  HARDCOPY: { text: "纸质", cls: "tag-purple" },
  STANDARD: { text: "标准", cls: "tag-blue" },
  CUSTOMER: { text: "客户", cls: "tag-orange" },
  PREVIEW: { text: "预览", cls: "tag-gray" },
  DOWNLOAD: { text: "下载", cls: "tag-blue" },
  PRINT: { text: "打印", cls: "tag-purple" },
  EXTERNAL_VIEW: { text: "外链查看", cls: "tag-orange" },
  L1: { text: "一级（宏观）", cls: "tag-purple" },
  L2: { text: "二级（细则）", cls: "tag-blue" },
  L3: { text: "三级（表单）", cls: "tag-green" },
  SEMI_TEST: { text: "半导体检测", cls: "tag-blue" },
  FRONTIER_TEST: { text: "前沿检测", cls: "tag-orange" },
  SIPH_MASS: { text: "硅光芯片量产", cls: "tag-purple" },
  COMMON: { text: "通用/跨业务", cls: "tag-gray" },
  ALL: { text: "全域", cls: "tag-gray" },
  PROD: { text: "生产域", cls: "tag-orange" },
  RD: { text: "研发域", cls: "tag-red" },
};

function statusTag(code) {
  if (code === "OBSOLETE" && arguments[1] === "type") return STATUS_MAP.OBSOLETE_T;
  return STATUS_MAP[code] || { text: code || "-", cls: "tag-gray" };
}

const MENUS = [
  { group: "总览", items: [{ key: "dashboard", label: "DCC工作台", icon: "⌂" }] },
  {
    group: "文件库",
    items: [
      { key: "docs", label: "受控文件台账", icon: "☰" },
      { key: "myDocs", label: "我的受控文件", icon: "☆" },
    ],
  },
  {
    group: "申请与审批",
    items: [
      { key: "applies", label: "申请", icon: "+" },
      { key: "todoApprove", label: "待我审批", icon: "☑", badge: "todoApprove" },
    ],
  },
  {
    group: "变更管理",
    items: [
      { key: "changes", label: "变更单", icon: "⇄" },
      { key: "notices", label: "变更通知", icon: "◎" },
    ],
  },
  {
    group: "分发与签收",
    items: [
      { key: "distributions", label: "分发单", icon: "⇉" },
      { key: "receipts", label: "待我签收", icon: "✓", badge: "todoReceipt" },
      { key: "hardCopies", label: "纸质受控/打印", icon: "▥", badge: "hardRecycle" },
    ],
  },
  {
    group: "借阅与外发",
    items: [
      { key: "borrows", label: "借阅申请", icon: "↔" },
      { key: "externalReleases", label: "外发申请", icon: "↗" },
      { key: "accessApplies", label: "打印/下载申请", icon: "▣", badge: "todoAccess" },
    ],
  },
  {
    group: "培训任务",
    items: [
      { key: "trainings", label: "我的培训待办", icon: "学", badge: "todoTrain" },
      { key: "cfgTraining", label: "岗位培训矩阵", icon: "⚙" },
    ],
  },
  {
    group: "外来与复审",
    items: [
      { key: "externalDocs", label: "外来文件", icon: "▽" },
      { key: "reviews", label: "复审任务", icon: "⏱" },
    ],
  },
  {
    group: "台账查询",
    items: [
      { key: "reportDocs", label: "综合查询", icon: "⌕" },
      { key: "records", label: "记录", icon: "≡" },
    ],
  },
  {
    group: "基础配置",
    items: [{ key: "config", label: "基础配置", icon: "⚙" }],
  },
];

const PAGE_TITLES = Object.fromEntries(MENUS.flatMap((g) => g.items.map((i) => [i.key, i.label])));

/** 旧菜单 key → 新页（兼容书签 / 旧入口） */
const LEGACY_NAV = {
  reportChanges: { key: "records", recordType: "changes" },
  reportDist: { key: "records", recordType: "dist" },
  reportBorrow: { key: "records", recordType: "borrow" },
  reportAccess: { key: "records", recordType: "access" },
  complianceExport: { key: "dashboard" },
  applyCreate: { key: "applies", openApply: "CREATE" },
  applyRevise: { key: "applies", openApply: "REVISE" },
  applyObsolete: { key: "applies", openApply: "OBSOLETE" },
  myApplies: { key: "applies" },
  cfgCategory: { key: "config", cfgType: "category" },
  cfgProduct: { key: "config", cfgType: "product" },
  cfgOwnerDept: { key: "config", cfgType: "ownerDept" },
  cfgNumber: { key: "config", cfgType: "number" },
  cfgApproval: { key: "config", cfgType: "approval" },
  cfgWatermark: { key: "config", cfgType: "watermark" },
};

const RECORD_TYPE_OPTIONS = [
  { value: "changes", label: "变更记录" },
  { value: "dist", label: "分发/领用记录" },
  { value: "borrow", label: "借阅/外发记录" },
  { value: "access", label: "下载/预览/打印日志" },
];

const CFG_TYPE_OPTIONS = [
  { value: "category", label: "文件分类" },
  { value: "product", label: "业务领域" },
  { value: "ownerDept", label: "文件所属部门" },
  { value: "number", label: "编号规则" },
  { value: "approval", label: "审批流程模板" },
  { value: "watermark", label: "水印策略" },
];

export function createDccSetup() {
    const vueRoute = useRoute();
    const router = useRouter();
    const data = reactive(DCC_DATA);
    /** 业务用 dccKey（与 meta.dccKey / 侧栏 key 一致），由 Vue Router 驱动 */
    const route = computed(() => vueRoute.meta.dccKey || "dashboard");
    const openTabs = ref([{ key: "dashboard", title: "DCC工作台" }]);
    const roleCode = ref(data.user.roleCode || "DCC_CONTROLLER");

    const docDetailVisible = ref(false);
    const currentDoc = ref(null);
    const previewVisible = ref(false);
    const approveVisible = ref(false);
    const currentTodo = ref(null);
    const applyDetailVisible = ref(false);
    const currentApply = ref(null);
    const applyDetailTimeline = ref([]);
    const applyDrawer = ref(false);
    const applyMode = ref("CREATE");
    const distDrawer = ref(false);
    const hardPrintVisible = ref(false);
    const printForm = reactive({
      copies: 1,
      holder: "",
      location: "现场墙柜",
      purpose: "现场受控张贴",
    });
    const recycleVisible = ref(false);
    const voidStampVisible = ref(false);
    const hardDetailVisible = ref(false);
    const currentHard = ref(null);
    const recycleForm = reactive({ remark: "" });
    const tplDrawer = ref(false);
    const currentTpl = ref(null);
    const tplNodes = ref([]);
    const extDocDrawer = ref(false);
    const extForm = reactive({
      title: "",
      sourceType: "STANDARD",
      sourceOrg: "",
      receiveDate: "2026-07-22",
      expireDate: "2027-12-31",
      owner: data.user.name,
      security: "INTERNAL",
      remark: "",
      fileName: "",
      fileSize: 0,
      fileUrl: "",
    });
    const receiptDetailVisible = ref(false);
    const currentReceiptRows = ref([]);
    const currentDistNo = ref("");
    const accessApplyVisible = ref(false);
    const accessAction = ref("PRINT");
    const accessReason = ref("");
    const accessDocNo = ref("");

    const borrowFormVisible = ref(false);
    const borrowForm = reactive({
      docNo: "",
      title: "",
      type: "ELECTRONIC",
      copyNo: "",
      days: 7,
      expectReturn: "",
      reason: "",
    });

    const externalFormVisible = ref(false);
    const externalForm = reactive({
      docNo: "",
      title: "",
      receiver: "",
      contact: "",
      expireDate: "",
      purpose: "",
    });

    const effectiveDocOptions = computed(() => {
      const code = roleCode.value;
      const isCtrl = code === "DCC_CONTROLLER" || code === "DCC_ADMIN";
      if (isCtrl) {
        return data.documents.filter((d) => d.status === "EFFECTIVE");
      }
      // 非文控：仅可选已签收文件（申请修订/作废等）
      const received = (data.myDocs || []).filter(
        (row) =>
          row.receiptStatus === "RECEIVED" &&
          (!row.forRoles || !row.forRoles.length || row.forRoles.indexOf(code) >= 0)
      );
      const nos = new Set(received.map((x) => x.docNo));
      return data.documents.filter((d) => d.status === "EFFECTIVE" && nos.has(d.docNo));
    });

    /** 借阅可选：非本人已签收、非本部门所属的现行文件（跨部门临时预览） */
    const borrowDocOptions = computed(() => {
      const code = roleCode.value;
      const dept = data.user.dept || "";
      return data.documents.filter((d) => {
        if (d.status !== "EFFECTIVE") return false;
        if (codeIsCtrl(code)) return true;
        if (userHasReceived(d.docNo)) return false;
        if (csvHas(d.ownerDept || d.dept, dept)) return false;
        return true;
      });
    });

    /** 外发可选：文控全库现行；负责人仅「我的受控文件」内 */
    const externalDocOptions = computed(() => {
      const code = roleCode.value;
      if (codeIsCtrl(code)) {
        return data.documents.filter((d) => d.status === "EFFECTIVE");
      }
      if (codeIsLeader(code)) {
        const nos = new Set(roleMyDocs.value.map((m) => m.docNo));
        return data.documents.filter((d) => d.status === "EFFECTIVE" && nos.has(d.docNo));
      }
      return [];
    });

    const canCreateExternal = computed(() => codeIsCtrl(roleCode.value) || codeIsLeader(roleCode.value));
    const canRegisterExtDoc = computed(() => codeIsCtrl(roleCode.value) || codeIsLeader(roleCode.value));

    const hardCopyOptionsForBorrow = computed(() => {
      if (!borrowForm.docNo) return [];
      return data.hardCopies.filter(
        (h) => h.docNo === borrowForm.docNo && (h.status === "IN_USE" || h.status === "RECYCLE_PENDING")
      );
    });
    const approveComment = ref("");
    const approveSignature = ref("");
    const exportForm = reactive({ asOfTime: "2026-07-21 00:00", scope: "ALL", includeBody: true });

    const filters = reactive({
      keyword: "",
      fileId: "",
      docNo: "",
      fileLevel: "",
      productType: "",
      ownerDept: "",
      category: "",
      status: "",
      security: "",
      accessDomain: "",
      fullText: true,
    });

    /** 下拉选项（避免 in-DOM 自闭合 el-option 导致只剩一项可选） */
    const securityOptions = [
      { label: "内部", value: "INTERNAL" },
      { label: "机密", value: "SECRET" },
    ];
    const domainOptions = [
      { label: "生产域", value: "PROD" },
      { label: "研发域", value: "RD" },
    ];
    const statusOptions = [
      { label: "现行有效", value: "EFFECTIVE" },
      { label: "待生效", value: "APPROVED_PENDING" },
      { label: "修订中", value: "REVISING" },
      { label: "已替代", value: "SUPERSEDED" },
      { label: "已废止", value: "OBSOLETE" },
    ];
    const hardCopyStatusOptions = [
      { label: "在用", value: "IN_USE" },
      { label: "待回收", value: "RECYCLE_PENDING" },
      { label: "已回收", value: "RECYCLED" },
      { label: "已盖作废章", value: "VOID_STAMPED" },
      { label: "已丢失确认", value: "LOST_CONFIRMED" },
    ];
    const hardCopyFilters = reactive({
      fileId: "",
      docNo: "",
      title: "",
      status: "",
    });
    const sourceTypeOptions = [
      { label: "标准", value: "STANDARD" },
      { label: "客户", value: "CUSTOMER" },
    ];
    const exportScopeOptions = [
      { label: "全库现行有效", value: "ALL" },
      { label: "一级（宏观文件）", value: "L1" },
      { label: "二级（部门细则）", value: "L2" },
      { label: "三级（表单）", value: "L3" },
    ];

    const createForm = reactive({
      fileId: null,
      docNo: "",
      title: "",
      category: "",
      fileLevel: "",
      productType: [],
      accessDomain: "",
      security: "",
      ownerDept: [],
      owner: "",
      reason: "",
      plannedEffectiveDate: "",
      reviewCycleMonths: null,
      allowDownload: true,
      allowPrint: true,
      changeSummary: "",
      baseDocNo: "",
      obsoleteReason: "",
      fileName: "",
      fileSize: 0,
      fileUrl: "",
      targetVersion: "",
    });

    const distForm = reactive({
      docNo: "",
      title: "",
      targetRoles: [],
      requireReceipt: true,
      remark: "",
    });

    const PAGE_SIZE = 10;
    const DOCS_PAGE_SIZE = 13;
    const listPage = reactive({
      docs: 1,
      myDocs: 1,
      receipts: 1,
      applies: 1,
      todos: 1,
      changes: 1,
      notices: 1,
      distributions: 1,
      hardCopies: 1,
      borrows: 1,
      externals: 1,
      externalDocs: 1,
      reviews: 1,
      accessLogs: 1,
      accessApplies: 1,
      trainings: 1,
      compliance: 1,
      complianceImport: 1,
      ptFiles: 1,
      odFiles: 1,
      categories: 1,
    });

    /** 记录页当前类型 */
    const recordType = ref("changes");
    const recordTypeOptions = RECORD_TYPE_OPTIONS;
    const onRecordTypeChange = () => {
      listPage.changes = 1;
      listPage.distributions = 1;
      listPage.hardCopies = 1;
      listPage.borrows = 1;
      listPage.externals = 1;
      listPage.accessLogs = 1;
      if (route.value === "records") {
        router.replace({ path: "/dcc/records", query: { type: recordType.value } });
      }
    };

    /** 基础配置页当前类型 */
    const cfgType = ref("category");
    const cfgTypeOptions = CFG_TYPE_OPTIONS;
    const onCfgTypeChange = () => {
      if (route.value === "config") {
        router.replace({ path: "/dcc/config", query: { type: cfgType.value } });
      }
    };

    watch(
      () => [vueRoute.meta.dccKey, vueRoute.query.type],
      ([key, type]) => {
        if (key === "records") {
          if (type && RECORD_TYPE_OPTIONS.some((o) => o.value === type)) {
            recordType.value = String(type);
          }
          return;
        }
        if (key === "config") {
          if (type && CFG_TYPE_OPTIONS.some((o) => o.value === type)) {
            cfgType.value = String(type);
          }
        }
      },
      { immediate: true }
    );

    const pageSizeOf = (key) => (key === "docs" ? DOCS_PAGE_SIZE : PAGE_SIZE);

    const pageSlice = (list, key) => {
      const arr = list || [];
      const size = pageSizeOf(key);
      const page = listPage[key] || 1;
      const start = (page - 1) * size;
      return arr.slice(start, start + size);
    };

    const toast = (text) => ElMessage.success(text);
    const warn = (text) => ElMessage.warning(text);

    const urgeNotice = (row) => {
      if (!row) return;
      const total = row.total || 0;
      let unread = row.unread || 0;
      if (row.status === "CLOSED" && unread === 0) {
        row.status = "SENT";
        unread = Math.min(total, Math.max(1, Math.ceil(total * 0.25)));
        row.unread = unread;
      }
      if (!unread) {
        warn("该通知已全部已读，无需催办");
        return;
      }
      row.urgeCount = (row.urgeCount || 0) + 1;
      row.lastUrgeAt = new Date().toISOString().slice(0, 16).replace("T", " ");
      if (row.status === "CLOSED") row.status = "SENT";
      // 催办后模拟部分人员打开通知
      const readBack = Math.min(unread - 1, Math.max(1, Math.floor(unread * 0.3)));
      if (readBack > 0 && unread > 1) row.unread = unread - readBack;
      toast(
        `已催办 ${row.noticeNo || ""}：向 ${unread} 位未读人员发送提醒（第 ${row.urgeCount} 次）` +
          (row.lastUrgeAt ? ` · ${row.lastUrgeAt}` : "")
      );
    };

    const urgeDist = (row) => {
      if (!row) return;
      toast("已催办未签收人：" + (row.distNo || "") + "（当前签收 " + (row.received || "-") + "）");
    };

    const revokeExternal = (row) => {
      if (!row) return;
      if (row.status === "REVOKED") return toast("该外链已撤销");
      row.status = "REVOKED";
      row.tokenActive = false;
      toast("已撤销外链：" + (row.releaseNo || "") + "，令牌立即失效");
    };

    const openDistForm = (row) => {
      if (!canDistribute.value) {
        return warn("普通员工无法分发；仅文控可向任何人分发，本部门负责人仅可向本部门员工分发");
      }
      const doc = row && row.docNo ? data.documents.find((d) => d.docNo === row.docNo) || row : null;
      Object.assign(distForm, {
        docNo: (doc && doc.docNo) || "",
        title: (doc && doc.title) || "",
        targetRoles: [],
        requireReceipt: true,
        remark: "",
      });
      distDrawer.value = true;
    };

    /** 选中文件后：编号与名称互相回填 */
    const syncDocFields = (target, docNo) => {
      if (!target) return;
      const doc = docNo
        ? effectiveDocOptions.value.find((d) => d.docNo === docNo) ||
          data.documents.find((d) => d.docNo === docNo)
        : null;
      target.docNo = doc ? doc.docNo : docNo || "";
      target.title = doc ? doc.title : "";
      return doc;
    };

    const onDistDocChange = (docNo) => {
      syncDocFields(distForm, docNo);
    };

    const onBorrowDocChange = (docNo) => {
      syncDocFields(borrowForm, docNo);
      borrowForm.copyNo = "";
    };

    const onExternalDocChange = (docNo) => {
      syncDocFields(externalForm, docNo);
    };

    const submitDistribution = () => {
      if (!canDistribute.value) {
        return warn("普通员工无法分发；仅文控或本部门负责人可分发");
      }
      if (!distForm.docNo) return warn("请选择或填写文件编号");
      const roles = Array.isArray(distForm.targetRoles) ? distForm.targetRoles.filter(Boolean) : [];
      if (!roles.length) return warn("请选择分发对象");
      const allowed = new Set(distTargetOptions.value.map((r) => r.roleCode));
      if (roles.some((c) => !allowed.has(c))) {
        return warn(codeIsLeader(roleCode.value) ? "本部门负责人只能分发给本部门员工" : "分发对象无效");
      }
      const doc =
        data.documents.find((d) => d.docNo === distForm.docNo && d.status === "EFFECTIVE") ||
        data.documents.find((d) => d.docNo === distForm.docNo);
      if (!doc) return warn("文件不存在");
      if (doc.status !== "EFFECTIVE") {
        return warn("仅「现行有效」文件可分发；待生效文件到达生效日后方可分发");
      }
      if (codeIsCtrl(roleCode.value) && roles.some((c) => !codeIsLeader(c))) {
        return warn("文控只能分发给各部门负责人，再由负责人二次分发给部门人员");
      }
      const id = Date.now();
      const distNo = "DF" + String(id).slice(-10);
      const sentAt = new Date().toISOString().slice(0, 16).replace("T", " ");
      const distDate = sentAt.slice(0, 10);
      const targetLabels = roles
        .map((c) => {
          const r = data.demoRoles.find((x) => x.roleCode === c);
          return r ? `${r.name}（${r.role}）` : c;
        })
        .join("、");
      data.distributions.unshift({
        id,
        distNo,
        docNo: distForm.docNo,
        title: (doc && doc.title) || distForm.title || "-",
        version: (doc && doc.version) || "-",
        fileLevel: doc && doc.fileLevel,
        productType: doc && doc.productType,
        requireReceipt: !!distForm.requireReceipt,
        status: distForm.requireReceipt ? "PARTIAL" : "DONE",
        sentAt,
        received: distForm.requireReceipt ? "0/" + roles.length : roles.length + "/" + roles.length,
        targets: targetLabels,
        targetRoles: roles.slice(),
        sentBy: data.user.name,
        sentByRole: roleCode.value,
      });
      if (!data.receiptDetails) data.receiptDetails = {};
      data.receiptDetails[distNo] = roles.map((c, i) => {
        const r = data.demoRoles.find((x) => x.roleCode === c);
        return {
          id: id + i + 1,
          user: r ? r.name : c,
          dept: r ? r.dept : "-",
          status: distForm.requireReceipt ? "PENDING" : "RECEIVED",
          time: distForm.requireReceipt ? "-" : sentAt,
        };
      });
      roles.forEach((c, i) => {
        data.myDocs.unshift({
          id: id + 100 + i,
          docNo: distForm.docNo,
          title: (doc && doc.title) || distForm.title || "-",
          version: (doc && doc.version) || "-",
          receiptStatus: distForm.requireReceipt ? "PENDING" : "RECEIVED",
          distDate,
          distNo,
          forRoles: [c],
        });
      });
      syncRoleStats();
      distDrawer.value = false;
      listPage.distributions = 1;
      toast("分发单已发送：" + distNo + " → 请对象在「待我签收」确认签收后，方可在「我的受控文件」查看");
      navigate("distributions");
    };

    /** 本地真实选择附件（内存 Blob URL，无后端） */
    const pickLocalFile = (assignFn, opts = {}) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept =
        opts.accept ||
        ".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      input.onchange = () => {
        const file = input.files && input.files[0];
        if (!file) return;
        if (opts.maxMb && file.size > opts.maxMb * 1024 * 1024) {
          return warn(`附件大小不能超过 ${opts.maxMb}MB`);
        }
        const prevUrl = opts.prevUrl;
        if (prevUrl && String(prevUrl).indexOf("blob:") === 0) {
          try {
            URL.revokeObjectURL(prevUrl);
          } catch (_) {
            /* ignore */
          }
        }
        const url = URL.createObjectURL(file);
        assignFn({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || "",
          fileUrl: url,
          fileBlob: file,
        });
        const kb = (file.size / 1024).toFixed(1);
        toast(`已上传附件：${file.name}（${kb} KB）`);
      };
      input.click();
    };

    const formatFileSize = (n) => {
      const size = Number(n) || 0;
      if (size < 1024) return size + " B";
      if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
      return (size / (1024 * 1024)).toFixed(2) + " MB";
    };

    const pickUploadFile = () => {
      pickLocalFile(
        (meta) => {
          createForm.fileName = meta.fileName;
          createForm.fileSize = meta.fileSize;
          createForm.fileUrl = meta.fileUrl;
        },
        { prevUrl: createForm.fileUrl, maxMb: 50 }
      );
    };

    const pickExtDocFile = () => {
      pickLocalFile(
        (meta) => {
          extForm.fileName = meta.fileName;
          extForm.fileSize = meta.fileSize;
          extForm.fileUrl = meta.fileUrl;
        },
        { prevUrl: extForm.fileUrl, maxMb: 50 }
      );
    };

    const currentRole = computed(() => data.demoRoles.find((r) => r.roleCode === roleCode.value) || data.demoRoles[0]);

    const hasPerm = (p) => (data.user.perms || []).includes(p);

    const matchForRoles = (row, code) => {
      if (!row) return false;
      const roles = row.forRoles;
      if (!roles || !roles.length) return true;
      return roles.indexOf(code) >= 0;
    };

    const codeIsDeptStaff = (code) =>
      ["DCC_DEPT_TECH", "DCC_DEPT_MKT", "DCC_DEPT_IT", "DCC_DEPT_FIN"].indexOf(code) >= 0;
    const codeIsLeader = (code) => String(code || "").indexOf("DCC_LEADER_") === 0;
    const codeIsCtrl = (code) => code === "DCC_CONTROLLER" || code === "DCC_ADMIN";
    /** 部门员工与负责人：近 7 日生效 / 现行有效按所属部门收窄 */
    const codeIsDeptScoped = (code) => codeIsDeptStaff(code) || codeIsLeader(code);

    /** 部门 → 部门负责人演示角色（员工申请一审；行政部无独立负责人，由文控审） */
    const LEADER_ROLE_BY_DEPT = {
      行政部: "DCC_CONTROLLER",
      技术部: "DCC_LEADER_TECH",
      市场部: "DCC_LEADER_MKT",
      IT部: "DCC_LEADER_IT",
      财务部: "DCC_LEADER_FIN",
    };
    const leaderRoleForDept = (dept) => LEADER_ROLE_BY_DEPT[dept] || "DCC_CONTROLLER";

    /** 演示「今天」：用于待生效→现行、复审顺延、借阅/外发到期 */
    const demoToday = () => "2026-07-24";
    const addMonthsYmd = (ymd, months) => {
      const d = new Date(String(ymd || demoToday()) + "T00:00:00");
      d.setMonth(d.getMonth() + Number(months || 0));
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    const addDaysYmd = (ymd, days) => {
      const d = new Date(String(ymd || demoToday()) + "T00:00:00");
      d.setDate(d.getDate() + Number(days || 0));
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    const syncBorrowExpectReturn = () => {
      const days = Math.max(1, Number(borrowForm.days) || 7);
      borrowForm.days = days;
      borrowForm.expectReturn = addDaysYmd(demoToday(), days);
    };

    /** 文控→各部门负责人；负责人→本部门员工；员工不可分发 */
    const canDistribute = computed(() => codeIsCtrl(roleCode.value) || codeIsLeader(roleCode.value));
    const distTargetOptions = computed(() => {
      const roles = data.demoRoles || [];
      if (codeIsCtrl(roleCode.value)) {
        return roles.filter((r) => codeIsLeader(r.roleCode));
      }
      if (codeIsLeader(roleCode.value)) {
        const dept = data.user.dept || "";
        return roles.filter((r) => codeIsDeptStaff(r.roleCode) && r.dept === dept);
      }
      return [];
    });

    /** 关联主档元数据（变更单等列表用） */
    const docMeta = (row) => {
      if (!row) return {};
      if (row.fileId != null) {
        const byFid = data.documents.find((d) => d.fileId === row.fileId || d.id === row.fileId);
        if (byFid) return byFid;
      }
      if (row.docNo) {
        const docs = data.documents.filter((d) => d.docNo === row.docNo);
        const eff = docs.find((d) => d.status === "EFFECTIVE");
        if (eff) return eff;
        if (docs.length) return docs[0];
      }
      return row;
    };
    const ownerDeptOf = (row) => {
      if (!row) return "-";
      if (row.ownerDept) return deptNames(row.ownerDept);
      const doc = docMeta(row);
      return deptNames(doc.ownerDept || doc.dept) || "-";
    };

    const roleMyDocsAll = computed(() => {
      const code = roleCode.value;
      return (data.myDocs || []).filter((row) => matchForRoles(row, code));
    });
    /** 待我签收：仅未签收 */
    const rolePendingReceipts = computed(() =>
      roleMyDocsAll.value.filter((r) => r.receiptStatus === "PENDING")
    );
    /** 我的受控文件：仅已签收 */
    const roleMyDocs = computed(() =>
      roleMyDocsAll.value.filter((r) => r.receiptStatus === "RECEIVED")
    );
    /** 复审：负责人看本部门；文控看全部 */
    const roleReviews = computed(() => {
      const code = roleCode.value;
      const list = data.reviews || [];
      if (codeIsCtrl(code)) return list;
      if (codeIsLeader(code)) {
        const dept = data.user.dept || "";
        const name = data.user.name;
        return list.filter((r) => {
          if (r.assignee === name) return true;
          const doc = data.documents.find((d) => d.docNo === r.docNo);
          return !!(doc && csvHas(doc.ownerDept || doc.dept, dept));
        });
      }
      return [];
    });

    /** 当前角色「我的受控文件」曾出现过的文件编号（含待签收/已签收） */
    const myEverDocNos = computed(() => {
      const set = new Set();
      roleMyDocsAll.value.forEach((m) => {
        if (m.docNo) set.add(m.docNo);
      });
      return set;
    });

    /** 分发单：文控全部；负责人仅本人发出的，或关联本人受控文件的 */
    const roleDistributions = computed(() => {
      const code = roleCode.value;
      const list = data.distributions || [];
      if (codeIsCtrl(code)) return list;
      if (codeIsLeader(code)) {
        const name = data.user.name;
        const ever = myEverDocNos.value;
        return list.filter((d) => {
          if (d.sentBy === name || d.sentByRole === code) return true;
          if (d.docNo && ever.has(d.docNo)) return true;
          if (Array.isArray(d.targetRoles) && d.targetRoles.indexOf(code) >= 0) return true;
          return false;
        });
      }
      // 普通员工：仅关联本人受控文件的分发
      const ever = myEverDocNos.value;
      return list.filter((d) => d.docNo && ever.has(d.docNo));
    });

    /** 变更通知：文控全部；负责人仅与本人受控文件关联的 */
    const roleNotices = computed(() => {
      const code = roleCode.value;
      const list = data.notices || [];
      if (codeIsCtrl(code)) return list;
      const ever = myEverDocNos.value;
      return list.filter((n) => {
        if (n.docNo && ever.has(n.docNo)) return true;
        const title = String(n.title || n.content || "");
        for (const no of ever) {
          if (title.indexOf(no) >= 0) return true;
        }
        return false;
      });
    });

    /** 借阅：员工本人；负责人本部门+本人；文控全部 */
    const roleBorrows = computed(() => {
      const code = roleCode.value;
      const list = data.borrows || [];
      if (codeIsCtrl(code)) return list;
      const name = data.user.name;
      const dept = data.user.dept || "";
      if (codeIsLeader(code)) {
        return list.filter((b) => b.applicant === name || b.dept === dept);
      }
      return list.filter((b) => b.applicant === name);
    });

    /** 外发：同上 */
    const roleExternals = computed(() => {
      const code = roleCode.value;
      const list = data.externals || [];
      if (codeIsCtrl(code)) return list;
      const name = data.user.name;
      const dept = data.user.dept || "";
      if (codeIsLeader(code)) {
        return list.filter((e) => {
          if (e.applicant === name) return true;
          const ap = data.demoRoles.find((r) => r.name === e.applicant);
          return !!(ap && ap.dept === dept);
        });
      }
      return list.filter((e) => e.applicant === name);
    });

    /** 记录页：仅「我的受控文件」曾经有过的文件相关记录；文控看全部 */
    const filterByMyDocs = (rows) => {
      const code = roleCode.value;
      if (codeIsCtrl(code)) return rows || [];
      const ever = myEverDocNos.value;
      return (rows || []).filter((r) => r.docNo && ever.has(r.docNo));
    };
    /** 变更单：文控全部；其他人仅与本人受控文件关联的 */
    const roleChanges = computed(() => filterByMyDocs(data.changes));
    const roleRecordChanges = roleChanges;
    const roleRecordDists = computed(() => filterByMyDocs(data.distributions));
    const roleRecordHardCopies = computed(() => filterByMyDocs(data.hardCopies));
    const roleRecordBorrows = computed(() => filterByMyDocs(data.borrows));
    const roleRecordExternals = computed(() => filterByMyDocs(data.externals));
    const roleRecordAccessLogs = computed(() => filterByMyDocs(data.accessLogs));

    /** 当前角色：待我审批 */
    const roleTodos = computed(() => {
      const code = roleCode.value;
      return (data.todos || []).filter((row) => matchForRoles(row, code));
    });

    /** 当前角色：我的培训待办（按受训人姓名） */
    const roleTrainings = computed(() => {
      const name = data.user.name;
      return (data.trainingTasks || []).filter((t) => t.assignee === name);
    });

    /** 当前角色：打印/下载申请（文控看全部，他人看自己的） */
    const roleAccessApplies = computed(() => {
      const code = roleCode.value;
      if (code === "DCC_CONTROLLER" || code === "DCC_ADMIN") return data.accessApplies || [];
      const name = data.user.name;
      return (data.accessApplies || []).filter((a) => a.applicant === name);
    });

    /** 我的申请：仅当前登录人提交的（按申请人姓名） */
    const roleMyApplies = computed(() => {
      const name = data.user.name;
      return (data.applies || []).filter((a) => a.applicant === name);
    });

    /** 英文逗号分隔多值（业务领域 / 所属部门） */
    const csvSplit = (v) => {
      if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
      return String(v || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    };
    const csvJoin = (arr) => csvSplit(arr).join(",");
    const csvHas = (haystack, needle) => {
      if (!needle) return true;
      return csvSplit(haystack).includes(String(needle).trim());
    };

    /** 当前角色：近 7 日生效（部门员工/负责人按所属部门收窄） */
    const roleRecentEffective = computed(() => {
      const dept = data.user.dept || "";
      const code = roleCode.value;
      return (data.recentEffective || []).filter((row) => {
        const doc = data.documents.find((d) => d.docNo === row.docNo);
        if (!doc) return true;
        if (codeIsDeptScoped(code)) return csvHas(doc.ownerDept, dept);
        return true;
      });
    });

    const roleEffectiveCount = computed(() => {
      const dept = data.user.dept || "";
      const code = roleCode.value;
      return data.documents.filter((d) => {
        if (d.status !== "EFFECTIVE" && d.status !== "REVISING") return false;
        if (codeIsDeptScoped(code)) return csvHas(d.ownerDept, dept);
        return true;
      }).length;
    });

    const roleStats = computed(() => {
      const code = roleCode.value;
      const isCtrl = code === "DCC_CONTROLLER" || code === "DCC_ADMIN";
      const pendReceipt = rolePendingReceipts.value.length;
      const pendTrain = roleTrainings.value.filter((x) => x.status === "PENDING" || x.status === "OVERDUE").length;
      const pendAccess = roleAccessApplies.value.filter((x) => x.status === "IN_APPROVAL").length;
      const monthPrefix = "2026-07";
      const recent = roleRecentEffective.value;
      return {
        effective: roleEffectiveCount.value,
        monthNew: recent.filter((x) => x.type === "新建发布" && String(x.effectiveDate || "").indexOf(monthPrefix) === 0).length,
        monthRevise: recent.filter((x) => x.type === "修订升版" && String(x.effectiveDate || "").indexOf(monthPrefix) === 0).length,
        reviewOverdue: isCtrl
          ? data.reviews.filter((x) => x.status === "OVERDUE").length
          : data.reviews.filter((x) => {
              if (x.status !== "OVERDUE") return false;
              const doc = data.documents.find((d) => d.docNo === x.docNo);
              return !!(doc && csvHas(doc.ownerDept, data.user.dept));
            }).length,
        todoApprove: roleTodos.value.length,
        todoReceipt: pendReceipt,
        hardRecycle: isCtrl ? data.hardCopies.filter((x) => x.status === "RECYCLE_PENDING").length : 0,
        todoTrain: pendTrain,
        todoAccess: pendAccess,
        totalDocs: isCtrl
          ? data.documents.length
          : roleEffectiveCount.value,
        revising: data.documents.filter((x) => x.status === "REVISING").length,
        obsolete: data.documents.filter((x) => x.status === "OBSOLETE").length,
      };
    });

    const syncRoleStats = () => {
      const s = roleStats.value;
      Object.assign(data.stats, {
        effective: s.effective,
        monthNew: s.monthNew,
        monthRevise: s.monthRevise,
        reviewOverdue: s.reviewOverdue,
        todoApprove: s.todoApprove,
        todoReceipt: s.todoReceipt,
        hardRecycle: s.hardRecycle,
        todoTrain: s.todoTrain,
        todoAccess: s.todoAccess,
        totalDocs: s.totalDocs,
      });
    };

    const switchRole = (code) => {
      if (code) roleCode.value = code;
      const r = currentRole.value;
      Object.assign(data.user, {
        name: r.name,
        userNo: r.userNo,
        dept: r.dept,
        role: r.role,
        roleCode: r.roleCode,
        post: r.post,
        short: r.short,
        perms: r.perms,
      });
      activateDueDocuments();
      syncRoleStats();
      listPage.applies = 1;
      listPage.myDocs = 1;
      listPage.accessApplies = 1;
      listPage.trainings = 1;
      toast(`已切换为：${r.role}（${r.name}）· 数据域 ${r.domain} · 受控文件 ${roleMyDocs.value.length} 份`);
    };

    /** 文控员 / 文控管理员：可维护基础配置（分类/业务领域/所属部门/水印等）；其他部门仅可查看 */
    const isDocController = computed(() => {
      const code = data.user.roleCode || roleCode.value;
      return code === "DCC_CONTROLLER" || code === "DCC_ADMIN";
    });

    const requireDocController = (actionLabel) => {
      if (isDocController.value) return true;
      ElMessage.error("无权限：仅文控员可" + (actionLabel || "修改基础配置") + "，其他部门一律不可改");
      return false;
    };

    const categoryFormVisible = ref(false);
    const categoryForm = reactive({
      code: "",
      name: "",
      reviewMonths: 12,
      allowDownload: true,
      remark: "",
    });

    const openCategoryForm = () => {
      if (!requireDocController("新增分类")) return;
      Object.assign(categoryForm, {
        code: "",
        name: "",
        reviewMonths: 12,
        allowDownload: true,
        remark: "",
      });
      categoryFormVisible.value = true;
    };

    const submitCategory = () => {
      if (!requireDocController("新增分类")) return;
      const code = (categoryForm.code || "").trim().toUpperCase();
      const name = (categoryForm.name || "").trim();
      if (!code) return warn("请填写分类编码");
      if (!/^[A-Z][A-Z0-9_]{0,31}$/.test(code)) {
        return warn("编码须以大写字母开头，仅含大写字母/数字/下划线");
      }
      if (!name) return warn("请填写分类名称");
      if (data.categories.some((c) => c.code === code)) {
        return warn("分类编码已存在：" + code);
      }
      const nextId = data.categories.reduce((m, c) => Math.max(m, c.id || 0), 0) + 1;
      data.categories.push({
        id: nextId,
        code,
        name,
        reviewMonths: categoryForm.reviewMonths || 12,
        allowDownload: !!categoryForm.allowDownload,
        remark: (categoryForm.remark || "").trim(),
      });
      categoryFormVisible.value = false;
      toast("已新增分类 " + code + " · " + name);
    };

    /** 业务领域：新增 / 修改（仅文控） */
    const productFormVisible = ref(false);
    const productFormMode = ref("CREATE");
    const productForm = reactive({ code: "", name: "", remark: "", editCode: "" });

    const openProductForm = (row) => {
      if (!requireDocController(row ? "修改业务领域" : "新增业务领域")) return;
      if (row) {
        productFormMode.value = "EDIT";
        Object.assign(productForm, {
          code: row.code || "",
          name: row.name || "",
          remark: row.remark || "",
          editCode: row.code || "",
        });
      } else {
        productFormMode.value = "CREATE";
        Object.assign(productForm, { code: "", name: "", remark: "", editCode: "" });
      }
      productFormVisible.value = true;
    };

    const submitProduct = () => {
      if (!requireDocController(productFormMode.value === "EDIT" ? "修改业务领域" : "新增业务领域")) return;
      const code = (productForm.code || "").trim().toUpperCase();
      const name = (productForm.name || "").trim();
      if (!code) return warn("请填写业务领域编码");
      if (!/^[A-Z][A-Z0-9_]{0,31}$/.test(code)) {
        return warn("编码须以大写字母开头，仅含大写字母/数字/下划线");
      }
      if (!name) return warn("请填写业务领域名称");
      if (productFormMode.value === "EDIT") {
        const row = data.productTypes.find((p) => p.code === productForm.editCode);
        if (!row) return warn("未找到要修改的业务领域");
        if (code !== productForm.editCode && data.productTypes.some((p) => p.code === code)) {
          return warn("业务领域编码已存在：" + code);
        }
        const oldCode = row.code;
        row.code = code;
        row.name = name;
        row.remark = (productForm.remark || "").trim();
        if (oldCode !== code) {
          data.documents.forEach((d) => {
            const parts = csvSplit(d.productType).map((c) => (c === oldCode ? code : c));
            d.productType = csvJoin(parts);
          });
        }
        productFormVisible.value = false;
        toast("已修改业务领域 " + code + " · " + name);
        return;
      }
      if (data.productTypes.some((p) => p.code === code)) {
        return warn("业务领域编码已存在：" + code);
      }
      data.productTypes.push({ code, name, remark: (productForm.remark || "").trim() });
      productFormVisible.value = false;
      toast("已新增业务领域 " + code + " · " + name);
    };

    /** 文件所属部门：新增 / 修改（仅文控） */
    const ownerDeptFormVisible = ref(false);
    const ownerDeptFormMode = ref("CREATE");
    const ownerDeptForm = reactive({ code: "", name: "", editCode: "" });

    const openOwnerDeptForm = (row) => {
      if (!requireDocController(row ? "修改所属部门" : "新增所属部门")) return;
      if (row) {
        ownerDeptFormMode.value = "EDIT";
        Object.assign(ownerDeptForm, {
          code: row.code || "",
          name: row.name || "",
          editCode: row.code || "",
        });
      } else {
        ownerDeptFormMode.value = "CREATE";
        Object.assign(ownerDeptForm, { code: "", name: "", editCode: "" });
      }
      ownerDeptFormVisible.value = true;
    };

    const submitOwnerDept = () => {
      if (!requireDocController(ownerDeptFormMode.value === "EDIT" ? "修改所属部门" : "新增所属部门")) return;
      const code = (ownerDeptForm.code || "").trim().toUpperCase();
      const name = (ownerDeptForm.name || "").trim();
      if (!code) return warn("请填写部门编码");
      if (!/^[A-Z][A-Z0-9_]{0,31}$/.test(code)) {
        return warn("编码须以大写字母开头，仅含大写字母/数字/下划线");
      }
      if (!name) return warn("请填写部门名称");
      if (ownerDeptFormMode.value === "EDIT") {
        const row = data.ownerDepts.find((d) => d.code === ownerDeptForm.editCode);
        if (!row) return warn("未找到要修改的所属部门");
        if (code !== ownerDeptForm.editCode && data.ownerDepts.some((d) => d.code === code)) {
          return warn("部门编码已存在：" + code);
        }
        if (name !== row.name && data.ownerDepts.some((d) => d.name === name && d.code !== ownerDeptForm.editCode)) {
          return warn("部门名称已存在：" + name);
        }
        const oldName = row.name;
        row.code = code;
        row.name = name;
        if (oldName !== name) {
          data.documents.forEach((d) => {
            const parts = csvSplit(d.ownerDept || d.dept).map((n) => (n === oldName ? name : n));
            d.ownerDept = csvJoin(parts);
          });
        }
        ownerDeptFormVisible.value = false;
        toast("已修改所属部门 " + code + " · " + name);
        return;
      }
      if (data.ownerDepts.some((d) => d.code === code)) {
        return warn("部门编码已存在：" + code);
      }
      if (data.ownerDepts.some((d) => d.name === name)) {
        return warn("部门名称已存在：" + name);
      }
      data.ownerDepts.push({ code, name });
      ownerDeptFormVisible.value = false;
      toast("已新增所属部门 " + code + " · " + name);
    };

    /** 水印策略保存（仅文控可改；下载/打印强制开；预览可由文控开关） */
    const saveWatermark = () => {
      if (!requireDocController("修改水印策略")) return;
      data.watermark.download = true;
      data.watermark.print = true;
      toast(
        data.watermark.preview
          ? "水印策略已保存（预览加水印：开；下载/打印强制开）"
          : "水印策略已保存（预览加水印：关；下载/打印强制开）"
      );
    };

    const badgeCount = (key) => {
      const s = roleStats.value;
      if (key === "todoApprove") return s.todoApprove;
      if (key === "todoReceipt") return s.todoReceipt;
      if (key === "hardRecycle") return s.hardRecycle;
      if (key === "todoTrain") return s.todoTrain;
      if (key === "todoAccess") return s.todoAccess;
      return 0;
    };

    const navigate = (key, opts) => {
      const legacy = LEGACY_NAV[key];
      let openApplyMode = opts && opts.openApply ? opts.openApply : null;
      if (legacy) {
        if (legacy.recordType) recordType.value = legacy.recordType;
        if (legacy.cfgType) cfgType.value = legacy.cfgType;
        if (legacy.openApply) openApplyMode = legacy.openApply;
        key = legacy.key;
      }
      if (opts && opts.recordType) recordType.value = opts.recordType;
      if (opts && opts.cfgType) cfgType.value = opts.cfgType;
      if (!openTabs.value.find((t) => t.key === key)) {
        openTabs.value.push({ key, title: PAGE_TITLES[key] || key });
      }
      const path = DCC_KEY_TO_PATH[key] || `/dcc/${key}`;
      const query = {};
      if (key === "records") query.type = recordType.value;
      if (key === "config") query.type = cfgType.value;
      if (key === "applies" && openApplyMode) query.apply = openApplyMode;
      if (Object.keys(query).length) {
        router.push({ path, query });
      } else if (vueRoute.path !== path) {
        router.push(path);
      }
    };

    const closeTab = (key, e) => {
      e.stopPropagation();
      const idx = openTabs.value.findIndex((t) => t.key === key);
      if (idx < 0 || openTabs.value.length === 1) return;
      openTabs.value.splice(idx, 1);
      if (route.value === key) {
        const next = openTabs.value[Math.max(0, idx - 1)].key;
        router.push(DCC_KEY_TO_PATH[next] || `/dcc/${next}`);
      }
    };

    const domainVisible = (doc) => {
      const domain = currentRole.value.domain;
      if (domain === "ALL") return true;
      if (doc.accessDomain === "ALL") return true;
      return doc.accessDomain === domain;
    };

    /** 展示文件ID（纯数字流水）；关联行无值时按编号回查主档 */
    const fileIdOf = (row) => {
      if (!row) return "-";
      if (row.fileId != null && row.fileId !== "") return row.fileId;
      if (row.docNo && row.docNo !== "-") {
        const doc = data.documents.find((d) => d.docNo === row.docNo);
        if (doc && (doc.fileId != null || doc.id != null)) return doc.fileId != null ? doc.fileId : doc.id;
      }
      // 主档行本身
      if (row.id != null && data.documents.some((d) => d.id === row.id && d.docNo === row.docNo)) {
        return row.id;
      }
      // 外来文件台账：优先 fileId，否则 id
      if (row.extNo != null) return row.fileId != null ? row.fileId : row.id != null ? row.id : "-";
      return "-";
    };

    /** 下一文件ID（演示用流水） */
    const nextFileId = () => {
      let max = 0;
      data.documents.forEach((d) => {
        max = Math.max(max, Number(d.fileId || d.id || 0));
      });
      (data.applies || []).forEach((a) => {
        max = Math.max(max, Number(a.fileId || 0));
      });
      return max + 1;
    };

    const filteredDocs = computed(() => {
      const ctrl = codeIsCtrl(roleCode.value);
      return data.documents.filter((d) => {
        if (!domainVisible(d)) return false;
        // 待生效仅文控在台账可见；其他人看现行等状态
        if (!ctrl && d.status === "APPROVED_PENDING") return false;
        if (filters.fileId) {
          const fid = String(filters.fileId).trim();
          if (String(d.fileId != null ? d.fileId : d.id) !== fid) return false;
        }
        if (filters.docNo) {
          const n = filters.docNo.trim().toUpperCase();
          if (!d.docNo.toUpperCase().startsWith(n) && d.docNo.toUpperCase() !== n) return false;
        }
        if (filters.fileLevel && d.fileLevel !== filters.fileLevel) return false;
        if (filters.productType && !csvHas(d.productType, filters.productType)) return false;
        if (filters.ownerDept && !csvHas(d.ownerDept, filters.ownerDept)) return false;
        if (filters.keyword) {
          const k = filters.keyword.trim().toLowerCase();
          const hitMeta =
            d.docNo.toLowerCase().includes(k) ||
            d.title.toLowerCase().includes(k) ||
            d.owner.includes(filters.keyword.trim()) ||
            String(d.fileId != null ? d.fileId : d.id).includes(k);
          const hitFull = filters.fullText && (d.fullText || "").toLowerCase().includes(k);
          if (!hitMeta && !hitFull) return false;
        }
        if (filters.category && d.category !== filters.category) return false;
        if (filters.status && d.status !== filters.status) return false;
        if (filters.security && d.security !== filters.security) return false;
        if (filters.accessDomain && d.accessDomain !== filters.accessDomain) return false;
        return true;
      });
    });

    watch(filteredDocs, () => {
      listPage.docs = 1;
    });

    const resetFilters = () => {
      listPage.docs = 1;
      filters.keyword = "";
      filters.fileId = "";
      filters.docNo = "";
      filters.fileLevel = "";
      filters.productType = "";
      filters.ownerDept = "";
      filters.category = "";
      filters.status = "";
      filters.security = "";
      filters.accessDomain = "";
      filters.fullText = true;
    };

    const versionRows = computed(() => {
      const doc = currentDoc.value;
      if (!doc) return [];
      const hist = data.versionHistories && data.versionHistories[doc.docNo];
      if (hist && hist.length) {
        return hist.map((h) => ({
          ver: h.ver || h.v || "-",
          statusText: h.statusText || h.s || "-",
          effDate: h.effDate || h.d || "-",
          author: h.author || "-",
          summary: h.summary || "-",
        }));
      }
      return [
        {
          ver: doc.version,
          statusText: statusTag(doc.status).text,
          effDate: doc.effectiveDate,
          author: doc.owner,
          summary: doc.changeSummary || "-",
        },
      ];
    });

    const previewScene = ref("");

    /** 合并台账元数据（借阅/外发行可能只有编号） */
    const resolveDocMeta = (row) => {
      if (!row) return null;
      if (!row.docNo) return row;
      const full = data.documents.find((d) => d.docNo === row.docNo);
      return full ? Object.assign({}, full, row) : row;
    };

    /**
     * 红色阶段状态水印（叠加在原有姓名/工号平铺水印之上）
     * scene: '' | BORROW | EXTERNAL | CREATE | REVISE
     */
    const resolveStatusWm = (doc, scene) => {
      const sc = String(scene || "").toUpperCase();
      let corner = "";
      if (sc === "BORROW") corner = "借阅";
      else if (sc === "EXTERNAL") corner = "外发";
      else if (sc === "CREATE") corner = "初级文件";
      else if (sc === "REVISE") corner = "修订";
      else {
        const st = doc && doc.status;
        if (st === "OBSOLETE" || st === "SUPERSEDED") corner = "失效";
        else if (st === "APPROVED_PENDING") corner = "审批完成";
        else if (st === "REVISING") corner = "修订";
        else if (st === "DRAFT" || st === "DRAFTING" || st === "IN_APPROVAL") corner = "初级文件";
        else if (st === "EFFECTIVE") {
          const hasDist = (data.distributions || []).some((d) => d.docNo === doc.docNo);
          corner = hasDist ? "已分发" : "审批完成";
        } else if (st === "APPROVED" || st === "PUBLISHED") corner = "审批完成";
        else corner = "初级文件";
      }
      let secret = !!(doc && doc.security === "SECRET");
      if (!secret && doc && doc.docNo) {
        const full = data.documents.find((d) => d.docNo === doc.docNo);
        secret = !!(full && full.security === "SECRET");
      }
      return { corner, secret };
    };

    const previewStatusWm = computed(() => resolveStatusWm(currentDoc.value, previewScene.value));

    /** 生成可真实下载的水印受控文件（HTML，含中文水印，可浏览器打开/另存 PDF） */
    const buildWatermarkHtml = (doc, mode, copyNo, scene) => {
      const now = new Date();
      const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const wm = `${data.user.name} ${data.user.userNo} ${doc.docNo} ${stamp}`;
      const kind = mode === "PRINT" ? "受控打印件" : "受控下载件";
      const sw = resolveStatusWm(doc, scene);
      const statusLayers = [
        sw.corner
          ? `<div class="wm-status-corner">${sw.corner}</div>`
          : "",
        sw.secret
          ? `<div class="wm-status-secret"><span>机密文件</span></div>`
          : "",
      ].join("");
      return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<title>${doc.docNo} V${doc.version} ${kind}</title>
<style>
  @page { margin: 18mm; }
  body { font-family: "Microsoft YaHei","PingFang SC",sans-serif; color:#222; margin:0; padding:40px 48px; position:relative; }
  .wm {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image: repeating-linear-gradient(-28deg, transparent, transparent 70px, rgba(0,0,0,.03) 70px, rgba(0,0,0,.03) 140px);
  }
  .wm-text {
    position: fixed; inset: -20%; z-index: 1; pointer-events: none;
    display: flex; flex-wrap: wrap; align-content: space-around; justify-content: space-around;
    transform: rotate(-24deg); opacity: 0.16; font-size: 15px; color: #000;
  }
  .wm-text span { margin: 28px; white-space: nowrap; }
  .wm-status-corner {
    position: fixed; top: 18px; left: 18px; z-index: 4; pointer-events: none;
    color: rgba(200,40,30,.62); font-size: 13px; font-weight: 700; letter-spacing: .18em;
    border: 1.5px solid rgba(200,40,30,.5); padding: 4px 10px; transform: rotate(-14deg);
    background: rgba(255,255,255,.3); white-space: nowrap;
  }
  .wm-status-secret {
    position: fixed; inset: 0; z-index: 3; pointer-events: none;
    display: flex; align-items: center; justify-content: center;
  }
  .wm-status-secret span {
    color: rgba(200,40,30,.18); font-size: 42px; font-weight: 800; letter-spacing: .55em;
    white-space: nowrap; transform: rotate(-34deg) scaleX(1.85);
    border: 2px solid rgba(200,40,30,.2); padding: 8px 28px;
  }
  .doc { position: relative; z-index: 2; max-width: 720px; margin: 0 auto; background: #fff; }
  h1 { text-align: center; font-size: 22px; margin: 0 0 8px; }
  .meta { text-align: center; color: #666; font-size: 13px; margin-bottom: 20px; line-height: 1.7; }
  .stamp { border: 2px solid #c0392b; color: #c0392b; display: inline-block; padding: 2px 10px; font-weight: 700; margin-bottom: 12px; }
  h2 { font-size: 16px; margin: 18px 0 8px; border-left: 3px solid #1677ff; padding-left: 8px; }
  p, li { font-size: 14px; line-height: 1.8; }
  .foot { margin-top: 28px; padding-top: 12px; border-top: 1px dashed #ccc; font-size: 12px; color: #888; }
</style>
</head>
<body>
  <div class="wm"></div>
  <div class="wm-text">${Array.from({ length: 18 }, () => `<span>${wm}</span>`).join("")}</div>
  ${statusLayers}
  <div class="doc">
    <div class="stamp">受控文件 · 强制水印 · ${kind}${sw.corner ? " · " + sw.corner : ""}${sw.secret ? " · 机密" : ""}</div>
    <h1>${doc.title || "受控文件"}</h1>
    <div class="meta">
      编号：${doc.docNo}　　版本：${doc.version}　　生效日：${doc.effectiveDate || "-"}<br/>
      编制：${doc.dept || "-"} / ${doc.owner || "-"}　　下载人：${data.user.name}（${data.user.userNo}）<br/>
      ${copyNo ? "纸质受控号：" + copyNo + "<br/>" : ""}
      生成时间：${stamp}　　密级：${statusTag(doc.security).text}
    </div>
    <h2>1 目的</h2>
    <p>规范相关作业流程，确保现行有效版本受控使用，防止无水印传播。</p>
    <h2>2 范围</h2>
    <p>适用于米格实验室相关部门及岗位。本文件为 DCC 系统按权限输出的水印副本。</p>
    <h2>3 本版变更说明</h2>
    <p>${doc.changeSummary || "见版本历史。"}</p>
    <h2>4 正文摘要（演示）</h2>
    <ol>
      <li>仅使用现行有效版本；旧版自动失效，不得继续执行。</li>
      <li>预览 / 下载 / 打印均强制叠加水印，禁止关闭。</li>
      <li>现场张贴须使用带受控号的打印件，并登记纸质台账。</li>
      <li>全文检索关键词示例：冷链、点检、校准、废液、签收。</li>
    </ol>
    <div class="foot">
      米格实验室 DCC 文控系统 · 原型导出件 · 禁止非授权传播<br/>
      提示：可用浏览器「打印 → 另存为 PDF」得到 PDF 归档件。
    </div>
  </div>
</body>
</html>`;
    };

    const triggerBlobDownload = (filename, content, mime) => {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 400);
    };

    const downloadWatermarkFile = (doc, mode, scene) => {
      if (!doc || !doc.docNo) {
        warn("未选择文件");
        return;
      }
      const copyNo =
        mode === "PRINT"
          ? `HC-${doc.docNo.replace(/^MG-/, "")}-${String(Math.floor(Math.random() * 90) + 10)}`
          : "";
      const html = buildWatermarkHtml(doc, mode, copyNo, scene || previewScene.value);
      const tag = mode === "PRINT" ? "受控打印" : "水印下载";
      const filename = `${doc.docNo}_V${doc.version}_${tag}${copyNo ? "_" + copyNo : ""}.html`;
      triggerBlobDownload(filename, html, "text/html;charset=utf-8");
      data.accessLogs.unshift({
        id: Date.now(),
        user: data.user.name,
        docNo: doc.docNo,
        version: doc.version,
        action: mode === "PRINT" ? "PRINT" : "DOWNLOAD",
        time: "2026-07-22 09:50",
        ip: "192.168.1.10",
      });
      toast(`已下载到本地：${filename}（强制水印，可用浏览器打开或另存 PDF）`);
      return copyNo;
    };

    const openDoc = (row) => {
      if (!domainVisible(row)) {
        ElMessage.error("当前角色数据域不可见该文件");
        return;
      }
      currentDoc.value = row;
      distForm.docNo = row.docNo;
      distForm.title = row.title;
      docDetailVisible.value = true;
    };

    const openDocByNo = (docNo) => {
      const doc = data.documents.find((d) => d.docNo === docNo);
      if (doc) openDoc(doc);
      else warn("未找到文件：" + docNo);
    };

    const hardRecycleCount = computed(
      () => data.hardCopies.filter((h) => h.status === "RECYCLE_PENDING").length
    );

    const filteredHardCopies = computed(() => {
      const fid = String(hardCopyFilters.fileId || "").trim();
      const no = String(hardCopyFilters.docNo || "").trim().toUpperCase();
      const title = String(hardCopyFilters.title || "").trim().toLowerCase();
      const st = hardCopyFilters.status || "";
      return (data.hardCopies || []).filter((h) => {
        if (fid) {
          const idStr = String(fileIdOf(h));
          if (idStr === "-" || idStr.indexOf(fid) < 0) return false;
        }
        if (no) {
          const docNo = String(h.docNo || "").toUpperCase();
          if (docNo.indexOf(no) < 0) return false;
        }
        if (title) {
          const t = String(h.title || "").toLowerCase();
          if (t.indexOf(title) < 0) return false;
        }
        if (st && h.status !== st) return false;
        return true;
      });
    });

    const resetHardCopyFilters = () => {
      hardCopyFilters.fileId = "";
      hardCopyFilters.docNo = "";
      hardCopyFilters.title = "";
      hardCopyFilters.status = "";
      listPage.hardCopies = 1;
    };

    watch(
      () => [
        hardCopyFilters.fileId,
        hardCopyFilters.docNo,
        hardCopyFilters.title,
        hardCopyFilters.status,
      ],
      () => {
        listPage.hardCopies = 1;
      }
    );

    const openDistDetail = (row) => {
      currentDistNo.value = row.distNo;
      currentReceiptRows.value =
        (data.receiptDetails && data.receiptDetails[row.distNo]) || [
          { user: "（示例）", dept: "-", status: "PENDING", time: "-" },
        ];
      receiptDetailVisible.value = true;
    };

    const userHasReceived = (docNo) => {
      if (!docNo) return false;
      return roleMyDocs.value.some((m) => m.docNo === docNo && m.receiptStatus === "RECEIVED");
    };

    /** 已签收进入「我的受控文件」：预览/下载/打印不受「本部门非密」限制 */
    const hasMyDocFullAccess = (doc) => {
      if (!doc || !doc.docNo) return false;
      return userHasReceived(doc.docNo);
    };

    /** 借阅通过且未到期：仅授予预览 */
    const hasActiveBorrowPreview = (docNo) => {
      if (!docNo) return false;
      const name = data.user.name;
      const today = demoToday();
      return (data.borrows || []).some(
        (b) =>
          b.docNo === docNo &&
          b.applicant === name &&
          b.status === "BORROWED" &&
          b.expectReturn &&
          String(b.expectReturn) >= today
      );
    };

    const assertDocAccessible = (doc, actionLabel) => {
      if (!doc || !doc.docNo) {
        warn("未选择文件");
        return false;
      }
      if (doc.status === "OBSOLETE" || doc.dead) {
        if (!codeIsCtrl(roleCode.value)) {
          ElMessage.error("文件已废止，除文控外不可" + (actionLabel || "访问"));
          return false;
        }
      }
      if (doc.status === "SUPERSEDED" && !codeIsCtrl(roleCode.value)) {
        ElMessage.error("文件已被替代，除文控外不可" + (actionLabel || "访问"));
        return false;
      }
      if (doc.status === "APPROVED_PENDING" && !codeIsCtrl(roleCode.value)) {
        ElMessage.error("文件待生效，仅文控可见");
        return false;
      }
      // 非现行：该版本纸质份已全部回收/盖废章后，除文控外收回预览下载打印
      if (!codeIsCtrl(roleCode.value) && doc.status !== "EFFECTIVE") {
        const ver = doc.version;
        const copies = (data.hardCopies || []).filter(
          (h) => h.docNo === doc.docNo && (!ver || !h.version || String(h.version) === String(ver))
        );
        if (
          copies.length &&
          copies.every((h) => ["RECYCLED", "VOID_STAMPED", "LOST", "LOST_CONFIRMED"].includes(h.status))
        ) {
          ElMessage.error(
            "该版本纸质份已全部回收，除文控外不可" + (actionLabel || "访问")
          );
          return false;
        }
      }
      // 文控 / 已签收「我的受控文件」：完整操作权限
      if (codeIsCtrl(roleCode.value) || hasMyDocFullAccess(doc)) return true;
      // 台账侧：本部门非密可直接预览/下载/打印
      if (canDeptDirectAccess(doc)) return true;
      // 借阅授权：仅预览
      if (actionLabel === "预览" && hasActiveBorrowPreview(doc.docNo)) return true;
      // 预览不可越权；下载/打印交给后续二次申请
      if (actionLabel === "预览") {
        ElMessage.error(
          "台账仅可预览本部门非密文件；跨部门请走「借阅申请」审批通过后临时预览，或待分发签收后在「我的受控文件」中预览"
        );
        return false;
      }
      return true;
    };

    const openPreview = (row, scene) => {
      const doc = resolveDocMeta(row || currentDoc.value);
      const borrowOk =
        (scene === "BORROW" || hasActiveBorrowPreview(doc && doc.docNo)) &&
        hasActiveBorrowPreview(doc && doc.docNo);
      if (doc && !domainVisible(doc) && doc.docNo && !borrowOk && scene !== "EXTERNAL") {
        ElMessage.error("无预览权限（数据域限制）");
        return;
      }
      if (!assertDocAccessible(doc, "预览")) return;
      currentDoc.value = doc;
      previewScene.value = scene || "";
      previewVisible.value = true;
    };


    const keepReviewMonths = ref(12);
    const keepReviewVisible = ref(false);
    const keepReviewRow = ref(null);
    const openKeepReview = (row) => {
      if (!row || row.status === "DONE") return;
      if (!codeIsCtrl(roleCode.value) && !codeIsLeader(roleCode.value)) {
        return warn("仅部门负责人或文控可处理复审");
      }
      keepReviewRow.value = row;
      keepReviewMonths.value = 12;
      keepReviewVisible.value = true;
    };
    const confirmKeepReview = () => {
      const row = keepReviewRow.value;
      if (!row) return;
      const months = Number(keepReviewMonths.value) || 12;
      const base = row.dueDate && row.dueDate !== "-" ? row.dueDate : demoToday();
      const nextDue = addMonthsYmd(base, months);
      row.status = "DONE";
      row.conclusion = "KEEP";
      row.dueDate = nextDue;
      row.note = `维持有效，顺延 ${months} 个月，复审到期日更新为 ${nextDue}`;
      const doc = data.documents.find((d) => d.docNo === row.docNo && d.status === "EFFECTIVE") ||
        data.documents.find((d) => d.docNo === row.docNo);
      if (doc) doc.reviewDue = nextDue;
      keepReviewVisible.value = false;
      keepReviewRow.value = null;
      toast(`已维持有效：复审日顺延 ${months} 个月 → ${nextDue}`);
    };

    /** 审批弹窗展示的时间线（按单，不串台） */
    const activeApprovalTimeline = ref([]);

    const syncTimelineView = (list) => {
      const arr = Array.isArray(list) ? list.slice() : [];
      activeApprovalTimeline.value = arr;
      data.approvalTimeline.splice(0, data.approvalTimeline.length, ...arr);
    };

    const ensureApplyTimeline = (apply, todo) => {
      if (!apply) return [];
      if (Array.isArray(apply.timeline) && apply.timeline.length) return apply.timeline;
      const typeLabel = apply.type === "CREATE" ? "新建" : apply.type === "REVISE" ? "修订" : "作废";
      apply.timeline = [
        {
          name: "提交申请",
          user: apply.applicant || (todo && String(todo.applicant || "").split("/")[0].trim()) || "-",
          time: apply.submittedAt || (todo && todo.time) || "-",
          status: "done",
          comment: `提交${typeLabel}：${apply.title || (todo && todo.title) || "-"}`,
          signature: "",
          post: "",
          roles: "",
        },
      ];
      return apply.timeline;
    };

    const appendApplyTimeline = (apply, node) => {
      if (!apply) return;
      if (!Array.isArray(apply.timeline)) apply.timeline = [];
      apply.timeline.push(node);
      syncTimelineView(apply.timeline);
    };

    /** 我的申请 · 详情（只读：基本信息 + 审批时间线） */
    const openApplyDetail = (row) => {
      if (!row) return warn("未选择申请单");
      const apply = data.applies.find((a) => a.id === row.id || a.applyNo === row.applyNo) || row;
      currentApply.value = apply;
      applyDetailTimeline.value = ensureApplyTimeline(apply);
      applyDetailVisible.value = true;
    };

    const openApprove = (todo) => {
      currentTodo.value = todo;
      approveComment.value = "";
      approveSignature.value = `${data.user.name}/${data.user.userNo}`;
      let tl = [];
      if (todo && isDocApplyBiz(todo.bizType) && todo.applyId != null) {
        const apply = data.applies.find((a) => a.id === todo.applyId);
        tl = ensureApplyTimeline(apply, todo);
      } else if (todo && todo.bizType === "ACCESS" && todo.applyId != null) {
        const aa = data.accessApplies.find((a) => a.id === todo.applyId);
        if (aa) {
          if (!Array.isArray(aa.timeline) || !aa.timeline.length) {
            aa.timeline = [
              {
                name: "提交申请",
                user: aa.applicant || "-",
                time: aa.submittedAt || todo.time || "-",
                status: "done",
                comment: `提交${aa.action === "PRINT" ? "打印" : "下载"}二次申请`,
                signature: "",
                post: "",
                roles: "",
              },
            ];
          }
          tl = aa.timeline;
        }
      } else if (todo) {
        tl = [
          {
            name: "提交申请",
            user: String(todo.applicant || "-").split("/")[0].trim() || "-",
            time: todo.time || "-",
            status: "done",
            comment: todo.detail || todo.node || "",
            signature: "",
            post: "",
            roles: "",
          },
        ];
      }
      syncTimelineView(tl);
      approveVisible.value = true;
    };

    const removeTodoMatch = (todo) => {
      const matchIdx = data.todos.findIndex((t) => {
        if (!todo) return false;
        if (todo.id != null && t.id === todo.id) return true;
        if (todo.applyId != null && t.applyId === todo.applyId && t.bizType === todo.bizType) return true;
        if (todo.bizType === "EXTERNAL" || todo.releaseId != null) return false;
        if (todo.bizType === "BORROW" || todo.borrowId != null) return false;
        if (todo.bizType === "ACCESS") return false;
        return !!(todo.docNo && t.docNo === todo.docNo);
      });
      if (matchIdx >= 0) data.todos.splice(matchIdx, 1);
    };

    const isDocApplyBiz = (biz) => biz === "CREATE" || biz === "REVISE" || biz === "OBSOLETE";

    /**
     * 生成纸质待回收（换版/作废）。
     * 换版须回收旧版纸质份：传入 oldVersion / reason，勿用新版 version。
     */
    const spawnHardcopyRecycle = (doc, opts = {}) => {
      if (!doc && !opts.docNo) return 0;
      const docNo = opts.docNo || doc.docNo;
      if (!docNo) return 0;
      const version = opts.version != null ? opts.version : (doc && doc.version) || "-";
      const title = opts.title || (doc && doc.title) || "-";
      const reason =
        opts.reason ||
        ((doc && doc.status === "OBSOLETE") ? "文件废止回收" : "换版回收");
      let n = 0;
      data.hardCopies.forEach((h) => {
        if (h.docNo !== docNo) return;
        // 换版：只收旧版纸质份（版本与旧版一致，或尚无版本字段的历史份）
        if (opts.version != null && h.version && String(h.version) !== String(opts.version)) return;
        if (h.status === "IN_USE" || h.status === "RECYCLE_PENDING") {
          h.status = "RECYCLE_PENDING";
          h.recycleReason = reason;
          if (!h.version || h.version === "-") h.version = version;
          n += 1;
        }
      });
      // 若无旧版纸质份，演示补一条「旧版」待回收（版本用旧版）
      if (!n) {
        const id = Date.now();
        data.hardCopies.unshift({
          id,
          copyNo: `HC-${docNo}-R${String(id).slice(-4)}`,
          docNo,
          title,
          version,
          status: "RECYCLE_PENDING",
          printedAt: demoToday(),
          holder: "现场存档",
          location: "待核实",
          recycleReason: reason,
        });
        n = 1;
      }
      syncHardRecycleStats();
      return n;
    };

    /** 修订生效：旧版已替代 + 变更单 + 通知签收人 + 纸质回收（旧版） */
    const onReviseActivated = (newDoc, oldDoc) => {
      const today = demoToday();
      if (oldDoc) {
        oldDoc.status = "SUPERSEDED";
        oldDoc.obsoleteDate = today;
      }
      const oldVer = oldDoc ? oldDoc.version : "-";
      // 变更单回收进度按旧版纸质份统计
      const related = data.hardCopies.filter(
        (h) => h.docNo === newDoc.docNo && (!oldVer || oldVer === "-" || !h.version || String(h.version) === String(oldVer))
      );
      const total = Math.max(related.length, 1);
      const changeId = Date.now();
      const changeNo = "ECN" + String(changeId).slice(-10);
      data.changes.unshift({
        id: changeId,
        changeNo,
        docNo: newDoc.docNo,
        title: newDoc.title,
        fromVer: oldVer,
        toVer: newDoc.version,
        status: "RECYCLING",
        recycleProgress: "0/" + total,
        createdAt: today,
        fileLevel: newDoc.fileLevel,
        productType: newDoc.productType,
        ownerDept: newDoc.ownerDept,
      });
      const msg = `${newDoc.docNo}已更新到${newDoc.version}`;
      const receivers = new Set();
      (data.myDocs || []).forEach((m) => {
        if (m.docNo === newDoc.docNo && m.receiptStatus === "RECEIVED") {
          (m.forRoles || []).forEach((rc) => {
            const role = data.demoRoles.find((r) => r.roleCode === rc);
            if (role) receivers.add(role.name);
          });
          if (m.receiptBy) receivers.add(m.receiptBy);
        }
      });
      data.notices.unshift({
        id: changeId + 1,
        noticeNo: "NT" + String(changeId).slice(-10),
        docNo: newDoc.docNo,
        title: newDoc.title,
        version: newDoc.version,
        content: msg,
        status: "SENT",
        sentAt: today + " 09:00",
        urgeCount: 0,
        receivers: [...receivers].join("、") || "全体已签收人",
      });
      // 纸质回收必须挂旧版版本号，不能用新版
      spawnHardcopyRecycle(oldDoc || newDoc, {
        docNo: newDoc.docNo,
        version: oldVer !== "-" ? oldVer : undefined,
        title: (oldDoc && oldDoc.title) || newDoc.title,
        reason: "换版回收（旧版 " + (oldVer !== "-" ? oldVer : "原版") + "）",
      });
      refreshChangeRecycleProgress(newDoc.docNo);
      toast(`新版已生效：${msg}；已生成变更单 ${changeNo}，纸质待回收为旧版 ${oldVer}`);
    };

    /** 确切生效日格式：YYYY-MM-DD（含合法日历日） */
    const isExactYmd = (s) => {
      const v = String(s || "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
      const y = Number(v.slice(0, 4));
      const m = Number(v.slice(5, 7));
      const d = Number(v.slice(8, 10));
      if (m < 1 || m > 12 || d < 1 || d > 31) return false;
      const dt = new Date(y, m - 1, d);
      return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
    };

    const syncApplyPublishedOnActivate = (doc) => {
      if (!doc) return;
      (data.applies || []).forEach((a) => {
        if (a.type !== "CREATE" && a.type !== "REVISE") return;
        if (a.status !== "APPROVED_PENDING" && a.status !== "APPROVED") return;
        const sameFile =
          (a.fileId != null && (a.fileId === doc.fileId || a.fileId === doc.id)) ||
          (a.docNo === doc.docNo && String(a.targetVersion || "") === String(doc.version || ""));
        if (sameFile) a.status = "PUBLISHED";
      });
    };

    const activatePendingDoc = (doc) => {
      if (!doc || doc.status !== "APPROVED_PENDING") return;
      const today = demoToday();
      doc.status = "EFFECTIVE";
      doc.effectiveDate = doc.plannedEffectiveDate || today;
      if (doc.replacesFileId != null) {
        const oldDoc = data.documents.find(
          (d) => (d.fileId === doc.replacesFileId || d.id === doc.replacesFileId) && d !== doc
        );
        onReviseActivated(doc, oldDoc);
      }
      syncApplyPublishedOnActivate(doc);
    };

    /** 借阅到期收回预览；外发到期令牌失效 */
    const expireBorrowsAndExternals = () => {
      const today = demoToday();
      (data.borrows || []).forEach((b) => {
        if ((b.status === "BORROWED" || b.status === "OVERDUE") && b.expectReturn && String(b.expectReturn) < today) {
          b.status = "EXPIRED";
          b.previewGranted = false;
        }
      });
      (data.externals || []).forEach((e) => {
        if (
          (e.status === "APPROVED" || e.status === "ACTIVE") &&
          e.expireDate &&
          String(e.expireDate) < today
        ) {
          e.status = "EXPIRED";
          e.tokenActive = false;
        }
      });
    };

    /** 扫描待生效：到达计划生效日 → 现行有效（文控方可分发） */
    const activateDueDocuments = () => {
      const today = demoToday();
      (data.documents || []).forEach((doc) => {
        if (doc.status !== "APPROVED_PENDING") return;
        const ped = doc.plannedEffectiveDate || doc.effectiveDate;
        if (ped && String(ped) <= today) activatePendingDoc(doc);
      });
      expireBorrowsAndExternals();
    };

    /** 新建/修订/作废终审或文控直办后落库 */
    const finalizeDocApply = (apply) => {
      if (!apply) return;
      const today = demoToday();
      const planned = apply.plannedEffectiveDate || "";
      // 新建/修订必须有合法确切生效日；未到日则申请为「待生效」，到日才「已发布」
      if (apply.type === "CREATE" || apply.type === "REVISE") {
        if (!isExactYmd(planned)) {
          warn("确切生效日须为 YYYY-MM-DD（如 2026-08-01），无法落库");
          return;
        }
      }
      if (apply.type === "CREATE") {
        let doc = data.documents.find((d) => d.docNo === apply.docNo && d.status !== "SUPERSEDED" && d.status !== "OBSOLETE");
        const fid = apply.fileId != null ? apply.fileId : nextFileId();
        if (!doc) {
          doc = {
            id: fid,
            fileId: fid,
            docNo: apply.docNo,
            title: apply.title,
            category: apply.category || "SOP",
            fileLevel: apply.fileLevel || "L2",
            productType: apply.productType || "COMMON",
            ownerDept: apply.ownerDept || apply.dept || data.user.dept,
            dept: apply.dept || data.user.dept,
            version: apply.targetVersion || "1.0",
            status: "APPROVED_PENDING",
            security: "INTERNAL",
            accessDomain: "PROD",
            owner: apply.applicant,
            plannedEffectiveDate: planned,
            effectiveDate: planned,
            allowDownload: true,
            allowPrint: true,
            fileName: apply.fileName || "",
            fileSize: apply.fileSize || 0,
            fileUrl: apply.fileUrl || "",
          };
          data.documents.unshift(doc);
        } else {
          doc.title = apply.title || doc.title;
          doc.status = "APPROVED_PENDING";
          doc.plannedEffectiveDate = planned;
          doc.effectiveDate = planned;
          doc.fileId = doc.fileId != null ? doc.fileId : fid;
          if (apply.fileName) {
            doc.fileName = apply.fileName;
            doc.fileSize = apply.fileSize || 0;
            doc.fileUrl = apply.fileUrl || "";
          }
        }
        if (String(planned) <= today) {
          activatePendingDoc(doc);
          apply.status = "PUBLISHED";
        } else {
          apply.status = "APPROVED_PENDING";
        }
      } else if (apply.type === "REVISE") {
        const oldDoc =
          data.documents.find((d) => d.docNo === apply.docNo && d.status === "EFFECTIVE") ||
          data.documents.find((d) => d.docNo === apply.docNo && d.status === "REVISING") ||
          data.documents.find((d) => d.docNo === apply.docNo);
        const newFid = nextFileId();
        const newVer = apply.targetVersion || "2.0";
        const newDoc = {
          id: newFid,
          fileId: newFid,
          docNo: apply.docNo,
          title: apply.title || (oldDoc && oldDoc.title) || "-",
          category: (oldDoc && oldDoc.category) || apply.category || "SOP",
          fileLevel: apply.fileLevel || (oldDoc && oldDoc.fileLevel) || "L2",
          productType: apply.productType || (oldDoc && oldDoc.productType) || "COMMON",
          ownerDept: apply.ownerDept || (oldDoc && oldDoc.ownerDept) || apply.dept,
          dept: apply.dept || (oldDoc && oldDoc.dept),
          version: newVer,
          status: "APPROVED_PENDING",
          security: (oldDoc && oldDoc.security) || "INTERNAL",
          accessDomain: (oldDoc && oldDoc.accessDomain) || "PROD",
          owner: apply.applicant,
          plannedEffectiveDate: planned,
          effectiveDate: planned,
          replacesFileId: oldDoc ? oldDoc.fileId != null ? oldDoc.fileId : oldDoc.id : null,
          allowDownload: true,
          allowPrint: true,
          changeSummary: apply.reason || "",
          fileName: apply.fileName || "",
          fileSize: apply.fileSize || 0,
          fileUrl: apply.fileUrl || "",
        };
        data.documents.unshift(newDoc);
        if (oldDoc && oldDoc.status === "EFFECTIVE") {
          // 生效日前旧版仍现行；新版待生效仅文控可见
        }
        apply.fileId = newFid;
        if (String(planned) <= today) {
          activatePendingDoc(newDoc);
          apply.status = "PUBLISHED";
        } else {
          apply.status = "APPROVED_PENDING";
        }
      } else if (apply.type === "OBSOLETE") {
        const doc =
          data.documents.find((d) => d.docNo === apply.docNo && d.status === "EFFECTIVE") ||
          data.documents.find((d) => d.docNo === apply.docNo);
        if (doc) {
          doc.status = "OBSOLETE";
          doc.obsoleteDate = today;
          doc.dead = true;
          doc.allowDownload = false;
          doc.allowPrint = false;
          spawnHardcopyRecycle(doc);
        }
        apply.status = "APPROVED";
      }
      activateDueDocuments();
    };

    const doApprove = (pass) => {
      if (!approveSignature.value.trim()) {
        warn("请完成电子签名（姓名/工号）后再提交");
        return;
      }
      if (!pass && !approveComment.value.trim()) {
        warn("驳回时审批意见必填");
        return;
      }
      if (!hasPerm("dcc:approve") && !codeIsCtrl(roleCode.value) && !codeIsLeader(roleCode.value)) {
        ElMessage.error("当前岗位无审批权限");
        return;
      }
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      const todo = currentTodo.value;

      // 新建/修订/作废：员工 → 负责人一审 → 文控二审；负责人提交仅文控审
      if (todo && isDocApplyBiz(todo.bizType) && todo.applyId != null) {
        const apply = data.applies.find((a) => a.id === todo.applyId);
        const step = todo.applyStep || "CTRL";
        if (!pass) {
          if (apply) {
            apply.status = "REJECTED";
            ensureApplyTimeline(apply, todo);
            appendApplyTimeline(apply, {
              name: step === "DEPT" ? "部门审核" : "文控审核",
              user: data.user.name,
              time: now,
              status: "done",
              comment: approveComment.value || "驳回",
              signature: approveSignature.value,
              post: data.user.post,
              roles: `${data.user.roleCode},dcc:approve`,
            });
          }
          removeTodoMatch(todo);
          syncRoleStats();
          approveVisible.value = false;
          currentTodo.value = null;
          toast("已驳回申请 · 签名已留痕");
          if (route.value !== "todoApprove") navigate("todoApprove");
          return;
        }
        if (step === "DEPT") {
          if (!codeIsLeader(roleCode.value) && !codeIsCtrl(roleCode.value)) {
            ElMessage.error("仅本部门负责人可进行初审");
            return;
          }
          ensureApplyTimeline(apply, todo);
          appendApplyTimeline(apply, {
            name: "部门审核",
            user: data.user.name,
            time: now,
            status: "done",
            comment: approveComment.value || "同意，转文控终审",
            signature: approveSignature.value,
            post: data.user.post,
            roles: `${data.user.roleCode},dcc:approve`,
          });
          removeTodoMatch(todo);
          data.todos.unshift({
            id: Date.now(),
            applyId: todo.applyId,
            bizType: todo.bizType,
            applyStep: "CTRL",
            fileId: todo.fileId,
            docNo: todo.docNo,
            title: todo.title,
            fileLevel: todo.fileLevel,
            productType: todo.productType,
            applicant: todo.applicant,
            applicantDept: todo.applicantDept || data.user.dept,
            node: "文控审核（终审）",
            time: now,
            detail:
              (todo.detail || "") +
              `；部门负责人 ${data.user.name} 已通过，转文控终审`,
            forRoles: ["DCC_CONTROLLER", "DCC_ADMIN"],
          });
          syncRoleStats();
          approveVisible.value = false;
          currentTodo.value = null;
          toast(`部门负责人初审已通过 · 已转文控待我审批 · ${approveSignature.value}`);
          if (route.value !== "todoApprove") navigate("todoApprove");
          return;
        }
        if (!codeIsCtrl(roleCode.value)) {
          ElMessage.error("仅文控可进行终审");
          return;
        }
        if (apply) {
          ensureApplyTimeline(apply, todo);
          appendApplyTimeline(apply, {
            name: "文控审核",
            user: data.user.name,
            time: now,
            status: "done",
            comment: approveComment.value || "同意（文控终审）",
            signature: approveSignature.value,
            post: data.user.post,
            roles: `${data.user.roleCode},dcc:approve`,
          });
          finalizeDocApply(apply);
        }
        removeTodoMatch(todo);
        syncRoleStats();
        approveVisible.value = false;
        currentTodo.value = null;
        toast(`文控终审已通过 · ${approveSignature.value} · ${now}`);
        if (route.value !== "todoApprove") navigate("todoApprove");
        return;
      }

      // 打印/下载二次申请：员工→负责人→文控；负责人提交直接文控
      if (todo && todo.bizType === "ACCESS" && todo.applyId != null) {
        const aa = data.accessApplies.find((a) => a.id === todo.applyId);
        const step = todo.accessStep || "DEPT";
        const pushAccessTl = (name, comment) => {
          if (!aa) return;
          if (!Array.isArray(aa.timeline)) aa.timeline = [];
          aa.timeline.push({
            name,
            user: data.user.name,
            time: now,
            status: "done",
            comment,
            signature: approveSignature.value,
            post: data.user.post,
            roles: `${data.user.roleCode},dcc:approve`,
          });
          syncTimelineView(aa.timeline);
        };
        if (!pass) {
          if (aa) aa.status = "REJECTED";
          pushAccessTl(step === "DEPT" ? "部门审核" : "文控备案", approveComment.value || "驳回");
          removeTodoMatch(todo);
          syncRoleStats();
          approveVisible.value = false;
          currentTodo.value = null;
          toast("已驳回打印/下载二次申请 · 签名已留痕");
          if (route.value !== "todoApprove") navigate("todoApprove");
          return;
        }
        if (step === "DEPT") {
          pushAccessTl("部门审核", approveComment.value || "同意，转文控备案");
          removeTodoMatch(todo);
          data.todos.unshift({
            id: Date.now(),
            applyId: todo.applyId,
            bizType: "ACCESS",
            accessStep: "CTRL",
            action: todo.action,
            docNo: todo.docNo,
            title: todo.title,
            fileLevel: todo.fileLevel,
            productType: todo.productType,
            applicant: todo.applicant,
            applicantDept: todo.applicantDept,
            node: "文控备案（打印/下载二次申请）",
            time: now,
            forRoles: ["DCC_CONTROLLER", "DCC_ADMIN"],
          });
          syncRoleStats();
          approveVisible.value = false;
          currentTodo.value = null;
          toast(`部门负责人初审已通过 · 已转文控备案 · ${approveSignature.value}`);
          if (route.value !== "todoApprove") navigate("todoApprove");
          return;
        }
        if (aa) aa.status = "APPROVED";
        pushAccessTl("文控备案", approveComment.value || "同意（文控备案）");
        removeTodoMatch(todo);
        syncRoleStats();
        approveVisible.value = false;
        currentTodo.value = null;
        toast(`文控备案通过 · 申请人可继续打印/下载 · ${approveSignature.value}`);
        if (route.value !== "todoApprove") navigate("todoApprove");
        return;
      }

      // 借阅：员工→负责人初审→文控终审；负责人提交直接文控
      if (todo && todo.bizType === "BORROW" && todo.borrowId != null) {
        const br = data.borrows.find((b) => b.id === todo.borrowId);
        const step = todo.borrowStep || "DEPT";
        if (!pass) {
          if (br) br.status = "REJECTED";
          removeTodoMatch(todo);
          syncRoleStats();
          approveVisible.value = false;
          currentTodo.value = null;
          toast("已驳回借阅申请 · 签名已留痕");
          if (route.value !== "todoApprove") navigate("todoApprove");
          return;
        }
        if (step === "DEPT") {
          removeTodoMatch(todo);
          data.todos.unshift({
            id: Date.now(),
            borrowId: todo.borrowId,
            bizType: "BORROW",
            borrowStep: "CTRL",
            docNo: todo.docNo,
            title: todo.title,
            fileLevel: todo.fileLevel,
            productType: todo.productType,
            applicant: todo.applicant,
            applicantDept: todo.applicantDept,
            node: "文控审核（借阅终审）",
            time: now,
            detail: (todo.detail || "") + `；部门负责人 ${data.user.name} 已通过，转文控终审`,
            forRoles: ["DCC_CONTROLLER", "DCC_ADMIN"],
          });
          syncRoleStats();
          approveVisible.value = false;
          currentTodo.value = null;
          toast(`借阅部门初审已通过 · 已转文控终审 · ${approveSignature.value}`);
          if (route.value !== "todoApprove") navigate("todoApprove");
          return;
        }
        if (br) {
          br.status = "BORROWED";
          br.previewGranted = true;
          br.approvedAt = now;
          br.approvedBy = data.user.name;
        }
        removeTodoMatch(todo);
        syncRoleStats();
        approveVisible.value = false;
        currentTodo.value = null;
        toast(`借阅终审通过 · 申请人已获临时预览权至 ${br && br.expectReturn ? br.expectReturn : "-"} · ${approveSignature.value}`);
        if (route.value !== "todoApprove") navigate("todoApprove");
        return;
      }

      // 外发：通过后生成访问令牌与专用水印包
      if (todo && (todo.bizType === "EXTERNAL" || todo.releaseId != null)) {
        const fallTl = activeApprovalTimeline.value.slice();
        fallTl.push({
          name: todo && todo.node ? String(todo.node).replace(/（.*）/, "") || "审批" : "审批",
          user: data.user.name,
          time: now,
          status: "done",
          comment: approveComment.value || (pass ? "同意" : "驳回"),
          signature: approveSignature.value,
          post: data.user.post,
          roles: `${data.user.roleCode},dcc:approve`,
        });
        syncTimelineView(fallTl);
        const ext = data.externals.find((e) => e.id === todo.releaseId);
        if (!pass) {
          if (ext) ext.status = "REJECTED";
          removeTodoMatch(todo);
          syncRoleStats();
          approveVisible.value = false;
          currentTodo.value = null;
          toast("已驳回外发申请 · 签名已留痕");
          if (route.value !== "todoApprove") navigate("todoApprove");
          return;
        }
        if (ext) activateExternalRelease(ext);
        removeTodoMatch(todo);
        syncRoleStats();
        approveVisible.value = false;
        currentTodo.value = null;
        toast(`外发已批准 · 已生成访问令牌与专用水印包 · ${approveSignature.value}`);
        if (route.value !== "todoApprove") navigate("todoApprove");
        return;
      }

      // 其它待办：在当前弹窗时间线上追加一条
      const fallTl = activeApprovalTimeline.value.slice();
      fallTl.push({
        name: todo && todo.node ? String(todo.node).replace(/（.*）/, "") || "审批" : "审批",
        user: data.user.name,
        time: now,
        status: "done",
        comment: approveComment.value || (pass ? "同意" : "驳回"),
        signature: approveSignature.value,
        post: data.user.post,
        roles: `${data.user.roleCode},dcc:approve`,
      });
      syncTimelineView(fallTl);

      removeTodoMatch(todo);
      syncRoleStats();

      if (todo && todo.applyId != null) {
        const apply = data.applies.find((a) => a.id === todo.applyId);
        if (apply) apply.status = pass ? "APPROVED" : "REJECTED";
      } else if (todo && todo.id != null) {
        const apply = data.applies.find((a) => a.id === todo.id || a.id === todo.applyId);
        if (apply) apply.status = pass ? "APPROVED" : "REJECTED";
      }

      approveVisible.value = false;
      currentTodo.value = null;
      toast(
        pass
          ? `审批已通过 · 签名 ${approveSignature.value} · ${now}`
          : `已驳回 · 签名已留痕`
      );
      if (route.value !== "todoApprove") {
        navigate("todoApprove");
      }
    };

    /** 业务领域：支持单码或逗号多码 → 中文名逗号拼接 */
    const ptName = (code) => {
      const codes = csvSplit(code);
      if (!codes.length) return "-";
      return codes
        .map((c) => {
          const p = data.productTypes.find((x) => x.code === c);
          return p ? p.name : c;
        })
        .join(",");
    };

    const levelName = (code) => {
      const p = (data.fileLevels || []).find((x) => x.code === code);
      return p ? p.name : code || "-";
    };

    /** 所属部门展示（已是中文名逗号串则原样规范化） */
    const deptNames = (v) => {
      const parts = csvSplit(v);
      return parts.length ? parts.join(",") : "-";
    };

    const displayVersion = (doc) => {
      if (!doc) return "-";
      const ver = doc.version || "-";
      if (doc.fileLevel === "L3" && doc.formRevision && doc.formRevision !== "r0") {
        return `${ver} / ${doc.formRevision}`;
      }
      return ver;
    };

    const productTypeFileRows = computed(() => {
      return data.documents.map((d) => ({
        fileId: d.fileId != null ? d.fileId : d.id,
        docNo: d.docNo,
        title: d.title,
        fileLevel: d.fileLevel,
        fileLevelName: d.fileLevelName || levelName(d.fileLevel),
        productType: d.productType,
        productTypeName: d.productTypeName || ptName(d.productType),
        ownerDept: d.ownerDept,
        webEditable: d.webEditable,
        category: d.category,
        version: d.version,
        formRevision: d.formRevision,
        status: d.status,
        accessDomain: d.accessDomain,
        effectiveDate: d.effectiveDate,
        owner: d.owner,
        security: d.security,
      }));
    });

    const formRevisionRows = computed(() => {
      const doc = currentDoc.value;
      if (!doc || doc.fileLevel !== "L3") return [];
      const hist = (data.formRevisionHistories && data.formRevisionHistories[doc.docNo]) || [];
      return hist.map((h) => ({
        rev: h.rev || "-",
        at: h.at || "-",
        author: h.author || "-",
        summary: h.summary || "-",
      }));
    });

    const ownerDeptFileRows = computed(() => {
      return data.documents.map((d) => ({
        fileId: d.fileId != null ? d.fileId : d.id,
        docNo: d.docNo,
        title: d.title,
        ownerDept: d.ownerDept || "-",
        fileLevelName: d.fileLevelName || levelName(d.fileLevel),
        productTypeName: d.productTypeName || ptName(d.productType),
        security: d.security,
        status: d.status,
        version: d.version,
        owner: d.owner,
      }));
    });

    const countDocsByOwnerDept = (name) => data.documents.filter((d) => csvHas(d.ownerDept, name)).length;

    /** 从详情/复审带入的目标文件编号；菜单直接进新建/修订时不带默认业务数据 */
    const applySourceDocNo = ref("");

    const resolveApplyBaseDoc = (source) => {
      let baseDoc = null;
      if (source) {
        if (typeof source === "string") {
          baseDoc = data.documents.find((x) => x.docNo === source) || null;
        } else if (source.docNo) {
          baseDoc = data.documents.find((x) => x.docNo === source.docNo) || source;
        }
      }
      if (!baseDoc && applySourceDocNo.value) {
        baseDoc = data.documents.find((x) => x.docNo === applySourceDocNo.value) || null;
      }
      return baseDoc;
    };

    const resetCreateFormEmpty = (mode) => {
      Object.assign(createForm, {
        fileId: null,
        docNo: "",
        title: "",
        category: "",
        fileLevel: "",
        productType: [],
        accessDomain: "",
        security: "",
        ownerDept: [],
        owner: "",
        reason: "",
        plannedEffectiveDate: "",
        reviewCycleMonths: null,
        allowDownload: true,
        allowPrint: true,
        changeSummary: "",
        baseDocNo: "",
        obsoleteReason: "",
        fileName: "",
        fileSize: 0,
        fileUrl: "",
        targetVersion: mode === "CREATE" ? "1.0" : "",
      });
    };

    /** 修订/作废：按选中主档回填表单（编号/名称可搜索关联） */
    const fillCreateFormFromDoc = (mode, baseDoc) => {
      if (!baseDoc || !baseDoc.docNo) {
        resetCreateFormEmpty(mode);
        return;
      }
      const baseNo = baseDoc.docNo || "";
      const nextMajor = (() => {
        const m = String(baseDoc.version || "1.0").match(/^(\d+)/);
        return m ? parseInt(m[1], 10) + 1 + ".0" : "2.0";
      })();
      Object.assign(createForm, {
        fileId: baseDoc.fileId != null ? baseDoc.fileId : baseDoc.id != null ? baseDoc.id : null,
        docNo: baseNo,
        title: baseDoc.title || "",
        category: baseDoc.category || "",
        fileLevel: baseDoc.fileLevel || "",
        productType: csvSplit(baseDoc.productType),
        accessDomain: baseDoc.accessDomain || "",
        security: baseDoc.security === "PUBLIC" ? "INTERNAL" : baseDoc.security || "",
        ownerDept: csvSplit(baseDoc.ownerDept || baseDoc.dept || ""),
        owner: baseDoc.owner || "",
        reason: "",
        plannedEffectiveDate: "",
        reviewCycleMonths: null,
        allowDownload: baseDoc.allowDownload != null ? !!baseDoc.allowDownload : true,
        allowPrint: true,
        changeSummary: "",
        baseDocNo: baseNo,
        obsoleteReason: "",
        fileName: "",
        fileSize: 0,
        fileUrl: "",
        targetVersion: mode === "REVISE" ? nextMajor : "-",
      });
    };

    /** 修订/作废：编号或名称下拉检索后关联回填 */
    const onApplyDocChange = (docNo) => {
      const mode = applyMode.value;
      if (mode !== "REVISE" && mode !== "OBSOLETE") return;
      if (!docNo) {
        resetCreateFormEmpty(mode);
        return;
      }
      const doc =
        effectiveDocOptions.value.find((d) => d.docNo === docNo) ||
        data.documents.find((d) => d.docNo === docNo) ||
        null;
      fillCreateFormFromDoc(mode, doc);
    };

    const openApply = (mode, source) => {
      applyMode.value = mode;
      const baseDoc = resolveApplyBaseDoc(source);

      // 新建：始终空白，不预填演示编号/生效日等
      if (mode === "CREATE") {
        resetCreateFormEmpty("CREATE");
        applySourceDocNo.value = "";
        applyDrawer.value = true;
        return;
      }

      // 修订/作废：仅当从详情等带入文件时预填；菜单入口空白，靠编号/名称搜索关联
      if (!baseDoc) {
        resetCreateFormEmpty(mode);
      } else {
        fillCreateFormFromDoc(mode, baseDoc);
      }
      applySourceDocNo.value = "";
      applyDrawer.value = true;
    };

    /** 详情/复审：发起修订，带入当前文件 */
    const startRevise = (row) => {
      const src = row || currentDoc.value;
      const doc = src && src.docNo ? data.documents.find((d) => d.docNo === src.docNo) || src : null;
      if (!doc || !doc.docNo) return warn("未选择要修订的文件");
      applySourceDocNo.value = doc.docNo;
      docDetailVisible.value = false;
      if (route.value === "applies") openApply("REVISE", doc);
      else navigate("applies", { openApply: "REVISE" });
    };

    /** 详情/复审：发起作废，带入当前文件 */
    const startObsolete = (row) => {
      const src = row || currentDoc.value;
      const doc = src && src.docNo ? data.documents.find((d) => d.docNo === src.docNo) || src : null;
      if (!doc || !doc.docNo) return warn("未选择要作废的文件");
      applySourceDocNo.value = doc.docNo;
      docDetailVisible.value = false;
      if (route.value === "applies") openApply("OBSOLETE", doc);
      else navigate("applies", { openApply: "OBSOLETE" });
    };

    const submitApply = () => {
      if (!createForm.docNo.trim()) return warn("请填写文件编号");
      if (!createForm.title.trim()) return warn("请填写文件名称");
      if (applyMode.value === "CREATE") {
        if (!createForm.fileLevel) return warn("请选择文件级别");
        if (!csvSplit(createForm.productType).length) return warn("请至少选择一个业务领域");
        if (!csvSplit(createForm.ownerDept).length) return warn("请至少选择一个所属部门");
        if (!createForm.reason.trim() || createForm.reason.trim().length < 10) return warn("编制原因必填（至少 10 字）");
        if (!createForm.plannedEffectiveDate || !String(createForm.plannedEffectiveDate).trim()) {
          return warn("必须填写确切生效日");
        }
        if (!isExactYmd(createForm.plannedEffectiveDate)) {
          return warn("确切生效日格式必须为 YYYY-MM-DD（如 2026-08-01），当前格式不正确，无法提交");
        }
      }
      if (applyMode.value === "REVISE") {
        createForm.baseDocNo = createForm.docNo;
        if (!csvSplit(createForm.productType).length) return warn("请至少选择一个业务领域");
        if (!csvSplit(createForm.ownerDept).length) return warn("请至少选择一个所属部门");
        if (!createForm.changeSummary.trim() || createForm.changeSummary.trim().length < 10) return warn("变更原因必填（至少 10 字，禁止空泛填写）");
        if (!createForm.plannedEffectiveDate || !String(createForm.plannedEffectiveDate).trim()) {
          return warn("修订必须填写新版确切生效日");
        }
        if (!isExactYmd(createForm.plannedEffectiveDate)) {
          return warn("确切生效日格式必须为 YYYY-MM-DD（如 2026-08-01），当前格式不正确，无法提交");
        }
      }
      if (applyMode.value === "OBSOLETE") {
        createForm.baseDocNo = createForm.docNo;
        if (!createForm.obsoleteReason.trim() || createForm.obsoleteReason.trim().length < 10) return warn("作废原因必填（至少 10 字）");
      }
      if (
        (applyMode.value === "CREATE" || applyMode.value === "REVISE") &&
        !String(createForm.fileName || "").trim()
      ) {
        return warn("请上传正文附件（支持 pdf / doc / docx / xls / xlsx）");
      }

      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      const applyId = Date.now();
      const applyNo = "DA" + String(applyId).slice(-11);
      const typeLabel = applyMode.value === "CREATE" ? "新建" : applyMode.value === "REVISE" ? "修订" : "作废";
      const reason =
        applyMode.value === "CREATE"
          ? createForm.reason
          : applyMode.value === "REVISE"
            ? createForm.changeSummary
            : createForm.obsoleteReason;
      const productTypeCsv = csvJoin(createForm.productType);
      const ownerDeptCsv = csvJoin(createForm.ownerDept);
      // 新建：提交时自动分配文件ID；修订/作废：沿用主档文件ID
      let fileId = createForm.fileId;
      if (applyMode.value === "CREATE" || fileId == null || fileId === "") {
        if (applyMode.value === "CREATE") fileId = nextFileId();
        else {
          const base = data.documents.find((d) => d.docNo === createForm.docNo);
          fileId = base ? base.fileId != null ? base.fileId : base.id : nextFileId();
        }
      }
      createForm.fileId = fileId;

      const applyRow = {
        id: applyId,
        applyNo,
        type: applyMode.value,
        fileId,
        docNo: createForm.docNo,
        title: createForm.title,
        category: createForm.category,
        fileLevel: createForm.fileLevel,
        productType: productTypeCsv,
        ownerDept: ownerDeptCsv,
        status: "IN_APPROVAL",
        applicant: data.user.name,
        dept: data.user.dept,
        submittedAt: now,
        targetVersion: applyMode.value === "CREATE" ? "1.0" : applyMode.value === "REVISE" ? "2.0" : "-",
        reason,
        plannedEffectiveDate: createForm.plannedEffectiveDate || "",
        fileName: createForm.fileName || "",
        fileSize: createForm.fileSize || 0,
        fileUrl: createForm.fileUrl || "",
      };
      data.applies.unshift(applyRow);

      const code = roleCode.value;
      const applicantDept = data.user.dept || "";
      const timelineBase = {
        name: "提交申请",
        user: data.user.name,
        time: now,
        status: "done",
        comment: `提交${typeLabel}：${createForm.title}`,
        signature: `${data.user.name}/${data.user.userNo}`,
        post: data.user.post,
        roles: data.user.roleCode,
      };

      // 时间线只记已发生节点：提交时仅「提交申请」；后续审批再追加
      applyRow.timeline = [timelineBase];

      // 文控：直接办理，无需任何审批
      if (codeIsCtrl(code)) {
        applyRow.timeline.push({
          name: "文控直办",
          user: data.user.name,
          time: now,
          status: "done",
          comment: "文控直接办理，无需审批",
          signature: `${data.user.name}/${data.user.userNo}`,
          post: data.user.post,
          roles: `${data.user.roleCode},dcc:approve`,
        });
        finalizeDocApply(applyRow);
        syncTimelineView(applyRow.timeline);
        syncRoleStats();
        applyDrawer.value = false;
        navigate("applies");
        const ped = applyRow.plannedEffectiveDate || "";
        const pendingTip =
          (applyMode.value === "CREATE" || applyMode.value === "REVISE") &&
          applyRow.status === "APPROVED_PENDING"
            ? `；计划生效日 ${ped} 未到，申请为「待生效」，到日后方为「已发布」`
            : "";
        toast(`文控已直接办理${typeLabel}（${applyNo}），无需审批` + pendingTip);
        return;
      }

      // 部门负责人：仅文控一审；普通员工：负责人一审 → 文控二审
      const leaderOnly = codeIsLeader(code);
      const leaderRole = leaderRoleForDept(applicantDept);
      const firstRoles = leaderOnly ? ["DCC_CONTROLLER", "DCC_ADMIN"] : [leaderRole];
      const firstNode = leaderOnly ? "文控审核（终审）" : `部门负责人初审（${applicantDept}）`;
      const firstStep = leaderOnly ? "CTRL" : "DEPT";
      data.todos.unshift({
        id: applyId + 1,
        bizType: applyMode.value,
        applyStep: firstStep,
        fileId,
        docNo: createForm.docNo,
        title: createForm.title,
        fileLevel: createForm.fileLevel,
        productType: productTypeCsv,
        applicant: `${data.user.name} / ${applicantDept}`,
        applicantDept,
        node: firstNode,
        time: now,
        applyId,
        detail: `${typeLabel}申请 ${applyNo}；文件ID ${fileId}；计划生效日 ${createForm.plannedEffectiveDate || "-"}；${
          leaderOnly ? "负责人提交，待文控审批" : "员工提交，待本部门负责人初审"
        }`,
        forRoles: firstRoles,
      });
      syncTimelineView(applyRow.timeline);
      syncRoleStats();
      applyDrawer.value = false;
      if (leaderOnly) {
        toast(`${typeLabel}已提交 → 请顶栏切「文控员」在「待我审批」处理（${applyNo}）`);
        navigate("applies");
      } else {
        toast(`${typeLabel}已提交 → 请顶栏切「${applicantDept}负责人」在「待我审批」初审（${applyNo}）`);
        navigate("applies");
      }
    };

    const confirmReceipt = (row) => {
      const now = new Date().toISOString().slice(0, 16).replace("T", " ");
      row.receiptStatus = "RECEIVED";
      row.receiptBy = data.user.name;
      row.receiptAt = now;
      if (row.distNo && data.receiptDetails && data.receiptDetails[row.distNo]) {
        const name = data.user.name;
        data.receiptDetails[row.distNo].forEach((r) => {
          if (r.user === name && r.status !== "RECEIVED") {
            r.status = "RECEIVED";
            r.time = now;
          }
        });
        const list = data.receiptDetails[row.distNo];
        const done = list.filter((r) => r.status === "RECEIVED").length;
        const dist = data.distributions.find((d) => d.distNo === row.distNo);
        if (dist) {
          dist.received = done + "/" + list.length;
          dist.status = done >= list.length ? "DONE" : "PARTIAL";
        }
      }
      toast(`已签收：${row.docNo} · ${data.user.name} · ${now}`);
      syncRoleStats();
    };

    const syncHardRecycleStats = () => {
      data.stats.hardRecycle = data.hardCopies.filter((x) => x.status === "RECYCLE_PENDING").length;
    };

    /** 按文件刷新变更单回收进度 done/total */
    const refreshChangeRecycleProgress = (docNo) => {
      if (!docNo) return;
      const related = data.hardCopies.filter((h) => h.docNo === docNo);
      if (!related.length) return;
      const done = related.filter((h) =>
        ["RECYCLED", "VOID_STAMPED", "LOST", "LOST_CONFIRMED"].includes(h.status)
      ).length;
      const total = related.length;
      data.changes.forEach((c) => {
        if (c.docNo !== docNo) return;
        c.recycleProgress = done + "/" + total;
        if (done >= total && (c.status === "RECYCLING" || c.status === "NOTIFYING")) {
          c.status = "CLOSED";
        } else if (done < total && c.status === "CLOSED" && total > 0) {
          /* keep closed if already closed */
        } else if (done < total && c.status !== "CLOSED") {
          c.status = "RECYCLING";
        }
      });
    };

    const openHardDetail = (row) => {
      if (!row) return warn("未选择纸质份");
      currentHard.value = row;
      hardDetailVisible.value = true;
    };

    const HARDCOPY_TERMINAL = ["RECYCLED", "VOID_STAMPED", "LOST", "LOST_CONFIRMED"];

    /** 是否有权处理该纸质份（文控 / 曾签收含历史 / 持有人部门或本人） */
    const canHandleHardCopy = (row) => {
      if (!row || !row.docNo) return false;
      if (codeIsCtrl(roleCode.value)) return true;
      if (myEverDocNos.value.has(row.docNo)) return true;
      if (userHasReceived(row.docNo)) return true;
      const name = data.user.name || "";
      const dept = data.user.dept || "";
      if (row.printedBy && row.printedBy === name) return true;
      if (row.holder) {
        const h = String(row.holder);
        if (h === name || h === dept || (dept && h.indexOf(dept) >= 0)) return true;
      }
      return false;
    };

    /** 第一步：待回收 → 实物回收（在用不可回收） */
    const canRecycleHardCopy = (row) => {
      if (!row || row.status !== "RECYCLE_PENDING") return false;
      return canHandleHardCopy(row);
    };

    /** 第二步：已回收 → 盖作废章（须先完成实物回收） */
    const canVoidStampHardCopy = (row) => {
      if (!row || row.status !== "RECYCLED") return false;
      return canHandleHardCopy(row);
    };

    /** 已回收/盖废章/丢失的纸质份：非文控不可再预览下载打印对应文件 */
    const isHardcopyAccessRevoked = (row) => {
      if (!row) return false;
      return HARDCOPY_TERMINAL.includes(row.status);
    };

    const openHardcopyLinkedDoc = (row) => {
      if (!row || !row.docNo) return warn("未选择纸质份");
      if (isHardcopyAccessRevoked(row) && !codeIsCtrl(roleCode.value)) {
        return warn("该纸质份已回收/作废，除文控外不可再预览、下载或打印");
      }
      const doc =
        data.documents.find(
          (d) => d.docNo === row.docNo && (!row.version || d.version === row.version)
        ) || data.documents.find((d) => d.docNo === row.docNo);
      if (!doc) return warn("未找到文件：" + row.docNo);
      if (!assertDocAccessible(doc, "预览")) return;
      hardDetailVisible.value = false;
      openDoc(doc);
    };

    const openRecycle = (row) => {
      if (!row) return warn("未选择纸质份");
      if (row.status === "IN_USE") {
        return warn("「在用」纸质份无需回收；仅「待回收」可办理实物回收");
      }
      if (HARDCOPY_TERMINAL.includes(row.status) && row.status !== "RECYCLED") {
        return warn("该纸质份已处理完毕");
      }
      if (row.status === "RECYCLED") {
        return openVoidStamp(row);
      }
      if (row.status !== "RECYCLE_PENDING") {
        return warn("仅「待回收」状态可办理实物回收");
      }
      if (!canRecycleHardCopy(row)) {
        return warn("无权回收：须为文控，或曾签收/持有该文件的人员");
      }
      currentHard.value = row;
      recycleForm.remark = "";
      hardDetailVisible.value = false;
      recycleVisible.value = true;
    };

    const openVoidStamp = (row) => {
      if (!row) return warn("未选择纸质份");
      if (row.status !== "RECYCLED") {
        return warn("须先完成「实物回收」，再办理盖作废章（两步不可合并）");
      }
      if (!canVoidStampHardCopy(row)) {
        return warn("无权盖作废章：须为文控，或曾签收/持有该文件的人员");
      }
      currentHard.value = row;
      recycleForm.remark = "";
      hardDetailVisible.value = false;
      voidStampVisible.value = true;
    };

    const finishRecycle = (action) => {
      if ((action === "LOST" || action === "LOST_CONFIRMED") && !codeIsCtrl(roleCode.value)) {
        return warn("丢失确认仅文控可登记");
      }
      const row = currentHard.value;
      if (!row) {
        recycleVisible.value = false;
        return warn("未选择纸质份");
      }
      if (action === "VOID") {
        recycleVisible.value = false;
        return warn("盖作废章须在实物回收完成后单独办理");
      }
      if (row.status !== "RECYCLE_PENDING") {
        recycleVisible.value = false;
        return warn("仅「待回收」可办理实物回收或丢失确认");
      }
      if (!canRecycleHardCopy(row) && action !== "LOST") {
        recycleVisible.value = false;
        return warn("无权执行纸质回收");
      }
      if (action === "LOST" && !codeIsCtrl(roleCode.value)) {
        recycleVisible.value = false;
        return warn("丢失确认仅文控可登记");
      }
      const target = data.hardCopies.find((h) => h.id === row.id || h.copyNo === row.copyNo);
      if (!target) {
        recycleVisible.value = false;
        return warn("未找到纸质份记录");
      }
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      const remark = (recycleForm.remark || "").trim();
      let nextStatus = "RECYCLED";
      let msg = "已登记实物回收；如需盖作废章，请再点「盖废章」";
      if (action === "LOST") {
        nextStatus = "LOST_CONFIRMED";
        msg = "已登记丢失确认";
      }
      target.status = nextStatus;
      target.recycledAt = now;
      target.recycledBy = data.user.name;
      target.recycleAction = action === "LOST" ? "丢失确认" : "实物回收";
      target.recycleRemark = remark || target.recycleReason || "";
      refreshChangeRecycleProgress(target.docNo);
      syncHardRecycleStats();
      recycleVisible.value = false;
      currentHard.value = target;
      toast(msg + "：" + target.copyNo);
    };

    const finishVoidStamp = () => {
      const row = currentHard.value;
      if (!row) {
        voidStampVisible.value = false;
        return warn("未选择纸质份");
      }
      if (row.status !== "RECYCLED") {
        voidStampVisible.value = false;
        return warn("须先完成实物回收，再盖作废章");
      }
      if (!canVoidStampHardCopy(row)) {
        voidStampVisible.value = false;
        return warn("无权盖作废章");
      }
      const target = data.hardCopies.find((h) => h.id === row.id || h.copyNo === row.copyNo);
      if (!target) {
        voidStampVisible.value = false;
        return warn("未找到纸质份记录");
      }
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      const remark = (recycleForm.remark || "").trim();
      target.status = "VOID_STAMPED";
      target.voidStampedAt = now;
      target.voidStampedBy = data.user.name;
      target.recycleAction = "实物回收 → 盖作废章留存";
      if (remark) target.recycleRemark = (target.recycleRemark ? target.recycleRemark + "；" : "") + remark;
      refreshChangeRecycleProgress(target.docNo);
      syncHardRecycleStats();
      voidStampVisible.value = false;
      currentHard.value = target;
      toast("已盖作废章留存：" + target.copyNo);
    };

    const requestAccess = (row, action) => {
      accessAction.value = action || "PRINT";
      accessReason.value = "";
      if (row && row.docNo) {
        currentDoc.value = data.documents.find((d) => d.docNo === row.docNo) || row;
        accessDocNo.value = row.docNo;
      } else {
        currentDoc.value = null;
        accessDocNo.value = "";
      }
      accessApplyVisible.value = true;
    };

    const openAccessApply = (action) => {
      requestAccess(null, action);
    };

    const onAccessDocChange = (docNo) => {
      const doc = syncDocFields({ docNo: "", title: "" }, docNo);
      accessDocNo.value = doc ? doc.docNo : docNo || "";
      currentDoc.value = doc || null;
    };

    const submitAccessApply = () => {
      if (!accessDocNo.value) return warn("请选择文件");
      if (!accessReason.value.trim() || accessReason.value.trim().length < 5) return warn("请填写用途说明");
      const doc = data.documents.find((d) => d.docNo === accessDocNo.value) || currentDoc.value || {};
      const now = new Date().toISOString().slice(0, 16).replace("T", " ");
      const applyId = Date.now();
      const actionLabel = accessAction.value === "PRINT" ? "打印" : "下载";
      const applicantDept = data.user.dept || "行政部";
      const leaderRole = leaderRoleForDept(applicantDept);
      data.accessApplies.unshift({
        id: applyId,
        applyNo: "AA" + String(applyId).slice(-10),
        action: accessAction.value,
        docNo: doc.docNo || accessDocNo.value,
        title: doc.title || "-",
        version: doc.version || "-",
        fileLevel: doc.fileLevel,
        productType: doc.productType,
        ownerDept: doc.ownerDept || doc.dept || "",
        applicant: data.user.name,
        applicantDept,
        reason: accessReason.value.trim(),
        status: "IN_APPROVAL",
        submittedAt: now,
      });
      const code = roleCode.value;
      let accessStep = "DEPT";
      let forRoles = [leaderRole];
      let node = "部门负责人初审（" + applicantDept + "）";
      let tip = `${actionLabel}申请已提交 → 请顶栏切换「${applicantDept}负责人」到「待我审批」初审，再由文控备案`;
      if (codeIsCtrl(code)) {
        data.accessApplies[0].status = "APPROVED";
        syncRoleStats();
        accessApplyVisible.value = false;
        toast(`${actionLabel}申请已由文控直接批准`);
        navigate("accessApplies");
        return;
      }
      if (codeIsLeader(code)) {
        accessStep = "CTRL";
        forRoles = ["DCC_CONTROLLER", "DCC_ADMIN"];
        node = "文控备案（打印/下载二次申请）";
        tip = `${actionLabel}申请已提交 → 请顶栏切换「文控员」到「待我审批」备案`;
      }
      data.todos.unshift({
        id: applyId + 1,
        applyId,
        bizType: "ACCESS",
        accessStep,
        action: accessAction.value,
        docNo: doc.docNo || accessDocNo.value,
        title: (doc.title || "-") + `（${actionLabel}二次申请）`,
        fileLevel: doc.fileLevel,
        productType: doc.productType,
        applicant: data.user.name + " / " + applicantDept,
        applicantDept,
        node,
        time: now,
        forRoles,
      });
      syncRoleStats();
      accessApplyVisible.value = false;
      toast(tip);
      navigate("accessApplies");
    };

    const openBorrowForm = () => {
      Object.assign(borrowForm, {
        docNo: "",
        title: "",
        type: "ELECTRONIC",
        copyNo: "",
        days: 7,
        expectReturn: "",
        reason: "",
      });
      syncBorrowExpectReturn();
      borrowFormVisible.value = true;
    };

    const submitBorrow = () => {
      if (!borrowForm.docNo) return warn("请选择借阅文件");
      syncBorrowExpectReturn();
      if (!borrowForm.expectReturn) return warn("请填写借阅天数以生成应还日期");
      if (!borrowForm.reason.trim() || borrowForm.reason.trim().length < 5) return warn("请填写借阅事由（至少 5 字）");
      if (borrowForm.type === "HARDCOPY" && !borrowForm.copyNo) {
        return warn("纸质借阅请选择纸质受控号");
      }
      const doc = data.documents.find((d) => d.docNo === borrowForm.docNo);
      if (!doc) return warn("文件不存在");
      if (!codeIsCtrl(roleCode.value)) {
        if (userHasReceived(doc.docNo)) {
          return warn("该文件已在您的「我的受控文件」中，无需借阅");
        }
        if (csvHas(doc.ownerDept || doc.dept, data.user.dept)) {
          return warn("本部门所属文件请走分发签收，无需借阅；借阅用于跨部门临时预览");
        }
      }
      const code = roleCode.value;
      const applicantDept = data.user.dept || "";
      const now = new Date().toISOString().slice(0, 16).replace("T", " ");
      const id = Date.now();
      const borrowNo = "BR" + String(id).slice(-10);
      const row = {
        id,
        borrowNo,
        docNo: doc.docNo,
        title: doc.title,
        fileLevel: doc.fileLevel,
        productType: doc.productType,
        type: borrowForm.type,
        copyNo: borrowForm.type === "HARDCOPY" ? borrowForm.copyNo : "",
        applicant: data.user.name,
        dept: applicantDept,
        days: borrowForm.days,
        expectReturn: borrowForm.expectReturn,
        status: "IN_APPROVAL",
        reason: borrowForm.reason.trim(),
        previewGranted: false,
      };

      // 文控直办：直接借阅中
      if (codeIsCtrl(code)) {
        row.status = "BORROWED";
        row.previewGranted = true;
        row.approvedAt = now;
        row.approvedBy = data.user.name;
        data.borrows.unshift(row);
        borrowFormVisible.value = false;
        toast(`借阅已直办通过：${borrowNo}，可预览至 ${row.expectReturn}`);
        navigate("borrows");
        return;
      }

      data.borrows.unshift(row);
      const leaderOnly = codeIsLeader(code);
      const leaderRole = leaderRoleForDept(applicantDept);
      const firstRoles = leaderOnly ? ["DCC_CONTROLLER", "DCC_ADMIN"] : [leaderRole];
      const firstNode = leaderOnly ? "文控审核（借阅终审）" : `部门负责人初审（${applicantDept}）`;
      const firstStep = leaderOnly ? "CTRL" : "DEPT";
      data.todos.unshift({
        id: id + 1,
        borrowId: id,
        bizType: "BORROW",
        borrowStep: firstStep,
        docNo: doc.docNo,
        title: doc.title,
        fileLevel: doc.fileLevel,
        productType: doc.productType,
        applicant: `${data.user.name} / ${applicantDept}`,
        applicantDept,
        node: firstNode,
        time: now,
        detail: `借阅 ${borrowNo}；${borrowForm.days} 天，应还 ${borrowForm.expectReturn}；${borrowForm.reason.trim()}`,
        forRoles: firstRoles,
      });
      syncRoleStats();
      borrowFormVisible.value = false;
      toast(
        leaderOnly
          ? `借阅已提交 → 请切「文控员」在「待我审批」终审（${borrowNo}）`
          : `借阅已提交 → 请切「${applicantDept}负责人」初审，再文控终审（${borrowNo}）`
      );
      navigate("borrows");
    };

    const returnBorrow = (row) => {
      if (!row) return;
      if (row.status !== "BORROWED" && row.status !== "OVERDUE") {
        return warn("仅「借阅中/已逾期」可归还");
      }
      const isOwner = row.applicant === data.user.name;
      if (!isOwner && !codeIsCtrl(roleCode.value)) {
        return warn("仅借阅人或文控可办理归还");
      }
      row.status = "RETURNED";
      row.previewGranted = false;
      row.returnedAt = demoToday();
      toast(`已归还 ${row.borrowNo || ""}，预览权限已收回`);
    };

    const activateExternalRelease = (ext) => {
      if (!ext) return;
      const token =
        ext.accessToken ||
        "EXT-" + Math.random().toString(36).slice(2, 10).toUpperCase() + String(Date.now()).slice(-4);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const path = typeof window !== "undefined" ? window.location.pathname : "/";
      ext.status = "APPROVED";
      ext.tokenActive = true;
      ext.accessToken = token;
      ext.accessLink = `${origin}${path}#/dcc/external-view?token=${token}`;
      ext.watermarkPackName = `${ext.releaseNo || "ER"}_专用水印包.pdf`;
      ext.approvedAt = new Date().toISOString().slice(0, 16).replace("T", " ");
      ext.approvedBy = data.user.name;
    };

    const copyExternalLink = async (row) => {
      if (!row || !row.accessLink) return warn("尚无外链（需审批通过后生成）");
      if (row.status === "REVOKED" || row.status === "EXPIRED" || row.tokenActive === false) {
        return warn("外链已失效，无法复制");
      }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(row.accessLink);
        } else {
          const ta = document.createElement("textarea");
          ta.value = row.accessLink;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        toast("外发访问链接已复制");
      } catch (_) {
        warn("复制失败，请手动复制：" + row.accessLink);
      }
    };

    const downloadExternalWatermarkPack = (row) => {
      if (!row) return;
      if (row.status !== "APPROVED" && row.status !== "ACTIVE") {
        return warn("仅已批准的外发可下载专用水印包");
      }
      if (row.tokenActive === false || row.status === "REVOKED" || row.status === "EXPIRED") {
        return warn("外发已失效，水印包不可用");
      }
      const lines = [
        "米格实验室 DCC 外发专用水印包（演示）",
        `外发单号：${row.releaseNo || "-"}`,
        `文件编号：${row.docNo || "-"}`,
        `文件名称：${row.title || "-"}`,
        `版本：${row.version || "-"}`,
        `接收单位：${row.receiver || "-"}`,
        `有效期至：${row.expireDate || "-"}`,
        `访问令牌：${row.accessToken || "-"}`,
        `外链：${row.accessLink || "-"}`,
        `水印：外发·${row.receiver || ""}·${row.accessToken || ""}·禁止下载`,
        `生成时间：${row.approvedAt || demoToday()}`,
      ];
      const blob = new Blob([lines.join("\n")], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = row.watermarkPackName || `${row.releaseNo || "ER"}_专用水印包.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast("已下载专用水印包（演示 PDF 文本包）");
    };

    const openExternalForm = () => {
      if (!canCreateExternal.value) {
        return warn("仅文控或部门负责人可新建外发（负责人须在「我的受控文件」内选择文件）");
      }
      Object.assign(externalForm, {
        docNo: "",
        title: "",
        receiver: "",
        contact: "",
        expireDate: addDaysYmd(demoToday(), 30),
        purpose: "",
      });
      externalFormVisible.value = true;
    };

    const submitExternal = () => {
      if (!canCreateExternal.value) {
        return warn("仅文控或部门负责人可新建外发");
      }
      if (!externalForm.docNo) return warn("请选择外发文件");
      if (!externalForm.receiver.trim()) return warn("请填写接收单位");
      if (!externalForm.expireDate) return warn("请填写外发有效期");
      if (!externalForm.purpose.trim() || externalForm.purpose.trim().length < 5) {
        return warn("请填写外发目的（至少 5 字）");
      }
      const doc = data.documents.find((d) => d.docNo === externalForm.docNo);
      if (!doc) return warn("文件不存在");
      if (codeIsLeader(roleCode.value) && !userHasReceived(doc.docNo)) {
        return warn("负责人仅可外发本人「我的受控文件」内已签收文件");
      }
      const id = Date.now();
      const now = new Date().toISOString().slice(0, 16).replace("T", " ");
      const releaseNo = "ER" + String(id).slice(-10);
      const row = {
        id,
        releaseNo,
        docNo: doc.docNo,
        title: doc.title,
        version: doc.version,
        fileLevel: doc.fileLevel,
        productType: doc.productType,
        receiver: externalForm.receiver.trim(),
        contact: (externalForm.contact || "").trim(),
        expireDate: externalForm.expireDate,
        status: "IN_APPROVAL",
        applicant: data.user.name,
        purpose: externalForm.purpose.trim(),
        tokenActive: false,
        accessToken: "",
        accessLink: "",
        watermarkPackName: "",
      };

      // 文控提交：直接批准并生成令牌
      if (codeIsCtrl(roleCode.value)) {
        data.externals.unshift(row);
        activateExternalRelease(row);
        syncRoleStats();
        externalFormVisible.value = false;
        toast(`外发已直办：${releaseNo}，令牌 ${row.accessToken}`);
        navigate("externalReleases");
        return;
      }

      data.externals.unshift(row);
      data.todos.unshift({
        id: id + 1,
        bizType: "EXTERNAL",
        releaseId: id,
        docNo: doc.docNo,
        title: doc.title,
        fileLevel: doc.fileLevel,
        productType: doc.productType,
        applicant: `${data.user.name} / ${data.user.dept}`,
        node: "文控审核（外发）",
        time: now,
        detail: `外发申请 ${externalForm.receiver.trim()}；有效期至 ${externalForm.expireDate}`,
        forRoles: ["DCC_CONTROLLER", "DCC_ADMIN"],
      });
      syncRoleStats();
      externalFormVisible.value = false;
      toast(`外发申请已提交 → 请切「文控员」在「待我审批」处理（${releaseNo}）`);
      navigate("externalReleases");
    };

    const mockDownload = (row, scene) => {
      const doc = resolveDocMeta(row || currentDoc.value);
      if (!doc || !doc.docNo) return warn("未选择文件");
      if (!assertDocAccessible(doc, "下载")) return;
      // 已签收「我的受控文件」：完整下载权限（含机密），不强制本部门非密
      if (hasMyDocFullAccess(doc)) {
        if (doc.allowDownload === false && !hasPerm("dcc:doc:download")) {
          ElMessage.error("该文件禁止下载，仅可预览");
          return;
        }
        downloadWatermarkFile(doc, "DOWNLOAD", scene || previewScene.value);
        toast("已按「我的受控文件」权限下载");
        return;
      }
      // 机密：不可本部门直下，须二次申请或下载直授权限
      if (isSecret(doc) && !hasPerm("dcc:doc:download")) {
        warn("机密文件不可本部门直下，请提交下载二次申请");
        requestAccess(doc, "DOWNLOAD");
        return;
      }
      // 一级/二级/三级相同：本部门非密可直下；文控等直授角色也可下
      const deptOk = canDeptDirectAccess(doc);
      const permOk = hasPerm("dcc:doc:download");
      if (deptOk || permOk) {
        downloadWatermarkFile(doc, "DOWNLOAD", scene || previewScene.value);
        if (deptOk && !permOk) toast("已按「所属部门直授」下载（非密，一/二/三级相同）");
        return;
      }
      // 跨部门且无直授：分类禁止下载则仅预览；否则走二次申请
      if (doc.allowDownload === false) {
        ElMessage.error("该文件禁止下载，仅可预览");
        return;
      }
      warn("非本部门或无权限：下载需二次申请");
      requestAccess(doc, "DOWNLOAD");
    };

    const isSecret = (row) => {
      if (!row) return false;
      if (row.security === "SECRET") return true;
      if (row.docNo) {
        const doc = data.documents.find((d) => d.docNo === row.docNo);
        if (doc && doc.security === "SECRET") return true;
      }
      return false;
    };

    /** 本部门非密文件：所属部门员工可直接下载/打印（一/二/三级相同），无需二次申请；多所属部门时命中任一即可 */
    const canDeptDirectAccess = (doc) => {
      if (!doc) return false;
      const full = doc.docNo ? data.documents.find((d) => d.docNo === doc.docNo) || doc : doc;
      if (isSecret(full)) return false;
      const od = full.ownerDept || full.dept || "";
      const userDept = data.user.dept || "";
      return !!(userDept && csvHas(od, userDept));
    };

    const isLevel3 = (doc) => !!(doc && (doc.fileLevel === "L3" || doc.webEditable));
    const isWebEditable = (doc) => isLevel3(doc);

    const formEditVisible = ref(false);
    const formEditText = ref("");
    const formEditDoc = ref(null);

    const openFormEdit = (row) => {
      const doc = row && row.docNo ? data.documents.find((d) => d.docNo === row.docNo) || row : row;
      if (!doc) return warn("未选择文件");
      if (!isWebEditable(doc)) {
        return warn("仅三级（表单）可在网页直接编辑；一级/二级请走修订申请");
      }
      formEditDoc.value = doc;
      formEditText.value = doc.formBody || "";
      formEditVisible.value = true;
    };

    const bumpFormRevision = (rev) => {
      const m = String(rev || "r0").match(/^r?(\d+)$/i);
      const n = m ? parseInt(m[1], 10) : 0;
      return "r" + (n + 1);
    };

    const saveFormEdit = () => {
      const doc = formEditDoc.value;
      if (!doc) return;
      const target = data.documents.find((d) => d.id === doc.id || d.docNo === doc.docNo);
      if (!target) {
        formEditVisible.value = false;
        return warn("未找到文件");
      }
      const now = new Date().toISOString().slice(0, 16).replace("T", " ");
      const oldRev = target.formRevision || "r0";
      const newRev = bumpFormRevision(oldRev);
      const formalVer = target.version || "1.0";
      const summary = "三级表单轻量修订（免审批）· " + now;

      target.formBody = formEditText.value;
      target.formRevision = newRev;
      // 正式版号不变（T-02-A）；仅更新轻量修订说明
      target.changeSummary = summary + "（正式版仍为 " + formalVer + "）";

      if (!data.formRevisionHistories) data.formRevisionHistories = {};
      const hist = data.formRevisionHistories[target.docNo] || [];
      hist.unshift({
        rev: newRev,
        at: now,
        author: data.user.name,
        summary,
        formalVersion: formalVer,
      });
      data.formRevisionHistories[target.docNo] = hist;

      [
        data.myDocs,
        data.applies,
        data.distributions,
        data.hardCopies,
        data.trainingTasks,
        data.recentEffective,
      ].forEach((list) => {
        (list || []).forEach((row) => {
          if (row.docNo === target.docNo) row.formRevision = newRev;
        });
      });

      if (currentDoc.value && currentDoc.value.docNo === target.docNo) {
        currentDoc.value = target;
      }

      formEditVisible.value = false;
      toast("已保存轻量修订 " + oldRev + " → " + newRev + "（正式版 " + formalVer + " 未变，无需审批）");
    };

    const downloadTrainingCert = (row) => {
      if (!row) return warn("未选择培训任务");
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      const wm = `${data.user.name} ${data.user.userNo} 培训证明 ${now}`;
      const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"/><title>培训证明_${row.docNo}</title>
<style>
body{font-family:"Microsoft YaHei",sans-serif;padding:40px;color:#222;position:relative}
h1{text-align:center}
.box{border:2px solid #1677ff;padding:24px;margin-top:16px;max-width:640px;margin-left:auto;margin-right:auto;position:relative;z-index:2;background:#fff}
.wm-layer{position:fixed;inset:-15%;z-index:1;pointer-events:none;display:flex;flex-direction:column;justify-content:space-around;align-items:center;transform:rotate(-24deg);opacity:0.16;font-size:16px;color:#000}
.wm-layer span{display:block;margin:24px 0;white-space:nowrap}
</style></head>
<body>
<div class="wm-layer">
  <span>${wm}</span>
  <span>${wm}</span>
  <span>${wm}</span>
</div>
<h1>受控文件培训证明</h1>
<div class="box">
<p><b>文件编号：</b>${row.docNo || "-"}</p>
<p><b>文件名称：</b>${row.title || "-"}${row.security === "SECRET" || isSecret(row) ? " 【密】" : ""}</p>
<p><b>版本：</b>${row.version || "-"}</p>
<p><b>受训人：</b>${row.assignee || data.user.name}（${row.post || data.user.post || "-"}）</p>
<p><b>完成时间：</b>${row.completedAt || now}</p>
<p><b>电子签名：</b>${data.user.name}/${data.user.userNo}</p>
<p><b>说明：</b>${row.note || "已完成学习确认"}</p>
<p style="margin-top:24px;color:#888;font-size:12px;">米格实验室 DCC · 培训证明（含水印×3）· 可浏览器打印另存 PDF</p>
</div></body></html>`;
      const filename = `培训证明_${row.docNo}_V${row.version || "1"}_${row.assignee || data.user.name}.html`;
      triggerBlobDownload(filename, html, "text/html;charset=utf-8");
      toast(`已下载培训证明：${filename}`);
    };

    /** 按导出范围筛出全部现行/修订中文件（一键导出用） */
    const resolveComplianceDocList = (scopeCodeRaw, scopeLabel) => {
      let scopeCode = scopeCodeRaw || "";
      if (!scopeCode) {
        const s = String(scopeLabel || "");
        if (s.indexOf("一级") >= 0 || scopeCodeRaw === "L1") scopeCode = "L1";
        else if (s.indexOf("二级") >= 0 || scopeCodeRaw === "L2") scopeCode = "L2";
        else if (s.indexOf("三级") >= 0 || scopeCodeRaw === "L3") scopeCode = "L3";
        else scopeCode = "ALL";
      }
      scopeCode = String(scopeCode).toUpperCase();
      let docList = (data.documents || []).filter((d) => d.status === "EFFECTIVE" || d.status === "REVISING");
      if (scopeCode === "L1" || scopeCode === "L2" || scopeCode === "L3") {
        docList = docList.filter((d) => String(d.fileLevel || "").toUpperCase() === scopeCode);
      }
      // 稳定排序，保证范围内全部编号都进表
      docList = docList.slice().sort((a, b) => String(a.docNo || "").localeCompare(String(b.docNo || "")));
      return { scopeCode, docList };
    };

    /** 导出/导入用：文件正文（三级优先表单正文） */
    const resolveDocBodyText = (d) => {
      if (!d) return "";
      if (d.fileLevel === "L3" && d.formBody) return String(d.formBody);
      return String(d.fullText || d.formBody || d.changeSummary || "");
    };

    const downloadCompliancePack = (row) => {
      const pack = row || {
        exportNo: "CE-TEMP",
        asOfTime: exportForm.asOfTime,
        scope: "全库现行有效",
        scopeCode: exportForm.scope,
        includeBody: !!exportForm.includeBody,
        pack: "文件版本+正文+审批+分发签收+培训",
        createdBy: data.user.name,
        createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
      };
      const { scopeCode, docList } = resolveComplianceDocList(pack.scopeCode || exportForm.scope, pack.scope);
      const docNoSet = new Set(docList.map((d) => d.docNo).filter(Boolean));
      const withBody = pack.includeBody != null ? !!pack.includeBody : !!exportForm.includeBody;
      const metaRows = [
        ["导出单号", pack.exportNo || "-"],
        ["时间点", pack.asOfTime || "-"],
        ["范围", pack.scope || "-"],
        ["范围编码", scopeCode],
        ["导出文件数", String(docList.length)],
        ["含正文", withBody ? "是" : "否"],
        ["包内容", pack.pack || "-"],
        ["操作人", pack.createdBy || data.user.name],
        ["生成时间", pack.createdAt || "-"],
        [
          "格式说明",
          "Excel（.xlsx）多工作表：文件版本清单、文件正文、审批记录、分发台账、分发签收台账、培训证明索引",
        ],
      ];
      const docHeader = [
        "文件ID",
        "文件编号",
        "文件名称",
        "文件级别",
        "业务领域",
        "版本",
        "轻量修订",
        "生效日",
        "状态",
        "所属部门",
      ];
      const docRows = docList.map((d) => [
        d.fileId != null ? d.fileId : d.id,
        d.docNo,
        d.title,
        levelName(d.fileLevel),
        ptName(d.productType),
        d.version,
        d.formRevision || "",
        d.effectiveDate,
        statusTag(d.status).text,
        d.ownerDept || d.dept || "",
      ]);

      // 文件正文（所选范围内全部文件）
      const bodyHeader = ["文件ID", "文件编号", "文件名称", "版本", "文件级别", "正文类型", "正文"];
      const bodyRows = docList.map((d) => [
        d.fileId != null ? d.fileId : d.id,
        d.docNo,
        d.title,
        d.version,
        levelName(d.fileLevel),
        d.fileLevel === "L3" && d.formBody ? "表单正文" : "文件正文",
        resolveDocBodyText(d),
      ]);

      // 审批记录：按申请单展开 timeline
      const apprHeader = [
        "申请单号",
        "申请类型",
        "文件编号",
        "文件名称",
        "申请状态",
        "节点",
        "处理人",
        "时间",
        "电子签名",
        "岗位",
        "意见",
      ];
      const apprRows = [];
      (data.applies || [])
        .filter((a) => docNoSet.has(a.docNo))
        .forEach((a) => {
          const typeText = a.type ? statusTag(a.type).text : "-";
          const st = a.status ? statusTag(a.status).text : "-";
          const nodes = Array.isArray(a.timeline) && a.timeline.length ? a.timeline : null;
          if (nodes) {
            nodes.forEach((n) => {
              apprRows.push([
                a.applyNo || "-",
                typeText,
                a.docNo || "-",
                a.title || "-",
                st,
                n.name || "-",
                n.user || "-",
                n.time || "-",
                n.signature || "-",
                n.post || "-",
                n.comment || "-",
              ]);
            });
          } else {
            apprRows.push([
              a.applyNo || "-",
              typeText,
              a.docNo || "-",
              a.title || "-",
              st,
              "提交申请",
              a.applicant || "-",
              a.submittedAt || "-",
              "-",
              a.dept || "-",
              a.reason || "-",
            ]);
          }
        });
      // 打印/下载二次申请审批（关联范围内文件）
      (data.accessApplies || [])
        .filter((a) => docNoSet.has(a.docNo))
        .forEach((a) => {
          const st = a.status ? statusTag(a.status).text : "-";
          const actionText = a.action === "PRINT" ? "打印二次申请" : "下载二次申请";
          const nodes = Array.isArray(a.timeline) && a.timeline.length ? a.timeline : null;
          if (nodes) {
            nodes.forEach((n) => {
              apprRows.push([
                a.applyNo || "-",
                actionText,
                a.docNo || "-",
                a.title || "-",
                st,
                n.name || "-",
                n.user || "-",
                n.time || "-",
                n.signature || "-",
                n.post || "-",
                n.comment || "-",
              ]);
            });
          } else {
            apprRows.push([
              a.applyNo || "-",
              actionText,
              a.docNo || "-",
              a.title || "-",
              st,
              "提交申请",
              a.applicant || "-",
              a.submittedAt || "-",
              "-",
              "-",
              a.reason || "-",
            ]);
          }
        });

      const distHeader = ["分发单号", "文件编号", "文件名称", "版本", "发送人", "签收进度", "状态", "发送时间", "分发对象"];
      const distInScope = (data.distributions || []).filter((d) => !docNoSet.size || docNoSet.has(d.docNo));
      const distRows = distInScope.map((d) => [
        d.distNo,
        d.docNo,
        d.title,
        d.version || "-",
        d.sentBy || "-",
        d.received || "-",
        statusTag(d.status).text,
        d.sentAt || "-",
        d.targets || "-",
      ]);

      // 分发签收台账：分发单 × 签收明细
      const receiptHeader = [
        "分发单号",
        "文件编号",
        "文件名称",
        "版本",
        "发送人",
        "发送时间",
        "签收进度",
        "分发状态",
        "签收人",
        "签收部门",
        "签收状态",
        "签收时间",
      ];
      const receiptRows = [];
      distInScope.forEach((d) => {
        const details =
          (data.receiptDetails && data.receiptDetails[d.distNo]) ||
          (data.myDocs || []).filter((m) => m.distNo === d.distNo);
        if (details && details.length) {
          details.forEach((r) => {
            receiptRows.push([
              d.distNo,
              d.docNo,
              d.title,
              d.version || "-",
              d.sentBy || "-",
              d.sentAt || "-",
              d.received || "-",
              statusTag(d.status).text,
              r.user || r.receiptBy || "-",
              r.dept || "-",
              r.status || r.receiptStatus ? statusTag(r.status || r.receiptStatus).text : "-",
              r.time || r.receiptAt || "-",
            ]);
          });
        } else {
          receiptRows.push([
            d.distNo,
            d.docNo,
            d.title,
            d.version || "-",
            d.sentBy || "-",
            d.sentAt || "-",
            d.received || "-",
            statusTag(d.status).text,
            "（无签收明细）",
            "-",
            "-",
            "-",
          ]);
        }
      });

      const trainHeader = ["任务号", "文件编号", "受训人", "岗位", "完成时间", "状态"];
      const trainRows = (data.trainingTasks || [])
        .filter((t) => t.status === "DONE" && (!docNoSet.size || docNoSet.has(t.docNo)))
        .map((t) => [t.taskNo, t.docNo, t.assignee, t.post || "-", t.completedAt || "-", statusTag(t.status).text]);

      const filename = `${pack.exportNo || "CE"}_合规包_${scopeCode}_${docList.length}份.xlsx`;
      const sheets = [
        { name: "文件版本清单", rows: [docHeader, ...docRows] },
        { name: "导出说明", rows: metaRows },
      ];
      if (withBody) {
        sheets.push({
          name: "文件正文",
          rows: [bodyHeader, ...(bodyRows.length ? bodyRows : [["-", "-", "（本范围内暂无）", "", "", "", ""]])],
        });
      }
      sheets.push(
        {
          name: "审批记录",
          rows: [
            apprHeader,
            ...(apprRows.length ? apprRows : [["-", "-", "（本范围内暂无）", "", "", "", "", "", "", "", ""]]),
          ],
        },
        {
          name: "分发台账",
          rows: [distHeader, ...(distRows.length ? distRows : [["-", "-", "（本范围内暂无）", "", "", "", "", "", ""]])],
        },
        {
          name: "分发签收台账",
          rows: [
            receiptHeader,
            ...(receiptRows.length ? receiptRows : [["-", "-", "（本范围内暂无）", "", "", "", "", "", "", "", "", ""]]),
          ],
        },
        {
          name: "培训证明索引",
          rows: [trainHeader, ...(trainRows.length ? trainRows : [["-", "-", "（本范围内暂无）", "", "", ""]])],
        }
      );
      downloadWorkbook(filename, sheets);
      if (!docList.length) {
        warn(`范围「${pack.scope || scopeCode}」下无现行/修订中文件，已生成空清单 Excel`);
      } else {
        toast(
          `已下载 Excel 合规包：${docList.length} 个文件` +
            (withBody ? "（含正文）" : "") +
            " · 审批记录 · 分发签收台账"
        );
      }
    };

    const exportDocsExcel = () => {
      const header = ["文件ID", "文件编号", "文件名称", "文件级别", "业务领域", "分类", "版本", "轻量修订", "状态", "域", "生效日期", "责任人", "所属部门"];
      const rows = filteredDocs.value.map((d) => [
        d.fileId != null ? d.fileId : d.id,
        d.docNo,
        d.title,
        levelName(d.fileLevel),
        ptName(d.productType),
        d.category,
        d.version,
        d.formRevision || "",
        statusTag(d.status).text,
        statusTag(d.accessDomain).text,
        d.effectiveDate,
        d.owner,
        d.ownerDept || d.dept || "",
      ]);
      downloadSheet(`受控文件台账_${Date.now()}.xlsx`, header, rows, "受控文件台账");
      toast("已导出 Excel 台账");
    };

    const exportAccessLog = () => {
      const header = ["时间", "用户", "文件ID", "文件编号", "文件名称", "版本", "动作", "IP"];
      const rows = data.accessLogs.map((r) => [
        r.time,
        r.user,
        fileIdOf(r),
        r.docNo,
        r.title || "",
        r.version,
        statusTag(r.action).text,
        r.ip,
      ]);
      downloadSheet(`审计日志_${Date.now()}.xlsx`, header, rows, "下载预览打印日志");
      toast("已导出审计日志 Excel");
    };

    const COMPLIANCE_IMPORT_HEADERS = [
      "文件ID",
      "文件编号",
      "文件名称",
      "文件级别",
      "业务领域编码",
      "所属部门",
      "分类",
      "版本",
      "状态",
      "密级",
      "数据域",
      "生效日期",
      "责任人",
      "变更说明",
      "正文",
    ];

    const normalizeImportLevel = (v) => {
      const s = String(v || "").trim().toUpperCase();
      if (s === "L1" || s.indexOf("一级") >= 0 || s.indexOf("宏观") >= 0) return "L1";
      if (s === "L3" || s.indexOf("三级") >= 0 || s.indexOf("表单") >= 0) return "L3";
      if (s === "L2" || s.indexOf("二级") >= 0 || s.indexOf("细则") >= 0) return "L2";
      return s || "L2";
    };

    const normalizeImportSecurity = (v) => {
      const s = String(v || "").trim().toUpperCase();
      if (s === "SECRET" || s.indexOf("机密") >= 0) return "SECRET";
      return "INTERNAL";
    };

    const normalizeImportDomain = (v) => {
      const s = String(v || "").trim().toUpperCase();
      if (s === "RD" || s.indexOf("研发") >= 0) return "RD";
      if (s === "ALL" || s.indexOf("全") >= 0) return "ALL";
      return "PROD";
    };

    const downloadComplianceImportTemplate = () => {
      if (!hasPerm("dcc:audit:export")) {
        ElMessage.error("当前角色无合规导入权限");
        return;
      }
      // 「文件主档」第 1 行已写好全部表头文字，打开后从第 2 行起直接粘贴/填写数据即可，无需再敲表头
      downloadWorkbook("DCC合规导入模板.xlsx", [
        {
          name: "文件主档",
          rows: [
            [...COMPLIANCE_IMPORT_HEADERS],
            // 第 2 行起为空，供直接粘贴业务数据；勿改第 1 行表头
          ],
        },
        {
          name: "填写说明",
          rows: [
            ["用法：打开「文件主档」表，第 1 行表头已填好，从第 2 行起粘贴或填写数据即可。"],
            ["列", "表头（已写入主档第1行）", "必填", "怎么填"],
            ["A", "文件ID", "否", "纯数字；新建留空由系统分配"],
            ["B", "文件编号", "是", "如 MG-SOP-2026-0001；按此匹配新增或更新"],
            ["C", "文件名称", "是", "文件标题"],
            ["D", "文件级别", "是", "填 L1 或 L2 或 L3（也可用一级/二级/三级）"],
            ["E", "业务领域编码", "是", "如 SEMI_TEST 或 SEMI_TEST,COMMON（多值英文逗号）"],
            ["F", "所属部门", "是", "如 行政部 或 行政部,技术部"],
            ["G", "分类", "否", "如 SOP，默认 SOP"],
            ["H", "版本", "否", "如 1.0，默认 1.0"],
            ["I", "状态", "否", "EFFECTIVE / REVISING / OBSOLETE，默认 EFFECTIVE"],
            ["J", "密级", "否", "INTERNAL 或 SECRET，默认 INTERNAL"],
            ["K", "数据域", "否", "PROD / RD / ALL，默认 PROD"],
            ["L", "生效日期", "否", "YYYY-MM-DD，如 2026-07-01"],
            ["M", "责任人", "否", "姓名"],
            ["N", "变更说明", "否", "备注"],
            ["O", "正文", "否", "文件全文；三级表单将同时写入表单正文，可多行文本"],
            [],
            ["也可单独使用「文件正文」工作表：列=文件编号、正文（按文件编号写回主档）"],
          ],
        },
        {
          name: "文件正文",
          rows: [
            ["文件编号", "正文"],
            // 第 2 行起：按文件编号提交正文；与主档「正文」列二选一或同时填写（正文表优先）
          ],
        },
      ]);
      toast("已下载导入模板：可在「文件主档.正文」或「文件正文」表提交正文");
    };

    const importComplianceExcel = async (file) => {
      if (!hasPerm("dcc:audit:export")) {
        ElMessage.error("当前角色无合规导入权限");
        return;
      }
      if (!isExcelFile(file)) return warn("请上传 Excel 表格（.xlsx / .xls）");
      try {
        const { sheets, sheetNames } = await parseWorkbookFile(file);
        const prefer =
          sheets["文件主档"] ||
          sheets[sheetNames.find((n) => n !== "文件正文" && n !== "填写说明" && /主档|文件/.test(n)) || ""] ||
          sheets[sheetNames.find((n) => n !== "文件正文" && n !== "填写说明") || ""] ||
          sheets[sheetNames[0]];
        if (!prefer || !prefer.length) return warn("Excel 中无有效数据行（请使用「文件主档」表）");

        /** 「文件正文」表：文件编号 → 正文（优先于主档正文列） */
        const bodyByDocNo = {};
        const bodySheet =
          sheets["文件正文"] || sheets[sheetNames.find((n) => /正文/.test(n) && n !== "文件主档") || ""];
        if (bodySheet && bodySheet.length) {
          bodySheet.forEach((r) => {
            const no = String(r["文件编号"] || r.docNo || "").trim();
            const body = String(r["正文"] || r.fullText || r.formBody || r.body || "").trim();
            if (no && body && no !== "文件编号") bodyByDocNo[no] = body;
          });
        }

        const applyBodyToDoc = (doc, body, fileLevel) => {
          if (!doc || !body) return;
          doc.fullText = body;
          if (fileLevel === "L3" || doc.fileLevel === "L3") {
            doc.formBody = body;
          }
        };

        let added = 0;
        let updated = 0;
        let skipped = 0;
        let bodyApplied = 0;
        prefer.forEach((row) => {
          const docNo = String(row["文件编号"] || row.docNo || "").trim();
          const title = String(row["文件名称"] || row.title || "").trim();
          if (!docNo || !title || docNo === "文件编号") {
            skipped += 1;
            return;
          }
          const fileLevel = normalizeImportLevel(row["文件级别"] || row.fileLevel);
          const productType = String(row["业务领域编码"] || row["业务领域"] || row.productType || "COMMON")
            .split(/[,，]/)
            .map((x) => x.trim())
            .filter(Boolean)
            .join(",");
          const ownerDept = String(row["所属部门"] || row.ownerDept || data.user.dept || "行政部")
            .split(/[,，]/)
            .map((x) => x.trim())
            .filter(Boolean)
            .join(",");
          const category = String(row["分类"] || row.category || "SOP").trim().toUpperCase();
          const version = String(row["版本"] || row.version || "1.0").trim();
          const statusRaw = String(row["状态"] || row.status || "EFFECTIVE").trim().toUpperCase();
          const status = ["EFFECTIVE", "REVISING", "OBSOLETE"].includes(statusRaw) ? statusRaw : "EFFECTIVE";
          const security = normalizeImportSecurity(row["密级"] || row.security);
          const accessDomain = normalizeImportDomain(row["数据域"] || row.accessDomain);
          const effectiveDate =
            String(row["生效日期"] || row.effectiveDate || "").trim() || new Date().toISOString().slice(0, 10);
          const owner = String(row["责任人"] || row.owner || data.user.name).trim();
          const changeSummary = String(row["变更说明"] || row.changeSummary || "合规导入").trim();
          const bodyText =
            bodyByDocNo[docNo] ||
            String(row["正文"] || row.fullText || row.formBody || "").trim();
          const productTypeName = ptName(productType);
          const fileLevelName = levelName(fileLevel);

          const existing = data.documents.find((d) => d.docNo === docNo);
          if (existing) {
            Object.assign(existing, {
              title,
              fileLevel,
              fileLevelName,
              productType,
              productTypeName,
              ownerDept,
              dept: ownerDept.split(",")[0] || existing.dept,
              category,
              version,
              status,
              security,
              accessDomain,
              effectiveDate,
              owner,
              changeSummary,
              webEditable: fileLevel === "L3",
            });
            if (row["文件ID"] !== "" && row["文件ID"] != null) {
              const fid = Number(row["文件ID"]);
              if (!Number.isNaN(fid)) {
                existing.fileId = fid;
                existing.id = fid;
              }
            }
            if (bodyText) {
              applyBodyToDoc(existing, bodyText, fileLevel);
              bodyApplied += 1;
              delete bodyByDocNo[docNo];
            }
            updated += 1;
          } else {
            const fidRaw = row["文件ID"];
            const fid =
              fidRaw !== "" && fidRaw != null && !Number.isNaN(Number(fidRaw)) ? Number(fidRaw) : nextFileId();
            const created = {
              id: fid,
              fileId: fid,
              docNo,
              title,
              fileLevel,
              fileLevelName,
              productType,
              productTypeName,
              ownerDept,
              dept: ownerDept.split(",")[0] || data.user.dept,
              category,
              version,
              formRevision: fileLevel === "L3" ? "r0" : undefined,
              status,
              security,
              accessDomain,
              effectiveDate,
              reviewDue: "-",
              owner,
              changeSummary,
              allowDownload: security !== "SECRET",
              pages: 1,
              webEditable: fileLevel === "L3",
            };
            if (bodyText) {
              applyBodyToDoc(created, bodyText, fileLevel);
              bodyApplied += 1;
              delete bodyByDocNo[docNo];
            }
            data.documents.unshift(created);
            added += 1;
          }
        });

        // 仅正文表、主档未带该编号时：写回已有文件
        Object.keys(bodyByDocNo).forEach((docNo) => {
          const doc = data.documents.find((d) => d.docNo === docNo);
          if (!doc) {
            skipped += 1;
            return;
          }
          applyBodyToDoc(doc, bodyByDocNo[docNo], doc.fileLevel);
          bodyApplied += 1;
        });

        if (!data.complianceImports) data.complianceImports = [];
        data.complianceImports.unshift({
          id: Date.now(),
          importNo: "CI" + String(Date.now()).slice(-10),
          fileName: file.name,
          status: "SUCCESS",
          added,
          updated,
          skipped,
          bodyApplied,
          createdBy: data.user.name,
          createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
        });
        listPage.complianceImport = 1;
        syncRoleStats();
        toast(
          `合规导入完成：新增 ${added}，更新 ${updated}，跳过 ${skipped}` +
            (bodyApplied ? `，写入正文 ${bodyApplied} 份` : "")
        );
      } catch (err) {
        warn("导入失败：" + ((err && err.message) || "无法解析 Excel"));
      }
    };

    const pickComplianceImportFile = () => {
      if (!hasPerm("dcc:audit:export")) {
        ElMessage.error("当前角色无合规导入权限");
        return;
      }
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";
      input.onchange = () => {
        const file = input.files && input.files[0];
        if (file) importComplianceExcel(file);
      };
      input.click();
    };

    const controlledPrint = (row) => {
      let doc = row || currentDoc.value;
      if (!doc || !doc.docNo) {
        doc = data.documents.find((d) => d.docNo === "MG-WI-2026-0012") || data.documents[0];
      }
      if (!assertDocAccessible(doc, "打印")) return;
      if (doc && doc.allowPrint === false) {
        ElMessage.error("该文件禁止受控打印");
        return;
      }
      // 已签收「我的受控文件」：完整打印权限（含机密）
      const myDocOk = hasMyDocFullAccess(doc);
      if (!myDocOk && isSecret(doc) && !hasPerm("dcc:doc:print") && !hasPerm("dcc:hardcopy")) {
        warn("机密文件不可本部门直打，请提交打印二次申请");
        requestAccess(doc, "PRINT");
        return;
      }
      if (
        !myDocOk &&
        !hasPerm("dcc:doc:print") &&
        !hasPerm("dcc:hardcopy") &&
        !canDeptDirectAccess(doc)
      ) {
        warn("非本部门或无权限：打印需二次申请");
        requestAccess(doc, "PRINT");
        return;
      }
      currentDoc.value = doc;
      printForm.copies = 1;
      printForm.holder = data.user.name;
      printForm.location = "现场墙柜";
      printForm.purpose = "现场受控张贴";
      hardPrintVisible.value = true;
    };

    const confirmPrint = () => {
      const doc = currentDoc.value || data.documents[0];
      if (!doc) {
        warn("未选择文件");
        return;
      }
      hardPrintVisible.value = false;
      const copyNo = downloadWatermarkFile(doc, "PRINT", previewScene.value);
      if (doc && copyNo) {
        data.hardCopies.unshift({
          id: Date.now(),
          copyNo,
          docNo: doc.docNo,
          title: doc.title,
          version: doc.version,
          holder: printForm.holder || data.user.name,
          location: printForm.location || "现场墙柜",
          status: "IN_USE",
          printedAt: "2026-07-22",
          printedBy: data.user.name,
        });
        data.stats.hardRecycle = data.hardCopies.filter((x) => x.status === "RECYCLE_PENDING").length;
      }
      toast(`受控打印完成：已下载水印件并登记纸质份 ${copyNo || ""}`.trim());
    };

    const completeTraining = (row) => {
      if (row.status === "DONE") return toast("已完成");
      row.status = "DONE";
      row.completedAt = "2026-07-22 09:40";
      row.note = `已学习确认 · 签名 ${data.user.name}/${data.user.userNo}`;
      syncRoleStats();
      toast("培训完成，已生成培训证明");
      downloadTrainingCert(row);
    };

    const runComplianceExport = () => {
      if (!hasPerm("dcc:audit:export")) {
        ElMessage.error("当前角色无合规导出权限");
        return;
      }
      const scopeCode = exportForm.scope || "ALL";
      const opt = exportScopeOptions.find((o) => o.value === scopeCode);
      const scopeLabel = (opt && opt.label) || "全库现行有效";
      const { docList } = resolveComplianceDocList(scopeCode, scopeLabel);
      const row = {
        id: Date.now(),
        exportNo: "CE" + Date.now().toString().slice(-10),
        asOfTime: exportForm.asOfTime,
        scope: scopeLabel,
        scopeCode,
        docCount: docList.length,
        includeBody: !!exportForm.includeBody,
        status: "SUCCESS",
        createdBy: data.user.name,
        createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
        pack:
          "Excel：版本清单（" +
          docList.length +
          "份）+审批记录+分发台账+分发签收台账+培训" +
          (exportForm.includeBody ? "+文件正文" : ""),
      };
      data.complianceExports.unshift(row);
      listPage.compliance = 1;
      downloadCompliancePack(row);
    };

    const openTplConfig = (row) => {
      currentTpl.value = row;
      const parts = String(row.nodes || "")
        .split(/→|->/)
        .map((s) => s.trim())
        .filter(Boolean);
      tplNodes.value = parts.length ? parts.map((name, i) => ({ order: i + 1, name })) : [{ order: 1, name: "文控员（终审）" }];
      tplDrawer.value = true;
    };

    const saveTplConfig = () => {
      if (!currentTpl.value) return;
      const names = tplNodes.value.map((n) => (n.name || "").trim()).filter(Boolean);
      if (!names.length) return warn("至少保留一个审批节点");
      currentTpl.value.nodes = names.join(" → ");
      tplDrawer.value = false;
      toast(`已保存模板「${currentTpl.value.name}」节点：${currentTpl.value.nodes}`);
    };

    const addTplNode = () => {
      tplNodes.value.push({ order: tplNodes.value.length + 1, name: "新节点" });
    };

    const removeTplNode = (idx) => {
      if (tplNodes.value.length <= 1) return warn("至少保留一个节点");
      tplNodes.value.splice(idx, 1);
      tplNodes.value.forEach((n, i) => (n.order = i + 1));
    };

    const openExtDocForm = () => {
      if (!canRegisterExtDoc.value) {
        return warn("仅文控或部门负责人可登记外来文件");
      }
      Object.assign(extForm, {
        title: "",
        sourceType: "STANDARD",
        sourceOrg: "",
        receiveDate: demoToday(),
        expireDate: "2027-12-31",
        owner: data.user.name,
        security: "INTERNAL",
        remark: "",
        fileName: "",
        fileSize: 0,
        fileUrl: "",
      });
      extDocDrawer.value = true;
    };

    const submitExtDoc = () => {
      if (!canRegisterExtDoc.value) {
        return warn("仅文控或部门负责人可登记外来文件");
      }
      if (!extForm.title.trim()) return warn("请填写文件名称");
      if (!extForm.sourceOrg.trim()) return warn("请填写来源单位");
      if (!extForm.receiveDate) return warn("请填写接收日");
      if (!String(extForm.fileName || "").trim()) return warn("请上传外来文件附件");
      const prefix = extForm.sourceType === "CUSTOMER" ? "MG-EXT-CUS" : "MG-EXT-STD";
      const seq = String(data.externalDocs.length + 1).padStart(4, "0");
      const year = (extForm.receiveDate || "2026").slice(0, 4);
      const maxExtFid = data.externalDocs.reduce((m, x) => Math.max(m, Number(x.fileId || 0)), 900000);
      const row = {
        id: Date.now(),
        fileId: maxExtFid + 1,
        extNo: `${prefix}-${year}-${seq}`,
        title: extForm.title.trim(),
        sourceType: extForm.sourceType,
        sourceOrg: extForm.sourceOrg.trim(),
        receiveDate: extForm.receiveDate,
        expireDate: extForm.expireDate || "-",
        status: "EFFECTIVE",
        owner: extForm.owner || data.user.name,
        security: extForm.security,
        remark: extForm.remark || "本月登记",
        fileName: extForm.fileName,
        fileSize: extForm.fileSize || 0,
        fileUrl: extForm.fileUrl || "",
      };
      data.externalDocs.unshift(row);
      extDocDrawer.value = false;
      toast(`外来文件已登记：${row.extNo} ${row.title}（附件 ${row.fileName}）`);
      navigate("externalDocs");
    };

    watch(
      route,
      (key) => {
        if (!key) return;
        if (!openTabs.value.find((t) => t.key === key)) {
          openTabs.value.push({ key, title: PAGE_TITLES[key] || key });
        }
      },
      { immediate: true }
    );

    /** 申请页：?apply=CREATE|REVISE|OBSOLETE 打开对应表单后清 query */
    watch(
      () => [vueRoute.meta.dccKey, vueRoute.query.apply],
      ([key, apply]) => {
        if (key !== "applies") return;
        if (apply !== "CREATE" && apply !== "REVISE" && apply !== "OBSOLETE") return;
        const doc = applySourceDocNo.value
          ? data.documents.find((d) => d.docNo === applySourceDocNo.value) || null
          : null;
        openApply(apply, doc || undefined);
        router.replace({ path: "/dcc/applies" });
      }
    );

    activateDueDocuments();

    return {
      data,
      menus: MENUS,
      route,
      openTabs,
      roleCode,
      currentRole,
      switchRole,
      syncRoleStats,
      roleMyDocs,
      rolePendingReceipts,
      roleReviews,
      roleDistributions,
      roleNotices,
      roleChanges,
      roleBorrows,
      roleExternals,
      roleRecordChanges,
      roleRecordDists,
      roleRecordHardCopies,
      roleRecordBorrows,
      roleRecordExternals,
      roleRecordAccessLogs,
      myEverDocNos,
      roleMyApplies,
      roleTodos,
      roleTrainings,
      roleAccessApplies,
      roleRecentEffective,
      roleStats,
      PAGE_SIZE,
      DOCS_PAGE_SIZE,
      listPage,
      pageSlice,
      recordType,
      recordTypeOptions,
      onRecordTypeChange,
      cfgType,
      cfgTypeOptions,
      onCfgTypeChange,
      urgeNotice,
      urgeDist,
      revokeExternal,
      openDistForm,
      canDistribute,
      distTargetOptions,
      onDistDocChange,
      onBorrowDocChange,
      onExternalDocChange,
      submitDistribution,
      pickUploadFile,
      pickExtDocFile,
      formatFileSize,
      hasPerm,
      hasMyDocFullAccess,
      hasActiveBorrowPreview,
      userHasReceived,
      isDocController,
      canCreateExternal,
      canRegisterExtDoc,
      categoryFormVisible,
      categoryForm,
      openCategoryForm,
      submitCategory,
      productFormVisible,
      productFormMode,
      productForm,
      openProductForm,
      submitProduct,
      ownerDeptFormVisible,
      ownerDeptFormMode,
      ownerDeptForm,
      openOwnerDeptForm,
      submitOwnerDept,
      saveWatermark,
      filters,
      filteredDocs,
      resetFilters,
      versionRows,
      receiptDetailVisible,
      currentReceiptRows,
      currentDistNo,
      openDistDetail,
      accessApplyVisible,
      accessAction,
      accessReason,
      accessDocNo,
      previewScene,
      previewStatusWm,
      effectiveDocOptions,
      borrowDocOptions,
      externalDocOptions,
      syncBorrowExpectReturn,
      openAccessApply,
      onAccessDocChange,
      requestAccess,
      submitAccessApply,
      borrowFormVisible,
      borrowForm,
      hardCopyOptionsForBorrow,
      openBorrowForm,
      submitBorrow,
      returnBorrow,
      externalFormVisible,
      externalForm,
      openExternalForm,
      submitExternal,
      copyExternalLink,
      downloadExternalWatermarkPack,
      activateExternalRelease,
      approveComment,
      approveSignature,
      exportForm,
      runComplianceExport,
      completeTraining,
      downloadTrainingCert,
      downloadCompliancePack,
      downloadComplianceImportTemplate,
      pickComplianceImportFile,
      importComplianceExcel,
      exportDocsExcel,
      exportAccessLog,
      controlledPrint,
      confirmPrint,
      printForm,
      openTplConfig,
      saveTplConfig,
      addTplNode,
      removeTplNode,
      tplDrawer,
      currentTpl,
      tplNodes,
      isSecret,
      canDeptDirectAccess,
      isLevel3,
      isWebEditable,
      formEditVisible,
      formEditText,
      formEditDoc,
      openFormEdit,
      saveFormEdit,
      ownerDeptFileRows,
      countDocsByOwnerDept,
      securityOptions,
      domainOptions,
      statusOptions,
      hardCopyStatusOptions,
      hardCopyFilters,
      filteredHardCopies,
      resetHardCopyFilters,
      sourceTypeOptions,
      exportScopeOptions,
      extDocDrawer,
      extForm,
      openExtDocForm,
      submitExtDoc,
      ptName,
      deptNames,
      fileIdOf,
      docMeta,
      ownerDeptOf,
      nextFileId,
      csvSplit,
      csvJoin,
      levelName,
      displayVersion,
      formRevisionRows,
      productTypeFileRows,
      statusTag,
      badgeCount,
      navigate,
      closeTab,
      docDetailVisible,
      currentDoc,
      previewVisible,
      approveVisible,
      currentTodo,
      activeApprovalTimeline,
      applyDetailVisible,
      currentApply,
      applyDetailTimeline,
      openApplyDetail,
      applyDrawer,
      applyMode,
      createForm,
      distDrawer,
      distForm,
      hardPrintVisible,
      recycleVisible,
      hardDetailVisible,
      currentHard,
      recycleForm,
      openHardDetail,
      openDoc,
      openDocByNo,
      hardRecycleCount,
      openPreview,
      openApprove,
      doApprove,
      openApply,
      onApplyDocChange,
      startRevise,
      startObsolete,
      applySourceDocNo,
      submitApply,
      confirmReceipt,
      openKeepReview,
      confirmKeepReview,
      keepReviewVisible,
      keepReviewMonths,
      keepReviewRow,
      activateDueDocuments,
      canRecycleHardCopy,
      canVoidStampHardCopy,
      isHardcopyAccessRevoked,
      openHardcopyLinkedDoc,
      openRecycle,
      openVoidStamp,
      finishRecycle,
      finishVoidStamp,
      voidStampVisible,
      mockDownload,
      toast,
      PAGE_TITLES,
    };
}
