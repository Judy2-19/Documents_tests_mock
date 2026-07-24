/**
 * Excel 读写（SheetJS）：列表/合规包统一 .xlsx
 */
import * as XLSX from "xlsx";

export function downloadWorkbook(filename, sheets) {
  const wb = XLSX.utils.book_new();
  (sheets || []).forEach((s) => {
    const name = String(s.name || "Sheet1").slice(0, 31);
    const rows = s.rows || [];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

/** 单表：header + dataRows */
export function downloadSheet(filename, header, dataRows, sheetName = "Sheet1") {
  downloadWorkbook(filename, [{ name: sheetName, rows: [header, ...(dataRows || [])] }]);
}

export function parseWorkbookFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const sheets = {};
        wb.SheetNames.forEach((name) => {
          sheets[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" });
        });
        resolve({ sheetNames: wb.SheetNames, sheets });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsArrayBuffer(file);
  });
}

export function isExcelFile(file) {
  if (!file || !file.name) return false;
  const n = file.name.toLowerCase();
  return n.endsWith(".xlsx") || n.endsWith(".xls");
}
