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
          <el-alert type="info" show-icon :closable="false" style="margin-bottom:12px;"
            :title="isDocController ? '文控可查看全部变更通知。' : '仅显示与您「我的受控文件」中文件相关的变更通知。'" />
          <el-table :data="pageSlice(roleNotices,'notices')" size="small" stripe border>
            <el-table-column label="通知单号" width="150"><template #default="{ row }">{{ row.noticeNo || '-' }}</template></el-table-column>
            <el-table-column label="标题" min-width="240"><template #default="{ row }">{{ row.title || '-' }}</template></el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }"><span class="tag" :class="statusTag(row.status).cls">{{ statusTag(row.status).text }}</span></template>
            </el-table-column>
            <el-table-column label="发送时间" width="150"><template #default="{ row }">{{ row.sentAt || '-' }}</template></el-table-column>
            <el-table-column label="已读" width="100">
              <template #default="{ row }">{{ (row.total || 0) - (row.unread || 0) }}/{{ row.total || 0 }}</template>
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
            <el-pagination v-model:current-page="listPage.notices" :page-size="PAGE_SIZE" :total="roleNotices.length" layout="total, prev, pager, next" background small></el-pagination>
          </div>
        </div>
</template>
