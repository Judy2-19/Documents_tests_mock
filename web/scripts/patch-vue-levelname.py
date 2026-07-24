# -*- coding: utf-8 -*-
from pathlib import Path

root = Path(__file__).resolve().parents[1] / "src" / "views" / "dcc"
patterns = [
    (
        '<el-table-column label="文件级别" width="100"><template #default="{ row }">{{ ptName(row.productType) }}</template></el-table-column>',
        '<el-table-column label="文件级别" width="100"><template #default="{ row }">{{ levelName(row.fileLevel) }}</template></el-table-column>\n'
        '            <el-table-column label="业务领域" width="110"><template #default="{ row }">{{ ptName(row.productType) }}</template></el-table-column>',
    ),
    (
        '<el-table-column label="文件级别" width="90"><template #default="{ row }">{{ ptName(row.productType) }}</template></el-table-column>',
        '<el-table-column label="文件级别" width="90"><template #default="{ row }">{{ levelName(row.fileLevel) }}</template></el-table-column>\n'
        '              <el-table-column label="业务领域" width="100"><template #default="{ row }">{{ ptName(row.productType) }}</template></el-table-column>',
    ),
    (
        '<el-table-column label="文件级别" width="110"><template #default="{ row }">{{ ptName(row.productType) }}</template></el-table-column>',
        '<el-table-column label="文件级别" width="100"><template #default="{ row }">{{ levelName(row.fileLevel) }}</template></el-table-column>\n'
        '            <el-table-column label="业务领域" width="110"><template #default="{ row }">{{ ptName(row.productType) }}</template></el-table-column>',
    ),
]

changed = []
for f in root.rglob("*.vue"):
    t = f.read_text(encoding="utf-8")
    orig = t
    for a, b in patterns:
        t = t.replace(a, b)
    # avoid double-add if already patched
    while t.count('label="业务领域"') > 0 and "levelName(row.fileLevel)" in t:
        # collapse accidental duplicates of 业务领域 right after another 业务领域
        dup = (
            '<el-table-column label="业务领域" width="110"><template #default="{ row }">{{ ptName(row.productType) }}</template></el-table-column>\n'
            '            <el-table-column label="业务领域" width="110"><template #default="{ row }">{{ ptName(row.productType) }}</template></el-table-column>'
        )
        if dup not in t:
            break
        t = t.replace(dup, '<el-table-column label="业务领域" width="110"><template #default="{ row }">{{ ptName(row.productType) }}</template></el-table-column>')
    if t != orig:
        f.write_text(t, encoding="utf-8")
        changed.append(str(f.relative_to(root)))

print("changed", len(changed))
for c in changed:
    print(" -", c)
