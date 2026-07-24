# -*- coding: utf-8 -*-
from pathlib import Path
import re

p = Path(__file__).resolve().parents[1] / "src" / "mock" / "data.js"
t = p.read_text(encoding="utf-8")

# —— applies ——
t2, n = re.subn(
    r"productType: \"FOOD\"",
    'fileLevel: "L2", productType: "SEMI_TEST"',
    t,
    count=0,
)
# Too blunt - FOOD appears in applies with different levels. Do line-by-line for applies block.

applies_map = {
    101: ('L3', 'SEMI_TEST'),
    102: ('L2', 'FRONTIER_TEST'),
    103: ('L2', 'SIPH_MASS'),
    104: ('L2', 'COMMON'),
    105: ('L2', 'SEMI_TEST'),
    106: ('L2', 'SEMI_TEST'),
    107: ('L2', 'FRONTIER_TEST'),
    108: ('L3', 'COMMON'),
    109: ('L2', 'COMMON'),
}

def patch_apply_line(m):
    id_ = int(m.group(1))
    rest = m.group(2)
    fl, pt = applies_map.get(id_, ('L2', 'COMMON'))
    rest = re.sub(r'productType: "[^"]*"', f'fileLevel: "{fl}", productType: "{pt}"', rest, count=1)
    return f'{{ id: {id_},{rest}'

t = re.sub(
    r'\{ id: (10[1-9]),((?:(?!\{ id:).)*?)(?=\n    \{ id: |\n  \],)',
    patch_apply_line,
    t,
    flags=re.S,
)

# —— todos productType L1/L2/L3 → fileLevel + productType ——
todos = [
    (1, 'L3', 'SEMI_TEST'),
    (2, 'L1', 'COMMON'),
    (3, 'L2', 'FRONTIER_TEST'),
]
for tid, fl, pt in todos:
    t = re.sub(
        rf'(\{{\s*id: {tid},\s*bizType: "[^"]+",\s*docNo: "[^"]+",\s*title: "[^"]+",\s*)productType: "[^"]+"',
        rf'\1fileLevel: "{fl}", productType: "{pt}"',
        t,
        count=1,
    )
# releaseId todo has different shape
t = t.replace(
    'title: "质量手册",\n      productType: "L1",',
    'title: "质量手册",\n      fileLevel: "L1",\n      productType: "COMMON",',
)
t = t.replace(
    'title: "危化品贮存管理规定",\n      productType: "L2",',
    'title: "危化品贮存管理规定",\n      fileLevel: "L2",\n      productType: "FRONTIER_TEST",',
)
t = t.replace(
    'title: "HPLC 柱温箱日常点检表",\n      productType: "L3",',
    'title: "HPLC 柱温箱日常点检表",\n      fileLevel: "L3",\n      productType: "SEMI_TEST",',
)

# —— trainingMatrix ——
t = t.replace(
    '{ id: 1, category: "SOP", productType: "L2", post: "样品接收岗"',
    '{ id: 1, category: "SOP", fileLevel: "L2", productType: "SEMI_TEST", post: "样品接收岗"',
)
t = t.replace(
    '{ id: 2, category: "SOP", productType: "L2", post: "报告编制岗"',
    '{ id: 2, category: "SOP", fileLevel: "L2", productType: "SEMI_TEST", post: "报告编制岗"',
)
t = t.replace(
    '{ id: 3, category: "TECH", productType: "L2", post: "方法开发工程师"',
    '{ id: 3, category: "TECH", fileLevel: "L2", productType: "SIPH_MASS", post: "方法开发工程师"',
)
t = t.replace(
    '{ id: 4, category: "FORM", productType: "L3", post: "表单填写岗"',
    '{ id: 4, category: "FORM", fileLevel: "L3", productType: "COMMON", post: "表单填写岗"',
)

# —— enrichDocs + enrichRelated rewrite ——
old_enrich = """// —— 补齐文件级别(L1/L2/L3) / 所属部门 / 数据域 / 三级表单正文 ——
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
        "\\n编号：" +
        doc.docNo +
        "\\n所属部门：" +
        doc.ownerDept +
        "\\n填写说明：本页可直接编辑保存（三级表单，无需走修订审批）。\\n\\n1. 日期：________\\n2. 填写人：________\\n3. 记录内容：\\n________\\n________\\n";
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
})(DCC_DATA);

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
})(DCC_DATA);"""

