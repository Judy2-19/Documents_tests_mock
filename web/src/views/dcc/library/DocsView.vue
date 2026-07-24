<script>
/**
 * DCC 页面视图：状态与方法来自 App provide 的 dcc 上下文（composables/dccApp.js）。
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "DocsView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
        <div class="page-card">
          <el-alert
            :type="route === 'reportDocs' ? 'success' : 'info'"
            show-icon
            :closable="false"
            style="margin-bottom:12px;"
            :title="route === 'reportDocs'
              ? (isDocController
                ? '综合查询（只读）：文控可见全库（含待生效）。'
                : '综合查询（只读）：可查看台账；预览/下载/打印仅限本部门非密。已签收文件请到「我的受控文件」操作（完整权限）。')
              : (isDocController
                ? '受控文件台账：含待生效/现行有效等。审批通过后为「待生效」，到达生效日后方可分发给各部门负责人；负责人再二次分发给部门人员。'
                : '受控文件台账全员可查。台账侧仅可预览/下载/打印本部门非密文件；已签收到「我的受控文件」的文件可完整预览/下载/打印（含机密）。待生效仅文控可见。')"
          ></el-alert>
          <div class="filter-row">
            <div class="filter-item">
              <label>文件ID</label>
              <el-input v-model="filters.fileId" placeholder="纯数字流水" clearable style="width:90px" />
            </div>
            <div class="filter-item">
              <label>文件编号</label>
              <el-input v-model="filters.docNo" placeholder="如 MG-SOP-2026" clearable style="width:180px" />
            </div>
            <div class="filter-item">
              <label>文件名称</label>
              <el-input v-model="filters.keyword" placeholder="文件名称/责任人/全文" clearable style="width:200px" />
            </div>
            <div class="filter-item">
              <label>文件级别</label>
              <el-select v-model="filters.fileLevel" clearable placeholder="全部" style="width:150px">
                <el-option v-for="p in data.fileLevels" :key="p.code" :label="p.name" :value="p.code"></el-option>
              </el-select>
            </div>
            <div class="filter-item">
              <label>业务领域</label>
              <el-select v-model="filters.productType" clearable placeholder="全部" style="width:150px">
                <el-option v-for="p in data.productTypes" :key="p.code" :label="p.name" :value="p.code"></el-option>
              </el-select>
            </div>
            <div class="filter-item">
              <label>所属部门</label>
              <el-select v-model="filters.ownerDept" clearable placeholder="全部" style="width:120px">
                <el-option v-for="d in data.ownerDepts" :key="d.code" :label="d.name" :value="d.name"></el-option>
              </el-select>
            </div>
            <div class="filter-item">
              <label>分类</label>
              <el-select v-model="filters.category" clearable placeholder="全部" style="width:130px">
                <el-option v-for="c in data.categories" :key="c.code" :label="c.code + ' ' + c.name" :value="c.code"></el-option>
              </el-select>
            </div>
            <div class="filter-item">
              <label>状态</label>
              <el-select v-model="filters.status" clearable placeholder="全部" style="width:120px">
                <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value"></el-option>
              </el-select>
            </div>
            <div class="filter-item">
              <label>密级</label>
              <el-select v-model="filters.security" clearable placeholder="请选择" style="width:120px">
                <el-option v-for="o in securityOptions" :key="o.value" :label="o.label" :value="o.value"></el-option>
              </el-select>
            </div>
            <div class="filter-item">
              <label>数据域</label>
              <el-select v-model="filters.accessDomain" clearable placeholder="请选择" style="width:120px">
                <el-option v-for="o in domainOptions" :key="o.value" :label="o.label" :value="o.value"></el-option>
              </el-select>
            </div>
            <div class="filter-item">
              <label>搜正文</label>
              <el-switch v-model="filters.fullText" />
            </div>
            <el-button type="primary" @click="toast('已按条件刷新（实时过滤）')">搜索</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </div>
          <div class="toolbar">
            <div class="left">
              <el-button v-if="route === 'docs'" type="primary" @click="navigate('applies', { openApply: 'CREATE' })">新建申请</el-button>
              <el-button @click="exportDocsExcel">导出 Excel</el-button>
            </div>
            <div class="right" style="color:#909399;font-size:12px;">可见 {{ filteredDocs.length }} 条 · 域 {{ statusTag(currentRole.domain).text }} · {{ route === 'reportDocs' ? '只读查询' : '业务台账' }}</div>
          </div>
          <el-table :data="pageSlice(filteredDocs,'docs')" size="small" stripe border style="width:100%">
            <el-table-column label="文件ID" width="68"><template #default="{ row }">{{ fileIdOf(row) }}</template></el-table-column>
            <el-table-column label="文件编号" width="170">
              <template #default="{ row }">{{ row.docNo || '-' }}</template>
            </el-table-column>
            <el-table-column label="文件名称" min-width="140">
              <template #default="{ row }">{{ row.title || '-' }}<span v-if="isSecret(row)" class="sec-mi" title="机密">密</span></template>
            </el-table-column>
            <el-table-column label="文件级别" width="150">
              <template #default="{ row }"><span class="tag" :class="statusTag(row.fileLevel).cls">{{ levelName(row.fileLevel) }}</span></template>
            </el-table-column>
            <el-table-column label="业务领域" min-width="160">
              <template #default="{ row }">{{ ptName(row.productType) }}</template>
            </el-table-column>
            <el-table-column label="所属部门" min-width="160">
              <template #default="{ row }">{{ deptNames(row.ownerDept || row.dept) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }"><span class="tag" :class="statusTag(row.status).cls">{{ statusTag(row.status).text }}</span></template>
            </el-table-column>
            <el-table-column label="域" width="80">
              <template #default="{ row }"><span class="tag" :class="statusTag(row.accessDomain).cls">{{ statusTag(row.accessDomain).text }}</span></template>
            </el-table-column>
            <el-table-column label="分类" width="70">
              <template #default="{ row }">{{ row.category || '-' }}</template>
            </el-table-column>
            <el-table-column label="版本" width="100">
              <template #default="{ row }">{{ displayVersion(row) }}</template>
            </el-table-column>
            <el-table-column label="生效日期" width="110">
              <template #default="{ row }">{{ row.effectiveDate || '-' }}</template>
            </el-table-column>
            <el-table-column label="责任人" width="80">
              <template #default="{ row }">{{ row.owner || '-' }}</template>
            </el-table-column>
            <el-table-column label="操作" :width="route === 'reportDocs' ? 110 : 220" fixed="right" align="center" class-name="ops-col" label-class-name="ops-col">
              <template #default="{ row }">
                <div class="ops-cell">
                  <button class="link-btn" @click="openDoc(row)">详情</button>
                  <button class="link-btn" @click="openPreview(row)">预览</button>
                  <template v-if="route === 'docs'">
                    <button v-if="isWebEditable(row)" class="link-btn" @click="openFormEdit(row)">编辑表单</button>
                    <button class="link-btn" @click="mockDownload(row)">下载</button>
                    <button class="link-btn" @click="controlledPrint(row)">打印</button>
                  </template>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <div class="list-pager">
            <el-pagination v-model:current-page="listPage.docs" :page-size="DOCS_PAGE_SIZE" :total="filteredDocs.length" layout="total, prev, pager, next" background small></el-pagination>
          </div>
        </div>
</template>
