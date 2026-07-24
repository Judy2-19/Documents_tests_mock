/**
 * 【备用 CDN 原型】Mock 数据（与 web/src/mock/data.js 同源思路）。
 * 挂到 window.DCC_DATA，供 assets/js/app.js 使用。改 Mock 后两边宜同步。
 */
window.DCC_DATA = {
  user: {
    name: "周文控",
    userNo: "MG00128",
    dept: "行政部",
    role: "文控员",
    roleCode: "DCC_CONTROLLER",
    post: "文控专员",
    short: "周",
    perms: ["dcc:doc:preview", "dcc:doc:print", "dcc:doc:download", "dcc:approve", "dcc:audit:export", "dcc:hardcopy"],
  },

  /**
   * 演示角色：
   * - 文控员挂在行政部（不是 IT）
   * - IT 部是独立业务部门人员（IT工程师），与文控分开
   */
  demoRoles: [
    { roleCode: "DCC_CONTROLLER", role: "文控员", name: "周文控", userNo: "MG00128", dept: "行政部", post: "文控专员", short: "周", perms: ["dcc:doc:preview", "dcc:doc:print", "dcc:doc:download", "dcc:approve", "dcc:audit:export", "dcc:hardcopy"], domain: "ALL" },
    { roleCode: "DCC_DEPT_TECH", role: "技术部员工", name: "王技术", userNo: "MG00701", dept: "技术部", post: "技术专员", short: "王", perms: ["dcc:doc:preview", "dcc:receipt", "dcc:training", "dcc:approve"], domain: "ALL" },
    { roleCode: "DCC_DEPT_MKT", role: "市场部员工", name: "李市场", userNo: "MG00702", dept: "市场部", post: "市场专员", short: "李", perms: ["dcc:doc:preview", "dcc:receipt", "dcc:training"], domain: "ALL" },
    { roleCode: "DCC_DEPT_IT", role: "IT部员工", name: "赵IT", userNo: "MG00703", dept: "IT部", post: "IT工程师", short: "赵", perms: ["dcc:doc:preview", "dcc:receipt", "dcc:training"], domain: "ALL" },
    { roleCode: "DCC_DEPT_FIN", role: "财务部员工", name: "孙财务", userNo: "MG00704", dept: "财务部", post: "财务专员", short: "孙", perms: ["dcc:doc:preview", "dcc:receipt", "dcc:training"], domain: "ALL" },
  ],

  /**
   * 原「产品类型」统一为文件级别三级：
   * L1 宏观文件 — 网页不可改正文；L2 部门细则 — 网页不可改正文；L3 表单 — 可在网页直接编辑
   */
  productTypes: [
    { code: "L1", name: "一级（宏观文件）", editable: false, needApproveContent: true, remark: "公司级/宏观制度，网页不可直接改正文，变更须走修订审批" },
    { code: "L2", name: "二级（部门细则）", editable: false, needApproveContent: true, remark: "部门级作业细则，网页不可直接改正文，变更须走修订审批" },
    { code: "L3", name: "三级（表单）", editable: true, needApproveContent: false, remark: "表单类可网页直接改；每次保存主版本+1并记版本历史（免审批）；新建入库/作废仍走审批" },
  ],

  /** 组织口径（演示统一）：行政部（文控）+ 市场/技术/IT/财务 */
  ownerDepts: [
    { code: "ADM", name: "行政部" },
    { code: "MKT", name: "市场部" },
    { code: "TECH", name: "技术部" },
    { code: "IT", name: "IT部" },
    { code: "FIN", name: "财务部" },
  ],

  // stats 在文件末尾按列表重算，保证与台账一致
  stats: {},

  documents: [
    { id: 1, docNo: "MG-SOP-2026-0008", title: "实验室样品接收作业指导书", category: "SOP", version: "2.0", status: "EFFECTIVE", security: "INTERNAL", dept: "行政部", owner: "张敏", effectiveDate: "2026-07-01", reviewDue: "2027-07-01", allowDownload: true, pages: 12, changeSummary: "增加冷链样品开箱拍照要求；附录更新接收标签样例" },
    { id: 2, docNo: "MG-QM-2026-0001", title: "质量手册", category: "QM", version: "3.0", status: "EFFECTIVE", security: "INTERNAL", dept: "行政部", owner: "李强", effectiveDate: "2026-03-15", reviewDue: "2027-03-15", allowDownload: true, pages: 48, changeSummary: "对齐 CNAS 2025 评审意见，调整组织架构图" },
    { id: 3, docNo: "MG-WI-2026-0012", title: "LC-MS 开机点检规程", category: "WI", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "王磊", effectiveDate: "2026-05-20", reviewDue: "2026-08-20", allowDownload: true, pages: 6, changeSummary: "首发：覆盖 Waters Xevo TQ-S 日常开机" },
    { id: 4, docNo: "MG-FORM-2026-0003", title: "设备校准记录表（空白）", category: "FORM", version: "1.0", status: "EFFECTIVE", security: "PUBLIC", dept: "行政部", owner: "张敏", effectiveDate: "2026-01-10", reviewDue: "2027-01-10", allowDownload: true, pages: 2, changeSummary: "首发空白表，供计量室填写" },
    { id: 5, docNo: "MG-SOP-2025-0021", title: "危化品贮存管理规定", category: "SOP", version: "1.0", status: "REVISING", security: "SECRET", dept: "技术部", owner: "赵倩", effectiveDate: "2025-11-02", reviewDue: "2026-11-02", allowDownload: false, pages: 18, changeSummary: "修订中：拟升版 2.0，补充易制毒双人双锁" },
    { id: 6, docNo: "MG-TECH-2024-0007", title: "光谱分析内部技术规范", category: "TECH", version: "2.0", status: "OBSOLETE", security: "INTERNAL", dept: "技术部", owner: "王磊", effectiveDate: "2024-08-01", reviewDue: "-", allowDownload: false, pages: 22, changeSummary: "已作废：方法迁入新版 MG-TECH-2026-0002" },
    { id: 7, docNo: "MG-SOP-2026-0015", title: "客户投诉处理作业指导书", category: "SOP", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "市场部", owner: "陈华", effectiveDate: "2026-06-18", reviewDue: "2027-06-18", allowDownload: true, pages: 9, changeSummary: "首发：48 小时首响、5 个工作日闭环" },
    { id: 8, docNo: "MG-WI-2026-0004", title: "气相色谱日常维护指导", category: "WI", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "刘洋", effectiveDate: "2026-04-08", reviewDue: "2026-07-25", allowDownload: true, pages: 8, changeSummary: "首发：Agilent 7890B 周维护清单" },
    { id: 9, docNo: "MG-SOP-2026-0016", title: "生物样本冷链运输指导书", category: "SOP", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "行政部", owner: "张敏", effectiveDate: "2026-07-15", reviewDue: "2027-07-15", allowDownload: true, pages: 11, changeSummary: "本月新建发布：干冰/冰袋双方案与温度记录要求" },
    { id: 10, docNo: "MG-WI-2026-0018", title: "ICP-MS 雾化器清洗规程", category: "WI", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "孙悦", effectiveDate: "2026-07-08", reviewDue: "2027-01-08", allowDownload: true, pages: 5, changeSummary: "本月新建：硝酸浸泡与超声步骤" },
    { id: 11, docNo: "MG-SOP-2026-0002", title: "文件控制程序", category: "SOP", version: "2.0", status: "EFFECTIVE", security: "INTERNAL", dept: "行政部", owner: "李强", effectiveDate: "2026-02-01", reviewDue: "2027-02-01", allowDownload: true, pages: 16, changeSummary: "升版：启用 DCC 系统电子签收" },
    { id: 12, docNo: "MG-FORM-2026-0011", title: "不符合项报告单", category: "FORM", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "行政部", owner: "李强", effectiveDate: "2026-03-01", reviewDue: "2027-03-01", allowDownload: true, pages: 3, changeSummary: "首发：对接内部审核记录" },
    { id: 13, docNo: "MG-TECH-2026-0002", title: "ICP 重金属检测方法（内部）", category: "TECH", version: "1.0", status: "EFFECTIVE", security: "SECRET", dept: "技术部", owner: "孙悦", effectiveDate: "2026-06-01", reviewDue: "2027-06-01", allowDownload: false, pages: 28, changeSummary: "替代旧光谱规范，含检出限表" },
    { id: 14, docNo: "MG-WI-2025-0009", title: "生物安全柜使用与消毒", category: "WI", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "赵倩", effectiveDate: "2025-09-12", reviewDue: "2026-07-10", allowDownload: true, pages: 7, changeSummary: "复审已超期，待责任人结论" },
    { id: 15, docNo: "MG-SOP-2026-0010", title: "留样管理作业指导书", category: "SOP", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "市场部", owner: "周宁", effectiveDate: "2026-05-06", reviewDue: "2027-05-06", allowDownload: true, pages: 10, changeSummary: "首发：留样期限与销毁审批" },
    { id: 16, docNo: "MG-FORM-2025-0009", title: "培训签到表（旧版）", category: "FORM", version: "1.0", status: "EFFECTIVE", security: "PUBLIC", dept: "行政部", owner: "张敏", effectiveDate: "2025-04-01", reviewDue: "2026-07-10", allowDownload: true, pages: 1, changeSummary: "复审超期：拟并入新培训系统表单" },
    { id: 17, docNo: "MG-WI-2026-0020", title: "纯水机制水与换芯规程", category: "WI", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "刘洋", effectiveDate: "2026-07-12", reviewDue: "2027-01-12", allowDownload: true, pages: 4, changeSummary: "本月新建：电阻率 ≤0.055 μS/cm 判定" },
    { id: 18, docNo: "MG-SOP-2024-0019", title: "实验室废弃物分类处置", category: "SOP", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "赵倩", effectiveDate: "2024-12-20", reviewDue: "2026-06-30", allowDownload: true, pages: 14, changeSummary: "复审超期：医废与危废分流标签更新中" },
    { id: 19, docNo: "MG-QM-2025-0003", title: "内部审核控制程序", category: "QM", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "行政部", owner: "李强", effectiveDate: "2025-08-08", reviewDue: "2026-08-08", allowDownload: true, pages: 12, changeSummary: "首发程序文件" },
    { id: 20, docNo: "MG-SOP-2026-0019", title: "检测报告编制与签发", category: "SOP", version: "2.0", status: "EFFECTIVE", security: "INTERNAL", dept: "市场部", owner: "陈华", effectiveDate: "2026-07-18", reviewDue: "2027-07-18", allowDownload: true, pages: 15, changeSummary: "本月修订升版：增加电子签章与防伪码" },
    { id: 21, docNo: "MG-FORM-2026-0014", title: "仪器使用登记表", category: "FORM", version: "1.0", status: "EFFECTIVE", security: "PUBLIC", dept: "技术部", owner: "王磊", effectiveDate: "2026-07-03", reviewDue: "2027-07-03", allowDownload: true, pages: 1, changeSummary: "本月新建：各仪器室共用模板" },
    { id: 22, docNo: "MG-WI-2026-0007", title: "样品前处理通风柜操作", category: "WI", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "孙悦", effectiveDate: "2026-04-22", reviewDue: "2026-10-22", allowDownload: true, pages: 5, changeSummary: "首发" },
    { id: 23, docNo: "MG-SOP-2024-0030", title: "实验室人员健康监护管理规定", category: "SOP", version: "2.0", status: "EFFECTIVE", security: "INTERNAL", dept: "行政部", owner: "张敏", effectiveDate: "2024-01-01", reviewDue: "2025-01-01", allowDownload: true, pages: 2, changeSummary: "升版：完善操作步骤与判定标准" },
    { id: 24, docNo: "MG-SOP-2025-0031", title: "检测数据原始记录管理规定", category: "SOP", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "行政部", owner: "李强", effectiveDate: "2025-02-02", reviewDue: "2026-02-02", allowDownload: true, pages: 3, changeSummary: "首发：原始记录防篡改与归档期限" },
    { id: 25, docNo: "MG-SOP-2026-0032", title: "内部质量监督实施细则", category: "SOP", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "行政部", owner: "周文控", effectiveDate: "2026-03-03", reviewDue: "2027-03-03", allowDownload: true, pages: 4, changeSummary: "首发：监督计划编制与结果通报" },
    { id: 26, docNo: "MG-SOP-2026-0033", title: "能力验证与比对试验程序", category: "SOP", version: "2.0", status: "EFFECTIVE", security: "INTERNAL", dept: "行政部", owner: "张敏", effectiveDate: "2026-04-04", reviewDue: "2027-04-04", allowDownload: true, pages: 5, changeSummary: "升版：完善操作步骤与判定标准" },
    { id: 27, docNo: "MG-SOP-2026-0034", title: "客户样品保密与脱敏作业指导", category: "SOP", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "市场部", owner: "周宁", effectiveDate: "2026-05-05", reviewDue: "2027-05-05", allowDownload: true, pages: 6, changeSummary: "首发：客户标识脱敏与访问控制" },
    { id: 28, docNo: "MG-SOP-2024-0035", title: "报价与合同评审作业指导书", category: "SOP", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "市场部", owner: "李市场", effectiveDate: "2024-06-06", reviewDue: "2025-06-06", allowDownload: true, pages: 7, changeSummary: "首发：检测范围确认与风险评审" },
    { id: 29, docNo: "MG-SOP-2025-0036", title: "客户满意度调查与改进程序", category: "SOP", version: "2.0", status: "REVISING", security: "INTERNAL", dept: "市场部", owner: "陈华", effectiveDate: "2025-07-07", reviewDue: "2026-07-07", allowDownload: true, pages: 8, changeSummary: "修订中：拟升版，补充操作细节与记录要求" },
    { id: 30, docNo: "MG-SOP-2026-0037", title: "方法验证与确认控制程序", category: "SOP", version: "1.0", status: "OBSOLETE", security: "INTERNAL", dept: "技术部", owner: "孙悦", effectiveDate: "2024-08-08", reviewDue: "-", allowDownload: true, pages: 9, changeSummary: "已作废：内容并入现行方法文件" },
    { id: 31, docNo: "MG-SOP-2026-0038", title: "标准溶液配制与标定管理", category: "SOP", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "赵倩", effectiveDate: "2026-09-09", reviewDue: "2027-09-09", allowDownload: true, pages: 10, changeSummary: "首发：配制记录与有效期管理" },
    { id: 32, docNo: "MG-SOP-2026-0039", title: "实验室温湿度监控管理规定", category: "SOP", version: "2.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "王技术", effectiveDate: "2026-10-10", reviewDue: "2027-10-10", allowDownload: true, pages: 11, changeSummary: "升版：完善操作步骤与判定标准" },
    { id: 33, docNo: "MG-SOP-2024-0040", title: "LIMS 账号与权限管理办法", category: "SOP", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "IT部", owner: "赵IT", effectiveDate: "2024-11-11", reviewDue: "2025-11-11", allowDownload: true, pages: 12, changeSummary: "首发：账号申请、变更与注销" },
    { id: 34, docNo: "MG-SOP-2025-0041", title: "检测收费与开票对账指导书", category: "SOP", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "财务部", owner: "张敏", effectiveDate: "2025-12-12", reviewDue: "2026-12-12", allowDownload: true, pages: 13, changeSummary: "首发：收费项目与月结对账" },
    { id: 35, docNo: "MG-WI-2026-0030", title: "天平日常校准与核查规程", category: "WI", version: "2.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "孙悦", effectiveDate: "2026-01-13", reviewDue: "2027-01-13", allowDownload: true, pages: 14, changeSummary: "升版：完善操作步骤与判定标准" },
    { id: 36, docNo: "MG-WI-2026-0031", title: "移液器校准与维护规程", category: "WI", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "赵倩", effectiveDate: "2026-02-14", reviewDue: "2027-02-14", allowDownload: true, pages: 15, changeSummary: "首发：称重法核查与维护周期" },
    { id: 37, docNo: "MG-WI-2026-0032", title: "离心机使用与平衡操作规程", category: "WI", version: "1.0", status: "REVISING", security: "INTERNAL", dept: "技术部", owner: "王技术", effectiveDate: "2026-03-15", reviewDue: "2027-03-15", allowDownload: true, pages: 16, changeSummary: "修订中：拟升版，补充操作细节与记录要求" },
    { id: 38, docNo: "MG-WI-2024-0033", title: "烘箱使用与温度均匀性检查", category: "WI", version: "1.0", status: "OBSOLETE", security: "INTERNAL", dept: "技术部", owner: "王磊", effectiveDate: "2024-04-16", reviewDue: "-", allowDownload: true, pages: 17, changeSummary: "已作废：内容并入现行方法文件" },
    { id: 39, docNo: "MG-WI-2025-0034", title: "马弗炉高温灰化操作规程", category: "WI", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "刘洋", effectiveDate: "2025-05-17", reviewDue: "2026-05-17", allowDownload: true, pages: 18, changeSummary: "首发：升温程序与坩埚冷却" },
    { id: 40, docNo: "MG-WI-2026-0035", title: "pH 计校准与电极保养规程", category: "WI", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "孙悦", effectiveDate: "2026-06-18", reviewDue: "2027-06-18", allowDownload: true, pages: 19, changeSummary: "首发：两点校准与电极浸泡" },
    { id: 41, docNo: "MG-WI-2026-0036", title: "紫外分光光度计使用规程", category: "WI", version: "2.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "赵倩", effectiveDate: "2026-07-19", reviewDue: "2027-07-19", allowDownload: true, pages: 20, changeSummary: "升版：完善操作步骤与判定标准" },
    { id: 42, docNo: "MG-WI-2026-0037", title: "原子吸收光谱仪开机规程", category: "WI", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "王技术", effectiveDate: "2026-08-20", reviewDue: "2027-08-20", allowDownload: true, pages: 21, changeSummary: "首发：气路检查与灯电流设定" },
    { id: 43, docNo: "MG-WI-2024-0038", title: "微生物培养箱日常点检规程", category: "WI", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "王磊", effectiveDate: "2024-09-21", reviewDue: "2025-09-21", allowDownload: true, pages: 2, changeSummary: "首发：温度点检与污染排查" },
    { id: 44, docNo: "MG-WI-2025-0039", title: "高压灭菌锅操作与安全规程", category: "WI", version: "2.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "刘洋", effectiveDate: "2025-10-22", reviewDue: "2026-10-22", allowDownload: true, pages: 3, changeSummary: "升版：完善操作步骤与判定标准" },
    { id: 45, docNo: "MG-WI-2026-0040", title: "超净湿台操作与消毒规程", category: "WI", version: "1.0", status: "REVISING", security: "INTERNAL", dept: "技术部", owner: "孙悦", effectiveDate: "2026-11-23", reviewDue: "2027-11-23", allowDownload: true, pages: 4, changeSummary: "修订中：拟升版，补充操作细节与记录要求" },
    { id: 46, docNo: "MG-WI-2026-0041", title: "标准物质入库与领用规程", category: "WI", version: "1.0", status: "OBSOLETE", security: "INTERNAL", dept: "行政部", owner: "周文控", effectiveDate: "2024-12-24", reviewDue: "-", allowDownload: true, pages: 5, changeSummary: "已作废：内容并入现行方法文件" },
    { id: 47, docNo: "MG-WI-2026-0042", title: "备份服务器日常巡检规程", category: "WI", version: "2.0", status: "EFFECTIVE", security: "INTERNAL", dept: "IT部", owner: "赵IT", effectiveDate: "2026-01-25", reviewDue: "2027-01-25", allowDownload: true, pages: 6, changeSummary: "升版：完善操作步骤与判定标准" },
    { id: 48, docNo: "MG-WI-2024-0043", title: "样品物流交接窗口操作规程", category: "WI", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "市场部", owner: "周宁", effectiveDate: "2024-02-26", reviewDue: "2025-02-26", allowDownload: true, pages: 7, changeSummary: "首发：交接单核对与异常登记" },
    { id: 49, docNo: "MG-FORM-2025-0020", title: "仪器故障报修单", category: "FORM", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "刘洋", effectiveDate: "2025-03-27", reviewDue: "2026-03-27", allowDownload: true, pages: 8, changeSummary: "首发：故障现象与维修确认栏" },
    { id: 50, docNo: "MG-FORM-2026-0021", title: "试剂领用登记表", category: "FORM", version: "2.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "孙悦", effectiveDate: "2026-04-28", reviewDue: "2027-04-28", allowDownload: true, pages: 9, changeSummary: "升版：完善操作步骤与判定标准" },
    { id: 51, docNo: "MG-FORM-2026-0022", title: "标准曲线原始记录表", category: "FORM", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "赵倩", effectiveDate: "2026-05-01", reviewDue: "2027-05-01", allowDownload: true, pages: 10, changeSummary: "首发：浓度吸光度与拟合结果" },
    { id: 52, docNo: "MG-FORM-2026-0023", title: "内审检查表（通用）", category: "FORM", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "行政部", owner: "周文控", effectiveDate: "2026-06-02", reviewDue: "2027-06-02", allowDownload: true, pages: 11, changeSummary: "首发：条款符合性勾选记录" },
    { id: 53, docNo: "MG-FORM-2024-0024", title: "管理评审输入材料清单", category: "FORM", version: "2.0", status: "REVISING", security: "INTERNAL", dept: "行政部", owner: "张敏", effectiveDate: "2024-07-03", reviewDue: "2025-07-03", allowDownload: true, pages: 12, changeSummary: "修订中：拟升版，补充操作细节与记录要求" },
    { id: 54, docNo: "MG-FORM-2025-0025", title: "文件发放回收登记表", category: "FORM", version: "1.0", status: "OBSOLETE", security: "INTERNAL", dept: "行政部", owner: "李强", effectiveDate: "2024-08-04", reviewDue: "-", allowDownload: true, pages: 13, changeSummary: "已作废：内容并入现行方法文件" },
    { id: 55, docNo: "MG-FORM-2026-0026", title: "客户样品交接单", category: "FORM", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "市场部", owner: "李市场", effectiveDate: "2026-09-05", reviewDue: "2027-09-05", allowDownload: true, pages: 14, changeSummary: "首发：样品信息与完好状态" },
    { id: 56, docNo: "MG-FORM-2026-0027", title: "报告更改申请单", category: "FORM", version: "2.0", status: "EFFECTIVE", security: "INTERNAL", dept: "市场部", owner: "陈华", effectiveDate: "2026-10-06", reviewDue: "2027-10-06", allowDownload: true, pages: 15, changeSummary: "升版：完善操作步骤与判定标准" },
    { id: 57, docNo: "MG-FORM-2026-0028", title: "检测费用确认单", category: "FORM", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "财务部", owner: "孙财务", effectiveDate: "2026-11-07", reviewDue: "2027-11-07", allowDownload: true, pages: 16, changeSummary: "首发：项目金额与客户确认" },
    { id: 58, docNo: "MG-FORM-2024-0029", title: "固定资产盘点表（仪器）", category: "FORM", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "财务部", owner: "张敏", effectiveDate: "2024-12-08", reviewDue: "2025-12-08", allowDownload: true, pages: 17, changeSummary: "首发：资产编号与盘点结果" },
    { id: 59, docNo: "MG-FORM-2025-0030", title: "系统变更申请单", category: "FORM", version: "2.0", status: "EFFECTIVE", security: "INTERNAL", dept: "IT部", owner: "赵IT", effectiveDate: "2025-01-09", reviewDue: "2026-01-09", allowDownload: true, pages: 18, changeSummary: "升版：完善操作步骤与判定标准" },
    { id: 60, docNo: "MG-FORM-2026-0031", title: "账号权限变更申请表", category: "FORM", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "IT部", owner: "刘洋", effectiveDate: "2026-02-10", reviewDue: "2027-02-10", allowDownload: true, pages: 19, changeSummary: "首发：角色权限与审批" },
    { id: 61, docNo: "MG-TECH-2026-0010", title: "农药残留多残留筛查方法", category: "TECH", version: "1.0", status: "EFFECTIVE", security: "SECRET", dept: "技术部", owner: "赵倩", effectiveDate: "2026-03-11", reviewDue: "2027-03-11", allowDownload: false, pages: 20, changeSummary: "首发：QuEChERS 与 MRM 参数" },
    { id: 62, docNo: "MG-TECH-2026-0011", title: "兽药残留检测方法（内部）", category: "TECH", version: "2.0", status: "EFFECTIVE", security: "SECRET", dept: "技术部", owner: "王技术", effectiveDate: "2026-04-12", reviewDue: "2027-04-12", allowDownload: false, pages: 21, changeSummary: "升版：完善操作步骤与判定标准" },
    { id: 63, docNo: "MG-TECH-2024-0012", title: "微生物菌落总数测定作业规范", category: "TECH", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "王磊", effectiveDate: "2024-05-13", reviewDue: "2025-05-13", allowDownload: true, pages: 2, changeSummary: "首发：平板计数判定规则" },
    { id: 64, docNo: "MG-TECH-2025-0013", title: "真菌毒素检测内部方法", category: "TECH", version: "1.0", status: "EFFECTIVE", security: "SECRET", dept: "技术部", owner: "刘洋", effectiveDate: "2025-06-14", reviewDue: "2026-06-14", allowDownload: false, pages: 3, changeSummary: "首发：免疫亲和柱与荧光检测" },
    { id: 65, docNo: "MG-TECH-2026-0014", title: "食品添加剂检测方法汇编", category: "TECH", version: "2.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "孙悦", effectiveDate: "2026-07-15", reviewDue: "2027-07-15", allowDownload: true, pages: 4, changeSummary: "升版：完善操作步骤与判定标准" },
    { id: 66, docNo: "MG-TECH-2026-0015", title: "水质重金属检测技术规范", category: "TECH", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "技术部", owner: "赵倩", effectiveDate: "2026-08-16", reviewDue: "2027-08-16", allowDownload: true, pages: 5, changeSummary: "首发：消解与 ICP 测定要点" },
    { id: 67, docNo: "MG-QM-2026-0010", title: "风险管理控制程序", category: "QM", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "行政部", owner: "周文控", effectiveDate: "2026-09-17", reviewDue: "2027-09-17", allowDownload: true, pages: 6, changeSummary: "首发：风险识别评价与控制措施" },
    { id: 68, docNo: "MG-QM-2024-0011", title: "纠正措施控制程序", category: "QM", version: "2.0", status: "EFFECTIVE", security: "INTERNAL", dept: "行政部", owner: "张敏", effectiveDate: "2024-10-18", reviewDue: "2025-10-18", allowDownload: true, pages: 7, changeSummary: "升版：完善操作步骤与判定标准" },
    { id: 69, docNo: "MG-QM-2025-0012", title: "预防措施控制程序", category: "QM", version: "1.0", status: "REVISING", security: "INTERNAL", dept: "行政部", owner: "李强", effectiveDate: "2025-11-19", reviewDue: "2026-11-19", allowDownload: true, pages: 8, changeSummary: "修订中：拟升版，补充操作细节与记录要求" },
    { id: 70, docNo: "MG-QM-2026-0013", title: "外包服务控制程序", category: "QM", version: "1.0", status: "OBSOLETE", security: "INTERNAL", dept: "行政部", owner: "周文控", effectiveDate: "2024-12-20", reviewDue: "-", allowDownload: true, pages: 9, changeSummary: "已作废：内容并入现行方法文件" },
    { id: 71, docNo: "MG-SOP-2026-0042", title: "网络安全与数据备份规定", category: "SOP", version: "2.0", status: "EFFECTIVE", security: "INTERNAL", dept: "IT部", owner: "赵IT", effectiveDate: "2026-01-21", reviewDue: "2027-01-21", allowDownload: true, pages: 10, changeSummary: "升版：完善操作步骤与判定标准" },
    { id: 72, docNo: "MG-SOP-2026-0043", title: "实验室耗材采购与验收规定", category: "SOP", version: "1.0", status: "EFFECTIVE", security: "INTERNAL", dept: "财务部", owner: "张敏", effectiveDate: "2026-02-22", reviewDue: "2027-02-22", allowDownload: true, pages: 11, changeSummary: "首发：请购审批与到货验收" },
  ],

  /** 文件详情 → 版本历史（按 docNo；字段用 ver/statusText/effDate 避免表格列绑定异常） */
  versionHistories: {
    "MG-SOP-2026-0008": [
      { ver: "2.0", statusText: "现行有效", effDate: "2026-07-01", author: "张敏", summary: "冷链开箱拍照；标签样例更新" },
      { ver: "1.0", statusText: "已替代", effDate: "2025-09-12", author: "张敏", summary: "首发版本：样品接收通用流程" },
    ],
    "MG-QM-2026-0001": [
      { ver: "3.0", statusText: "现行有效", effDate: "2026-03-15", author: "李强", summary: "组织架构与职责调整，对齐 CNAS 意见" },
      { ver: "2.0", statusText: "已替代", effDate: "2024-11-01", author: "李强", summary: "增加检测能力范围附录" },
      { ver: "1.0", statusText: "已替代", effDate: "2022-06-01", author: "李强", summary: "建院首版质量手册" },
    ],
    "MG-SOP-2026-0019": [
      { ver: "2.0", statusText: "现行有效", effDate: "2026-07-18", author: "陈华", summary: "电子签章与防伪码" },
      { ver: "1.0", statusText: "已替代", effDate: "2025-02-14", author: "陈华", summary: "首发：报告编制与签发流程" },
    ],
    "MG-SOP-2026-0002": [
      { ver: "2.0", statusText: "现行有效", effDate: "2026-02-01", author: "李强", summary: "启用 DCC 系统电子签收" },
      { ver: "1.0", statusText: "已替代", effDate: "2023-05-20", author: "李强", summary: "首发：纸质文控流程" },
    ],
    "MG-TECH-2024-0007": [
      { ver: "2.0", statusText: "已废止", effDate: "2024-08-01", author: "王磊", summary: "方法迁入 MG-TECH-2026-0002 后作废" },
      { ver: "1.0", statusText: "已替代", effDate: "2023-01-10", author: "王磊", summary: "首发光谱分析内部规范" },
    ],
    "MG-SOP-2025-0021": [
      { ver: "2.0-draft", statusText: "审批中", effDate: "-", author: "赵倩", summary: "拟升版：易制毒双人双锁与台账字段" },
      { ver: "1.0", statusText: "现行有效", effDate: "2025-11-02", author: "赵倩", summary: "首发危化品贮存管理规定" },
    ],
    "MG-WI-2026-0012": [
      { ver: "1.0", statusText: "现行有效", effDate: "2026-05-20", author: "王磊", summary: "首发：Waters Xevo TQ-S 日常开机点检" },
    ],
    "MG-FORM-2026-0003": [
      { ver: "1.0", statusText: "现行有效", effDate: "2026-01-10", author: "张敏", summary: "首发空白校准记录表" },
    ],
    "MG-SOP-2026-0015": [
      { ver: "1.0", statusText: "现行有效", effDate: "2026-06-18", author: "陈华", summary: "首发：48 小时首响、5 个工作日闭环" },
    ],
    "MG-WI-2026-0004": [
      { ver: "1.0", statusText: "现行有效", effDate: "2026-04-08", author: "刘洋", summary: "首发：Agilent 7890B 周维护清单" },
    ],
    "MG-SOP-2026-0016": [
      { ver: "1.0", statusText: "现行有效", effDate: "2026-07-15", author: "张敏", summary: "首发：干冰/冰袋双方案与温度记录" },
    ],
    "MG-WI-2026-0018": [
      { ver: "1.0", statusText: "现行有效", effDate: "2026-07-08", author: "孙悦", summary: "首发：硝酸浸泡与超声清洗步骤" },
    ],
    "MG-FORM-2026-0011": [
      { ver: "1.0", statusText: "现行有效", effDate: "2026-03-01", author: "李强", summary: "首发：不符合项报告单" },
    ],
    "MG-TECH-2026-0002": [
      { ver: "1.0", statusText: "现行有效", effDate: "2026-06-01", author: "孙悦", summary: "首发：替代旧光谱规范，含检出限表" },
    ],
    "MG-WI-2025-0009": [
      { ver: "1.0", statusText: "现行有效", effDate: "2025-09-12", author: "赵倩", summary: "首发：生物安全柜使用与消毒（复审已超期）" },
    ],
    "MG-SOP-2026-0010": [
      { ver: "1.0", statusText: "现行有效", effDate: "2026-05-06", author: "周宁", summary: "首发：留样期限与销毁审批" },
    ],
    "MG-FORM-2025-0009": [
      { ver: "1.0", statusText: "现行有效", effDate: "2025-04-01", author: "张敏", summary: "首发培训签到表（拟废止并入新系统）" },
    ],
    "MG-WI-2026-0020": [
      { ver: "1.0", statusText: "现行有效", effDate: "2026-07-12", author: "刘洋", summary: "首发：电阻率判定与换芯周期" },
    ],
    "MG-SOP-2024-0019": [
      { ver: "1.0", statusText: "现行有效", effDate: "2024-12-20", author: "赵倩", summary: "首发：医废与危废分流（复审超期）" },
    ],
    "MG-QM-2025-0003": [
      { ver: "1.0", statusText: "现行有效", effDate: "2025-08-08", author: "李强", summary: "首发内部审核控制程序" },
    ],
    "MG-FORM-2026-0014": [
      { ver: "1.0", statusText: "现行有效", effDate: "2026-07-03", author: "王磊", summary: "首发：仪器室共用使用登记表" },
    ],
    "MG-WI-2026-0007": [
      { ver: "1.0", statusText: "现行有效", effDate: "2026-04-22", author: "孙悦", summary: "首发：样品前处理通风柜操作" },
    ],
  },

  /**
   * 分发给我的受控文件（按 forRoles 过滤；切换演示角色后「我的受控文件」不同）
   * forRoles 空/缺省 = 全角色可见（一般不用）
   */
  myDocs: [
    { id: 1, docNo: "MG-SOP-2026-0008", title: "实验室样品接收作业指导书", version: "2.0", receiptStatus: "RECEIVED", distDate: "2026-07-01", distNo: "DF20260701003", forRoles: ["DCC_CONTROLLER", "DCC_DEPT_MKT"] },
    { id: 3, docNo: "MG-WI-2026-0012", title: "LC-MS 开机点检规程", version: "1.0", receiptStatus: "PENDING", distDate: "2026-07-18", distNo: "DF20260718002", forRoles: ["DCC_CONTROLLER", "DCC_DEPT_TECH"] },
    { id: 8, docNo: "MG-WI-2026-0004", title: "气相色谱日常维护指导", version: "1.0", receiptStatus: "PENDING", distDate: "2026-07-19", distNo: "DF20260719001", forRoles: ["DCC_CONTROLLER", "DCC_DEPT_TECH"] },
    { id: 9, docNo: "MG-SOP-2026-0016", title: "生物样本冷链运输指导书", version: "1.0", receiptStatus: "RECEIVED", distDate: "2026-07-15", distNo: "DF20260715004", forRoles: ["DCC_CONTROLLER", "DCC_DEPT_MKT"] },
    { id: 20, docNo: "MG-SOP-2026-0019", title: "检测报告编制与签发", version: "2.0", receiptStatus: "PENDING", distDate: "2026-07-18", distNo: "DF20260718005", forRoles: ["DCC_CONTROLLER", "DCC_DEPT_MKT"] },
    { id: 11, docNo: "MG-SOP-2026-0002", title: "文件控制程序", version: "2.0", receiptStatus: "RECEIVED", distDate: "2026-02-02", distNo: "DF20260202001", forRoles: ["DCC_CONTROLLER", "DCC_DEPT_IT"] },
    { id: 2, docNo: "MG-QM-2026-0001", title: "质量手册", version: "3.0", receiptStatus: "RECEIVED", distDate: "2026-03-16", distNo: "DF20260316001", forRoles: ["DCC_CONTROLLER", "DCC_DEPT_MKT"] },
    { id: 17, docNo: "MG-WI-2026-0020", title: "纯水机制水与换芯规程", version: "1.0", receiptStatus: "PENDING", distDate: "2026-07-12", distNo: "DF20260712006", forRoles: ["DCC_DEPT_IT", "DCC_DEPT_TECH"] },
    { id: 21, docNo: "MG-FORM-2026-0014", title: "仪器使用登记表", version: "1.0", receiptStatus: "RECEIVED", distDate: "2026-07-04", distNo: "DF20260704001", forRoles: ["DCC_DEPT_TECH"] },
    { id: 16, docNo: "MG-FORM-2025-0009", title: "培训签到表（旧版）", version: "1.0", receiptStatus: "PENDING", distDate: "2026-07-10", distNo: "DF20260710009", forRoles: ["DCC_DEPT_FIN"] },
    { id: 13, docNo: "MG-TECH-2026-0002", title: "ICP 重金属检测方法（内部）", version: "1.0", receiptStatus: "RECEIVED", distDate: "2026-06-02", distNo: "DF20260602001", forRoles: ["DCC_DEPT_TECH"] },
    { id: 7, docNo: "MG-SOP-2026-0015", title: "客户投诉处理作业指导书", version: "1.0", receiptStatus: "RECEIVED", distDate: "2026-06-19", distNo: "DF20260619001", forRoles: ["DCC_DEPT_MKT"] },
  ],

  applies: [
    { id: 101, applyNo: "DA20260721001", type: "CREATE", docNo: "MG-FORM-2026-0015", title: "HPLC 柱温箱日常点检表", category: "FORM", productType: "FOOD", status: "IN_APPROVAL", applicant: "刘洋", dept: "技术部", submittedAt: "2026-07-21 09:12", targetVersion: "1.0", reason: "仪器室要求纸质+电子双登记" },
    { id: 102, applyNo: "DA20260720008", type: "REVISE", docNo: "MG-SOP-2025-0021", title: "危化品贮存管理规定", category: "SOP", productType: "ENV", status: "IN_APPROVAL", applicant: "赵倩", dept: "技术部", submittedAt: "2026-07-20 16:40", targetVersion: "2.0", reason: "市监局检查反馈：易制毒需双人双锁" },
    { id: 103, applyNo: "DA20260718003", type: "OBSOLETE", docNo: "MG-TECH-2024-0007", title: "光谱分析内部技术规范", category: "TECH", productType: "PHARMA", status: "APPROVED", applicant: "王磊", dept: "技术部", submittedAt: "2026-07-18 11:05", targetVersion: "2.0", reason: "已被 MG-TECH-2026-0002 替代" },
    { id: 104, applyNo: "DA20260715011", type: "CREATE", docNo: "MG-WI-2026-0022", title: "访客入室安全须知", category: "WI", productType: "SYS", status: "DRAFT", applicant: "周文控", dept: "行政部", submittedAt: "-", targetVersion: "1.0", reason: "前台接待区张贴用" },
    { id: 105, applyNo: "DA20260710002", type: "REVISE", docNo: "MG-SOP-2026-0008", title: "实验室样品接收作业指导书", category: "SOP", productType: "FOOD", status: "PUBLISHED", applicant: "张敏", dept: "行政部", submittedAt: "2026-07-10 10:00", targetVersion: "2.0", reason: "客户A审计要求补冷链开箱记录" },
    { id: 106, applyNo: "DA20260718009", type: "REVISE", docNo: "MG-SOP-2026-0019", title: "检测报告编制与签发", category: "SOP", productType: "FOOD", status: "PUBLISHED", applicant: "陈华", dept: "市场部", submittedAt: "2026-07-16 14:20", targetVersion: "2.0", reason: "上线电子签章" },
    { id: 107, applyNo: "DA20260721005", type: "CREATE", docNo: "MG-WI-2026-0023", title: "移动相配制与废液回收", category: "WI", productType: "FOOD", status: "IN_APPROVAL", applicant: "孙悦", dept: "技术部", submittedAt: "2026-07-21 11:30", targetVersion: "1.0", reason: "有机相废液分类不清，需规程固化" },
  ],

  todos: [
    {
      id: 1,
      bizType: "CREATE",
      docNo: "MG-FORM-2026-0015",
      title: "HPLC 柱温箱日常点检表",
      productType: "L3",
      applicant: "刘洋 / 技术部",
      node: "文控审核（终审）",
      time: "2026-07-21 09:12",
      applyId: 101,
      detail: "申请编号 DA20260721001，目标版本 1.0；文控终审通过即生效，不强制质量批准",
      forRoles: ["DCC_CONTROLLER"],
    },
    {
      id: 2,
      bizType: "EXTERNAL",
      releaseId: 1,
      docNo: "MG-QM-2026-0001",
      title: "质量手册",
      productType: "L1",
      applicant: "陈华 / 市场部",
      node: "文控审核（终审）",
      time: "2026-07-21 11:00",
      detail: "外发客户A；强制水印链接",
      forRoles: ["DCC_CONTROLLER"],
    },
    {
      id: 3,
      bizType: "REVISE",
      docNo: "MG-SOP-2025-0021",
      title: "危化品贮存管理规定",
      productType: "L2",
      applicant: "赵倩 / 技术部",
      node: "部门初审（技术部）",
      time: "2026-07-20 16:40",
      applyId: 102,
      detail: "易制毒双人双锁修订；部门侧待确认（演示）",
      forRoles: ["DCC_DEPT_TECH"],
    },
  ],

  approvalTimeline: [
    { name: "提交申请", user: "刘洋", time: "2026-07-21 09:12:08", status: "done", comment: "提交新建：HPLC 柱温箱日常点检表", signature: "刘洋/MG00321", post: "色谱岗", roles: "DCC_AUTHOR" },
    { name: "部门审核", user: "周宁", time: "2026-07-21 10:05:33", status: "done", comment: "同意，请文控按 FORM 规则编号", signature: "周宁/MG00210", post: "市场部主管", roles: "DCC_DEPT_LEADER,dcc:approve" },
    { name: "文控审核", user: "周文控（待处理）", time: "-", status: "current", comment: "文控终审通过即生效流转（不强制质量批准）", signature: "", post: "文控专员", roles: "DCC_CONTROLLER,dcc:approve" },
  ],

  trainingTasks: [
    { id: 1, taskNo: "TR20260718001", docNo: "MG-SOP-2026-0019", title: "检测报告编制与签发", version: "2.0", assignee: "李市场", post: "市场专员", dueDate: "2026-07-25", status: "PENDING", note: "升版生效自动下发" },
    { id: 2, taskNo: "TR20260718002", docNo: "MG-SOP-2026-0019", title: "检测报告编制与签发", version: "2.0", assignee: "周文控", post: "文控专员", dueDate: "2026-07-25", status: "DONE", completedAt: "2026-07-19 11:20", note: "已签名确认" },
    { id: 3, taskNo: "TR20260715001", docNo: "MG-SOP-2026-0016", title: "生物样本冷链运输指导书", version: "1.0", assignee: "周文控", post: "文控专员", dueDate: "2026-07-22", status: "DONE", completedAt: "2026-07-16 09:40", note: "预览确认+签名" },
    { id: 4, taskNo: "TR20260715002", docNo: "MG-SOP-2026-0016", title: "生物样本冷链运输指导书", version: "1.0", assignee: "李市场", post: "市场专员", dueDate: "2026-07-22", status: "OVERDUE", note: "已超期，待完成" },
    { id: 5, taskNo: "TR20260701001", docNo: "MG-SOP-2026-0008", title: "实验室样品接收作业指导书", version: "2.0", assignee: "李市场", post: "市场专员", dueDate: "2026-07-08", status: "DONE", completedAt: "2026-07-03 14:12", note: "换版培训" },
    { id: 6, taskNo: "TR20260712001", docNo: "MG-WI-2026-0012", title: "LC-MS 开机点检规程", version: "1.0", assignee: "王技术", post: "技术专员", dueDate: "2026-07-24", status: "PENDING", note: "仪器室岗位培训" },
    { id: 7, taskNo: "TR20260712002", docNo: "MG-WI-2026-0020", title: "纯水机制水与换芯规程", version: "1.0", assignee: "赵IT", post: "IT工程师", dueDate: "2026-07-23", status: "PENDING", note: "公用设施相关" },
    { id: 8, taskNo: "TR20260710001", docNo: "MG-FORM-2025-0009", title: "培训签到表（旧版）", version: "1.0", assignee: "孙财务", post: "财务专员", dueDate: "2026-07-26", status: "PENDING", note: "表单使用说明" },
    { id: 9, taskNo: "TR20260706001", docNo: "MG-TECH-2026-0002", title: "ICP 重金属检测方法（内部）", version: "1.0", assignee: "王技术", post: "技术专员", dueDate: "2026-07-21", status: "OVERDUE", note: "方法文件培训" },
    { id: 10, taskNo: "TR20260718003", docNo: "MG-SOP-2026-0015", title: "客户投诉处理作业指导书", version: "1.0", assignee: "李市场", post: "市场专员", dueDate: "2026-07-28", status: "PENDING", note: "客诉流程巩固" },
  ],

  accessApplies: [
    { id: 1, applyNo: "AA20260721001", action: "PRINT", docNo: "MG-WI-2026-0004", title: "气相色谱日常维护指导", version: "1.0", applicant: "王技术", reason: "色谱室现场张贴点检表", status: "IN_APPROVAL", submittedAt: "2026-07-21 08:40" },
    { id: 2, applyNo: "AA20260720003", action: "DOWNLOAD", docNo: "MG-TECH-2026-0002", title: "ICP 重金属检测方法（内部）", version: "1.0", applicant: "王技术", reason: "方法验证对照（仅水印 PDF）", status: "APPROVED", submittedAt: "2026-07-20 15:10", expireAt: "2026-07-27" },
    { id: 3, applyNo: "AA20260718002", action: "PRINT", docNo: "MG-SOP-2026-0016", title: "生物样本冷链运输指导书", version: "1.0", applicant: "李市场", reason: "冷库门口受控张贴", status: "USED", submittedAt: "2026-07-18 10:00" },
  ],

  complianceExports: [
    { id: 1, exportNo: "CE20260721001", asOfTime: "2026-07-21 00:00", scope: "二级（部门细则）", scopeCode: "L2", status: "SUCCESS", createdBy: "周文控", createdAt: "2026-07-21 09:00", pack: "文件版本+审批签名+分发台账+培训证明" },
    { id: 2, exportNo: "CE20260715001", asOfTime: "2026-07-15 18:00", scope: "全库现行有效", scopeCode: "ALL", status: "SUCCESS", createdBy: "周文控", createdAt: "2026-07-15 18:20", pack: "元数据清单+正文水印PDF" },
  ],

  trainingMatrix: [
    { id: 1, category: "SOP", productType: "L2", post: "样品接收岗", dueDays: 7, mustTrain: true },
    { id: 2, category: "SOP", productType: "L2", post: "报告编制岗", dueDays: 7, mustTrain: true },
    { id: 3, category: "TECH", productType: "L2", post: "方法开发工程师", dueDays: 5, mustTrain: true },
    { id: 4, category: "FORM", productType: "L3", post: "表单填写岗", dueDays: 7, mustTrain: true },
  ],

  changes: [
    { id: 1, changeNo: "ECN20260701001", docNo: "MG-SOP-2026-0008", title: "实验室样品接收作业指导书", fromVer: "1.0", toVer: "2.0", effectiveDate: "2026-07-01", status: "CLOSED", recycleProgress: "5/5", noticeNo: "CN20260701001" },
    { id: 2, changeNo: "ECN20260721002", docNo: "MG-SOP-2025-0021", title: "危化品贮存管理规定", fromVer: "1.0", toVer: "2.0", effectiveDate: "2026-07-25", status: "RECYCLING", recycleProgress: "2/7", noticeNo: "CN20260721002" },
    { id: 3, changeNo: "ECN20260718003", docNo: "MG-SOP-2026-0019", title: "检测报告编制与签发", fromVer: "1.0", toVer: "2.0", effectiveDate: "2026-07-18", status: "NOTIFYING", recycleProgress: "1/3", noticeNo: "CN20260718003" },
    { id: 4, changeNo: "ECN20260715004", docNo: "MG-SOP-2026-0016", title: "生物样本冷链运输指导书", fromVer: "-", toVer: "1.0", effectiveDate: "2026-07-15", status: "CLOSED", recycleProgress: "-", noticeNo: "CN20260715004" },
  ],

  notices: [
    { id: 1, noticeNo: "CN20260701001", title: "【换版】MG-SOP-2026-0008 样品接收指导书 1.0→2.0，请停用旧版", sentAt: "2026-07-01 09:00", unread: 0, total: 36, status: "CLOSED" },
    { id: 2, noticeNo: "CN20260721001", title: "【分发】MG-WI-2026-0004 气相色谱维护指导，请于 7/22 前签收", sentAt: "2026-07-19 15:20", unread: 12, total: 18, status: "SENT" },
    { id: 3, noticeNo: "CN20260718003", title: "【换版】检测报告编制与签发已升版 2.0，旧纸质份回收中", sentAt: "2026-07-18 16:00", unread: 5, total: 22, status: "SENT" },
    { id: 4, noticeNo: "CN20260715004", title: "【新发】生物样本冷链运输指导书 1.0 已生效并分发行政部/样品组", sentAt: "2026-07-15 10:30", unread: 0, total: 14, status: "CLOSED" },
  ],

  distributions: [
    { id: 1, distNo: "DF20260719001", docNo: "MG-WI-2026-0004", title: "气相色谱日常维护指导", version: "1.0", requireReceipt: true, status: "PARTIAL", sentAt: "2026-07-19 15:20", received: "6/18", targets: "技术部色谱组、行政部计量" },
    { id: 2, distNo: "DF20260718002", docNo: "MG-WI-2026-0012", title: "LC-MS 开机点检规程", version: "1.0", requireReceipt: true, status: "PARTIAL", sentAt: "2026-07-18 11:00", received: "14/16", targets: "仪器室1、仪器室2" },
    { id: 3, distNo: "DF20260701003", docNo: "MG-SOP-2026-0008", title: "实验室样品接收作业指导书", version: "2.0", requireReceipt: true, status: "COMPLETED", sentAt: "2026-07-01 09:00", received: "36/36", targets: "市场部、行政部、客服、技术部" },
    { id: 4, distNo: "DF20260715004", docNo: "MG-SOP-2026-0016", title: "生物样本冷链运输指导书", version: "1.0", requireReceipt: true, status: "COMPLETED", sentAt: "2026-07-15 10:40", received: "14/14", targets: "行政部、市场部" },
    { id: 5, distNo: "DF20260718005", docNo: "MG-SOP-2026-0019", title: "检测报告编制与签发", version: "2.0", requireReceipt: true, status: "PARTIAL", sentAt: "2026-07-18 16:10", received: "9/22", targets: "市场部、授权签字人、行政部" },
    { id: 6, distNo: "DF20260712006", docNo: "MG-WI-2026-0020", title: "纯水机制水与换芯规程", version: "1.0", requireReceipt: true, status: "COMPLETED", sentAt: "2026-07-12 09:00", received: "8/8", targets: "技术部公用设施岗" },
  ],

  /** 分发签收明细示例（点「明细」可展示） */
  receiptDetails: {
    DF20260719001: [
      { user: "刘洋", dept: "技术部", status: "RECEIVED", time: "2026-07-19 16:02" },
      { user: "王磊", dept: "技术部", status: "RECEIVED", time: "2026-07-19 17:11" },
      { user: "孙悦", dept: "技术部", status: "PENDING", time: "-" },
      { user: "张敏", dept: "行政部", status: "PENDING", time: "-" },
      { user: "周文控", dept: "行政部", status: "RECEIVED", time: "2026-07-20 09:01" },
    ],
  },

  hardCopies: [
    { id: 1, copyNo: "HC-SOP-2026-0008-01", docNo: "MG-SOP-2026-0008", version: "2.0", holder: "市场部", location: "接收窗口墙柜", status: "IN_USE", printedAt: "2026-07-01", printedBy: "周文控" },
    { id: 2, copyNo: "HC-SOP-2026-0008-02", docNo: "MG-SOP-2026-0008", version: "2.0", holder: "行政部", location: "文件柜B-3", status: "IN_USE", printedAt: "2026-07-01", printedBy: "周文控" },
    { id: 3, copyNo: "HC-SOP-2025-0021-01", docNo: "MG-SOP-2025-0021", version: "1.0", holder: "危化品库", location: "库房门口看板", status: "RECYCLE_PENDING", printedAt: "2025-11-02", printedBy: "赵倩", recycleReason: "换版 2.0 待生效，旧份须回收" },
    { id: 4, copyNo: "HC-SOP-2025-0021-02", docNo: "MG-SOP-2025-0021", version: "1.0", holder: "技术部", location: "技术部文件架第2格", status: "RECYCLE_PENDING", printedAt: "2025-11-02", printedBy: "赵倩", recycleReason: "换版回收" },
    { id: 5, copyNo: "HC-SOP-2025-0021-03", docNo: "MG-SOP-2025-0021", version: "1.0", holder: "样品前处理室", location: "通风柜旁夹子", status: "RECYCLE_PENDING", printedAt: "2025-11-05", printedBy: "周文控", recycleReason: "换版回收" },
    { id: 6, copyNo: "HC-WI-2026-0012-01", docNo: "MG-WI-2026-0012", version: "1.0", holder: "仪器室1", location: "LC-MS 机旁夹", status: "IN_USE", printedAt: "2026-05-20", printedBy: "王磊" },
    { id: 7, copyNo: "HC-SOP-2026-0019-01", docNo: "MG-SOP-2026-0019", version: "1.0", holder: "市场部", location: "签发岗桌面", status: "RECYCLE_PENDING", printedAt: "2025-02-14", printedBy: "陈华", recycleReason: "已升版 2.0" },
    { id: 8, copyNo: "HC-SOP-2026-0019-02", docNo: "MG-SOP-2026-0019", version: "1.0", holder: "授权签字人办公室", location: "抽屉A", status: "RECYCLE_PENDING", printedAt: "2025-03-01", printedBy: "周文控", recycleReason: "已升版 2.0" },
    { id: 9, copyNo: "HC-WI-2026-0004-01", docNo: "MG-WI-2026-0004", version: "1.0", holder: "色谱室", location: "7890B 旁", status: "IN_USE", printedAt: "2026-04-10", printedBy: "刘洋" },
    { id: 10, copyNo: "HC-SOP-2026-0016-01", docNo: "MG-SOP-2026-0016", version: "1.0", holder: "市场部", location: "冷库门口", status: "IN_USE", printedAt: "2026-07-15", printedBy: "周文控" },
  ],

  borrows: [
    { id: 1, borrowNo: "BR20260720001", docNo: "MG-QM-2026-0001", title: "质量手册", type: "ELECTRONIC", applicant: "陈华", dept: "市场部", expectReturn: "2026-07-27", status: "BORROWED", reason: "客户A二方审核准备材料" },
    { id: 2, borrowNo: "BR20260715002", docNo: "MG-SOP-2026-0008", title: "实验室样品接收作业指导书", type: "HARDCOPY", applicant: "刘洋", dept: "技术部", expectReturn: "2026-07-22", status: "OVERDUE", reason: "新员工岗前培训纸质讲义", copyNo: "HC-SOP-2026-0008-02" },
    { id: 3, borrowNo: "BR20260718003", docNo: "MG-TECH-2026-0002", title: "ICP 重金属检测方法（内部）", type: "ELECTRONIC", applicant: "王磊", dept: "技术部", expectReturn: "2026-07-25", status: "BORROWED", reason: "方法验证对照阅读（禁止下载）" },
    { id: 4, borrowNo: "BR20260705004", docNo: "MG-SOP-2026-0002", title: "文件控制程序", type: "ELECTRONIC", applicant: "周宁", dept: "市场部", expectReturn: "2026-07-12", status: "RETURNED", reason: "内审员培训" },
  ],

  externals: [
    { id: 1, releaseNo: "ER20260721001", docNo: "MG-QM-2026-0001", title: "质量手册", version: "3.0", receiver: "客户A科技有限公司", contact: "采购部-林女士", expireDate: "2026-08-21", status: "IN_APPROVAL", applicant: "陈华", purpose: "供应商审核资料包" },
    { id: 2, releaseNo: "ER20260601002", docNo: "MG-SOP-2026-0015", title: "客户投诉处理作业指导书", version: "1.0", receiver: "客户B检测中心", contact: "行政部-韩工", expireDate: "2026-07-01", status: "EXPIRED", applicant: "陈华", purpose: "合作对接流程对齐" },
    { id: 3, releaseNo: "ER20260710003", docNo: "MG-SOP-2026-0019", title: "检测报告编制与签发", version: "2.0", receiver: "客户C医药股份", contact: "QA-徐经理", expireDate: "2026-09-30", status: "APPROVED", applicant: "陈华", purpose: "报告样式确认（仅预览外链）" },
  ],

  externalDocs: [
    { id: 1, extNo: "MG-EXT-STD-2026-0003", title: "GB/T 27025-2019 检测和校准实验室能力的通用要求", sourceType: "STANDARD", sourceOrg: "国家标准委", receiveDate: "2026-02-10", expireDate: "2029-12-31", status: "EFFECTIVE", owner: "李强", security: "INTERNAL", remark: "体系主标准，纸质存放行政部柜 A-1" },
    { id: 2, extNo: "MG-EXT-CUS-2026-0011", title: "客户A 样品包装规范 V3", sourceType: "CUSTOMER", sourceOrg: "客户A科技有限公司", receiveDate: "2026-06-05", expireDate: "2026-12-31", status: "EFFECTIVE", owner: "陈华", security: "SECRET", remark: "影响样品接收指导书附录" },
    { id: 3, extNo: "MG-EXT-STD-2023-0008", title: "旧版实验室安全通则（协会）", sourceType: "STANDARD", sourceOrg: "行业协会", receiveDate: "2023-04-01", expireDate: "2025-12-31", status: "EXPIRED", owner: "赵倩", security: "INTERNAL", remark: "已废止，仅归档查阅" },
    { id: 4, extNo: "MG-EXT-STD-2026-0005", title: "JJF 1059.1-2012 测量不确定度评定与表示", sourceType: "STANDARD", sourceOrg: "国家计量院", receiveDate: "2026-07-06", expireDate: "2030-12-31", status: "EFFECTIVE", owner: "张敏", security: "INTERNAL", remark: "本月登记，供方法验证引用" },
    { id: 5, extNo: "MG-EXT-CUS-2026-0014", title: "客户C 报告封面与签章要求（2026）", sourceType: "CUSTOMER", sourceOrg: "客户C医药股份", receiveDate: "2026-07-09", expireDate: "2026-12-31", status: "EFFECTIVE", owner: "陈华", security: "SECRET", remark: "驱动报告编制 SOP 升版 2.0" },
  ],

  reviews: [
    { id: 1, docNo: "MG-WI-2026-0004", title: "气相色谱日常维护指导", dueDate: "2026-07-25", assignee: "刘洋", status: "PENDING", conclusion: "-", note: "距到期 4 天" },
    { id: 2, docNo: "MG-WI-2026-0012", title: "LC-MS 开机点检规程", dueDate: "2026-08-20", assignee: "王磊", status: "PENDING", conclusion: "-", note: "正常周期内" },
    { id: 3, docNo: "MG-FORM-2025-0009", title: "培训签到表（旧版）", dueDate: "2026-07-10", assignee: "张敏", status: "OVERDUE", conclusion: "-", note: "已超期 11 天" },
    { id: 4, docNo: "MG-SOP-2025-0010", title: "文件控制程序（旧编号示意）", dueDate: "2026-06-30", assignee: "李强", status: "DONE", conclusion: "KEEP", note: "已维持，复审日顺延至 2027-06-30" },
    { id: 5, docNo: "MG-WI-2025-0009", title: "生物安全柜使用与消毒", dueDate: "2026-07-10", assignee: "赵倩", status: "OVERDUE", conclusion: "-", note: "已超期，技术部待出结论" },
    { id: 6, docNo: "MG-SOP-2024-0019", title: "实验室废弃物分类处置", dueDate: "2026-06-30", assignee: "赵倩", status: "OVERDUE", conclusion: "-", note: "医废标签变更未完成" },
    { id: 7, docNo: "MG-QM-2025-0003", title: "内部审核控制程序", dueDate: "2026-08-08", assignee: "李强", status: "PENDING", conclusion: "-", note: "下月到期" },
  ],

  /** 近 7 日生效（工作台用） */
  recentEffective: [
    { docNo: "MG-SOP-2026-0019", title: "检测报告编制与签发", version: "2.0", dept: "市场部", effectiveDate: "2026-07-18", type: "修订升版" },
    { docNo: "MG-SOP-2026-0016", title: "生物样本冷链运输指导书", version: "1.0", dept: "行政部", effectiveDate: "2026-07-15", type: "新建发布" },
    { docNo: "MG-WI-2026-0020", title: "纯水机制水与换芯规程", version: "1.0", dept: "IT部", effectiveDate: "2026-07-12", type: "新建发布" },
    { docNo: "MG-WI-2026-0018", title: "ICP-MS 雾化器清洗规程", version: "1.0", dept: "技术部", effectiveDate: "2026-07-08", type: "新建发布" },
    { docNo: "MG-FORM-2026-0014", title: "仪器使用登记表", version: "1.0", dept: "技术部", effectiveDate: "2026-07-03", type: "新建发布" },
    { docNo: "MG-SOP-2026-0008", title: "实验室样品接收作业指导书", version: "2.0", dept: "行政部", effectiveDate: "2026-07-01", type: "修订升版" },
  ],

  accessLogs: [
    { id: 1, user: "王磊", docNo: "MG-WI-2026-0012", version: "1.0", action: "PREVIEW", time: "2026-07-21 15:02", ip: "192.168.1.56" },
    { id: 2, user: "张敏", docNo: "MG-SOP-2026-0008", version: "2.0", action: "DOWNLOAD", time: "2026-07-21 14:40", ip: "192.168.1.22" },
    { id: 3, user: "刘洋", docNo: "MG-WI-2026-0004", version: "1.0", action: "PRINT", time: "2026-07-20 11:18", ip: "192.168.1.77" },
    { id: 4, user: "外链·客户C", docNo: "MG-SOP-2026-0019", version: "2.0", action: "EXTERNAL_VIEW", time: "2026-07-19 09:33", ip: "118.124.x.x" },
    { id: 5, user: "周文控", docNo: "MG-QM-2026-0001", version: "3.0", action: "PREVIEW", time: "2026-07-21 10:18", ip: "192.168.1.10" },
    { id: 6, user: "陈华", docNo: "MG-SOP-2026-0015", version: "1.0", action: "DOWNLOAD", time: "2026-07-21 09:55", ip: "192.168.1.45" },
    { id: 7, user: "孙悦", docNo: "MG-TECH-2026-0002", version: "1.0", action: "PREVIEW", time: "2026-07-20 16:40", ip: "192.168.1.63" },
    { id: 8, user: "赵倩", docNo: "MG-SOP-2025-0021", version: "1.0", action: "PREVIEW", time: "2026-07-20 15:02", ip: "192.168.1.88" },
    { id: 9, user: "王技术", docNo: "MG-SOP-2024-0030", version: "2.0", action: "PREVIEW", time: "2026-07-21 16:10", ip: "192.168.1.71" },
    { id: 10, user: "李市场", docNo: "MG-SOP-2025-0031", version: "1.0", action: "DOWNLOAD", time: "2026-07-21 16:22", ip: "192.168.1.45" },
    { id: 11, user: "孙财务", docNo: "MG-SOP-2026-0032", version: "1.0", action: "PREVIEW", time: "2026-07-21 16:40", ip: "192.168.1.90" },
    { id: 12, user: "赵IT", docNo: "MG-SOP-2026-0033", version: "2.0", action: "PRINT", time: "2026-07-21 17:05", ip: "192.168.1.33" },
    { id: 13, user: "周文控", docNo: "MG-SOP-2026-0034", version: "1.0", action: "PREVIEW", time: "2026-07-21 17:18", ip: "192.168.1.10" },
  ],

  categories: [
    { id: 1, code: "QM", name: "质量手册/程序文件", reviewMonths: 12, allowDownload: true },
    { id: 2, code: "SOP", name: "作业指导书", reviewMonths: 12, allowDownload: true },
    { id: 3, code: "WI", name: "操作规程", reviewMonths: 6, allowDownload: true },
    { id: 4, code: "FORM", name: "记录表格", reviewMonths: 12, allowDownload: true },
    { id: 5, code: "TECH", name: "技术文件", reviewMonths: 12, allowDownload: true },
    { id: 6, code: "EXT_STD", name: "外来标准", reviewMonths: 24, allowDownload: true },
    { id: 7, code: "EXT_CUS", name: "客户文件", reviewMonths: 12, allowDownload: false },
  ],

  numberRules: [
    { id: 1, name: "SOP编号", pattern: "MG-SOP-{YYYY}-{SEQ:4}", example: "MG-SOP-2026-0020", reset: "YEAR" },
    { id: 2, name: "WI编号", pattern: "MG-WI-{YYYY}-{SEQ:4}", example: "MG-WI-2026-0021", reset: "YEAR" },
    { id: 3, name: "FORM编号", pattern: "MG-FORM-{YYYY}-{SEQ:4}", example: "MG-FORM-2026-0015", reset: "YEAR" },
    { id: 4, name: "外来标准", pattern: "MG-EXT-STD-{YYYY}-{SEQ:4}", example: "MG-EXT-STD-2026-0006", reset: "YEAR" },
  ],

  approvalTemplates: [
    { code: "DOC_CREATE", name: "新建文件", nodes: "部门负责人 → 文控员（终审，不强制质量批准）" },
    { code: "DOC_REVISE", name: "修订文件", nodes: "部门负责人 → 文控员（终审，不强制质量批准）" },
    { code: "DOC_OBSOLETE", name: "作废文件", nodes: "部门负责人 → 文控员（终审，不强制质量批准）" },
    { code: "BORROW", name: "借阅", nodes: "部门负责人 → 文控员" },
    { code: "EXTERNAL", name: "外发", nodes: "部门负责人 → 文控员（终审，不强制质量批准）" },
    { code: "HARDCOPY_PRINT", name: "纸质加印", nodes: "文控员" },
    { code: "ACCESS_PRINT", name: "打印二次申请", nodes: "部门负责人 → 文控备案" },
    { code: "ACCESS_DOWNLOAD", name: "下载二次申请", nodes: "部门负责人 → 文控备案" },
  ],

  watermark: {
    template: "{userName} {userNo} {docNo} {datetime}",
    preview: true,
    download: true,
    print: true,
    forceGlobal: true,
    opacity: 0.18,
  },
};

// —— 补齐文件级别(L1/L2/L3) / 所属部门 / 数据域 / 三级表单正文 ——
(function enrichDocs(d) {
  const levelByCat = { QM: "L1", SOP: "L2", WI: "L2", FORM: "L3", TECH: "L2" };
  const domainByCat = { QM: "PROD", SOP: "PROD", WI: "PROD", FORM: "PROD", TECH: "RD" };
  const ownerDeptByOld = {
    行政部: "行政部",
    市场部: "市场部",
    技术部: "技术部",
    IT部: "IT部",
    财务部: "财务部",
  };
  const overrides = {
    "MG-TECH-2026-0002": { productType: "L2", accessDomain: "RD", ownerDept: "技术部" },
    "MG-TECH-2024-0007": { productType: "L2", accessDomain: "RD", ownerDept: "技术部" },
    "MG-SOP-2025-0021": { productType: "L2", accessDomain: "PROD", ownerDept: "技术部" },
    "MG-SOP-2024-0019": { productType: "L2", accessDomain: "PROD", ownerDept: "技术部" },
    "MG-WI-2025-0009": { productType: "L2", accessDomain: "PROD", ownerDept: "技术部" },
    "MG-QM-2026-0001": { productType: "L1", accessDomain: "PROD", ownerDept: "行政部" },
    "MG-QM-2025-0003": { productType: "L1", accessDomain: "PROD", ownerDept: "行政部" },
    "MG-SOP-2026-0002": { productType: "L1", accessDomain: "PROD", ownerDept: "行政部" },
    "MG-SOP-2026-0008": { productType: "L2", ownerDept: "行政部" },
    "MG-SOP-2026-0016": { productType: "L2", ownerDept: "行政部" },
    "MG-FORM-2026-0014": { productType: "L3", ownerDept: "技术部" },
    "MG-FORM-2026-0003": { productType: "L3", ownerDept: "技术部" },
    "MG-FORM-2026-0011": { productType: "L3", ownerDept: "行政部" },
    "MG-FORM-2025-0009": { productType: "L3", ownerDept: "财务部" },
    "MG-SOP-2026-0015": { productType: "L2", ownerDept: "市场部" },
    "MG-SOP-2026-0019": { productType: "L2", ownerDept: "市场部" },
    "MG-WI-2026-0020": { productType: "L2", ownerDept: "IT部" },
  };
  const ptNameMap = Object.fromEntries(d.productTypes.map((x) => [x.code, x.name]));
  const legacyPt = { FOOD: "L2", ENV: "L2", PHARMA: "L2", SYS: "L1" };
  const statusLabel = {
    EFFECTIVE: "现行有效",
    REVISING: "现行有效",
    OBSOLETE: "已废止",
  };
  d.documents.forEach((doc, idx) => {
    const o = overrides[doc.docNo] || {};
    if (!doc.docNo) doc.docNo = "MG-UNKNOWN-0000";
    if (!doc.title) doc.title = "（未命名受控文件）";
    let lv = o.productType || levelByCat[doc.category] || "L2";
    if (legacyPt[lv]) lv = legacyPt[lv];
    doc.productType = lv;
    doc.productTypeName = ptNameMap[doc.productType] || doc.productType;
    doc.accessDomain = o.accessDomain || domainByCat[doc.category] || "PROD";
    doc.ownerDept = o.ownerDept || ownerDeptByOld[doc.dept] || d.ownerDepts[idx % d.ownerDepts.length].name;
    // 编制部门与所属部门同口径，便于演示「本部门直下」
    doc.dept = doc.ownerDept;
    if (doc.security === "PUBLIC") doc.security = "INTERNAL";
    doc.webEditable = !!(d.productTypes.find((p) => p.code === doc.productType) || {}).editable;
    // 一/二/三级：非密默认可下载（本部门直授）；仅机密保持禁止直下
    if (doc.security !== "SECRET") doc.allowDownload = true;
    if (doc.productType === "L3" && !doc.formBody) {
      doc.formBody =
        "表单标题：" +
        doc.title +
        "\n编号：" +
        doc.docNo +
        "\n所属部门：" +
        doc.ownerDept +
        "\n填写说明：本页可直接编辑保存（三级表单，无需走修订审批）。\n\n1. 日期：________\n2. 填写人：________\n3. 记录内容：\n________\n________\n";
    }
    doc.fullText =
      doc.fullText ||
      [doc.title, doc.changeSummary, doc.docNo, doc.category, doc.ownerDept, doc.productTypeName, "受控 水印 表单"].join(" ");
    if (!d.versionHistories[doc.docNo]) {
      const major = parseInt(String(doc.version || "1").split(".")[0], 10) || 1;
      const rows = [];
      for (let m = major; m >= 1; m--) {
        const ver = m + ".0";
        const isCurrent = ver === doc.version || (m === major && doc.version.indexOf(String(major)) === 0);
        rows.push({
          ver,
          statusText: isCurrent ? statusLabel[doc.status] || "现行有效" : "已替代",
          effDate: isCurrent ? doc.effectiveDate : "202" + (4 + m) + "-0" + m + "-15",
          author: doc.owner,
          summary: isCurrent ? doc.changeSummary || "本版发布" : "历史版本 " + ver + "（已由新版替代）",
        });
      }
      d.versionHistories[doc.docNo] = rows;
    }
  });
})(window.DCC_DATA);

// —— 关联列表补齐文件编号/名称/文件级别/所属部门（避免界面空值） ——
(function enrichRelated(d) {
  const byNo = Object.fromEntries(d.documents.map((x) => [x.docNo, x]));
  const legacyPt = { FOOD: "L2", ENV: "L2", PHARMA: "L2", SYS: "L1" };
  const fill = (row) => {
    if (!row) return;
    const src = row.docNo && byNo[row.docNo];
    if (src) {
      if (!row.title) row.title = src.title;
      if (!row.productType) row.productType = src.productType;
      if (!row.version) row.version = src.version;
      if (!row.security) row.security = src.security;
      if (!row.ownerDept) row.ownerDept = src.ownerDept;
    }
    if (legacyPt[row.productType]) row.productType = legacyPt[row.productType];
    if (!row.docNo) row.docNo = "-";
    if (!row.title) row.title = "（未命名）";
    row.productTypeName = row.productTypeName || (d.productTypes.find((p) => p.code === row.productType) || {}).name || row.productType || "-";
  };
  [
    d.applies,
    d.todos,
    d.changes,
    d.distributions,
    d.hardCopies,
    d.borrows,
    d.externals,
    d.reviews,
    d.recentEffective,
    d.accessLogs,
    d.accessApplies,
    d.trainingTasks,
    d.myDocs,
  ].forEach((list) => (list || []).forEach(fill));
})(window.DCC_DATA);

// —— 统计与台账对齐 ——
(function syncStats(d) {
  const monthPrefix = "2026-07";
  const effectiveDocs = d.documents.filter((x) => x.status === "EFFECTIVE");
  const monthNew = d.recentEffective.filter((x) => x.type === "新建发布" && x.effectiveDate.startsWith(monthPrefix)).length;
  const monthRevise = d.recentEffective.filter((x) => x.type === "修订升版" && x.effectiveDate.startsWith(monthPrefix)).length;
  d.stats = {
    effective: effectiveDocs.length,
    monthNew,
    monthRevise,
    reviewOverdue: d.reviews.filter((x) => x.status === "OVERDUE").length,
    todoApprove: d.todos.length,
    todoReceipt: d.myDocs.filter((x) => x.receiptStatus === "PENDING").length,
    hardRecycle: d.hardCopies.filter((x) => x.status === "RECYCLE_PENDING").length,
    todoTrain: d.trainingTasks.filter((x) => x.status === "PENDING" || x.status === "OVERDUE").length,
    todoAccess: d.accessApplies.filter((x) => x.status === "IN_APPROVAL").length,
    totalDocs: d.documents.length,
    revising: d.documents.filter((x) => x.status === "REVISING").length,
    obsolete: d.documents.filter((x) => x.status === "OBSOLETE").length,
  };
})(window.DCC_DATA);
