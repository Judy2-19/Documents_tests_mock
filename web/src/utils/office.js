/**
 * 前端 Office 预览 / 轻量编辑（无后端）。
 * Word: mammoth 转 HTML（含图片 dataURL）；保存用 docx 重打包（含 ImageRun）。
 * Excel: SheetJS 读表 / 写回 xlsx。
 * PPT: JSZip 抽幻灯片文字+图片；保存时 patch 原 pptx（保留图片与版式）。
 */
import * as XLSX from "xlsx";
import mammoth from "mammoth";
import JSZip from "jszip";
import { Document, Packer, Paragraph, TextRun, ImageRun } from "docx";

export function getOfficeKind(fileName, fileType) {
  const name = String(fileName || "").toLowerCase();
  const type = String(fileType || "").toLowerCase();
  if (type.indexOf("pdf") >= 0 || /\.pdf$/i.test(name)) return "pdf";
  if (type.indexOf("image/") === 0 || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name)) return "image";
  if (/\.docx?$/i.test(name) || type.indexOf("word") >= 0) return "word";
  if (/\.xlsx?$/i.test(name) || type.indexOf("excel") >= 0 || type.indexOf("spreadsheet") >= 0) return "excel";
  // 仅 .pptx / OOXML；旧版 .ppt 单独标出（无法用 JSZip 解析）
  if (/\.pptx$/i.test(name) || type.indexOf("presentationml.presentation") >= 0) return "ppt";
  if (/\.ppt$/i.test(name) || type.indexOf("ms-powerpoint") >= 0 || type.indexOf("presentation") >= 0)
    return "ppt";
  return "other";
}

/** 是否为 ZIP/OOXML（pptx/docx/xlsx 均以 PK 开头） */
export function isZipArrayBuffer(arrayBuffer) {
  const u8 = new Uint8Array(arrayBuffer || []);
  return u8.length >= 4 && u8[0] === 0x50 && u8[1] === 0x4b;
}

function decodeXmlText(s) {
  return String(s || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

const escapeHtml = (s) =>
  String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const escapeXml = (s) =>
  String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export async function fetchArrayBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("读取附件失败");
  return res.arrayBuffer();
}

/** Word → HTML（保留图片为 data URL） */
export async function previewWord(arrayBuffer) {
  const r = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      convertImage: mammoth.images.imgElement((image) =>
        image.read("base64").then((imageBuffer) => ({
          src: "data:" + image.contentType + ";base64," + imageBuffer,
        }))
      ),
    }
  );
  return {
    html: r.value || "<p>（空文档）</p>",
    messages: r.messages || [],
  };
}

/** Excel → 多表 AOA + HTML */
export async function previewExcel(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  return (wb.SheetNames || []).map((name) => {
    const sheet = wb.Sheets[name];
    const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
    const rows = aoa.length ? aoa : [[""]];
    const maxCols = Math.max(1, ...rows.map((r) => (Array.isArray(r) ? r.length : 0)));
    const normalized = rows.map((r) => {
      const row = Array.isArray(r) ? r.slice() : [r];
      while (row.length < maxCols) row.push("");
      return row;
    });
    return {
      name,
      aoa: normalized,
      html: XLSX.utils.sheet_to_html(sheet, { id: "dcc-xlsx", editable: false }),
    };
  });
}

