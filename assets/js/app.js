/**
 * 【备用 CDN 原型】业务逻辑（与 web/src/composables/dccApp.js 对应）。
 * 依赖全局 Vue / ElementPlus / window.DCC_DATA；无打包，改完硬刷新即可。
 */
const { createApp, ref, computed, reactive, watch } = Vue;

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
  FOOD: { text: "二级（细则）", cls: "tag-blue" },
  ENV: { text: "二级（细则）", cls: "tag-blue" },
  PHARMA: { text: "二级（细则）", cls: "tag-blue" },
  SYS: { text: "一级（宏观）", cls: "tag-purple" },
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
      { key: "myDocs", label: "我的受控文件", icon: "☆", badge: "todoReceipt" },
    ],
  },
  {
    group: "编制与审批",
    items: [
      { key: "applyCreate", label: "新建申请", icon: "+" },
      { key: "applyRevise", label: "修订申请", icon: "✎" },
      { key: "applyObsolete", label: "作废申请", icon: "×" },
      { key: "myApplies", label: "我的申请", icon: "▤" },
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
      { key: "reportChanges", label: "变更记录", icon: "≡" },
      { key: "reportDist", label: "分发/领用记录", icon: "≡" },
      { key: "reportBorrow", label: "借阅/外发记录", icon: "≡" },
      { key: "reportAccess", label: "下载/预览/打印日志", icon: "≡" },
      { key: "complianceExport", label: "一键合规导出", icon: "⇩" },
    ],
  },
  {
    group: "基础配置",
    items: [
      { key: "cfgCategory", label: "文件分类", icon: "⚙" },
      { key: "cfgProduct", label: "文件级别", icon: "⚙" },
      { key: "cfgOwnerDept", label: "文件所属部门", icon: "⚙" },
      { key: "cfgNumber", label: "编号规则", icon: "⚙" },
      { key: "cfgApproval", label: "审批流程模板", icon: "⚙" },
      { key: "cfgWatermark", label: "水印策略", icon: "⚙" },
    ],
  },
];

const PAGE_TITLES = Object.fromEntries(MENUS.flatMap((g) => g.items.map((i) => [i.key, i.label])));

