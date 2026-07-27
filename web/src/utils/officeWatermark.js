/**
 * 下载用水印：Word/Excel/PPT/图片均写入「打开即可见」的水印。
 * Word/Excel 采用 Canvas 生成 PNG 再嵌入（中文可靠；避免 VML/仅页眉打印预览才看见）。
 */
import JSZip from "jszip";

const escapeXml = (s) =>
  String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** 生成稀疏水印 PNG（含中文；数量少、间距大，避免姓名编号挤在一起） */
export async function renderWatermarkPng(tileText, width = 900, height = 640) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = "#555555";
  ctx.font = "bold 22px Microsoft YaHei, SimHei, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(width / 2, height / 2);
  ctx.rotate((-26 * Math.PI) / 180);
  const label = String(tileText || "DCC").trim() || "DCC";
  // 仅 3 处，间距拉开
  const spots = [
    [-width * 0.18, -height * 0.22],
    [width * 0.12, height * 0.02],
    [-width * 0.08, height * 0.28],
  ];
  spots.forEach(([x, y]) => ctx.fillText(label, x, y));
  ctx.restore();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("水印图生成失败");
  const buf = await blob.arrayBuffer();
  return new Uint8Array(buf);
}

/** 图片：Canvas 平铺水印后导出 */
export async function stampImageWatermark(arrayBuffer, tileText, mimeHint) {
  const mime = String(mimeHint || "image/png").split(";")[0] || "image/png";
  const blob = new Blob([arrayBuffer], { type: mime });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("图片加载失败"));
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#333";
    ctx.font = `bold ${Math.max(16, Math.floor(canvas.width / 26))}px Microsoft YaHei, sans-serif`;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((-24 * Math.PI) / 180);
    const stepX = Math.max(180, canvas.width / 3.5);
    const stepY = Math.max(90, canvas.height / 5);
    const label = String(tileText || "DCC");
    for (let y = -canvas.height; y < canvas.height; y += stepY) {
      for (let x = -canvas.width; x < canvas.width; x += stepX) {
        ctx.fillText(label, x, y);
      }
    }
    ctx.restore();
    const outType = mime.indexOf("jpeg") >= 0 || mime.indexOf("jpg") >= 0 ? "image/jpeg" : "image/png";
    const out = await new Promise((resolve) => canvas.toBlob(resolve, outType, 0.92));
    if (!out) throw new Error("图片水印导出失败");
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function nextRid(relsXml, preferred) {
  if (preferred && relsXml.indexOf(`Id="${preferred}"`) < 0) return preferred;
  const ids = [...relsXml.matchAll(/Id="rId(\d+)"/g)].map((m) => parseInt(m[1], 10));
  const max = ids.length ? Math.max(...ids) : 20;
  return "rId" + (max + 1);
}

/** 红色状态章 PNG（审批完成/借阅/失效等），不改动普通灰字水印 */
export async function renderRedStatusPng(corner, secret) {
  const canvas = document.createElement("canvas");
  canvas.width = 520;
  canvas.height = secret ? 200 : 140;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const label = String(corner || "").trim();
  if (label) {
    ctx.save();
    ctx.translate(canvas.width / 2, 56);
    ctx.rotate((-6 * Math.PI) / 180);
    ctx.strokeStyle = "rgba(196,30,22,0.92)";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 4;
    ctx.font = "bold 36px Microsoft YaHei, SimHei, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const tw = ctx.measureText(label).width;
    const padX = 22;
    const padY = 16;
    const bw = tw + padX * 2;
    const bh = 36 + padY;
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    ctx.fillStyle = "rgba(196,30,22,0.95)";
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }
  if (secret) {
    ctx.save();
    ctx.translate(canvas.width / 2, label ? 150 : 100);
    ctx.rotate((-34 * Math.PI) / 180);
    ctx.strokeStyle = "rgba(200,40,30,0.45)";
    ctx.fillStyle = "rgba(200,40,30,0.35)";
    ctx.lineWidth = 3;
    ctx.font = "bold 40px Microsoft YaHei, SimHei, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const t = "机密文件";
    const tw = ctx.measureText(t).width;
    ctx.strokeRect(-tw / 2 - 16, -28, tw + 32, 56);
    ctx.fillText(t, 0, 0);
    ctx.restore();
  }
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("红色水印图生成失败");
  return new Uint8Array(await blob.arrayBuffer());
}

