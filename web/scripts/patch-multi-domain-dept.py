# -*- coding: utf-8 -*-
"""Patch mock enrich to support multi productType / ownerDept (comma-separated)."""
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "src" / "mock" / "data.js"
t = p.read_text(encoding="utf-8")

# Add a few multi-value overrides
old = '''    "MG-SOP-2026-0008": { fileLevel: "L2", productType: "SEMI_TEST", ownerDept: "行政部" },
    "MG-SOP-2026-0016": { fileLevel: "L2", productType: "SEMI_TEST", ownerDept: "行政部" },
    "MG-FORM-2026-0014": { fileLevel: "L3", productType: "SEMI_TEST", ownerDept: "技术部" },'''
new = '''    "MG-SOP-2026-0008": { fileLevel: "L2", productType: "SEMI_TEST,FRONTIER_TEST", ownerDept: "行政部,技术部" },
    "MG-SOP-2026-0016": { fileLevel: "L2", productType: "SEMI_TEST", ownerDept: "行政部,市场部" },
    "MG-FORM-2026-0014": { fileLevel: "L3", productType: "SEMI_TEST,SIPH_MASS", ownerDept: "技术部" },'''
if old not in t:
    raise SystemExit("overrides block not found")
t = t.replace(old, new, 1)

# Replace productType / ownerDept assignment block inside enrichDocs
old_assign = '''    let pt = o.productType || doc.productType;
    if (!pt || legacyLevel[pt] || ["L1", "L2", "L3"].includes(pt)) {
      pt = domainCodes[idx % domainCodes.length];
    }
    doc.productType = pt;
    doc.productTypeName = ptNameMap[doc.productType] || doc.productType;
    doc.accessDomain = o.accessDomain || domainByCat[doc.category] || "PROD";
    doc.ownerDept = o.ownerDept || ownerDeptByOld[doc.dept] || d.ownerDepts[idx % d.ownerDepts.length].name;
    doc.dept = doc.ownerDept;'''

new_assign = r'''    const toCsvCodes = (v) =>
      String(v || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    const ptNameOf = (codes) =>
      codes
        .map((c) => ptNameMap[c] || c)
        .filter(Boolean)
        .join(",");
    let ptRaw = o.productType || doc.productType;
    let pts = toCsvCodes(ptRaw);
    if (!pts.length || pts.some((c) => legacyLevel[c] || ["L1", "L2", "L3"].includes(c))) {
      pts = [domainCodes[idx % domainCodes.length]];
      if (idx % 4 === 0) pts.push(domainCodes[(idx + 1) % domainCodes.length]);
    }
    // 去重保持顺序
    pts = [...new Set(pts)];
    doc.productType = pts.join(",");
    doc.productTypeName = ptNameOf(pts);
    doc.accessDomain = o.accessDomain || domainByCat[doc.category] || "PROD";
    let odRaw = o.ownerDept || doc.ownerDept || ownerDeptByOld[doc.dept] || d.ownerDepts[idx % d.ownerDepts.length].name;
    let ods = toCsvCodes(odRaw);
    if (!ods.length) ods = [d.ownerDepts[idx % d.ownerDepts.length].name];
    if (idx % 5 === 1 && ods.length === 1) {
      const extra = d.ownerDepts[(idx + 2) % d.ownerDepts.length].name;
      if (!ods.includes(extra)) ods.push(extra);
    }
    ods = [...new Set(ods)];
    doc.ownerDept = ods.join(",");
    // 编制部门取第一个所属部门，便于演示
    doc.dept = ods[0];'''

if old_assign not in t:
    raise SystemExit("assign block not found")
t = t.replace(old_assign, new_assign, 1)

# Fix enrichRelated productTypeName for multi
old_fill = '''    row.productTypeName =
      row.productTypeName || (d.productTypes.find((p) => p.code === row.productType) || {}).name || row.productType || "-";'''
new_fill = '''    if (!row.productTypeName) {
      row.productTypeName = String(row.productType || "")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => (d.productTypes.find((p) => p.code === c) || {}).name || c)
        .join(",") || "-";
    }'''
if old_fill not in t:
    raise SystemExit("fill productTypeName not found")
t = t.replace(old_fill, new_fill, 1)

p.write_text(t, encoding="utf-8")
print("mock patched")