createApp({
  setup() {
    const data = reactive(window.DCC_DATA);
    const route = ref("dashboard");
    const openTabs = ref([{ key: "dashboard", title: "DCC工作台" }]);
    const roleCode = ref(data.user.roleCode || "DCC_CONTROLLER");

    const docDetailVisible = ref(false);
    const currentDoc = ref(null);
    const previewVisible = ref(false);
    const approveVisible = ref(false);
    const currentTodo = ref(null);
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
      type: "ELECTRONIC",
      copyNo: "",
      expectReturn: "",
      reason: "",
    });

    const externalFormVisible = ref(false);
    const externalForm = reactive({
      docNo: "",
      receiver: "",
      contact: "",
      expireDate: "",
      purpose: "",
    });

    const effectiveDocOptions = computed(() =>
      data.documents.filter((d) => d.status === "EFFECTIVE" || d.status === "REVISING")
    );

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
      docNo: "",
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
      { label: "修订中", value: "REVISING" },
      { label: "已废止", value: "OBSOLETE" },
    ];
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
      docNo: "",
      title: "",
      category: "",
      productType: "",
      accessDomain: "",
      security: "",
      ownerDept: "",
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
      targetVersion: "",
    });

    const distForm = reactive({
      docNo: "",
      title: "",
      targets: "",
      requireReceipt: true,
      remark: "",
    });

    const PAGE_SIZE = 10;
    const DOCS_PAGE_SIZE = 13;
    const listPage = reactive({
      docs: 1,
      myDocs: 1,
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
      ptFiles: 1,
      odFiles: 1,
      categories: 1,
    });

    const pageSizeOf = (key) => (key === "docs" ? DOCS_PAGE_SIZE : PAGE_SIZE);

    const pageSlice = (list, key) => {
      const arr = list || [];
      const size = pageSizeOf(key);
      const page = listPage[key] || 1;
      const start = (page - 1) * size;
      return arr.slice(start, start + size);
    };

    const toast = (text) => ElementPlus.ElMessage.success(text);
    const warn = (text) => ElementPlus.ElMessage.warning(text);

    const urgeNotice = (row) => {
      if (!row) return;
      const total = row.total || 0;
      const unread = row.unread || 0;
      row.unread = Math.min(total, unread + Math.max(1, Math.min(3, total - unread || 1)));
      if (row.status === "CLOSED") row.status = "SENT";
      toast("已催办：" + (row.noticeNo || "") + "，当前未读 " + row.unread + "/" + total);
    };

    const urgeDist = (row) => {
      if (!row) return;
      toast("已催办未签收人：" + (row.distNo || "") + "（当前签收 " + (row.received || "-") + "）");
    };

    const revokeExternal = (row) => {
      if (!row) return;
      if (row.status === "REVOKED") return toast("该外链已撤销");
      row.status = "REVOKED";
      toast("已撤销外链：" + (row.releaseNo || "") + "，令牌立即失效");
    };

    const openDistForm = (row) => {
      const doc = row && row.docNo ? data.documents.find((d) => d.docNo === row.docNo) || row : null;
      Object.assign(distForm, {
        docNo: (doc && doc.docNo) || "",
        title: (doc && doc.title) || "",
        targets: "",
        requireReceipt: true,
        remark: "",
      });
      distDrawer.value = true;
    };

    const onDistDocChange = (docNo) => {
      distForm.docNo = docNo || "";
      const doc = docNo ? data.documents.find((d) => d.docNo === docNo) : null;
      distForm.title = doc ? doc.title : "";
    };

    const submitDistribution = () => {
      if (!distForm.docNo) return warn("请选择或填写文件编号");
      if (!distForm.targets || !String(distForm.targets).trim()) return warn("请填写分发对象");
      const doc = data.documents.find((d) => d.docNo === distForm.docNo);
      const id = Date.now();
      const distNo = "DF" + String(id).slice(-10);
      data.distributions.unshift({
        id,
        distNo,
        docNo: distForm.docNo,
        title: (doc && doc.title) || distForm.title || "-",
        version: (doc && doc.version) || "-",
        productType: doc && doc.productType,
        requireReceipt: !!distForm.requireReceipt,
        status: "PARTIAL",
        sentAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        received: "0/" + String(distForm.targets).split(/[,，、]/).filter(Boolean).length,
        targets: String(distForm.targets).trim(),
      });
      distDrawer.value = false;
      listPage.distributions = 1;
      toast("分发单已发送：" + distNo);
      navigate("distributions");
    };

    const pickUploadFile = () => {
      createForm.fileName = (createForm.docNo || "附件") + "_正文.pdf";
      toast("已选择附件：" + createForm.fileName);
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

    /** 当前角色：我的受控文件 */
    const roleMyDocs = computed(() => {
      const code = roleCode.value;
      return (data.myDocs || []).filter((row) => matchForRoles(row, code));
    });

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

    /** 当前角色：近 7 日生效（按数据域 / 所属部门） */
    const roleRecentEffective = computed(() => {
      const domain = (currentRole.value && currentRole.value.domain) || "ALL";
      const dept = data.user.dept || "";
      const code = roleCode.value;
      return (data.recentEffective || []).filter((row) => {
        const doc = data.documents.find((d) => d.docNo === row.docNo);
        if (!doc) return domain === "ALL";
        if (domain === "ALL") {
          if (codeIsDeptStaff(code)) return doc.ownerDept === dept;
          return true;
        }
        return doc.accessDomain === domain;
      });
    });

    const roleEffectiveCount = computed(() => {
      const domain = (currentRole.value && currentRole.value.domain) || "ALL";
      const dept = data.user.dept || "";
      const code = roleCode.value;
      return data.documents.filter((d) => {
        if (d.status !== "EFFECTIVE" && d.status !== "REVISING") return false;
        if (domain === "PROD" || domain === "RD") return d.accessDomain === domain;
        if (codeIsDeptStaff(code)) return d.ownerDept === dept;
        return true;
      }).length;
    });

    const roleStats = computed(() => {
      const code = roleCode.value;
      const isCtrl = code === "DCC_CONTROLLER" || code === "DCC_ADMIN";
      const pendReceipt = roleMyDocs.value.filter((x) => x.receiptStatus === "PENDING").length;
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
              return !!(doc && doc.ownerDept === data.user.dept);
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
      syncRoleStats();
      toast(`已切换为：${r.role}（${r.name}）· 数据域 ${r.domain} · 受控文件 ${roleMyDocs.value.length} 份`);
    };

    /** 文控员 / 文控管理员：可维护文件分类等基础配置 */
    const isDocController = computed(() => {
      const code = data.user.roleCode || roleCode.value;
      return code === "DCC_CONTROLLER" || code === "DCC_ADMIN";
    });

    const categoryFormVisible = ref(false);
    const categoryForm = reactive({
      code: "",
      name: "",
      reviewMonths: 12,
      allowDownload: true,
      remark: "",
    });

    const openCategoryForm = () => {
      if (!isDocController.value) {
        return warn("仅文控员可新增分类，请切换角色后再试");
      }
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
      if (!isDocController.value) {
        return ElementPlus.ElMessage.error("无权限：仅文控员可新增分类");
      }
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

    const badgeCount = (key) => {
      const s = roleStats.value;
      if (key === "todoApprove") return s.todoApprove;
      if (key === "todoReceipt") return s.todoReceipt;
      if (key === "hardRecycle") return s.hardRecycle;
      if (key === "todoTrain") return s.todoTrain;
      if (key === "todoAccess") return s.todoAccess;
      return 0;
    };

    const navigate = (key) => {
      route.value = key;
      if (!openTabs.value.find((t) => t.key === key)) {
        openTabs.value.push({ key, title: PAGE_TITLES[key] || key });
      }
    };

    const closeTab = (key, e) => {
      e.stopPropagation();
      const idx = openTabs.value.findIndex((t) => t.key === key);
      if (idx < 0 || openTabs.value.length === 1) return;
      openTabs.value.splice(idx, 1);
      if (route.value === key) route.value = openTabs.value[Math.max(0, idx - 1)].key;
    };

    const domainVisible = (doc) => {
      const domain = currentRole.value.domain;
      if (domain === "ALL") return true;
      if (doc.accessDomain === "ALL") return true;
      return doc.accessDomain === domain;
    };

    const filteredDocs = computed(() => {
      return data.documents.filter((d) => {
        if (!domainVisible(d)) return false;
        if (filters.docNo) {
          const n = filters.docNo.trim().toUpperCase();
          if (!d.docNo.toUpperCase().startsWith(n) && d.docNo.toUpperCase() !== n) return false;
        }
        if (filters.productType && d.productType !== filters.productType) return false;
        if (filters.ownerDept && d.ownerDept !== filters.ownerDept) return false;
        if (filters.keyword) {
          const k = filters.keyword.trim().toLowerCase();
          const hitMeta = d.docNo.toLowerCase().includes(k) || d.title.toLowerCase().includes(k) || d.owner.includes(filters.keyword.trim());
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
      filters.docNo = "";
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
        if (st === "OBSOLETE") corner = "失效";
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
        ElementPlus.ElMessage.error("当前角色数据域不可见该文件");
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

    const openDistDetail = (row) => {
      currentDistNo.value = row.distNo;
      currentReceiptRows.value =
        (data.receiptDetails && data.receiptDetails[row.distNo]) || [
          { user: "（示例）", dept: "-", status: "PENDING", time: "-" },
        ];
      receiptDetailVisible.value = true;
    };

    const openPreview = (row, scene) => {
      const doc = resolveDocMeta(row || currentDoc.value);
      if (doc && !domainVisible(doc) && doc.docNo) {
        ElementPlus.ElMessage.error("无预览权限（数据域限制）");
        return;
      }
      currentDoc.value = doc;
      previewScene.value = scene || "";
      previewVisible.value = true;
    };

    const openApprove = (todo) => {
      currentTodo.value = todo;
      approveComment.value = "";
      approveSignature.value = `${data.user.name}/${data.user.userNo}`;
      approveVisible.value = true;
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
      if (!hasPerm("dcc:approve") && roleCode.value !== "DCC_CONTROLLER") {
        ElementPlus.ElMessage.error("当前岗位无审批权限");
        return;
      }
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      const todo = currentTodo.value;
      const cur = data.approvalTimeline.find((x) => x.status === "current");
      if (cur) {
        cur.status = "done";
        cur.user = data.user.name;
        cur.time = now;
        cur.signature = approveSignature.value;
        cur.post = data.user.post;
        cur.roles = `${data.user.roleCode},dcc:approve`;
        cur.comment = approveComment.value || (pass ? "同意（文控终审）" : "驳回");
      }

      // 只移除「当前这一条」待办，禁止匹配失败时清空全部
      const matchIdx = data.todos.findIndex((t) => {
        if (!todo) return false;
        if (todo.id != null && t.id === todo.id) return true;
        if (todo.applyId != null && t.applyId === todo.applyId) return true;
        // 外发审批不按 docNo 误删其它待办
        if (todo.bizType === "EXTERNAL" || todo.releaseId != null) return false;
        return !!(todo.docNo && t.docNo === todo.docNo);
      });
      if (matchIdx >= 0) data.todos.splice(matchIdx, 1);
      syncRoleStats();

      // 回写对应业务单状态（外发 / 我的申请）
      if (todo && todo.releaseId != null) {
        const ext = data.externals.find((e) => e.id === todo.releaseId);
        if (ext) ext.status = pass ? "APPROVED" : "REJECTED";
      } else if (todo && todo.applyId != null) {
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
      // 外发审批留在本页；其它审批回到待办列表
      if (todo && todo.bizType !== "EXTERNAL" && todo.releaseId == null && route.value !== "todoApprove") {
        navigate("todoApprove");
      }
    };

    const ptName = (code) => {
      const p = data.productTypes.find((x) => x.code === code);
      return p ? p.name : code || "-";
    };

    const productTypeFileRows = computed(() => {
      return data.documents.map((d) => ({
        docNo: d.docNo,
        title: d.title,
        productType: d.productType,
        productTypeName: d.productTypeName || ptName(d.productType),
        ownerDept: d.ownerDept,
        webEditable: d.webEditable,
        category: d.category,
        version: d.version,
        status: d.status,
        accessDomain: d.accessDomain,
        effectiveDate: d.effectiveDate,
        owner: d.owner,
        security: d.security,
      }));
    });

    const ownerDeptFileRows = computed(() => {
      return data.documents.map((d) => ({
        docNo: d.docNo,
        title: d.title,
        ownerDept: d.ownerDept || "-",
        productTypeName: d.productTypeName || ptName(d.productType),
        security: d.security,
        status: d.status,
        version: d.version,
        owner: d.owner,
      }));
    });

    const countDocsByOwnerDept = (name) => data.documents.filter((d) => d.ownerDept === name).length;

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
        docNo: "",
        title: "",
        category: "",
        productType: "",
        accessDomain: "",
        security: "",
        ownerDept: "",
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
        targetVersion: mode === "CREATE" ? "1.0" : "",
      });
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

      // 修订/作废：仅当从详情等带入文件时预填该文件；菜单入口不预填危化品等默认件
      if (!baseDoc) {
        resetCreateFormEmpty(mode);
        applySourceDocNo.value = "";
        applyDrawer.value = true;
        return;
      }

      const baseNo = baseDoc.docNo || "";
      const nextMajor = (() => {
        const m = String(baseDoc.version || "1.0").match(/^(\d+)/);
        return m ? parseInt(m[1], 10) + 1 + ".0" : "2.0";
      })();
      Object.assign(createForm, {
        docNo: baseNo,
        title: baseDoc.title || "",
        category: baseDoc.category || "",
        productType: baseDoc.productType || "",
        accessDomain: baseDoc.accessDomain || "",
        security: baseDoc.security === "PUBLIC" ? "INTERNAL" : baseDoc.security || "",
        ownerDept: baseDoc.ownerDept || baseDoc.dept || "",
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
        targetVersion: mode === "REVISE" ? nextMajor : "-",
      });
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
      if (route.value === "applyRevise") openApply("REVISE", doc);
      else navigate("applyRevise");
    };

    /** 详情/复审：发起作废，带入当前文件 */
    const startObsolete = (row) => {
      const src = row || currentDoc.value;
      const doc = src && src.docNo ? data.documents.find((d) => d.docNo === src.docNo) || src : null;
      if (!doc || !doc.docNo) return warn("未选择要作废的文件");
      applySourceDocNo.value = doc.docNo;
      docDetailVisible.value = false;
      if (route.value === "applyObsolete") openApply("OBSOLETE", doc);
      else navigate("applyObsolete");
    };

    const submitApply = () => {
      if (!createForm.docNo.trim()) return warn("请填写文件编号");
      if (!createForm.title.trim()) return warn("请填写文件名称");
      if (applyMode.value === "CREATE") {
        if (!createForm.reason.trim() || createForm.reason.trim().length < 10) return warn("编制原因必填（至少 10 字）");
        if (!createForm.plannedEffectiveDate) return warn("必须填写确切计划生效日");
      }
      if (applyMode.value === "REVISE") {
        createForm.baseDocNo = createForm.docNo;
        if (!createForm.changeSummary.trim() || createForm.changeSummary.trim().length < 10) return warn("变更原因必填（至少 10 字，禁止空泛填写）");
        if (!createForm.plannedEffectiveDate) return warn("修订必须填写新版确切生效日");
      }
      if (applyMode.value === "OBSOLETE") {
        createForm.baseDocNo = createForm.docNo;
        if (!createForm.obsoleteReason.trim() || createForm.obsoleteReason.trim().length < 10) return warn("作废原因必填（至少 10 字）");
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

      data.applies.unshift({
        id: applyId,
        applyNo,
        type: applyMode.value,
        docNo: createForm.docNo,
        title: createForm.title,
        category: createForm.category,
        productType: createForm.productType,
        ownerDept: createForm.ownerDept,
        status: "IN_APPROVAL",
        applicant: data.user.name,
        dept: data.user.dept,
        submittedAt: now,
        targetVersion: applyMode.value === "CREATE" ? "1.0" : applyMode.value === "REVISE" ? "2.0" : "-",
        reason,
      });

      // 演示：部门审核自动通过，待办落到文控终审
      data.todos.unshift({
        id: applyId + 1,
        bizType: applyMode.value,
        docNo: createForm.docNo,
        title: createForm.title,
        productType: createForm.productType,
        applicant: `${data.user.name} / ${data.user.dept}`,
        node: "文控审核（终审）",
        time: now,
        applyId,
        detail: `${typeLabel}申请 ${applyNo}；计划生效日 ${createForm.plannedEffectiveDate || "-"}；部门审核已通过，待文控终审`,
        forRoles: ["DCC_CONTROLLER"],
      });
      syncRoleStats();

      data.approvalTimeline.splice(0, data.approvalTimeline.length,
        {
          name: "提交申请",
          user: data.user.name,
          time: now,
          status: "done",
          comment: `提交${typeLabel}：${createForm.title}`,
          signature: `${data.user.name}/${data.user.userNo}`,
          post: data.user.post,
          roles: data.user.roleCode,
        },
        {
          name: "部门审核",
          user: "（演示自动通过）",
          time: now,
          status: "done",
          comment: "同意，转文控终审",
          signature: "系统/AUTO",
          post: "部门负责人",
          roles: "DCC_DEPT_LEADER,dcc:approve",
        },
        {
          name: "文控审核",
          user: "周文控（待处理）",
          time: "-",
          status: "current",
          comment: "文控终审通过即生效流转（不强制质量批准）",
          signature: "",
          post: "文控专员",
          roles: "DCC_CONTROLLER,dcc:approve",
        }
      );

      applyDrawer.value = false;
      navigate("todoApprove");
      toast(`申请已提交 → 请在本页「待我审批」点击「去处理」完成文控终审（${applyNo}）`);
    };

    const confirmReceipt = (row) => {
      row.receiptStatus = "RECEIVED";
      toast(`已签收：${row.docNo}`);
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

    const openRecycle = (row) => {
      if (!row) return warn("未选择纸质份");
      if (["RECYCLED", "VOID_STAMPED", "LOST", "LOST_CONFIRMED"].includes(row.status)) {
        return warn("该纸质份已处理完毕，无需再回收");
      }
      currentHard.value = row;
      recycleForm.remark = "";
      hardDetailVisible.value = false;
      recycleVisible.value = true;
    };

    const finishRecycle = (action) => {
      const row = currentHard.value;
      if (!row) {
        recycleVisible.value = false;
        return warn("未选择纸质份");
      }
      const target = data.hardCopies.find((h) => h.id === row.id || h.copyNo === row.copyNo);
      if (!target) {
        recycleVisible.value = false;
        return warn("未找到纸质份记录");
      }
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      const remark = (recycleForm.remark || "").trim();
      let nextStatus = "RECYCLED";
      let msg = "已登记实物回收";
      if (action === "VOID") {
        nextStatus = "VOID_STAMPED";
        msg = "已登记盖作废章留存";
      } else if (action === "LOST") {
        nextStatus = "LOST_CONFIRMED";
        msg = "已登记丢失确认";
      }
      target.status = nextStatus;
      target.recycledAt = now;
      target.recycledBy = data.user.name;
      target.recycleAction =
        action === "VOID" ? "盖作废章留存" : action === "LOST" ? "丢失确认" : "实物回收";
      target.recycleRemark = remark || target.recycleReason || "";
      refreshChangeRecycleProgress(target.docNo);
      syncHardRecycleStats();
      recycleVisible.value = false;
      currentHard.value = target;
      toast(msg + "：" + target.copyNo);
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
      accessDocNo.value = docNo || "";
      currentDoc.value = docNo ? data.documents.find((d) => d.docNo === docNo) || null : null;
    };

    const submitAccessApply = () => {
      if (!accessDocNo.value) return warn("请选择文件");
      if (!accessReason.value.trim() || accessReason.value.trim().length < 5) return warn("请填写用途说明");
      const doc = data.documents.find((d) => d.docNo === accessDocNo.value) || currentDoc.value || {};
      const now = new Date().toISOString().slice(0, 16).replace("T", " ");
      data.accessApplies.unshift({
        id: Date.now(),
        applyNo: "AA" + Date.now().toString().slice(-10),
        action: accessAction.value,
        docNo: doc.docNo || accessDocNo.value,
        title: doc.title || "-",
        version: doc.version || "-",
        productType: doc.productType,
        applicant: data.user.name,
        reason: accessReason.value.trim(),
        status: "IN_APPROVAL",
        submittedAt: now,
      });
      syncRoleStats();
      accessApplyVisible.value = false;
      toast(`${accessAction.value === "PRINT" ? "打印" : "下载"}二次申请已提交，审批通过后可操作`);
      navigate("accessApplies");
    };

    const openBorrowForm = () => {
      Object.assign(borrowForm, {
        docNo: "",
        type: "ELECTRONIC",
        copyNo: "",
        expectReturn: "",
        reason: "",
      });
      borrowFormVisible.value = true;
    };

    const submitBorrow = () => {
      if (!borrowForm.docNo) return warn("请选择借阅文件");
      if (!borrowForm.expectReturn) return warn("请填写应还日期");
      if (!borrowForm.reason.trim() || borrowForm.reason.trim().length < 5) return warn("请填写借阅事由（至少 5 字）");
      if (borrowForm.type === "HARDCOPY" && !borrowForm.copyNo) {
        return warn("纸质借阅请选择纸质受控号");
      }
      const doc = data.documents.find((d) => d.docNo === borrowForm.docNo);
      if (!doc) return warn("文件不存在");
      const id = Date.now();
      data.borrows.unshift({
        id,
        borrowNo: "BR" + String(id).slice(-10),
        docNo: doc.docNo,
        title: doc.title,
        productType: doc.productType,
        type: borrowForm.type,
        copyNo: borrowForm.type === "HARDCOPY" ? borrowForm.copyNo : "",
        applicant: data.user.name,
        dept: data.user.dept,
        expectReturn: borrowForm.expectReturn,
        status: "IN_APPROVAL",
        reason: borrowForm.reason.trim(),
      });
      borrowFormVisible.value = false;
      toast("借阅申请已提交，待部门→文控审批");
      navigate("borrows");
    };

    const openExternalForm = () => {
      Object.assign(externalForm, {
        docNo: "",
        receiver: "",
        contact: "",
        expireDate: "",
        purpose: "",
      });
      externalFormVisible.value = true;
    };

    const submitExternal = () => {
      if (!externalForm.docNo) return warn("请选择外发文件");
      if (!externalForm.receiver.trim()) return warn("请填写接收单位");
      if (!externalForm.expireDate) return warn("请填写外发有效期");
      if (!externalForm.purpose.trim() || externalForm.purpose.trim().length < 5) {
        return warn("请填写外发目的（至少 5 字）");
      }
      const doc = data.documents.find((d) => d.docNo === externalForm.docNo);
      if (!doc) return warn("文件不存在");
      const id = Date.now();
      data.externals.unshift({
        id,
        releaseNo: "ER" + String(id).slice(-10),
        docNo: doc.docNo,
        title: doc.title,
        version: doc.version,
        productType: doc.productType,
        receiver: externalForm.receiver.trim(),
        contact: (externalForm.contact || "").trim(),
        expireDate: externalForm.expireDate,
        status: "IN_APPROVAL",
        applicant: data.user.name,
        purpose: externalForm.purpose.trim(),
      });
      data.todos.unshift({
        id: id + 1,
        bizType: "EXTERNAL",
        releaseId: id,
        docNo: doc.docNo,
        title: doc.title,
        productType: doc.productType,
        applicant: `${data.user.name} / ${data.user.dept}`,
        node: "文控审核（终审）",
        time: new Date().toISOString().slice(0, 16).replace("T", " "),
        detail: `外发申请 ${externalForm.receiver.trim()}；有效期至 ${externalForm.expireDate}`,
        forRoles: ["DCC_CONTROLLER"],
      });
      syncRoleStats();
      externalFormVisible.value = false;
      toast("外发申请已提交，待审批");
      navigate("externalReleases");
    };

    const mockDownload = (row, scene) => {
      const doc = resolveDocMeta(row || currentDoc.value);
      if (!doc || !doc.docNo) return warn("未选择文件");
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
        ElementPlus.ElMessage.error("该文件禁止下载，仅可预览");
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

    /** 本部门非密文件：所属部门员工可直接下载/打印（一/二/三级相同），无需二次申请 */
    const canDeptDirectAccess = (doc) => {
      if (!doc) return false;
      const full = doc.docNo ? data.documents.find((d) => d.docNo === doc.docNo) || doc : doc;
      if (isSecret(full)) return false;
      const od = full.ownerDept || full.dept || "";
      const userDept = data.user.dept || "";
      return !!(od && userDept && userDept === od);
    };

    const isLevel3 = (doc) => !!(doc && (doc.productType === "L3" || doc.webEditable));
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

    const bumpMajorVersion = (ver) => {
      const m = String(ver || "1.0").match(/^(\d+)/);
      const major = m ? parseInt(m[1], 10) : 1;
      return major + 1 + ".0";
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
      const today = now.slice(0, 10);
      const oldVer = target.version || "1.0";
      const newVer = bumpMajorVersion(oldVer);
      const summary = "三级表单网页修订（免审批升版）· " + now;

      target.formBody = formEditText.value;
      target.version = newVer;
      target.changeSummary = summary;
      target.effectiveDate = target.effectiveDate || today;

      const hist = data.versionHistories[target.docNo] || [];
      hist.forEach((h) => {
        if (h.statusText === "现行有效" || h.ver === oldVer) h.statusText = "已替代";
      });
      hist.unshift({
        ver: newVer,
        statusText: "现行有效",
        effDate: today,
        author: data.user.name,
        summary,
      });
      data.versionHistories[target.docNo] = hist;

      // 同步其它列表上的版本号
      [
        data.myDocs,
        data.applies,
        data.distributions,
        data.hardCopies,
        data.trainingTasks,
        data.recentEffective,
      ].forEach((list) => {
        (list || []).forEach((row) => {
          if (row.docNo === target.docNo) row.version = newVer;
        });
      });

      if (currentDoc.value && currentDoc.value.docNo === target.docNo) {
        currentDoc.value = target;
      }

      formEditVisible.value = false;
      toast("已保存并升版 " + oldVer + " → " + newVer + "（已记入版本历史，无需审批）");
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

    const downloadCompliancePack = (row) => {
      const pack = row || {
        exportNo: "CE-TEMP",
        asOfTime: exportForm.asOfTime,
        scope: "全库现行有效",
        scopeCode: exportForm.scope,
        pack: "文件版本+审批+分发+培训",
        createdBy: data.user.name,
        createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
      };
      let scopeCode = pack.scopeCode || "";
      if (!scopeCode) {
        if (pack.scope && pack.scope.indexOf("一级") >= 0) scopeCode = "L1";
        else if (pack.scope && pack.scope.indexOf("二级") >= 0) scopeCode = "L2";
        else if (pack.scope && pack.scope.indexOf("三级") >= 0) scopeCode = "L3";
        else scopeCode = "ALL";
      }
      let docList = data.documents.filter((d) => d.status === "EFFECTIVE" || d.status === "REVISING");
      if (scopeCode === "L1" || scopeCode === "L2" || scopeCode === "L3") {
        docList = docList.filter((d) => d.productType === scopeCode);
      }
      const docs = docList
        .map((d) => `${d.docNo}\t${d.title}\t${ptName(d.productType)}\tV${d.version}\t${d.effectiveDate}`)
        .join("\n");
      const content = `米格实验室 DCC 合规导出包（演示）
导出单号：${pack.exportNo}
时间点：${pack.asOfTime}
范围：${pack.scope}
包内容：${pack.pack}
操作人：${pack.createdBy || data.user.name}
生成时间：${pack.createdAt || "-"}

======== 文件版本清单（编号/名称/文件级别/版本/生效日） ========
${docs || "（本范围内无现行文件）"}

======== 审批记录（摘要） ========
${data.approvalTimeline.map((n) => `${n.name}\t${n.user}\t${n.time}\t签名:${n.signature || "-"}\t岗位:${n.post || "-"}`).join("\n")}

======== 分发台账 ========
${data.distributions.map((d) => `${d.distNo}\t${d.docNo}\t${d.received}\t${d.status}`).join("\n")}

======== 培训证明索引 ========
${data.trainingTasks
  .filter((t) => t.status === "DONE")
  .map((t) => `${t.taskNo}\t${t.docNo}\t${t.assignee}\t${t.completedAt || "-"}`)
  .join("\n")}

说明：原型以文本包代替 ZIP；正式环境打包版本/审批/分发/培训证明及水印 PDF。
`;
      const filename = `${pack.exportNo || "CE"}_合规包.txt`;
      triggerBlobDownload(filename, content, "text/plain;charset=utf-8");
      toast(`已下载合规包：${filename}`);
    };

    const exportDocsExcel = () => {
      const header = "文件编号,文件名称,产品类型,分类,版本,状态,域,生效日期,责任人\n";
      const body = filteredDocs.value
        .map((d) =>
          [d.docNo, d.title, ptName(d.productType), d.category, d.version, statusTag(d.status).text, statusTag(d.accessDomain).text, d.effectiveDate, d.owner]
            .map((x) => `"${String(x || "").replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");
      triggerBlobDownload(`受控文件台账_${Date.now()}.csv`, "\uFEFF" + header + body, "text/csv;charset=utf-8");
      toast("已导出 CSV（可用 Excel 打开）");
    };

    const exportAccessLog = () => {
      const header = "时间,用户,文件编号,文件名称,版本,动作,IP\n";
      const body = data.accessLogs
        .map((r) =>
          [r.time, r.user, r.docNo, r.title, r.version, statusTag(r.action).text, r.ip]
            .map((x) => `"${String(x || "").replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");
      triggerBlobDownload(`审计日志_${Date.now()}.csv`, "\uFEFF" + header + body, "text/csv;charset=utf-8");
      toast("已导出审计日志 CSV");
    };

    const controlledPrint = (row) => {
      let doc = row || currentDoc.value;
      if (!doc || !doc.docNo) {
        doc = data.documents.find((d) => d.docNo === "MG-WI-2026-0012") || data.documents[0];
      }
      if (doc && doc.allowPrint === false) {
        ElementPlus.ElMessage.error("该文件禁止受控打印");
        return;
      }
      if (isSecret(doc) && !hasPerm("dcc:doc:print") && !hasPerm("dcc:hardcopy")) {
        warn("机密文件不可本部门直打，请提交打印二次申请");
        requestAccess(doc, "PRINT");
        return;
      }
      if (!hasPerm("dcc:doc:print") && !hasPerm("dcc:hardcopy") && !canDeptDirectAccess(doc)) {
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
        ElementPlus.ElMessage.error("当前角色无合规导出权限");
        return;
      }
      const opt = exportScopeOptions.find((o) => o.value === exportForm.scope);
      const scopeLabel = (opt && opt.label) || "全库现行有效";
      const row = {
        id: Date.now(),
        exportNo: "CE" + Date.now().toString().slice(-10),
        asOfTime: exportForm.asOfTime,
        scope: scopeLabel,
        scopeCode: exportForm.scope || "ALL",
        status: "SUCCESS",
        createdBy: data.user.name,
        createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
        pack: "文件版本+审批签名/时间戳/岗位+分发台账+培训证明" + (exportForm.includeBody ? "+正文水印PDF" : ""),
      };
      data.complianceExports.unshift(row);
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
      Object.assign(extForm, {
        title: "",
        sourceType: "STANDARD",
        sourceOrg: "",
        receiveDate: "2026-07-22",
        expireDate: "2027-12-31",
        owner: data.user.name,
        security: "INTERNAL",
        remark: "",
      });
      extDocDrawer.value = true;
    };

    const submitExtDoc = () => {
      if (!extForm.title.trim()) return warn("请填写文件名称");
      if (!extForm.sourceOrg.trim()) return warn("请填写来源单位");
      if (!extForm.receiveDate) return warn("请填写接收日");
      const prefix = extForm.sourceType === "CUSTOMER" ? "MG-EXT-CUS" : "MG-EXT-STD";
      const seq = String(data.externalDocs.length + 1).padStart(4, "0");
      const year = (extForm.receiveDate || "2026").slice(0, 4);
      const row = {
        id: Date.now(),
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
      };
      data.externalDocs.unshift(row);
      extDocDrawer.value = false;
      toast(`外来文件已登记：${row.extNo} ${row.title}`);
      navigate("externalDocs");
    };

    watch(route, (key) => {
      if (key === "applyCreate") openApply("CREATE");
      else if (key === "applyRevise") openApply("REVISE"); // 若已设 applySourceDocNo 则带入该文件
      else if (key === "applyObsolete") openApply("OBSOLETE");
    });

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
      roleTodos,
      roleTrainings,
      roleAccessApplies,
      roleRecentEffective,
      roleStats,
      PAGE_SIZE,
      DOCS_PAGE_SIZE,
      listPage,
      pageSlice,
      urgeNotice,
      urgeDist,
      revokeExternal,
      openDistForm,
      onDistDocChange,
      submitDistribution,
      pickUploadFile,
      hasPerm,
      isDocController,
      categoryFormVisible,
      categoryForm,
      openCategoryForm,
      submitCategory,
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
      openAccessApply,
      onAccessDocChange,
      requestAccess,
      submitAccessApply,
      borrowFormVisible,
      borrowForm,
      hardCopyOptionsForBorrow,
      openBorrowForm,
      submitBorrow,
      externalFormVisible,
      externalForm,
      openExternalForm,
      submitExternal,
      approveComment,
      approveSignature,
      exportForm,
      runComplianceExport,
      completeTraining,
      downloadTrainingCert,
      downloadCompliancePack,
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
      sourceTypeOptions,
      exportScopeOptions,
      extDocDrawer,
      extForm,
      openExtDocForm,
      submitExtDoc,
      ptName,
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
      startRevise,
      startObsolete,
      applySourceDocNo,
      submitApply,
      confirmReceipt,
      openRecycle,
      finishRecycle,
      mockDownload,
      toast,
      PAGE_TITLES,
    };
  },
}).use(ElementPlus).mount("#app");