/** Word 内嵌图片（inline，兼容性最好） */
function wordInlinePic(rEmbed, cx, cy, docPrId, name) {
  return `<w:drawing>
  <wp:inline distT="0" distB="0" distL="0" distR="0">
    <wp:extent cx="${cx}" cy="${cy}"/>
    <wp:effectExtent l="0" t="0" r="0" b="0"/>
    <wp:docPr id="${docPrId}" name="${name}"/>
    <wp:cNvGraphicFramePr>
      <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
    </wp:cNvGraphicFramePr>
    <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
      <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
        <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
          <pic:nvPicPr>
            <pic:cNvPr id="${docPrId}" name="${name}.png"/>
            <pic:cNvPicPr/>
          </pic:nvPicPr>
          <pic:blipFill>
            <a:blip r:embed="${rEmbed}"/>
            <a:stretch><a:fillRect/></a:stretch>
          </pic:blipFill>
          <pic:spPr>
            <a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
            <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          </pic:spPr>
        </pic:pic>
      </a:graphicData>
    </a:graphic>
  </wp:inline>
</w:drawing>`;
}

/**
 * DOCX：页眉 + 正文插入 inline 水印图（打开必见）；可选红色状态章
 */
export async function stampDocxWatermark(arrayBuffer, tileText, statusWm) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  if (!zip.file("word/document.xml")) {
    throw new Error("不是有效的 docx（请使用 .docx）");
  }

  const png = await renderWatermarkPng(tileText, 960, 680);
  zip.file("word/media/dcc_watermark.png", png);

  const sw = statusWm || {};
  const hasRed = !!(sw.corner || sw.secret);
  if (hasRed) {
    const red = await renderRedStatusPng(sw.corner, sw.secret);
    zip.file("word/media/dcc_red_stamp.png", red);
  }

  // 页眉：灰字 + inline 水印图（每页）
  const headerImgRid = "rId1";
  const headerRedRid = "rId2";
  let headerRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="${headerImgRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/dcc_watermark.png"/>`;
  if (hasRed) {
    headerRels += `
  <Relationship Id="${headerRedRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/dcc_red_stamp.png"/>`;
  }
  headerRels += `
