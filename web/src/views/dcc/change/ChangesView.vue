<script>
/**
 * DCC 页面视图：状态与方法来自 App provide 的 dcc 上下文（composables/dccApp.js）。
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "ChangesView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
        <div class="page-card">
          <div class="section-title"><span>变更单</span></div>
          <div class="filter-row">
            <div class="filter-item">
              <label>文件ID</label>
              <el-input v-model="changeFilters.fileId" placeholder="纯数字流水" clearable style="width:100px" />
            </div>
            <div class="filter-item">
              <label>文件编号</label>
              <el-input v-model="changeFilters.docNo" placeholder="如 MG-SOP-2026" clearable style="width:180px" />
            </div>
            <div class="filter-item">
              <label>文件名称</label>
              <el-input v-model="changeFilters.title" placeholder="名称关键词" clearable style="width:180px" />
            </div>
            <div class="filter-item">
              <label>变更类型</label>
              <el-select v-model="changeFilters.changeType" clearable placeholder="全部" style="width:120px">
                <el-option v-for="o in changeKindOptions" :key="o.value" :label="o.label" :value="o.value"></el-option>
              </el-select>
            </div>
            <el-button type="primary" @click="toast('已按条件刷新（实时过滤）')">搜索</el-button>
            <el-button @click="resetChangeFilters">重置</el-button>
          </div>
          <el-alert type="info" show-icon :closable="false" style="margin-bottom:12px;"
            :title="isDocController ? '变更类型仅含换版/过期/废弃（新建不算变更）。文控可查看全部变更单。' : '变更类型仅含换版/过期/废弃。仅显示与您「我的受控文件」中文件相关的变更单。'" />
          <el-table :data="pageSlice(filteredChanges,'changes')" size="small" stripe border>
            <el-table-column label="变更单号" width="150"><template #default="{ row }">{{ row.changeNo || '-' }}</template></el-table-column>
            <el-table-column label="文件ID" width="68"><template #default="{ row }">{{ fileIdOf(row) }}</template></el-table-column>
            <el-table-column label="文件编号" width="150"><template #default="{ row }">{{ row.docNo || '-' }}</template></el-table-column>
            <el-table-column label="文件名称" min-width="160"><template #default="{ row }">{{ row.title || '-' }}<span v-if="isSecret(row)" class="sec-mi" title="机密">密</span></template></el-table-column>
            <el-table-column label="变更类型" width="90" align="center">
              <template #default="{ row }">
                <span class="tag" :class="changeTypeTag(row).cls">{{ changeTypeTag(row).text }}</span>
              </template>
            </el-table-column>
            <el-table-column label="变更内容" min-width="220" show-overflow-tooltip>
              <template #default="{ row }">{{ changeSummaryOf(row) }}</template>
            </el-table-column>
            <el-table-column label="所属部门" min-width="140" show-overflow-tooltip>
              <template #default="{ row }">{{ ownerDeptOf(row) }}</template>
            </el-table-column>
            <el-table-column label="文件级别" width="150"><template #default="{ row }">{{ levelName(row.fileLevel || docMeta(row).fileLevel) }}</template></el-table-column>
            <el-table-column label="业务领域" width="110"><template #default="{ row }">{{ ptName(row.productType) }}</template></el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }"><span class="tag" :class="statusTag(row.status).cls">{{ statusTag(row.status).text }}</span></template>
            </el-table-column>
            <el-table-column label="生效日" width="110"><template #default="{ row }">{{ row.effectiveDate || '-' }}</template></el-table-column>
            <el-table-column label="旧版→新版" width="120">
              <template #default="{ row }">{{ (row.fromVer || row.version || '-') + ' → ' + (row.toVer || '-') }}</template>
            </el-table-column>
            <el-table-column label="纸质回收" width="90"><template #default="{ row }">{{ row.recycleProgress || '-' }}</template></el-table-column>
            <el-table-column label="操作" width="80" fixed="right" align="center" class-name="ops-col" label-class-name="ops-col">
              <template #default>
                <div class="ops-cell"><button class="link-btn" @click="navigate('hardCopies')">回收进度</button></div>
              </template>
            </el-table-column>
          </el-table>
          <div class="list-pager">
            <el-pagination v-model:current-page="listPage.changes" :page-size="PAGE_SIZE" :total="filteredChanges.length" layout="total, prev, pager, next" background small></el-pagination>
          </div>
        </div>
</template>