async function loadPptMediaMap(zip) {
  const media = {};
  const paths = Object.keys(zip.files).filter((f) => /^ppt\/media\//i.test(f) && !zip.files[f].dir);
  await Promise.all(
    paths.map(async (p) => {
      try {
        const file = zip.file(p);
        if (!file) return;
        const buf = await file.async("base64");
        const name = p.split("/").pop() || p;
        const lower = name.toLowerCase();
        let mime = "image/png";
        if (/\.jpe?g$/i.test(lower)) mime = "image/jpeg";
        else if (/\.gif$/i.test(lower)) mime = "image/gif";
        else if (/\.webp$/i.test(lower)) mime = "image/webp";
        else if (/\.bmp$/i.test(lower)) mime = "image/bmp";
        else if (/\.(emf|wmf|svg)$/i.test(lower)) mime = ""; // 浏览器难直接显示
        if (mime && buf) media[name.toLowerCase()] = `data:${mime};base64,${buf}`;
      } catch (_) {
        /* 单张媒体失败忽略 */
      }
    })
  );
  return media;
}

async function slideImageSrcs(zip, slidePath, mediaMap) {
  const base = slidePath.replace(/^.*\//, "");
  const relsPath = `ppt/slides/_rels/${base}.rels`;
  const relsFile = zip.file(relsPath);
  if (!relsFile) return [];
  let rels = "";
  try {
    rels = await relsFile.async("string");
  } catch (_) {
    return [];
  }
  const srcs = [];
  const re = /Target="([^"]+)"/gi;
  let m;
  while ((m = re.exec(rels))) {
    const target = (m[1] || "").replace(/\\/g, "/");
    if (!/media\//i.test(target)) continue;
    const name = (target.split("/").pop() || "").toLowerCase();
    if (name && mediaMap[name]) srcs.push(mediaMap[name]);
  }
  // 每页最多 6 张预览图，避免巨大 base64 撑爆弹窗
  return srcs.slice(0, 6);
}

function extractSlideTexts(xml) {
  const texts = [];
  const re = /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/gi;
  let m;
  while ((m = re.exec(xml))) {
    const t = decodeXmlText(m[1]).replace(/\s+/g, " ").trim();
    if (t) texts.push(t);
  }
  return texts;
}

/** PPTX → 幻灯片文字 + 图片 */
export async function previewPptx(arrayBuffer) {
  if (!isZipArrayBuffer(arrayBuffer)) {
    throw new Error("旧版 .ppt 无法在线预览，请用 PowerPoint「另存为 .pptx」后重新上传");
  }
  let zip;
  try {
    zip = await JSZip.loadAsync(arrayBuffer);
  } catch (e) {
    throw new Error("PPT 文件损坏或不是 .pptx（OOXML）格式");
  }
  if (!zip.file("ppt/presentation.xml") && !Object.keys(zip.files).some((f) => /^ppt\//i.test(f))) {
    throw new Error("未识别到 PPTX 结构，请确认上传的是 .pptx 文件");
  }

  const mediaMap = await loadPptMediaMap(zip);
  const paths = Object.keys(zip.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/i.test(f) && !zip.files[f].dir)
    .sort((a, b) => {
      const na = parseInt((a.match(/slide(\d+)/i) || [])[1] || "0", 10);
      const nb = parseInt((b.match(/slide(\d+)/i) || [])[1] || "0", 10);
      return na - nb;
    });

  const slides = [];
  for (let i = 0; i < paths.length; i++) {
    try {
      const file = zip.file(paths[i]);
      if (!file) continue;
      const xml = await file.async("string");
      const texts = extractSlideTexts(xml);
      const images = await slideImageSrcs(zip, paths[i], mediaMap);
      const imgHtml = images
        .map((src, ii) => `<img class="office-ppt-img" src="${src}" alt="幻灯片图片 ${ii + 1}" />`)
        .join("");
      const textHtml =
        texts.length > 0
          ? texts.map((t) => `<p>${escapeHtml(t)}</p>`).join("")
          : images.length
            ? ""
            : "<p style='color:#999'>（本页无文本）</p>";
      const html = (imgHtml + textHtml).trim() || "<p style='color:#999'>（空）</p>";
      slides.push({
        index: i + 1,
        path: paths[i],
        texts,
        images,
        html,
      });
    } catch (e) {
      console.warn("slide parse", paths[i], e);
      slides.push({
        index: i + 1,
        path: paths[i],
        texts: [],
        images: [],
        html: `<p style='color:#cf1322'>幻灯片 ${i + 1} 解析失败</p>`,
      });
    }
  }
  if (!slides.length) {
    slides.push({
      index: 1,
      path: "",
      texts: [],
      images: [],
      html: "<p style='color:#999'>PPT 在线预览暂不可用，请使用「下载真实附件」后用 PowerPoint / WPS 打开。</p>",
    });
  }
  return slides;
}

export async function loadOfficePreview(fileUrl, fileName, fileType) {
  const kind = getOfficeKind(fileName, fileType);
  if (kind !== "word" && kind !== "excel" && kind !== "ppt") {
    return { kind, error: null };
  }
  const buf = await fetchArrayBuffer(fileUrl);
  if (kind === "word") {
    if (/\.doc$/i.test(fileName || "") && !/\.docx$/i.test(fileName || "") && !isZipArrayBuffer(buf)) {
      throw new Error("旧版 .doc 无法在线预览，请另存为 .docx 后重新上传");
    }
    const { html } = await previewWord(buf);
    return { kind, html, sheets: null, slides: null, sourceBuffer: buf, error: null };
  }
  if (kind === "excel") {
    if (/\.xls$/i.test(fileName || "") && !/\.xlsx$/i.test(fileName || "") && !isZipArrayBuffer(buf)) {
      throw new Error("旧版 .xls 无法在线预览，请另存为 .xlsx 后重新上传");
    }
    const sheets = await previewExcel(buf);
    return { kind, html: null, sheets, slides: null, sourceBuffer: buf, error: null };
  }
  const slides = await previewPptx(buf);
  return { kind, html: null, sheets: null, slides, sourceBuffer: buf, error: null };
}

/** 保存 Excel AOA → xlsx Blob */
export function buildExcelBlob(sheets) {
  const wb = XLSX.utils.book_new();
  (sheets || []).forEach((s, idx) => {
    const name = (s.name || `Sheet${idx + 1}`).slice(0, 31);
    const aoa = s.aoa && s.aoa.length ? s.aoa : [[""]];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function dataUrlToBytes(src) {
  const m = String(src || "").match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  const contentType = m[1];
  const b64 = m[2];
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  let type = "png";
  if (contentType.indexOf("jpeg") >= 0 || contentType.indexOf("jpg") >= 0) type = "jpg";
  else if (contentType.indexOf("gif") >= 0) type = "gif";
  else if (contentType.indexOf("bmp") >= 0) type = "bmp";
  return { bytes, type, contentType };
}

function measureDataUrlImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth || 480;
      let h = img.naturalHeight || 320;
      const maxW = 520;
      if (w > maxW) {
        h = Math.round((h * maxW) / w);
        w = maxW;
      }
      resolve({ width: w, height: h });
    };
    img.onerror = () => resolve({ width: 480, height: 320 });
    img.src = src;
  });
}

/** contenteditable HTML → docx（保留 dataURL 图片） */
export async function buildWordBlobFromHtml(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html || "";
  const blocks = [];

  const pushText = (text) => {
    const t = String(text || "").replace(/\u00a0/g, " ");
    if (!String(t).trim()) {
      blocks.push(new Paragraph({ children: [new TextRun("")] }));
      return;
    }
    blocks.push(new Paragraph({ children: [new TextRun(t)] }));
  };

  const pushImage = async (imgEl) => {
    const src = imgEl.getAttribute("src") || "";
    const parsed = dataUrlToBytes(src);
    if (!parsed) return;
    const size = await measureDataUrlImage(src);
    try {
      blocks.push(
        new Paragraph({
          children: [
            new ImageRun({
              type: parsed.type,
              data: parsed.bytes,
              transformation: { width: size.width, height: size.height },
            }),
          ],
        })
      );
    } catch (e) {
      console.warn("embed word image", e);
      pushText("[图片]");
    }
  };

  const walk = async (nodes) => {
    for (const n of nodes) {
      if (n.nodeType === 3) {
        if (String(n.textContent || "").trim()) pushText(n.textContent);
      } else if (n.nodeName === "IMG") {
        await pushImage(n);
      } else if (n.nodeName === "BR") {
        pushText("");
      } else if (
        n.nodeName === "P" ||
        n.nodeName === "DIV" ||
        n.nodeName === "LI" ||
        n.nodeName === "H1" ||
        n.nodeName === "H2" ||
        n.nodeName === "H3"
      ) {
        const imgs = n.querySelectorAll ? n.querySelectorAll("img") : [];
        if (imgs && imgs.length) {
          const clone = n.cloneNode(true);
          clone.querySelectorAll("img").forEach((im) => im.remove());
          const t = clone.textContent;
          if (String(t || "").trim()) pushText(t);
          for (const im of imgs) await pushImage(im);
        } else {
          pushText(n.textContent);
        }
      } else if (n.childNodes && n.childNodes.length) {
        await walk([...n.childNodes]);
      } else if (n.textContent) {
        pushText(n.textContent);
      }
    }
  };

  const top = tmp.childNodes.length ? [...tmp.childNodes] : [];
  if (!top.length) pushText(tmp.textContent || "");
  else await walk(top);

  if (!blocks.length) blocks.push(new Paragraph({ children: [new TextRun("")] }));
  const doc = new Document({ sections: [{ children: blocks }] });
  return Packer.toBlob(doc);
}

/**
 * 在原 PPTX 上改文字（不重建），保留图片/版式。
 * 策略：把编辑后的全文写入该页第一个 <a:t>，其余文本 run 清空。
 */
export async function patchPptxTexts(arrayBuffer, editedSlides) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const paths = Object.keys(zip.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/i.test(f))
    .sort((a, b) => {
      const na = parseInt((a.match(/slide(\d+)/i) || [])[1] || "0", 10);
      const nb = parseInt((b.match(/slide(\d+)/i) || [])[1] || "0", 10);
      return na - nb;
    });

  for (let i = 0; i < paths.length; i++) {
    const edited = (editedSlides || [])[i];
    if (!edited) continue;
    let xml = await zip.file(paths[i]).async("string");
    const joined =
      edited.textJoined != null
        ? String(edited.textJoined)
        : (edited.texts || []).join("\n");
    const re = /<a:t([^>]*)>([^<]*)<\/a:t>/g;
    let idx = 0;
    xml = xml.replace(re, (full, attrs) => {
      const content = idx === 0 ? escapeXml(joined) : "";
      idx += 1;
      return `<a:t${attrs}>${content}</a:t>`;
    });
    // 若原本无文本节点但有编辑内容，跳过（避免破坏结构）；图片仍保留
    zip.file(paths[i], xml);
  }

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
}

/** @deprecated 重建会丢图；保留给兼容，优先用 patchPptxTexts */
export async function buildPptBlob(slides) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  (slides || []).forEach((s, i) => {
    const slide = pptx.addSlide();
    const body = (s.texts || []).join("\n") || `幻灯片 ${i + 1}`;
    slide.addText(body, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 6.5,
      fontSize: 16,
      color: "222222",
      valign: "top",
    });
    (s.images || []).forEach((src, ii) => {
      try {
        slide.addImage({ data: src, x: 0.5 + (ii % 2) * 4.5, y: 4.2, w: 4, h: 2.2 });
      } catch (_) {
        /* ignore */
      }
    });
  });
  if (!(slides || []).length) {
    const slide = pptx.addSlide();
    slide.addText("空演示文稿", { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 18 });
  }
  return pptx.write({ outputType: "blob" });
}