</Relationships>`;
  zip.file("word/_rels/header_dcc_wm.xml.rels", headerRels);

  const wmInline = wordInlinePic(headerImgRid, 5486400, 3886200, 9101, "DCCWatermark");
  const redInline = hasRed
    ? wordInlinePic(headerRedRid, 3200400, 1143000, 9102, "DCCRedStamp")
    : "";
  const headerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
  <w:p>
    <w:pPr><w:jc w:val="center"/></w:pPr>
    <w:r>
      <w:rPr><w:color w:val="888888"/><w:sz w:val="18"/></w:rPr>
      <w:t xml:space="preserve">${escapeXml(tileText || "DCC")}</w:t>
    </w:r>
  </w:p>
  ${hasRed ? `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r>${redInline}</w:r></w:p>` : ""}
  <w:p>
    <w:pPr><w:jc w:val="center"/></w:pPr>
    <w:r>${wmInline}</w:r>
  </w:p>
</w:hdr>`;
  zip.file("word/header_dcc_wm.xml", headerXml);

  const relsPath = "word/_rels/document.xml.rels";
  let rels = zip.file(relsPath)
    ? await zip.file(relsPath).async("string")
    : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';

  rels = rels
    .replace(/<Relationship[^>]*header_dcc_wm\.xml"[^>]*\/>/g, "")
    .replace(/<Relationship[^>]*dcc_watermark\.png"[^>]*\/>/g, "")
    .replace(/<Relationship[^>]*dcc_red_stamp\.png"[^>]*\/>/g, "");

  const headerRid = nextRid(rels, "rIdDccWmHeader");
  const bodyImgRid = nextRid(rels + headerRid, "rIdDccWmImg");
  const bodyRedRid = nextRid(rels + headerRid + bodyImgRid, "rIdDccRedImg");
  let addRels = `<Relationship Id="${headerRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header_dcc_wm.xml"/>
<Relationship Id="${bodyImgRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/dcc_watermark.png"/>`;
  if (hasRed) {
    addRels += `
<Relationship Id="${bodyRedRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/dcc_red_stamp.png"/>`;
  }
  rels = rels.replace("</Relationships>", `${addRels}
</Relationships>`);
  zip.file(relsPath, rels);

  let ct = await zip.file("[Content_Types].xml").async("string");
  if (ct.indexOf("header_dcc_wm.xml") < 0) {
    ct = ct.replace(
      "</Types>",
      `<Override PartName="/word/header_dcc_wm.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/></Types>`
    );
  }
  if (!/Extension="png"/i.test(ct)) {
    ct = ct.replace(/<Types[^>]*>/, (m) => `${m}<Default Extension="png" ContentType="image/png"/>`);
  }
  zip.file("[Content_Types].xml", ct);

  let docXml = await zip.file("word/document.xml").async("string");
  // 确保关键命名空间在根节点
  const needNs = [
    ['xmlns:r=', 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'],
    ['xmlns:wp=', 'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"'],
  ];
  needNs.forEach(([probe, attr]) => {
    if (docXml.indexOf(probe) < 0) {
      docXml = docXml.replace(/<w:document/, `<w:document ${attr}`);
    }
  });

  // 挂页眉到所有节（含自闭合 sectPr；避免重复插入）
  const headerRef = `<w:headerReference w:type="default" r:id="${headerRid}"/>`;
  docXml = docXml.replace(/<w:headerReference[^>]*w:type="default"[^>]*\/>/g, "");
  docXml = docXml.replace(/<w:sectPr\b([^>]*)\/>/g, `<w:sectPr$1>${headerRef}</w:sectPr>`);
  if (/<w:sectPr[\s>]/.test(docXml)) {
    docXml = docXml.replace(
      /<w:sectPr\b([^>]*)>(?!\s*<w:headerReference[^>]*w:type="default")/g,
      `<w:sectPr$1>${headerRef}`
    );
  } else {
    docXml = docXml.replace("</w:body>", `<w:sectPr>${headerRef}</w:sectPr></w:body>`);
  }

  // 正文最前插入可见 inline 水印（不依赖页眉也能看见）
  const bodyWm = wordInlinePic(bodyImgRid, 5029200, 3570000, 9201, "DCCBodyWatermark");
  const bodyRed = hasRed
    ? wordInlinePic(bodyRedRid, 3200400, 1143000, 9202, "DCCBodyRedStamp")
    : "";
  const block = `<w:p>
  <w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="80"/></w:pPr>
  <w:r>
    <w:rPr><w:color w:val="C41E16"/><w:sz w:val="28"/><w:b/></w:rPr>
    <w:t xml:space="preserve">${escapeXml(sw.corner || "受控文件")}</w:t>
  </w:r>
</w:p>
<w:p>
  <w:pPr><w:jc w:val="center"/></w:pPr>
  <w:r>
    <w:rPr><w:color w:val="666666"/><w:sz w:val="20"/></w:rPr>
    <w:t xml:space="preserve">${escapeXml(tileText || "DCC")}</w:t>
  </w:r>
</w:p>
${hasRed ? `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r>${bodyRed}</w:r></w:p>` : ""}
<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r>${bodyWm}</w:r></w:p>`;
  if (!/<w:body[\s>]/.test(docXml)) throw new Error("Word 正文结构异常，无法写入水印");
  // 去掉旧水印块后重插
  docXml = docXml.replace(
    /<w:p>[\s\S]*?DCCBodyWatermark[\s\S]*?<\/w:p>/g,
    ""
  );
  docXml = docXml.replace(/<w:body([^>]*)>/, (m) => `${m}${block}`);

  zip.file("word/document.xml", docXml);

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

function buildXlsxWmAnchor(imgRid, picId, name, posX, posY, extX, extY) {
  return `<xdr:absoluteAnchor>
  <xdr:pos x="${posX}" y="${posY}"/>
  <xdr:ext cx="${extX}" cy="${extY}"/>
  <xdr:pic>
    <xdr:nvPicPr>
      <xdr:cNvPr id="${picId}" name="${name}"/>
      <xdr:cNvPicPr><a:picLocks noChangeAspect="0"/></xdr:cNvPicPr>
    </xdr:nvPicPr>
    <xdr:blipFill>
      <a:blip r:embed="${imgRid}"/>
      <a:stretch><a:fillRect/></a:stretch>
    </xdr:blipFill>
    <xdr:spPr>
      <a:xfrm><a:off x="0" y="0"/><a:ext cx="${extX}" cy="${extY}"/></a:xfrm>
      <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
    </xdr:spPr>
  </xdr:pic>
  <xdr:clientData fLocksWithSheet="0"/>
</xdr:absoluteAnchor>`;
}

function ensureXlsxImageRel(dRels, targetFile, preferredRid) {
  const re = new RegExp(`Id="([^"]+)"[^>]*Target="[^"]*${targetFile.replace(".", "\\.")}"`);
  const hit = dRels.match(re);
  if (hit) return { rels: dRels, rid: hit[1] };
  const rid = nextRid(dRels, preferredRid);
  return {
    rid,
    rels: dRels.replace(
      "</Relationships>",
      `<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${targetFile}"/></Relationships>`
    ),
  };
}

/**
 * XLSX：普通灰字水印保持不变；额外叠加红色状态章（若有）
 */
export async function stampXlsxWatermark(arrayBuffer, tileText, statusWm) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const sheetPaths = Object.keys(zip.files)
    .filter((p) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(p))
    .sort((a, b) => {
      const na = parseInt((a.match(/sheet(\d+)/i) || [])[1] || "0", 10);
      const nb = parseInt((b.match(/sheet(\d+)/i) || [])[1] || "0", 10);
      return na - nb;
    });
  if (!sheetPaths.length) throw new Error("不是有效的 xlsx（请使用 .xlsx）");

  const png = await renderWatermarkPng(tileText, 1000, 700);
  zip.file("xl/media/dcc_watermark.png", png);

  const sw = statusWm || {};
  const hasRed = !!(sw.corner || sw.secret);
  if (hasRed) {
    zip.file("xl/media/dcc_red_stamp.png", await renderRedStatusPng(sw.corner, sw.secret));
  }

  let ct = await zip.file("[Content_Types].xml").async("string");
  if (!/Extension="png"/i.test(ct)) {
    ct = ct.replace(/<Types[^>]*>/, (m) => `${m}<Default Extension="png" ContentType="image/png"/>`);
  }

  const text = escapeXml(tileText || "DCC");

  for (let i = 0; i < sheetPaths.length; i++) {
    const sheetPath = sheetPaths[i];
    const sheetName = sheetPath.split("/").pop();
    const sheetRelsPath = `xl/worksheets/_rels/${sheetName}.rels`;
    let sheetXml = await zip.file(sheetPath).async("string");
    let sheetRels = zip.file(sheetRelsPath)
      ? await zip.file(sheetRelsPath).async("string")
      : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';

    if (sheetXml.indexOf("xmlns:r=") < 0) {
      sheetXml = sheetXml.replace(
        /<worksheet([^>]*)>/,
        '<worksheet$1 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
      );
    }

    const relMatch = sheetRels.match(
      /Id="([^"]+)"[^>]*Type="[^"]*relationships\/drawing"[^>]*Target="([^"]+)"|Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*Type="[^"]*relationships\/drawing"/
    );
    let drawRid = relMatch ? relMatch[1] || relMatch[3] : "";
    let drawingTarget = relMatch ? relMatch[2] || relMatch[4] : "";
    let injectedIntoExisting = false;

    const grayAnchor = (imgRid, picId) =>
      buildXlsxWmAnchor(imgRid, picId, "DCCWatermark", 200000, 200000, 9000000, 6200000);
    // 顶部居中红色章
    const redAnchor = (imgRid, picId) =>
      buildXlsxWmAnchor(imgRid, picId, "DCCRedStamp", 2800000, 80000, 3600000, 1400000);

    if (drawingTarget) {
      const dPath = `xl/drawings/${String(drawingTarget).split("/").pop()}`;
      const dRelsFixed = `xl/drawings/_rels/${dPath.split("/").pop()}.rels`;
      let dXml = zip.file(dPath) ? await zip.file(dPath).async("string") : "";
      let dRels = zip.file(dRelsFixed)
        ? await zip.file(dRelsFixed).async("string")
        : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';

      if (dXml && dXml.indexOf("</xdr:wsDr>") >= 0) {
        let anchors = "";
        if (dXml.indexOf("DCCWatermark") < 0) {
          const g = ensureXlsxImageRel(dRels, "dcc_watermark.png", "rIdDccWmImg");
          dRels = g.rels;
          anchors += grayAnchor(g.rid, 8800 + i);
        }
        if (hasRed && dXml.indexOf("DCCRedStamp") < 0) {
          const r = ensureXlsxImageRel(dRels, "dcc_red_stamp.png", "rIdDccRedImg");
          dRels = r.rels;
          anchors += redAnchor(r.rid, 8900 + i);
        }
        if (anchors) {
          zip.file(dRelsFixed, dRels);
          dXml = dXml.replace("</xdr:wsDr>", `${anchors}</xdr:wsDr>`);
          zip.file(dPath, dXml);
        }
        injectedIntoExisting = true;
      }
    }

    if (!injectedIntoExisting) {
      const drawingId = i + 1;
      const drawingPath = `xl/drawings/drawing_dcc_wm_${drawingId}.xml`;
      const drawingRelsPath = `xl/drawings/_rels/drawing_dcc_wm_${drawingId}.xml.rels`;
      let relXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/dcc_watermark.png"/>`;
      if (hasRed) {
        relXml += `
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/dcc_red_stamp.png"/>`;
      }
      relXml += `
</Relationships>`;
      zip.file(drawingRelsPath, relXml);
      const anchors =
        grayAnchor("rId1", 1) + (hasRed ? redAnchor("rId2", 2) : "");
      zip.file(
        drawingPath,
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
${anchors}
</xdr:wsDr>`
      );
      if (ct.indexOf(`drawing_dcc_wm_${drawingId}.xml`) < 0) {
        ct = ct.replace(
          "</Types>",
          `<Override PartName="/xl/drawings/drawing_dcc_wm_${drawingId}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>`
        );
      }
      drawRid = nextRid(sheetRels, `rIdDccDraw${drawingId}`);
      sheetRels = sheetRels.replace(
        "</Relationships>",
        `<Relationship Id="${drawRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing_dcc_wm_${drawingId}.xml"/></Relationships>`
      );
      zip.file(sheetRelsPath, sheetRels);

      if (!/<drawing[\s>]/.test(sheetXml)) {
        const drawingTag = `<drawing r:id="${drawRid}"/>`;
        if (sheetXml.indexOf("</worksheet>") >= 0) {
          sheetXml = sheetXml.replace("</worksheet>", `${drawingTag}</worksheet>`);
        }
      }
    }

    // 页眉页脚（打印）
    const hf = `<headerFooter><oddHeader>&amp;C&amp;K808080&amp;12${text}</oddHeader><oddFooter>&amp;C&amp;K808080${text}</oddFooter></headerFooter>`;
    if (sheetXml.indexOf("<headerFooter") >= 0) {
      sheetXml = sheetXml.replace(/<headerFooter[\s\S]*?<\/headerFooter>/, hf);
    } else if (sheetXml.indexOf("<drawing") >= 0) {
      sheetXml = sheetXml.replace(/<drawing/, `${hf}<drawing`);
    } else {
      sheetXml = sheetXml.replace("</worksheet>", `${hf}</worksheet>`);
    }
    if (sheetXml.indexOf("<pageMargins") < 0) {
      const insertBefore = sheetXml.indexOf("<headerFooter") >= 0 ? "<headerFooter" : sheetXml.indexOf("<drawing") >= 0 ? "<drawing" : "</worksheet>";
      if (insertBefore === "</worksheet>") {
        sheetXml = sheetXml.replace(
          "</worksheet>",
          `<pageMargins left="0.7" right="0.7" top="0.85" bottom="0.85" header="0.35" footer="0.35"/></worksheet>`
        );
      } else {
        sheetXml = sheetXml.replace(
          insertBefore,
          `<pageMargins left="0.7" right="0.7" top="0.85" bottom="0.85" header="0.35" footer="0.35"/>${insertBefore}`
        );
      }
    }

    zip.file(sheetPath, sheetXml);
    if (!zip.file(sheetRelsPath)) zip.file(sheetRelsPath, sheetRels);
  }

  zip.file("[Content_Types].xml", ct);

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function maxXmlId(xml) {
  let max = 2;
  const re = /\bid="(\d+)"/g;
  let m;
  while ((m = re.exec(xml))) {
    const n = parseInt(m[1], 10);
    if (n > max) max = n;
  }
  return max;
}

/** JSZip 路径大小写不敏感查找 */
function zipFindPath(zip, want) {
  const target = String(want || "")
    .replace(/^\/+/, "")
    .replace(/\\/g, "/")
    .toLowerCase();
  if (!target) return "";
  if (zip.files[want] && !zip.files[want].dir) return want;
  const hit = Object.keys(zip.files).find((k) => {
    if (zip.files[k].dir) return false;
    return k.replace(/^\/+/, "").replace(/\\/g, "/").toLowerCase() === target;
  });
  return hit || "";
}

function zipReadString(zip, want) {
  const path = zipFindPath(zip, want);
  if (!path) return null;
  return zip.file(path).async("string");
}

function sortSlidePaths(paths) {
  return paths.slice().sort((a, b) => {
    const na = parseInt((a.match(/slide(\d+)/i) || [])[1] || "0", 10);
    const nb = parseInt((b.match(/slide(\d+)/i) || [])[1] || "0", 10);
    return na - nb;
  });
}

function resolvePptRelTarget(target) {
  let t = String(target || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "");
  if (!t) return "";
  if (t.startsWith("/")) t = t.slice(1);
  if (!/^ppt\//i.test(t)) t = "ppt/" + t;
  return t;
}

/** 从包内多来源发现幻灯片路径（presentation 关系表优先，兼容非常规命名） */
async function listPptSlidePaths(zip) {
  const found = [];
  const push = (p) => {
    if (!p || found.indexOf(p) >= 0) return;
    found.push(p);
  };

  // 1) presentation.xml.rels 中 Type=slide 的 Target（最可靠）
  try {
    let relKey = zipFindPath(zip, "ppt/_rels/presentation.xml.rels");
    if (!relKey) {
      relKey = Object.keys(zip.files).find((k) => /ppt\/_rels\/presentation[^/]*\.rels$/i.test(k.replace(/\\/g, "/")));
    }
    if (relKey) {
      const relXml = await zip.file(relKey).async("string");
      const re =
        /<Relationship[^>]*Type="[^"]*\/slide"[^>]*Target="([^"]+)"|<Relationship[^>]*Target="([^"]+)"[^>]*Type="[^"]*\/slide"/gi;
      let m;
      while ((m = re.exec(relXml))) {
        const real = zipFindPath(zip, resolvePptRelTarget(m[1] || m[2]));
        if (real) push(real);
      }
      // 兜底：Target 指向 slides/*.xml
      if (!found.length) {
        const re2 = /Target="([^"]*slides\/[^"]+\.xml)"/gi;
        while ((m = re2.exec(relXml))) {
          const t = resolvePptRelTarget(m[1]);
          if (/_rels\//i.test(t)) continue;
          const real = zipFindPath(zip, t);
          if (real) push(real);
        }
      }
    }
  } catch (_) {
    /* ignore */
  }

  // 2) Content_Types Override
  if (!found.length) {
    try {
      const ct = await zipReadString(zip, "[Content_Types].xml");
      if (ct) {
        const re =
          /PartName="([^"]+)"[^>]*ContentType="[^"]*presentationml\.slide[^"]*"|ContentType="[^"]*presentationml\.slide[^"]*"[^>]*PartName="([^"]+)"/gi;
        let m;
        while ((m = re.exec(ct))) {
          const p = String(m[1] || m[2] || "")
            .replace(/^\/+/, "")
            .replace(/\\/g, "/");
          const real = zipFindPath(zip, p);
          if (real) push(real);
        }
      }
    } catch (_) {
      /* ignore */
    }
  }

  // 3) 目录枚举：ppt/slides 下除 rels 外的 xml
  if (!found.length) {
    Object.keys(zip.files).forEach((f) => {
      if (zip.files[f].dir) return;
      const norm = f.replace(/\\/g, "/");
      if (/ppt\/slides\/[^/]+\.xml$/i.test(norm) && !/_rels\//i.test(norm)) push(f);
    });
  }

  return sortSlidePaths(found);
}

function resolvePptMediaDir(zip) {
  const sample = Object.keys(zip.files).find((k) => /(?:^|\/)ppt\/media\//i.test(k.replace(/\\/g, "/")));
  if (sample) {
    const norm = sample.replace(/\\/g, "/");
    const idx = norm.toLowerCase().indexOf("/ppt/media/");
    if (idx >= 0) return norm.slice(0, idx + "/ppt/media".length);
    if (/^ppt\/media\//i.test(norm)) return "ppt/media";
  }
  // 沿用 presentation 所在大小写
  const pres = zipFindPath(zip, "ppt/presentation.xml");
  if (pres) {
    const root = pres.split("/").slice(0, -1).join("/") || "ppt";
    return root + "/media";
  }
  return "ppt/media";
}

/** PPT 图片水印形状（比文本框兼容性好，避免破坏幻灯片） */
function buildPptPicShape(embedRid, shapeId, name, x, y, cx, cy) {
  return `<p:pic>
  <p:nvPicPr>
    <p:cNvPr id="${shapeId}" name="${name}"/>
    <p:cNvPicPr><a:picLocks noChangeAspect="0" noChangeArrowheads="1"/></p:cNvPicPr>
    <p:nvPr/>
  </p:nvPicPr>
  <p:blipFill>
    <a:blip r:embed="${embedRid}"/>
    <a:stretch><a:fillRect/></a:stretch>
  </p:blipFill>
  <p:spPr bwMode="auto">
    <a:xfrm>
      <a:off x="${x}" y="${y}"/>
      <a:ext cx="${cx}" cy="${cy}"/>
    </a:xfrm>
    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
    <a:noFill/>
    <a:ln><a:noFill/></a:ln>
  </p:spPr>
</p:pic>`;
}

/**
 * PPTX：每页嵌入水印 PNG（原格式可打开）；旧版 .ppt 直接报错提示另存 pptx
 */
export async function stampPptxWatermark(arrayBuffer, tileText, statusWm) {
  const u8 = new Uint8Array(arrayBuffer || []);
  if (u8.length < 4 || u8[0] !== 0x50 || u8[1] !== 0x4b) {
    throw new Error("旧版 .ppt 无法写入水印，请另存为 .pptx 后重新上传");
  }

  let zip;
  try {
    zip = await JSZip.loadAsync(arrayBuffer);
  } catch (_) {
    throw new Error("PPT 文件无法解析，请确认是 .pptx");
  }

  const hasPpt = Object.keys(zip.files).some((f) => /(^|\/)ppt\//i.test(f.replace(/\\/g, "/")));
  if (!hasPpt && !zipFindPath(zip, "ppt/presentation.xml")) {
    throw new Error("不是有效的 pptx（请使用 .pptx）");
  }

  const paths = await listPptSlidePaths(zip);
  if (!paths.length) {
    throw new Error("PPTX 中未找到幻灯片（可能已加密或格式异常）");
  }

  const mediaDir = resolvePptMediaDir(zip);
  const png = await renderWatermarkPng(tileText, 1000, 700);
  const mediaName = "dcc_watermark.png";
  zip.file(`${mediaDir}/${mediaName}`, png);

  const sw = statusWm || {};
  const hasRed = !!(sw.corner || sw.secret);
  if (hasRed) {
    zip.file(`${mediaDir}/dcc_red_stamp.png`, await renderRedStatusPng(sw.corner, sw.secret));
  }

  const ctPath = zipFindPath(zip, "[Content_Types].xml");
  if (ctPath) {
    let ct = await zip.file(ctPath).async("string");
    if (!/Extension="png"/i.test(ct)) {
      ct = ct.replace(/<Types[^>]*>/, (m) => `${m}<Default Extension="png" ContentType="image/png"/>`);
      zip.file(ctPath, ct);
    }
  }

  let stamped = 0;
  for (let i = 0; i < paths.length; i++) {
    const slidePath = paths[i];
    const slideFile = zip.file(slidePath);
    if (!slideFile) continue;
    let xml = await slideFile.async("string");
    if (xml.indexOf("DCCWatermark") >= 0) {
      stamped += 1;
      continue;
    }

    if (!/\sxmlns:r=/.test(xml)) {
      // 必须在下一个属性前留空格，否则 XML 损坏导致 PPT 无法打开
      const next = xml.replace(
        /<(?:p:)?sld(\s|>)/i,
        '<p:sld xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"$1'
      );
      if (next !== xml) xml = next;
    }

    const slideBase = slidePath.replace(/\\/g, "/").split("/").pop();
    const slidesDir = slidePath.replace(/\\/g, "/").replace(/\/[^/]+$/, "");
    const relsCandidate = `${slidesDir}/_rels/${slideBase}.rels`;
    const relsPath = zipFindPath(zip, relsCandidate) || relsCandidate;
    let rels = zip.file(relsPath)
      ? await zip.file(relsPath).async("string")
      : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';

    rels = rels
      .replace(/<Relationship[^>]*dcc_watermark\.png"[^>]*\/>/g, "")
      .replace(/<Relationship[^>]*dcc_red_stamp\.png"[^>]*\/>/g, "");

    // media 相对 slides 目录：../media/xxx
    const wmRid = nextRid(rels);
    rels = rels.replace(
      "</Relationships>",
      `<Relationship Id="${wmRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${mediaName}"/></Relationships>`
    );
    let redRid = "";
    if (hasRed) {
      redRid = nextRid(rels);
      rels = rels.replace(
        "</Relationships>",
        `<Relationship Id="${redRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/dcc_red_stamp.png"/></Relationships>`
      );
    }
    zip.file(relsPath, rels);

    let nextId = maxXmlId(xml) + 1;
    // 幻灯片坐标系约 9144000 x 6858000 (10" x 7.5")
    let pics = buildPptPicShape(wmRid, nextId++, "DCCWatermark", 600000, 800000, 8000000, 5200000);
    if (hasRed && redRid) {
      pics += buildPptPicShape(redRid, nextId++, "DCCRedStamp", 2800000, 120000, 3500000, 1200000);
    }

    if (xml.indexOf("</p:spTree>") >= 0) {
      xml = xml.replace("</p:spTree>", `${pics}</p:spTree>`);
    } else if (/<\/p:spTree>/i.test(xml)) {
      xml = xml.replace(/<\/p:spTree>/i, `${pics}</p:spTree>`);
    } else {
      console.warn("slide missing spTree", slidePath);
      continue;
    }
    zip.file(slidePath, xml);
    stamped += 1;
  }

  if (!stamped) throw new Error("未能写入 PPT 水印（幻灯片结构异常）");

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
}
