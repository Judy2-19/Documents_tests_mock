# -*- coding: utf-8 -*-
from pathlib import Path

root = Path(__file__).resolve().parents[1] / "src"
n = 0
for f in root.rglob("*.vue"):
    t = f.read_text(encoding="utf-8")
    orig = t
    for w in ("90", "100", "120"):
        t = t.replace(f'label="文件级别" width="{w}"', 'label="文件级别" width="150"')
    if t != orig:
        f.write_text(t, encoding="utf-8")
        n += 1
        print(f.relative_to(root))
print("files", n)
