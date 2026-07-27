<script>
/**
 * DCC 页面视图：状态与方法来自 App provide 的 dcc 上下文（composables/dccApp.js）。
 */
import { defineComponent } from "vue";
import { useDccPage } from "./useDccPage.js";

export default defineComponent({
  name: "DccOverlays",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
  <div class="dcc-overlays">
<!-- Doc detail drawer：操作按钮固定在 footer，避免被版本历史表格遮挡 -->
<el-drawer
  v-model="docDetailVisible"
  title="受控文件详情"
  size="640px"
  destroy-on-close
  class="doc-detail-drawer"
>
  <div v-if="currentDoc" class="doc-detail-body">
    <el-descriptions :column="2" border size="small">
      <el-descriptions-item label="文件ID">{{ fileIdOf(currentDoc) }}</el-descriptions-item>
      <el-descriptions-item label="文件编号">{{ currentDoc.docNo || '-' }}</el-descriptions-item>
      <el-descriptions-item label="文件名称">{{ currentDoc.title || '-' }}<span v-if="currentDoc.security==='SECRET'" class="sec-mi" title="机密">密</span></el-descriptions-item>
      <el-descriptions-item label="文件级别">{{ levelName(currentDoc.fileLevel) }}</el-descriptions-item>
      <el-descriptions-item label="业务领域">{{ ptName(currentDoc.productType) }}</el-descriptions-item>
      <el-descriptions-item label="现行正式版本">{{ currentDoc.version }}</el-descriptions-item>
      <el-descriptions-item v-if="currentDoc.fileLevel==='L3'" label="轻量修订">{{ currentDoc.formRevision || 'r0' }}</el-descriptions-item>
      <el-descriptions-item label="分类">{{ currentDoc.category }}</el-descriptions-item>
      <el-descriptions-item label="状态"><span class="tag" :class="statusTag(currentDoc.status).cls">{{ statusTag(currentDoc.status).text }}</span></el-descriptions-item>
      <el-descriptions-item label="数据域"><span class="tag" :class="statusTag(currentDoc.accessDomain).cls">{{ statusTag(currentDoc.accessDomain).text }}</span></el-descriptions-item>
      <el-descriptions-item label="密级"><span class="tag" :class="statusTag(currentDoc.security).cls">{{ statusTag(currentDoc.security).text }}</span></el-descriptions-item>
      <el-descriptions-item label="文件所属部门">{{ deptNames(currentDoc.ownerDept) }}</el-descriptions-item>
      <el-descriptions-item label="编制部门">{{ currentDoc.dept }}</el-descriptions-item>
      <el-descriptions-item label="责任人">{{ currentDoc.owner }}</el-descriptions-item>
      <el-descriptions-item label="网页编辑">{{ isWebEditable(currentDoc) ? '三级表单可直接编辑' : '一级/二级不可网页改正文' }}</el-descriptions-item>
      <el-descriptions-item label="生效日期"><b>{{ currentDoc.effectiveDate || '（缺失则不可生效）' }}</b></el-descriptions-item>
      <el-descriptions-item label="下次复审">{{ currentDoc.reviewDue }}</el-descriptions-item>
      <el-descriptions-item label="页数">{{ currentDoc.pages || '-' }}</el-descriptions-item>
      <el-descriptions-item label="允许下载">{{ currentDoc.allowDownload ? (isSecret(currentDoc) ? '机密须二次申请' : '本部门可直下；跨部门须申请') : '否' }}</el-descriptions-item>
      <el-descriptions-item label="本版变更说明" :span="2">{{ currentDoc.changeSummary || '-' }}</el-descriptions-item>
    </el-descriptions>
    <div class="section-title" style="margin-top:16px;"><span>正式版本历史</span></div>
    <el-table :data="versionRows" size="small" border class="version-history-table" style="width:100%">
      <el-table-column label="版本" width="72"><template #default="{ row }">{{ row.ver || '-' }}</template></el-table-column>
      <el-table-column label="状态" width="88"><template #default="{ row }">{{ row.statusText || '-' }}</template></el-table-column>
      <el-table-column label="生效日" width="110"><template #default="{ row }">{{ row.effDate || '-' }}</template></el-table-column>
      <el-table-column label="编制人" width="80"><template #default="{ row }">{{ row.author || '-' }}</template></el-table-column>
          <el-table-column label="变更摘要" min-width="140" show-overflow-tooltip>
            <template #default="{ row }">{{ row.summary || '-' }}</template>
          </el-table-column>
    </el-table>
    <template v-if="currentDoc.fileLevel==='L3'">
      <div class="section-title" style="margin-top:16px;"><span>轻量修订历史（rN）</span></div>
      <el-empty v-if="!formRevisionRows.length" description="尚无轻量修订（保存表单后生成 r1/r2…）" :image-size="48"></el-empty>
      <el-table v-else :data="formRevisionRows" size="small" border style="width:100%">
        <el-table-column label="修订号" width="72"><template #default="{ row }">{{ row.rev }}</template></el-table-column>
        <el-table-column label="时间" width="140"><template #default="{ row }">{{ row.at }}</template></el-table-column>
        <el-table-column label="操作人" width="80"><template #default="{ row }">{{ row.author }}</template></el-table-column>
        <el-table-column label="说明" min-width="160" show-overflow-tooltip><template #default="{ row }">{{ row.summary }}</template></el-table-column>
      </el-table>
    </template>
  </div>
  <template #footer>
    <div class="doc-detail-actions" v-if="currentDoc">
      <el-button type="primary" @click="openPreview(currentDoc)">PDF 预览</el-button>
      <el-button v-if="isWebEditable(currentDoc)" type="success" @click="openFormEdit(currentDoc)">编辑表单</el-button>
      <el-button @click="mockDownload(currentDoc)">下载水印版</el-button>
      <el-button @click="controlledPrint(currentDoc)">受控打印</el-button>
      <el-button @click="startRevise(currentDoc)">发起修订</el-button>
      <el-button v-if="canDistribute" @click="openDistForm(currentDoc)">分发</el-button>
    </div>
  </template>
</el-drawer>

<!-- 新增文件分类（仅文控） -->
<el-dialog v-model="categoryFormVisible" title="新增文件分类" width="480px" destroy-on-close>
  <el-alert v-if="!isDocController" type="error" show-icon :closable="false" style="margin-bottom:12px;"
    title="无权限：仅文控员可新增分类。"></el-alert>
  <el-form label-position="top" :disabled="!isDocController">
    <div class="form-grid">
      <div class="form-item">
        <label><span class="req">*</span>分类编码</label>
        <el-input v-model="categoryForm.code" placeholder="如 SOP、WI、FORM（大写）" maxlength="32"></el-input>
      </div>
      <div class="form-item">
        <label><span class="req">*</span>分类名称</label>
        <el-input v-model="categoryForm.name" placeholder="如 作业指导书" maxlength="100"></el-input>
      </div>
      <div class="form-item">
        <label>默认复审周期（月）</label>
        <el-input-number v-model="categoryForm.reviewMonths" :min="1" :max="60" style="width:100%"></el-input-number>
      </div>
      <div class="form-item">
        <label>默认可下载</label>
        <el-switch v-model="categoryForm.allowDownload"></el-switch>
      </div>
      <div class="form-item full">
        <label>备注</label>
        <el-input v-model="categoryForm.remark" type="textarea" :rows="2" placeholder="可选"></el-input>
      </div>
    </div>
  </el-form>
  <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">
    <el-button @click="categoryFormVisible=false">取消</el-button>
    <el-button type="primary" :disabled="!isDocController" @click="submitCategory">保存</el-button>
  </div>
</el-dialog>

<!-- 业务领域新增/修改（仅文控） -->
<el-dialog v-model="productFormVisible" :title="productFormMode==='EDIT'?'修改业务领域':'新增业务领域'" width="480px" destroy-on-close>
  <el-alert v-if="!isDocController" type="error" show-icon :closable="false" style="margin-bottom:12px;"
    title="无权限：仅文控员可维护业务领域，其他部门一律不可改。"></el-alert>
  <el-form label-position="top" :disabled="!isDocController">
    <div class="form-grid">
      <div class="form-item">
        <label><span class="req">*</span>编码</label>
        <el-input v-model="productForm.code" placeholder="如 SEMI_TEST（大写）" maxlength="32"></el-input>
      </div>
      <div class="form-item">
        <label><span class="req">*</span>业务领域名称</label>
        <el-input v-model="productForm.name" placeholder="如 半导体检测" maxlength="100"></el-input>
      </div>
      <div class="form-item full">
        <label>说明</label>
        <el-input v-model="productForm.remark" type="textarea" :rows="2" placeholder="可选"></el-input>
      </div>
    </div>
  </el-form>
  <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">
    <el-button @click="productFormVisible=false">取消</el-button>
    <el-button type="primary" :disabled="!isDocController" @click="submitProduct">保存</el-button>
  </div>
</el-dialog>

<!-- 文件所属部门新增/修改（仅文控） -->
<el-dialog v-model="ownerDeptFormVisible" :title="ownerDeptFormMode==='EDIT'?'修改所属部门':'新增所属部门'" width="480px" destroy-on-close>
  <el-alert v-if="!isDocController" type="error" show-icon :closable="false" style="margin-bottom:12px;"
    title="无权限：仅文控员可维护文件所属部门，其他部门一律不可改。"></el-alert>
  <el-form label-position="top" :disabled="!isDocController">
    <div class="form-grid">
      <div class="form-item">
        <label><span class="req">*</span>编码</label>
        <el-input v-model="ownerDeptForm.code" placeholder="如 ADM、TECH（大写）" maxlength="32"></el-input>
      </div>
      <div class="form-item">
        <label><span class="req">*</span>部门名称</label>
        <el-input v-model="ownerDeptForm.name" placeholder="如 行政部" maxlength="100"></el-input>
      </div>
    </div>
  </el-form>
  <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">
    <el-button @click="ownerDeptFormVisible=false">取消</el-button>
    <el-button type="primary" :disabled="!isDocController" @click="submitOwnerDept">保存</el-button>
  </div>
</el-dialog>

<!-- 三级表单：Word/Excel/PPT 正文编辑；PDF 叠字段填写 -->
<el-dialog
  v-model="formEditVisible"
  :title="formEditMode === 'word' ? '编辑表单 · Word 正文（轻量修订，免审批）'
    : formEditMode === 'excel' ? '编辑表单 · Excel 表格（轻量修订，免审批）'
    : formEditMode === 'ppt' ? '编辑表单 · PPT 文本（轻量修订，免审批）'
    : formEditMode === 'pdf' ? '编辑表单 · 在 PDF 上填写（轻量修订，免审批）'
    : '编辑表单 · 字段填写（轻量修订，免审批）'"
  :width="formEditMode === 'excel' || formEditMode === 'word' ? '960px' : '920px'"
  destroy-on-close
  class="form-edit-dialog"
>
  <p style="margin:0 0 10px;font-size:13px;color:#5c6b7a;" v-if="formEditDoc">
    文件ID {{ fileIdOf(formEditDoc) }} · {{ formEditDoc.docNo }} · {{ formEditDoc.title }} · 正式版 {{ formEditDoc.version || '-' }} · 轻量修订 {{ formEditDoc.formRevision || 'r0' }}
    <br/>
    <template v-if="formEditMode === 'word'">直接编辑 Word 正文，保存后写回 .docx。正式升版请走修订审批。</template>
    <template v-else-if="formEditMode === 'excel'">直接编辑单元格，保存后写回 .xlsx。正式升版请走修订审批。</template>
    <template v-else-if="formEditMode === 'ppt'">按幻灯片编辑文本，保存后写回 .pptx。正式升版请走修订审批。</template>
    <template v-else-if="formEditMode === 'pdf'">在蓝色虚线框内填写，保存后写入 PDF 末页。正式升版请走修订审批。</template>
    <template v-else>无 Office/PDF 附件时仅保存字段；建议上传 Word / Excel / PPT / PDF 后编辑。</template>
  </p>

  <!-- Word -->
  <div v-if="formEditDoc && formEditMode === 'word'" class="form-edit-office">
    <div class="form-edit-office-stage">
      <div class="wm"></div>
      <div class="wm-text">
        <span v-for="n in 14" :key="'fw-' + n">{{ data.user.name }} · {{ data.user.userNo }} · {{ formEditDoc.docNo }}</span>
      </div>
      <div
        class="office-word-editor"
        contenteditable="true"
        :key="'we-' + fileIdOf(formEditDoc) + '-' + (formEditDoc.formRevision || 'r0')"
        v-html="formEditWordHtml"
        @input="syncFormEditWordHtml"
      ></div>
    </div>
    <div class="form-edit-meta-row">
      <el-input v-model="formEditFields.filler" size="small" placeholder="填写人" style="width:160px" />
      <el-date-picker v-model="formEditFields.fillDate" type="date" value-format="YYYY-MM-DD" size="small" placeholder="填写日期" style="width:160px" />
      <el-input v-model="formEditFields.remark" size="small" placeholder="备注（可选）" style="flex:1" />
    </div>
  </div>

  <!-- Excel -->
  <div v-else-if="formEditDoc && formEditMode === 'excel'" class="form-edit-office">
    <div class="office-sheet-tabs">
      <button
        v-for="(s, i) in formEditSheets"
        :key="'es-' + i"
        type="button"
        class="office-sheet-tab"
        :class="{ active: formEditSheetIndex === i }"
        @click="formEditSheetIndex = i"
      >{{ s.name || ('Sheet' + (i + 1)) }}</button>
      <el-button size="small" @click="addExcelRow">加行</el-button>
      <el-button size="small" @click="addExcelCol">加列</el-button>
    </div>
    <div class="form-edit-office-stage">
      <div class="wm"></div>
      <div class="wm-text">
        <span v-for="n in 14" :key="'fe-' + n">{{ data.user.name }} · {{ data.user.userNo }} · {{ formEditDoc.docNo }}</span>
      </div>
      <div class="office-excel-scroll" v-if="formEditSheets[formEditSheetIndex]">
        <table class="office-excel-grid">
          <tbody>
            <tr v-for="(row, ri) in formEditSheets[formEditSheetIndex].aoa" :key="'er-' + ri">
              <td v-for="(cell, ci) in row" :key="'ec-' + ri + '-' + ci">
                <input v-model="formEditSheets[formEditSheetIndex].aoa[ri][ci]" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="form-edit-meta-row">
      <el-input v-model="formEditFields.filler" size="small" placeholder="填写人" style="width:160px" />
      <el-date-picker v-model="formEditFields.fillDate" type="date" value-format="YYYY-MM-DD" size="small" placeholder="填写日期" style="width:160px" />
      <el-input v-model="formEditFields.remark" size="small" placeholder="备注（可选）" style="flex:1" />
    </div>
  </div>

  <!-- PPT -->
  <div v-else-if="formEditDoc && formEditMode === 'ppt'" class="form-edit-office">
    <div class="office-sheet-tabs">
      <button
        v-for="(s, i) in formEditSlides"
        :key="'ps-' + i"
        type="button"
        class="office-sheet-tab"
        :class="{ active: formEditSlideIndex === i }"
        @click="formEditSlideIndex = i"
      >幻灯片 {{ s.index || (i + 1) }}</button>
    </div>
    <div class="form-edit-office-stage" v-if="formEditSlides[formEditSlideIndex]">
      <div class="wm"></div>
      <div class="wm-text">
        <span v-for="n in 14" :key="'fp-' + n">{{ data.user.name }} · {{ data.user.userNo }} · {{ formEditDoc.docNo }}</span>
      </div>
      <div class="office-ppt-edit">
        <div class="office-ppt-imgs" v-if="formEditSlides[formEditSlideIndex].images && formEditSlides[formEditSlideIndex].images.length">
          <img
            v-for="(src, ii) in formEditSlides[formEditSlideIndex].images"
            :key="'pimg-' + ii"
            :src="src"
            alt="幻灯片图片（只读保留）"
          />
        </div>
        <label class="field-label">本页文本（每行一段；图片自动保留不丢失）</label>
        <el-input
          v-model="formEditSlides[formEditSlideIndex].textJoined"
          type="textarea"
          :rows="8"
          placeholder="编辑本页文字…"
        />
      </div>
    </div>
    <div class="form-edit-meta-row">
      <el-input v-model="formEditFields.filler" size="small" placeholder="填写人" style="width:160px" />
      <el-date-picker v-model="formEditFields.fillDate" type="date" value-format="YYYY-MM-DD" size="small" placeholder="填写日期" style="width:160px" />
      <el-input v-model="formEditFields.remark" size="small" placeholder="备注（可选）" style="flex:1" />
    </div>
  </div>

  <!-- PDF / 无附件字段 -->
  <div class="form-edit-stage preview-box" v-else-if="formEditDoc">
    <template v-if="data.watermark.preview">
      <div class="wm"></div>
      <div class="wm-text">
        <span v-for="n in 10" :key="n">{{ data.user.name }} · {{ data.user.userNo }} · {{ formEditDoc.docNo }}</span>
      </div>
    </template>

    <iframe
      v-if="formEditMode === 'pdf'"
      class="form-edit-pdf"
      :src="formEditDoc.fileUrl"
      title="表单 PDF"
    ></iframe>
    <img
      v-else-if="previewFileKind(formEditDoc) === 'image'"
      class="form-edit-img"
      :src="formEditDoc.fileUrl"
      :alt="formEditDoc.fileName || '表单'"
    />
    <div v-else class="form-edit-paper">
      <h3>{{ formEditDoc.title || '三级表单' }}</h3>
      <div class="meta">{{ formEditDoc.docNo }} · 正式版 {{ formEditDoc.version || '-' }}</div>
      <p style="color:#909399;font-size:13px;">建议上传 Word / Excel / PPT 后直接编辑正文；当前仅保存字段。</p>
    </div>

    <div class="form-edit-overlay">
      <div class="form-edit-fields">
        <div>
          <label class="field-label">填写人</label>
          <el-input v-model="formEditFields.filler" size="small" placeholder="填写人" />
        </div>
        <div>
          <label class="field-label">填写日期</label>
          <el-date-picker
            v-model="formEditFields.fillDate"
            type="date"
            value-format="YYYY-MM-DD"
            size="small"
            style="width:100%"
            placeholder="选择日期"
          />
        </div>
        <div class="field-full">
          <label class="field-label">记录内容</label>
          <el-input v-model="formEditFields.content" type="textarea" :rows="2" placeholder="填写内容…" />
        </div>
        <div class="field-full">
          <label class="field-label">备注</label>
          <el-input v-model="formEditFields.remark" size="small" placeholder="可选" />
        </div>
      </div>
    </div>
  </div>
  <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">
    <el-button @click="formEditVisible=false">取消</el-button>
    <el-button type="primary" :loading="formEditSaving" @click="saveFormEdit">
      {{ formEditMode === 'word' ? '保存 Word'
        : formEditMode === 'excel' ? '保存 Excel'
        : formEditMode === 'ppt' ? '保存 PPT'
        : formEditMode === 'pdf' ? '保存到 PDF'
        : '保存' }}
    </el-button>
  </div>
</el-dialog>

<!-- Preview dialog：PDF/图片/Word/Excel/PPT 具体预览；无附件时演示正文 -->
<el-dialog
  v-model="previewVisible"
  :title="currentDoc && currentDoc.fileUrl
    ? ('附件预览 · ' + (currentDoc.fileName || currentDoc.title || '受控文件'))
    : (data.watermark.preview ? '转 PDF 预览（含水印 · 演示正文）' : '转 PDF 预览（演示正文）')"
  :width="['pdf','image','word','excel','ppt'].indexOf(previewFileKind(currentDoc)) >= 0 ? '920px' : '720px'"
  destroy-on-close
>
  <div
    class="preview-box"
    :class="{
      'preview-box--file': previewFileKind(currentDoc) === 'pdf' || previewFileKind(currentDoc) === 'image',
      'preview-box--office': ['word','excel','ppt'].indexOf(previewFileKind(currentDoc)) >= 0
    }"
  >
    <iframe
      v-if="previewFileKind(currentDoc) === 'pdf'"
      class="preview-file-frame"
      :src="currentDoc.fileUrl"
      title="PDF 预览"
    ></iframe>

    <div v-else-if="previewFileKind(currentDoc) === 'image'" class="preview-file-image-wrap">
      <img class="preview-file-image" :src="currentDoc.fileUrl" :alt="currentDoc.fileName || '附件预览'" />
    </div>

    <!-- Word / Excel / PPT 前端解析预览 -->
    <div v-else-if="['word','excel','ppt'].indexOf(previewFileKind(currentDoc)) >= 0" class="office-preview-pane">
      <div v-if="officePreview.loading" class="office-preview-status">正在解析预览…</div>
      <div v-else-if="officePreview.error" class="office-preview-status err">
        {{ officePreview.error }}
        <el-button type="primary" size="small" style="margin-left:10px" @click="openUploadedFile(currentDoc)">打开附件</el-button>
      </div>
      <template v-else>
        <div v-if="previewFileKind(currentDoc) === 'word'" class="office-paper office-paper--wm">
          <div class="office-paper-wm-tiles" aria-hidden="true">
            <span v-for="n in 12" :key="'owm-' + n">{{ data.user.name }} · {{ data.user.userNo }} · {{ currentDoc && currentDoc.docNo }}</span>
          </div>
          <div class="office-paper-body" v-html="officePreview.html || '<p>（空文档）</p>'"></div>
        </div>
        <template v-else-if="previewFileKind(currentDoc) === 'excel'">
          <div class="office-sheet-tabs">
            <button
              v-for="(s, i) in officePreview.sheets"
              :key="'pv-es-' + i"
              type="button"
              class="office-sheet-tab"
              :class="{ active: officePreview.sheetIndex === i }"
              @click="officePreview.sheetIndex = i"
            >{{ s.name || ('Sheet' + (i + 1)) }}</button>
          </div>
          <div
            class="office-paper office-excel-html office-paper--wm"
            v-if="officePreview.sheets[officePreview.sheetIndex]"
          >
            <div class="office-paper-wm-tiles" aria-hidden="true">
              <span v-for="n in 12" :key="'ewm-' + n">{{ data.user.name }} · {{ data.user.userNo }} · {{ currentDoc && currentDoc.docNo }}</span>
            </div>
            <div class="office-paper-body" v-html="officePreview.sheets[officePreview.sheetIndex].html || ''"></div>
          </div>
        </template>
        <template v-else>
          <div v-if="!officePreview.slides || !officePreview.slides.length" class="office-preview-status">
            PPT 在线预览暂不可用，请直接下载后用 PowerPoint / WPS 打开。
          </div>
          <template v-else>
            <div class="office-sheet-tabs">
              <button
                v-for="(s, i) in officePreview.slides"
                :key="'pv-ps-' + i"
                type="button"
                class="office-sheet-tab"
                :class="{ active: officePreview.slideIndex === i }"
                @click="officePreview.slideIndex = i"
              >幻灯片 {{ s.index || (i + 1) }}</button>
            </div>
            <div
              class="office-paper office-ppt-slide office-paper--wm"
              v-if="officePreview.slides[officePreview.slideIndex]"
            >
              <div class="office-paper-wm-tiles" aria-hidden="true">
                <span v-for="n in 12" :key="'pwm2-' + n">{{ data.user.name }} · {{ data.user.userNo }} · {{ currentDoc && currentDoc.docNo }}</span>
              </div>
              <div
                class="office-paper-body"
                v-html="officePreview.slides[officePreview.slideIndex].html || '<p>（空）</p>'"
              ></div>
            </div>
          </template>
        </template>
      </template>
    </div>

    <div v-else-if="previewFileKind(currentDoc) === 'other'" class="preview-doc">
      <h3>{{ currentDoc && currentDoc.title || '受控文件' }}</h3>
      <div class="meta">编号 {{ currentDoc && currentDoc.docNo }}　版本 {{ currentDoc && currentDoc.version }}</div>
      <p>已上传附件：<strong>{{ currentDoc.fileName || '-' }}</strong>
        <template v-if="currentDoc.fileSize">（{{ formatFileSize(currentDoc.fileSize) }}）</template>
      </p>
      <p style="color:#606266;font-size:13px;">该格式暂不支持内嵌预览，请打开或下载查看。</p>
      <el-button type="primary" @click="openUploadedFile(currentDoc)">打开真实附件</el-button>
    </div>

    <div v-else class="preview-doc">
      <h3>{{ currentDoc && currentDoc.title || '受控文件' }}</h3>
      <div class="meta">编号 {{ currentDoc && currentDoc.docNo }}　版本 {{ currentDoc && currentDoc.version }}
        <template v-if="data.watermark.preview">　· 预览水印已开 · 下载/打印仍强制水印</template>
        <template v-else>　· 预览水印已关 · 下载/打印仍强制水印</template>
        <template v-if="data.watermark.preview && previewStatusWm.corner">　· {{ previewStatusWm.corner }}</template>
      </div>
      <p>1 目的<br/>规范相关作业流程，确保现行有效版本受控使用。</p>
      <p>2 范围<br/>适用于本公司相关部门及岗位。</p>
      <p>3 职责<br/>文件责任人维护内容；文控中心负责编号、分发与回收。</p>
      <p style="color:#8c8c8c;font-size:12px;margin-top:20px;">当前文件无上传附件，显示演示正文。上传 PDF / Word / Excel / PPT / 图片后可预览真实内容。</p>
    </div>

    <!-- 水印置顶叠层：Office/PDF/图片预览均强制可见（Office 滚动时仍覆盖可视区） -->
    <template v-if="data.watermark.preview || ['word','excel','ppt'].indexOf(previewFileKind(currentDoc)) >= 0">
      <div class="wm preview-wm-top"></div>
      <div class="wm-text preview-wm-top">
        <span v-for="n in 16" :key="'pwm-' + n">{{ data.user.name }} · {{ data.user.userNo }} · {{ currentDoc && currentDoc.docNo }}</span>
      </div>
      <div class="wm-status-corner preview-wm-top" v-if="previewStatusWm.corner">{{ previewStatusWm.corner }}</div>
      <div class="wm-status-secret preview-wm-top" v-if="previewStatusWm.secret"><span>机密文件</span></div>
    </template>
  </div>
  <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">
    <el-button @click="previewVisible=false">关闭</el-button>
    <el-button v-if="currentDoc && (currentDoc.fileUrl || currentDoc.fileBlob)" @click="openUploadedFile(currentDoc)">打开附件（含水印）</el-button>
    <el-button @click="controlledPrint(currentDoc)">受控打印</el-button>
    <el-button type="primary" @click="mockDownload(currentDoc)">
      {{ currentDoc && (currentDoc.fileUrl || currentDoc.fileBlob) ? '下载真实附件' : '下载演示件' }}
    </el-button>
  </div>
</el-dialog>

<!-- 我的申请 · 详情（只读） -->
<el-dialog v-model="applyDetailVisible" title="申请详情" width="640px" destroy-on-close>
  <template v-if="currentApply">
    <el-descriptions :column="2" size="small" border>
      <el-descriptions-item label="申请单号" :span="2">{{ currentApply.applyNo || "-" }}</el-descriptions-item>
      <el-descriptions-item label="类型">
        <span class="tag" :class="statusTag(currentApply.type).cls">{{ statusTag(currentApply.type).text }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <span class="tag" :class="statusTag(currentApply.status).cls">{{ statusTag(currentApply.status).text }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="文件ID">{{ fileIdOf(currentApply) }}</el-descriptions-item>
      <el-descriptions-item label="文件编号">{{ currentApply.docNo || "-" }}</el-descriptions-item>
      <el-descriptions-item label="文件名称" :span="2">
        {{ currentApply.title || "-" }}
        <span v-if="isSecret(currentApply)" class="sec-mi" title="机密">密</span>
      </el-descriptions-item>
      <el-descriptions-item label="文件级别">{{ levelName(currentApply.fileLevel) }}</el-descriptions-item>
      <el-descriptions-item label="业务领域">{{ ptName(currentApply.productType) }}</el-descriptions-item>
      <el-descriptions-item label="目标版本">{{ currentApply.targetVersion || "-" }}</el-descriptions-item>
      <el-descriptions-item label="计划生效日">{{ currentApply.plannedEffectiveDate || "-" }}</el-descriptions-item>
      <el-descriptions-item label="申请人">{{ currentApply.applicant || "-" }}</el-descriptions-item>
      <el-descriptions-item label="部门">{{ currentApply.dept || "-" }}</el-descriptions-item>
      <el-descriptions-item label="提交时间" :span="2">{{ currentApply.submittedAt || "-" }}</el-descriptions-item>
      <el-descriptions-item label="原因/说明" :span="2">{{ currentApply.reason || "-" }}</el-descriptions-item>
    </el-descriptions>
    <div style="margin-top:16px;" class="section-title"><span>审批时间线</span></div>
    <div class="timeline" v-if="applyDetailTimeline.length">
      <div
        v-for="(n, i) in applyDetailTimeline"
        :key="i"
        class="tl-item"
        :class="n.status === 'done' ? 'done' : n.status === 'current' ? 'current' : 'wait'"
      >
        <div class="t">
          {{ n.name }} · {{ n.user }}
          <span v-if="n.post" style="color:#909399;font-weight:400;"> · {{ n.post }}</span>
        </div>
        <div class="d">
          {{ n.time }}
          <span v-if="n.signature"> · 签名 {{ n.signature }}</span>
          <span v-if="n.roles"> · 权限 {{ n.roles }}</span>
          <span v-if="n.comment"> · {{ n.comment }}</span>
        </div>
      </div>
    </div>
    <el-empty v-else description="暂无审批节点记录" :image-size="48" />
  </template>
  <template #footer>
    <el-button type="primary" @click="applyDetailVisible = false">关闭</el-button>
  </template>
</el-dialog>

<!-- Approve dialog -->
<el-dialog v-model="approveVisible" title="审批处理（签名 · 时间戳 · 岗位权限）" width="680px" destroy-on-close>
  <template v-if="currentTodo">
    <el-descriptions :column="1" size="small" border>
      <el-descriptions-item label="文件ID">{{ fileIdOf(currentTodo) }}</el-descriptions-item>
      <el-descriptions-item label="文件编号">{{ currentTodo.docNo || '-' }}</el-descriptions-item>
      <el-descriptions-item label="文件名称">{{ currentTodo.title || '-' }}</el-descriptions-item>
      <el-descriptions-item label="文件级别">{{ levelName(currentTodo.fileLevel) }}</el-descriptions-item>
      <el-descriptions-item label="业务领域">{{ ptName(currentTodo.productType) }}</el-descriptions-item>
      <el-descriptions-item label="提交人">{{ currentTodo.applicant }}</el-descriptions-item>
      <el-descriptions-item label="当前节点">{{ currentTodo.node }}</el-descriptions-item>
      <el-descriptions-item label="审批人岗位">{{ data.user.post }} · {{ data.user.roleCode }}</el-descriptions-item>
      <el-descriptions-item v-if="currentTodo.detail" label="摘要">{{ currentTodo.detail }}</el-descriptions-item>
    </el-descriptions>
    <div style="margin-top:16px;" class="section-title"><span>审批时间线</span></div>
    <div class="timeline">
      <div v-for="(n,i) in activeApprovalTimeline" :key="i" class="tl-item" :class="n.status==='done'?'done':(n.status==='current'?'':'wait')">
        <div class="t">{{ n.name }} · {{ n.user }} <span v-if="n.post" style="color:#909399;font-weight:400;">· {{ n.post }}</span></div>
        <div class="d">
          {{ n.time }}
          <span v-if="n.signature"> · 签名 {{ n.signature }}</span>
          <span v-if="n.roles"> · 权限 {{ n.roles }}</span>
          <span v-if="n.comment"> · {{ n.comment }}</span>
        </div>
      </div>
    </div>
    <div style="margin-top:12px;">
      <label style="font-size:13px;color:#595959;display:block;margin-bottom:6px;"><span class="req" style="color:#ff4d4f;">*</span> 电子签名</label>
      <el-input v-model="approveSignature" placeholder="姓名/工号，如 周文控/MG00128" />
    </div>
    <el-input v-model="approveComment" type="textarea" rows="3" placeholder="审批意见（驳回必填）" style="margin-top:8px;" />
  </template>
  <template #footer>
    <el-button @click="doApprove(false)">驳回</el-button>
    <el-button type="primary" @click="doApprove(true)">签名并通过</el-button>
  </template>
</el-dialog>

<!-- Access apply dialog -->
<el-dialog v-model="accessApplyVisible" :title="(accessAction==='PRINT'?'打印':'下载')+'二次申请'" width="520px">
  <div class="form-item full" style="margin-bottom:12px;">
    <label><span class="req">*</span>文件编号</label>
    <el-select v-model="accessDocNo" filterable clearable placeholder="输入编号检索并选择" style="width:100%" @change="onAccessDocChange">
      <el-option v-for="d in effectiveDocOptions" :key="'aa-no-'+d.docNo" :label="d.docNo" :value="d.docNo">
        <span>{{ d.docNo }}</span>
        <span style="color:#909399;margin-left:8px;font-size:12px;">{{ d.title }}</span>
      </el-option>
    </el-select>
  </div>
  <div class="form-item full" style="margin-bottom:12px;">
    <label><span class="req">*</span>文件名称</label>
    <el-select v-model="accessDocNo" filterable clearable placeholder="输入名称检索并选择（自动关联编号）" style="width:100%" @change="onAccessDocChange">
      <el-option v-for="d in effectiveDocOptions" :key="'aa-tt-'+d.docNo" :label="d.title" :value="d.docNo">
        <span>{{ d.title }}</span>
        <span style="color:#909399;margin-left:8px;font-size:12px;">{{ d.docNo }}</span>
      </el-option>
    </el-select>
  </div>
  <div class="form-item full" style="margin-bottom:12px;">
    <label><span class="req">*</span>用途说明</label>
    <el-input v-model="accessReason" type="textarea" rows="3" placeholder="用途说明（必填，将留痕审计）"></el-input>
  </div>
  <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;">
    <el-button @click="accessApplyVisible=false">取消</el-button>
    <el-button type="primary" @click="submitAccessApply">提交申请</el-button>
  </div>
</el-dialog>

<!-- Borrow apply dialog -->
<el-dialog v-model="borrowFormVisible" title="新建借阅申请" width="560px">
  <el-alert type="info" show-icon :closable="false" style="margin-bottom:12px;"
    title="借阅用于临时预览「非本人受控、非本部门所属」的现行文件：部门初审→文控终审；通过后可预览，可提前归还，到期自动收回。" />
  <div class="form-grid">
    <div class="form-item full">
      <label><span class="req">*</span>文件编号</label>
      <el-select v-model="borrowForm.docNo" filterable clearable placeholder="跨部门现行文件（不含本人已签收/本部门所属）" style="width:100%" @change="onBorrowDocChange">
        <el-option v-for="d in borrowDocOptions" :key="'br-no-'+d.docNo" :label="d.docNo" :value="d.docNo">
          <span>{{ d.docNo }}</span>
          <span style="color:#909399;margin-left:8px;font-size:12px;">{{ d.title }}</span>
        </el-option>
      </el-select>
    </div>
    <div class="form-item full">
      <label><span class="req">*</span>文件名称</label>
      <el-select v-model="borrowForm.docNo" filterable clearable placeholder="输入名称检索并选择（自动关联编号）" style="width:100%" @change="onBorrowDocChange">
        <el-option v-for="d in borrowDocOptions" :key="'br-tt-'+d.docNo" :label="d.title" :value="d.docNo">
          <span>{{ d.title }}</span>
          <span style="color:#909399;margin-left:8px;font-size:12px;">{{ d.docNo }}</span>
        </el-option>
      </el-select>
    </div>
    <div class="form-item">
      <label><span class="req">*</span>借阅类型</label>
      <el-select v-model="borrowForm.type" style="width:100%" @change="borrowForm.copyNo=''">
        <el-option label="电子借阅" value="ELECTRONIC"></el-option>
        <el-option label="纸质借阅" value="HARDCOPY"></el-option>
      </el-select>
    </div>
    <div class="form-item" v-if="borrowForm.type==='HARDCOPY'">
      <label><span class="req">*</span>纸质受控号</label>
      <el-select v-model="borrowForm.copyNo" filterable clearable placeholder="请选择纸质份" style="width:100%">
        <el-option
          v-for="h in hardCopyOptionsForBorrow"
          :key="h.copyNo"
          :label="h.copyNo + ' · ' + h.holder"
          :value="h.copyNo"
        ></el-option>
      </el-select>
    </div>
    <div class="form-item">
      <label><span class="req">*</span>借阅天数</label>
      <el-input-number v-model="borrowForm.days" :min="1" :max="90" style="width:100%" @change="syncBorrowExpectReturn" />
    </div>
    <div class="form-item">
      <label><span class="req">*</span>应还日期</label>
      <el-input v-model="borrowForm.expectReturn" readonly placeholder="由借阅天数自动生成"></el-input>
    </div>
    <div class="form-item full">
      <label><span class="req">*</span>借阅事由</label>
      <el-input v-model="borrowForm.reason" type="textarea" rows="3" placeholder="至少 5 字"></el-input>
    </div>
  </div>
  <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
    <el-button @click="borrowFormVisible=false">取消</el-button>
    <el-button type="primary" @click="submitBorrow">提交申请</el-button>
  </div>
</el-dialog>

<!-- External release dialog -->
<el-dialog v-model="externalFormVisible" title="新建外发申请" width="560px">
  <el-alert type="warning" show-icon :closable="false" style="margin-bottom:12px;"
    title="仅文控或部门负责人可发起；负责人须选「我的受控文件」内文件。审批通过后生成访问令牌与专用水印包，可复制链接发给外部人员；到期令牌自动失效。"></el-alert>
  <div class="form-grid">
    <div class="form-item full">
      <label><span class="req">*</span>文件编号</label>
      <el-select v-model="externalForm.docNo" filterable clearable placeholder="输入编号检索并选择" style="width:100%" @change="onExternalDocChange">
        <el-option v-for="d in externalDocOptions" :key="'er-no-'+d.docNo" :label="d.docNo" :value="d.docNo">
          <span>{{ d.docNo }}</span>
          <span style="color:#909399;margin-left:8px;font-size:12px;">{{ d.title }}</span>
        </el-option>
      </el-select>
    </div>
    <div class="form-item full">
      <label><span class="req">*</span>文件名称</label>
      <el-select v-model="externalForm.docNo" filterable clearable placeholder="输入名称检索并选择（自动关联编号）" style="width:100%" @change="onExternalDocChange">
        <el-option v-for="d in externalDocOptions" :key="'er-tt-'+d.docNo" :label="d.title" :value="d.docNo">
          <span>{{ d.title }}</span>
          <span style="color:#909399;margin-left:8px;font-size:12px;">{{ d.docNo }}</span>
        </el-option>
      </el-select>
    </div>
    <div class="form-item">
      <label><span class="req">*</span>接收单位</label>
      <el-input v-model="externalForm.receiver" placeholder="客户 / 外部单位名称"></el-input>
    </div>
    <div class="form-item">
      <label>联系人</label>
      <el-input v-model="externalForm.contact" placeholder="可选"></el-input>
    </div>
    <div class="form-item">
      <label><span class="req">*</span>有效期至</label>
      <el-input v-model="externalForm.expireDate" placeholder="YYYY-MM-DD"></el-input>
    </div>
    <div class="form-item full">
      <label><span class="req">*</span>外发目的</label>
      <el-input v-model="externalForm.purpose" type="textarea" rows="3" placeholder="至少 5 字"></el-input>
    </div>
  </div>
  <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
    <el-button @click="externalFormVisible=false">取消</el-button>
    <el-button type="primary" @click="submitExternal">提交申请</el-button>
  </div>
</el-dialog>

<!-- Apply drawer -->
<el-drawer v-model="applyDrawer" :title="applyMode==='CREATE'?'新建文件申请':(applyMode==='REVISE'?'修订文件申请':'作废文件申请')" size="560px" destroy-on-close>
  <el-alert type="info" show-icon :closable="false" style="margin-bottom:12px;"
    :title="isDocController
      ? '文控提交后直接办理完成，无需审批。'
      : (String(roleCode||'').indexOf('DCC_LEADER_')===0
        ? '部门负责人提交后，仅需文控在「待我审批」处理。'
        : '普通员工提交后：本部门负责人一审 → 文控二审。')" />
  <el-form label-width="110px" label-position="top">
    <div class="form-grid">
      <div class="form-item">
        <label>文件ID</label>
        <el-input :model-value="applyMode==='CREATE' ? (createForm.fileId != null ? String(createForm.fileId) : '提交后自动生成') : String(createForm.fileId != null ? createForm.fileId : '-')" readonly />
      </div>
      <!-- 新建：手填编号/名称；修订/作废：与借阅等相同，编号与名称可检索互相关联 -->
      <template v-if="applyMode==='CREATE'">
        <div class="form-item">
          <label><span class="req">*</span>文件编号</label>
          <el-input v-model="createForm.docNo" placeholder="拟编号（按规则预生成）" />
        </div>
        <div class="form-item full">
          <label><span class="req">*</span>文件名称</label>
          <el-input v-model="createForm.title" placeholder="请输入文件名称" />
        </div>
      </template>
      <template v-else>
        <div class="form-item full">
          <label><span class="req">*</span>文件编号</label>
          <el-select v-model="createForm.docNo" filterable clearable placeholder="输入编号检索并选择" style="width:100%" @change="onApplyDocChange">
            <el-option v-for="d in effectiveDocOptions" :key="'ap-no-'+d.docNo" :label="d.docNo" :value="d.docNo">
              <span>{{ d.docNo }}</span>
              <span style="color:#909399;margin-left:8px;font-size:12px;">{{ d.title }}</span>
            </el-option>
          </el-select>
        </div>
        <div class="form-item full">
          <label><span class="req">*</span>文件名称</label>
          <el-select v-model="createForm.docNo" filterable clearable placeholder="输入名称检索并选择（自动关联编号）" style="width:100%" @change="onApplyDocChange">
            <el-option v-for="d in effectiveDocOptions" :key="'ap-tt-'+d.docNo" :label="d.title" :value="d.docNo">
              <span>{{ d.title }}</span>
              <span style="color:#909399;margin-left:8px;font-size:12px;">{{ d.docNo }}</span>
            </el-option>
          </el-select>
        </div>
      </template>
      <div class="form-item" v-if="applyMode!=='OBSOLETE'">
        <label><span class="req">*</span>文件级别</label>
        <el-select v-model="createForm.fileLevel" placeholder="请选择文件级别" style="width:100%">
          <el-option v-for="p in data.fileLevels" :key="p.code" :label="p.name" :value="p.code"></el-option>
        </el-select>
      </div>
      <div class="form-item" v-if="applyMode!=='OBSOLETE'">
        <label><span class="req">*</span>业务领域</label>
        <el-select v-model="createForm.productType" multiple collapse-tags collapse-tags-tooltip placeholder="可多选，展示用英文逗号分隔" style="width:100%">
          <el-option v-for="p in data.productTypes" :key="p.code" :label="p.name" :value="p.code"></el-option>
        </el-select>
      </div>
      <div class="form-item" v-if="applyMode==='OBSOLETE'">
        <label>文件级别</label>
        <el-input :model-value="levelName(createForm.fileLevel)" readonly />
      </div>
      <div class="form-item" v-if="applyMode==='OBSOLETE'">
        <label>业务领域</label>
        <el-input :model-value="ptName(createForm.productType)" readonly />
      </div>
      <div class="form-item" v-if="applyMode!=='OBSOLETE'">
        <label><span class="req">*</span>分类</label>
        <el-select v-model="createForm.category" style="width:100%">
          <el-option v-for="c in data.categories" :key="c.code" :label="c.code+' '+c.name" :value="c.code"></el-option>
        </el-select>
      </div>
      <div class="form-item" v-if="applyMode!=='OBSOLETE'">
        <label><span class="req">*</span>密级</label>
        <el-select v-model="createForm.security" placeholder="请选择密级" style="width:100%">
          <el-option v-for="o in securityOptions" :key="'sec-'+o.value" :label="o.label" :value="o.value"></el-option>
        </el-select>
      </div>
      <div class="form-item" v-if="applyMode!=='OBSOLETE'">
        <label><span class="req">*</span>数据域</label>
        <el-select v-model="createForm.accessDomain" placeholder="请选择数据域" style="width:100%">
          <el-option v-for="o in domainOptions" :key="'dom-'+o.value" :label="o.label" :value="o.value"></el-option>
        </el-select>
      </div>
      <div class="form-item">
        <label><span class="req">*</span>文件所属部门</label>
        <el-select v-model="createForm.ownerDept" multiple collapse-tags collapse-tags-tooltip placeholder="可多选，展示用英文逗号分隔" style="width:100%" :disabled="applyMode==='OBSOLETE'">
          <el-option v-for="d in data.ownerDepts" :key="d.code" :label="d.name" :value="d.name"></el-option>
        </el-select>
      </div>
      <div class="form-item">
        <label>责任人</label>
        <el-input v-model="createForm.owner" />
      </div>
      <div class="form-item full" v-if="applyMode==='CREATE'">
        <label><span class="req">*</span>编制原因</label>
        <el-input v-model="createForm.reason" type="textarea" rows="2" />
      </div>
      <div class="form-item full" v-if="applyMode==='REVISE'">
        <label><span class="req">*</span>变更原因（≥10 字）</label>
        <el-input v-model="createForm.changeSummary" type="textarea" rows="2" placeholder="强制必填：说明为何修订，禁止仅填「更新」" />
      </div>
      <div class="form-item full" v-if="applyMode==='OBSOLETE'">
        <label><span class="req">*</span>作废原因（≥10 字）</label>
        <el-input v-model="createForm.obsoleteReason" type="textarea" rows="2" placeholder="强制必填，否则不可提交" />
      </div>
      <div class="form-item" v-if="applyMode!=='OBSOLETE'">
        <label><span class="req">*</span>确切生效日</label>
        <el-input
          v-model="createForm.plannedEffectiveDate"
          placeholder="必须 YYYY-MM-DD，如 2026-08-01"
          maxlength="10"
        />
        <div style="font-size:12px;color:#909399;margin-top:4px;">仅接受格式 YYYY-MM-DD；不符则无法提交。未到该日申请显示「待生效」，到日才「已发布」。</div>
      </div>
      <div class="form-item" v-if="applyMode!=='OBSOLETE'">
        <label>复审周期(月)</label>
        <el-input-number v-model="createForm.reviewCycleMonths" :min="1" :max="36" />
      </div>
      <div class="form-item full" v-if="applyMode!=='OBSOLETE'">
        <label><span class="req">*</span>上传正文</label>
        <div style="border:1px dashed #d9d9d9;border-radius:6px;padding:16px;text-align:center;">
          <div style="color:#909399;font-size:13px;margin-bottom:8px;">支持 pdf / doc / docx / xls / xlsx（本地实装选择，存于浏览器内存）</div>
          <el-button type="primary" plain size="small" @click="pickUploadFile">选择附件</el-button>
          <div v-if="createForm.fileName" style="margin-top:8px;font-size:13px;color:#1677ff;">
            已选：{{ createForm.fileName }}
            <span v-if="createForm.fileSize" style="color:#909399;margin-left:6px;">（{{ formatFileSize(createForm.fileSize) }}）</span>
          </div>
        </div>
      </div>
      <div class="form-item" v-if="applyMode!=='OBSOLETE'">
        <label>允许下载</label>
        <el-switch v-model="createForm.allowDownload" />
      </div>
      <div class="form-item" v-if="applyMode!=='OBSOLETE'">
        <label>允许受控打印</label>
        <el-switch v-model="createForm.allowPrint" />
      </div>
    </div>
  </el-form>
  <div style="display:flex;justify-content:flex-end;gap:8px;padding:20px 0 0;">
    <el-button @click="applyDrawer=false">取消</el-button>
    <el-button @click="toast('已保存草稿')">保存草稿</el-button>
    <el-button type="primary" @click="submitApply">{{ isDocController ? '直接办理' : '提交审批' }}</el-button>
  </div>
</el-drawer>

<!-- Dist drawer -->
<el-drawer v-model="distDrawer" title="新建分发单" size="480px">
  <el-alert type="info" show-icon :closable="false" style="margin-bottom:12px;"
    :title="isDocController
      ? '仅现行有效可分发；文控只分发给各部门负责人。对象到「待我签收」确认后进入「我的受控文件」。'
      : '负责人仅可向本部门员工二次分发。对象到「待我签收」确认后进入「我的受控文件」。'" />
  <el-form label-position="top">
    <el-form-item label="文件编号">
      <el-select v-model="distForm.docNo" filterable clearable placeholder="输入编号检索并选择" style="width:100%" @change="onDistDocChange">
        <el-option v-for="d in effectiveDocOptions" :key="'dist-no-'+d.docNo" :label="d.docNo" :value="d.docNo">
          <span>{{ d.docNo }}</span>
          <span style="color:#909399;margin-left:8px;font-size:12px;">{{ d.title }}</span>
        </el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="文件名称">
      <el-select v-model="distForm.docNo" filterable clearable placeholder="输入名称检索并选择（自动关联编号）" style="width:100%" @change="onDistDocChange">
        <el-option v-for="d in effectiveDocOptions" :key="'dist-tt-'+d.docNo" :label="d.title" :value="d.docNo">
          <span>{{ d.title }}</span>
          <span style="color:#909399;margin-left:8px;font-size:12px;">{{ d.docNo }}</span>
        </el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="分发对象">
      <el-select v-model="distForm.targetRoles" multiple filterable clearable placeholder="选择接收人（可多选）" style="width:100%">
        <el-option v-for="r in distTargetOptions" :key="r.roleCode" :label="r.name + ' · ' + r.role" :value="r.roleCode" />
      </el-select>
    </el-form-item>
    <el-form-item label="强制签收">
      <el-switch v-model="distForm.requireReceipt" />
    </el-form-item>
    <el-form-item label="备注">
      <el-input v-model="distForm.remark" type="textarea" rows="2" />
    </el-form-item>
    <div style="display:flex;justify-content:flex-end;gap:8px;">
      <el-button @click="distDrawer=false">取消</el-button>
      <el-button type="primary" @click="submitDistribution">发送分发</el-button>
    </div>
  </el-form>
</el-drawer>

<!-- Hard print：按钮放在内容区底部（in-DOM 下 #footer 插槽常不显示） -->
<el-dialog v-model="hardPrintVisible" title="受控打印（强制水印）" width="520px" destroy-on-close>
  <el-alert type="warning" show-icon :closable="false" style="margin-bottom:12px;"
    title="确认后将下载强制水印受控件，并登记纸质受控号；可用浏览器打开后打印/另存 PDF。"></el-alert>
  <el-form label-width="100px">
    <el-form-item label="文件ID"><el-input :model-value="currentDoc ? String(fileIdOf(currentDoc)) : '-'" readonly /></el-form-item>
    <el-form-item label="文件编号"><el-input :model-value="currentDoc && currentDoc.docNo || '-'" readonly /></el-form-item>
    <el-form-item label="文件名称"><el-input :model-value="currentDoc && currentDoc.title || '-'" readonly /></el-form-item>
    <el-form-item label="版本"><el-input :model-value="currentDoc && currentDoc.version || '-'" readonly /></el-form-item>
    <el-form-item label="打印份数"><el-input-number v-model="printForm.copies" :min="1" :max="20" /></el-form-item>
    <el-form-item label="持有人"><el-input v-model="printForm.holder" /></el-form-item>
    <el-form-item label="存放位置"><el-input v-model="printForm.location" /></el-form-item>
    <el-form-item label="用途"><el-input v-model="printForm.purpose" type="textarea" rows="2" /></el-form-item>
  </el-form>
  <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;padding-top:12px;border-top:1px solid #f0f0f0;">
    <el-button @click="hardPrintVisible=false">取消</el-button>
    <el-button type="primary" @click="confirmPrint">确认受控打印并下载</el-button>
  </div>
</el-dialog>

<!-- 外来文件登记 -->
<el-drawer v-model="extDocDrawer" title="登记外来文件" size="520px" destroy-on-close>
  <el-form label-position="top">
    <div class="form-grid">
      <div class="form-item full">
        <label><span class="req">*</span>文件名称</label>
        <el-input v-model="extForm.title" placeholder="如 GB/T xxx 或客户规范名称" />
      </div>
      <div class="form-item">
        <label><span class="req">*</span>来源类型</label>
        <el-select v-model="extForm.sourceType" style="width:100%">
          <el-option v-for="o in sourceTypeOptions" :key="o.value" :label="o.label" :value="o.value"></el-option>
        </el-select>
      </div>
      <div class="form-item">
        <label><span class="req">*</span>密级</label>
        <el-select v-model="extForm.security" style="width:100%">
          <el-option v-for="o in securityOptions" :key="'ext-'+o.value" :label="o.label" :value="o.value"></el-option>
        </el-select>
      </div>
      <div class="form-item full">
        <label><span class="req">*</span>来源单位</label>
        <el-input v-model="extForm.sourceOrg" placeholder="国家标准委 / 客户名称等" />
      </div>
      <div class="form-item">
        <label><span class="req">*</span>接收日</label>
        <el-input v-model="extForm.receiveDate" placeholder="YYYY-MM-DD" />
      </div>
      <div class="form-item">
        <label>失效日</label>
        <el-input v-model="extForm.expireDate" placeholder="YYYY-MM-DD" />
      </div>
      <div class="form-item">
        <label>责任人</label>
        <el-input v-model="extForm.owner" />
      </div>
      <div class="form-item full">
        <label><span class="req">*</span>上传附件</label>
        <div style="color:#909399;font-size:13px;margin-bottom:8px;">支持 pdf / doc / docx / xls / xlsx</div>
        <el-button type="primary" plain size="small" @click="pickExtDocFile">选择附件</el-button>
        <div v-if="extForm.fileName" style="margin-top:8px;font-size:13px;color:#1677ff;">
          已选：{{ extForm.fileName }}
          <span v-if="extForm.fileSize" style="color:#909399;margin-left:6px;">（{{ formatFileSize(extForm.fileSize) }}）</span>
        </div>
      </div>
      <div class="form-item full">
        <label>备注</label>
        <el-input v-model="extForm.remark" type="textarea" rows="2" placeholder="存放位置、用途说明等" />
      </div>
    </div>
  </el-form>
  <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
    <el-button @click="extDocDrawer=false">取消</el-button>
    <el-button type="primary" @click="submitExtDoc">提交登记</el-button>
  </div>
</el-drawer>

<!-- 审批模板节点配置 -->
<el-drawer v-model="tplDrawer" :title="'配置节点 · ' + (currentTpl && currentTpl.name || '')" size="480px" destroy-on-close>
  <p style="font-size:13px;color:#595959;margin:0 0 12px;" v-if="currentTpl">
    模板编码 <b>{{ currentTpl.code }}</b>：按顺序配置审批人角色/岗位节点，末节点为终审。
  </p>
  <div v-for="(n, idx) in tplNodes" :key="idx" style="display:flex;gap:8px;align-items:center;margin-bottom:10px;">
    <span style="width:28px;color:#909399;">{{ idx + 1 }}</span>
    <el-input v-model="n.name" placeholder="节点名称，如 部门负责人" />
    <el-button @click="removeTplNode(idx)" :disabled="tplNodes.length<=1">删除</el-button>
  </div>
  <el-button @click="addTplNode" style="margin-bottom:16px;">新增节点</el-button>
  <div style="display:flex;justify-content:flex-end;gap:8px;">
    <el-button @click="tplDrawer=false">取消</el-button>
    <el-button type="primary" @click="saveTplConfig">保存</el-button>
  </div>
</el-drawer>

  <!-- Receipt detail -->
  <el-dialog v-model="receiptDetailVisible" :title="'签收明细 · '+currentDistNo" width="560px">
    <el-table :data="currentReceiptRows" size="small" border stripe>
      <el-table-column label="人员" width="100"><template #default="{ row }">{{ row.user || '-' }}</template></el-table-column>
      <el-table-column label="部门" width="120"><template #default="{ row }">{{ row.dept || '-' }}</template></el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }"><span class="tag" :class="statusTag(row.status).cls">{{ statusTag(row.status).text }}</span></template>
      </el-table-column>
      <el-table-column label="签收时间" min-width="120"><template #default="{ row }">{{ row.time || '-' }}</template></el-table-column>
    </el-table>
  </el-dialog>

  <!-- 纸质份详情 -->
  <el-dialog v-model="hardDetailVisible" title="纸质受控份详情" width="560px" destroy-on-close>
    <template v-if="currentHard">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="纸质受控号" :span="2">{{ currentHard.copyNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="文件ID">{{ fileIdOf(currentHard) }}</el-descriptions-item>
        <el-descriptions-item label="文件编号">{{ currentHard.docNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="文件名称">{{ currentHard.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="版本">{{ currentHard.version || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <span class="tag" :class="statusTag(currentHard.status).cls">{{ statusTag(currentHard.status).text }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="持有人/组">{{ currentHard.holder || '-' }}</el-descriptions-item>
        <el-descriptions-item label="存放位置">{{ currentHard.location || '-' }}</el-descriptions-item>
        <el-descriptions-item label="打印人">{{ currentHard.printedBy || '-' }}</el-descriptions-item>
        <el-descriptions-item label="打印日期">{{ currentHard.printedAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="回收原因" :span="2">{{ currentHard.recycleReason || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理方式">{{ currentHard.recycleAction || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ currentHard.recycledBy || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理时间" :span="2">{{ currentHard.recycledAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理备注" :span="2">{{ currentHard.recycleRemark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
        <el-button @click="hardDetailVisible=false">关闭</el-button>
        <el-button
          v-if="currentHard.status==='RECYCLE_PENDING' && canRecycleHardCopy(currentHard)"
          type="danger"
          @click="openRecycle(currentHard)"
        >去回收</el-button>
        <el-button
          v-if="currentHard.status==='RECYCLED' && canVoidStampHardCopy(currentHard)"
          type="warning"
          @click="openVoidStamp(currentHard)"
        >盖废章</el-button>
        <el-button
          type="primary"
          :disabled="isHardcopyAccessRevoked(currentHard) && !isDocController"
          @click="openHardcopyLinkedDoc(currentHard)"
        >查看文件</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 第一步：实物回收（仅待回收） -->
  <el-dialog v-model="recycleVisible" title="纸质受控份 · 实物回收" width="520px" destroy-on-close>
    <template v-if="currentHard">
      <p style="font-size:13px;margin:0 0 12px;line-height:1.7;">
        受控号 <b>{{ currentHard.copyNo }}</b><br/>
        文件 {{ currentHard.docNo }} · {{ currentHard.title || '' }} · 版本 {{ currentHard.version }}<br/>
        持有：{{ currentHard.holder }} / {{ currentHard.location }}
        <template v-if="currentHard.recycleReason"><br/>待回收原因：{{ currentHard.recycleReason }}</template>
      </p>
      <el-alert type="warning" :closable="false" show-icon style="margin-bottom:12px;"
        title="第一步仅登记实物回收。回收完成后，再在列表点「盖废章」办理第二步；两步不可合并。"></el-alert>
      <div class="form-item full">
        <label>处理备注（可选）</label>
        <el-input v-model="recycleForm.remark" type="textarea" :rows="2" placeholder="如：实物已交回文控柜 A-2"></el-input>
      </div>
      <div style="display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-top:16px;">
        <el-button @click="recycleVisible=false">取消</el-button>
        <el-button v-if="isDocController" type="danger" plain @click="finishRecycle('LOST')">丢失确认（仅文控）</el-button>
        <el-button type="primary" @click="finishRecycle('RECYCLE')">确认实物回收</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 第二步：盖作废章（仅已回收） -->
  <el-dialog v-model="voidStampVisible" title="纸质受控份 · 盖作废章" width="520px" destroy-on-close>
    <template v-if="currentHard">
      <p style="font-size:13px;margin:0 0 12px;line-height:1.7;">
        受控号 <b>{{ currentHard.copyNo }}</b><br/>
        文件 {{ currentHard.docNo }} · {{ currentHard.title || '' }} · 版本 {{ currentHard.version }}<br/>
        实物回收：{{ currentHard.recycledBy || '-' }} · {{ currentHard.recycledAt || '-' }}
      </p>
      <el-alert type="info" :closable="false" show-icon style="margin-bottom:12px;"
        title="第二步：在已实物回收的纸质份上盖作废章留存。盖章后非文控不可再预览/下载/打印该版本。"></el-alert>
      <div class="form-item full">
        <label>盖章备注（可选）</label>
        <el-input v-model="recycleForm.remark" type="textarea" :rows="2" placeholder="如：已盖作废章并拍照归档"></el-input>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
        <el-button @click="voidStampVisible=false">取消</el-button>
        <el-button type="warning" @click="finishVoidStamp">确认盖作废章</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 复审：维持有效 → 选择顺延月数 -->
  <el-dialog v-model="keepReviewVisible" title="维持有效 · 顺延复审" width="440px" destroy-on-close>
    <p style="font-size:13px;margin:0 0 12px;line-height:1.6;" v-if="keepReviewRow">
      {{ keepReviewRow.docNo }} · {{ keepReviewRow.title }}<br/>
      当前到期日：{{ keepReviewRow.dueDate || "-" }}
    </p>
    <el-form label-position="top">
      <el-form-item label="顺延月数（月）">
        <el-input-number v-model="keepReviewMonths" :min="1" :max="60" />
      </el-form-item>
    </el-form>
    <div style="display:flex;justify-content:flex-end;gap:8px;">
      <el-button @click="keepReviewVisible=false">取消</el-button>
      <el-button type="primary" @click="confirmKeepReview">确认顺延并维持有效</el-button>
    </div>
  </el-dialog>
  </div>
</template>
