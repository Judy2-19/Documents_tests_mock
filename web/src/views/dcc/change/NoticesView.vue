<script>
/**
 * DCC 页面视图：状态与方法来自 App provide 的 dcc 上下文（composables/dccApp.js）。
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "NoticesView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
        <div class="page-card">
          <div class="section-title"><span>变更通知</span></div>
          <div class="filter-row">
            <div class="filter-item">
              <label>文件ID</label>
              <el-input v-model="noticeFilters.fileId" placeholder="纯数字流水" clearable style="width:100px" />
            </div>
            <div class="filter-item">
              <label>文件编号</label>
              <el-input v-model="noticeFilters.docNo" placeholder="如 MG-SOP-2026" clearable style="width:180px" />
            </div>
            <div class="filter-item">
              <label>文件名称</label>
              <el-input v-model="noticeFilters.title" placeholder="名称关键词" clearable style="width:180px" />
            </div>
            <div class="filter-item">
              <label>变更类型</label>
              <el-select v-model="noticeFilters.changeType" clearable placeholder="全部" style="width:120px">
                <el-option v-for="o in changeKindOptions" :key="o.value" :label="o.label" :value="o.value"></el-option>
              </el-select>
            </div>
            <el-button type="primary" @click="toast('已按条件刷新（实时过滤）')">搜索</el-button>
            <el-button @click="resetNoticeFilters">重置</el-button>
          </div>
          <el-alert type="info" show-icon :closable="false" style="margin-bottom:12px;"
            :title="isDocController ? '变更类型仅含换版/过期/废弃（新建不算变更）。催办将通知「我的受控文件」中持有该文件的全部人员。文控可查看全部变更通知。' : '变更类型仅含换版/过期/废弃。催办将通知持有该文件的全部受控人员。仅显示与您「我的受控文件」相关的变更通知。'" />
          <el-table :data="pageSlice(filteredNotices,'notices')" size="small" stripe border>
            <el-table-column label="通知单号" width="150"><template #default="{ row }">{{ row.noticeNo || '-' }}</template></el-table-column>
            <el-table-column label="文件ID" width="68"><template #default="{ row }">{{ fileIdOf(row) }}</template></el-table-column>
            <el-table-column label="文件编号" width="150"><template #default="{ row }">{{ row.docNo || '-' }}</template></el-table-column>
            <el-table-column label="变更类型" width="90" align="center">
              <template #default="{ row }">
                <span class="tag" :class="noticeTypeTag(row).cls">{{ noticeTypeTag(row).text }}</span>
              </template>
            </el-table-column>
            <el-table-column label="旧版" width="70" align="center">
              <template #default="{ row }">{{ row.fromVer || row.version || '-' }}</template>
            </el-table-column>
            <el-table-column label="新版" width="70" align="center">
              <template #default="{ row }">{{ row.toVer || '-' }}</template>
            </el-table-column>
            <el-table-column label="标题" min-width="240"><template #default="{ row }">{{ row.title || '-' }}</template></el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }"><span class="tag" :class="statusTag(row.status).cls">{{ statusTag(row.status).text }}</span></template>
            </el-table-column>
            <el-table-column label="发送时间" width="150"><template #default="{ row }">{{ row.sentAt || '-' }}</template></el-table-column>
            <el-table-column label="已读" width="100">
              <template #default="{ row }">{{ noticeReadText(row) }}</template>
            </el-table-column>
            <el-table-column label="催办" width="90">
              <template #default="{ row }">{{ row.urgeCount ? (row.urgeCount + ' 次') : '-' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <button class="link-btn" @click="urgeNotice(row)">催办</button>
              </template>
            </el-table-column>
          </el-table>
          <div class="list-pager">
            <el-pagination v-model:current-page="listPage.notices" :page-size="PAGE_SIZE" :total="filteredNotices.length" layout="total, prev, pager, next" background small></el-pagination>
          </div>
        </div>
</template>
