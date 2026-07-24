from pathlib import Path
p = Path(__file__).resolve().parents[1] / "src" / "mock" / "data.js"
t = p.read_text(encoding="utf-8")
t2 = t.replace('fileLevel: "L3", fileLevel: "L3"', 'fileLevel: "L3"')
t2 = t2.replace('fileLevel: "L2", fileLevel: "L2"', 'fileLevel: "L2"')
p.write_text(t2, encoding="utf-8")
print("ok", t.count('fileLevel: "L3", fileLevel'))