new_enrich = r"""// —— 补齐 fileLevel + 业务领域 productType / 所属部门 / 数据域 / 三级表单正文 ——
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
  const domainCodes = d.productTypes.map((x) => x.code);
  const overrides = {
    "MG-TECH-2026-0002": { fileLevel: "L2", productType: "SIPH_MASS", accessDomain: "RD", ownerDept: "技术部" },
    "MG-TECH-2024-0007": { fileLevel: "L2", productType: "SIPH_MASS", accessDomain: "RD", ownerDept: "技术部" },
    "MG-SOP-2025-0021": { fileLevel: "L2", productType: "FRONTIER_TEST", accessDomain: "PROD", ownerDept: "技术部" },
    "MG-SOP-2024-0019": { fileLevel: "L2", productType: "FRONTIER_TEST", accessDomain: "PROD", ownerDept: "技术部" },
    "MG-WI-2025-0009": { fileLevel: "L2", productType: "SEMI_TEST", accessDomain: "PROD", ownerDept: "技术部" },
    "MG-QM-2026-0001": { fileLevel: "L1", productType: "COMMON", accessDomain: "PROD", ownerDept: "行政部" },
    "MG-QM-2025-0003": { fileLevel: "L1", productType: "COMMON", accessDomain: "PROD", ownerDept: "行政部" },
    "MG-SOP-2026-0002": { fileLevel: "L1", productType: "COMMON", accessDomain: "PROD", ownerDept: "行政部" },
    "MG-SOP-2026-0008": { fileLevel: "L2", productType: "SEMI_TEST", ownerDept: "行政部" },
    "MG-SOP-2026-0016": { fileLevel: "L2", productType: "SEMI_TEST", ownerDept: "行政部" },
    "MG-FORM-2026-0014": { fileLevel: "L3", productType: "SEMI_TEST", ownerDept: "技术部" },
    "MG-FORM-2026-0003": { fileLevel: "L3", productType: "SEMI_TEST", ownerDept: "技术部" },
    "MG-FORM-2026-0011": { fileLevel: "L3", productType: "COMMON", ownerDept: "行政部" },
    "MG-FORM-2025-0009": { fileLevel: "L3", productType: "COMMON", ownerDept: "财务部" },
    "MG-SOP-2026-0015": { fileLevel: "L2", productType: "FRONTIER_TEST", ownerDept: "市场部" },
    "MG-SOP-2026-0019": { fileLevel: "L2", productType: "SEMI_TEST", ownerDept: "市场部" },
    "MG-WI-2026-0020": { fileLevel: "L2", productType: "COMMON", ownerDept: "IT部" },
  };
  const levelNameMap = Object.fromEntries(d.fileLevels.map((x) => [x.code, x.name]));
  const ptNameMap = Object.fromEntries(d.productTypes.map((x) => [x.code, x.name]));
  const legacyLevel = { FOOD: "L2", ENV: "L2", PHARMA: "L2", SYS: "L1", L1: "L1", L2: "L2", L3: "L3" };
  const statusLabel = {
    EFFECTIVE: "现行有效",
    REVISING: "现行有效",
    OBSOLETE: "已废止",
  };
  d.documents.forEach((doc, idx) => {
    const o = overrides[doc.docNo] || {};
    if (!doc.docNo) doc.docNo = "MG-UNKNOWN-0000";
    if (!doc.title) doc.title = "（未命名受控文件）";
    let lv = o.fileLevel || doc.fileLevel || levelByCat[doc.category] || "L2";
    if (legacyLevel[lv]) lv = legacyLevel[lv];
    // 旧数据把级别误写在 productType 上
    if (!o.fileLevel && legacyLevel[doc.productType] && ["L1", "L2", "L3"].includes(legacyLevel[doc.productType])) {
      lv = legacyLevel[doc.productType];
    }
    doc.fileLevel = lv;
    doc.fileLevelName = levelNameMap[doc.fileLevel] || doc.fileLevel;
    let pt = o.productType || doc.productType;
    if (!pt || legacyLevel[pt] || ["L1", "L2", "L3"].includes(pt)) {
      pt = domainCodes[idx % domainCodes.length];
    }
    doc.productType = pt;
    doc.productTypeName = ptNameMap[doc.productType] || doc.productType;
    doc.accessDomain = o.accessDomain || domainByCat[doc.category] || "PROD";
    doc.ownerDept = o.ownerDept || ownerDeptByOld[doc.dept] || d.ownerDepts[idx % d.ownerDepts.length].name;
    doc.dept = doc.ownerDept;
    if (doc.security === "PUBLIC") doc.security = "INTERNAL";
    const flMeta = d.fileLevels.find((p) => p.code === doc.fileLevel) || {};
    doc.webEditable = !!flMeta.editable;
    if (doc.security !== "SECRET") doc.allowDownload = true;
    if (doc.fileLevel === "L3") {
      if (!doc.formRevision) doc.formRevision = "r0";
      if (!doc.formBody) {
        doc.formBody =
          "表单标题：" +
          doc.title +
          "\n编号：" +
          doc.docNo +
          "\n所属部门：" +
          doc.ownerDept +
          "\n业务领域：" +
          doc.productTypeName +
          "\n填写说明：本页可直接编辑保存；保存递增轻量修订 rN，不改正式版本号。\n\n1. 日期：________\n2. 填写人：________\n3. 记录内容：\n________\n________\n";
      }
    }
    doc.fullText =
      doc.fullText ||
      [doc.title, doc.changeSummary, doc.docNo, doc.category, doc.ownerDept, doc.fileLevelName, doc.productTypeName, "受控 水印 表单"].join(" ");
    if (!d.versionHistories[doc.docNo]) {
      const major = parseInt(String(doc.version || "1").split(".")[0], 10) || 1;
      const rows = [];
      for (let m = major; m >= 1; m--) {
        const ver = m + ".0";
        const isCurrent = ver === doc.version || (m === major && String(doc.version).indexOf(String(major)) === 0);
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
})(DCC_DATA);

// —— 关联列表补齐文件编号/名称/文件级别/业务领域/所属部门 ——
(function enrichRelated(d) {
  const byNo = Object.fromEntries(d.documents.map((x) => [x.docNo, x]));
  const fill = (row) => {
    if (!row) return;
    const src = row.docNo && byNo[row.docNo];
    if (src) {
      if (!row.title) row.title = src.title;
      if (!row.fileLevel) row.fileLevel = src.fileLevel;
      if (!row.productType || ["L1", "L2", "L3"].includes(row.productType)) row.productType = src.productType;
      if (!row.version) row.version = src.version;
      if (!row.security) row.security = src.security;
      if (!row.ownerDept) row.ownerDept = src.ownerDept;
      if (!row.formRevision && src.formRevision) row.formRevision = src.formRevision;
    }
    if (!row.docNo) row.docNo = "-";
    if (!row.title) row.title = "（未命名）";
    row.fileLevelName =
      row.fileLevelName || (d.fileLevels.find((p) => p.code === row.fileLevel) || {}).name || row.fileLevel || "-";
    row.productTypeName =
      row.productTypeName || (d.productTypes.find((p) => p.code === row.productType) || {}).name || row.productType || "-";
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
    d.trainingMatrix,
  ].forEach((list) => (list || []).forEach(fill));
})(DCC_DATA);"""

if old_enrich not in t:
    # try flexible: find markers
    start = t.find("// —— 补齐文件级别")
    end = t.find("// —— 统计与台账对齐")
    if start < 0 or end < 0:
        raise SystemExit(f"enrich block not found start={start} end={end}")
    t = t[:start] + new_enrich + "\n\n" + t[end:]
    print("replaced enrich by markers")
else:
    t = t.replace(old_enrich, new_enrich)
    print("replaced enrich exact")

p.write_text(t, encoding="utf-8")
print("done", p)
