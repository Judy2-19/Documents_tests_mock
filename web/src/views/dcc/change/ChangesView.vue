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
          <el-alert type="info" show-icon :closable="false" style="margin-bottom:12px;"
            :title="isDocController ? '文控可查看全部变更单。' : '仅显示与您「我的受控文件」中文件相关的变更单。'" />
          <el-table :data="pageSlice(roleChanges,'changes')" size="small" stripe border>
            <el-table-column label="变更单号" width="150"><template #default="{ row }">{{ row.changeNo || '-' }}</template></el-table-column>
            <el-table-column label="文件ID" width="68"><template #default="{ row }">{{ fileIdOf(row) }}</template></el-table-column>
            <el-table-column label="文件编号" width="150"><template #default="{ row }">{{ row.docNo || '-' }}</template></el-table-column>
            <el-table-column label="文件名称" min-width="160"><template #default="{ row }">{{ row.title || '-' }}<span v-if="isSecret(row)" class="sec-mi" title="机密">密</span></template></el-table-column>
            <el-table-column label="所属部门" min-width="140" show-overflow-tooltip>
              <template #default="{ row }">{{ ownerDeptOf(row) }}</template>
            </el-table-column>
            <el-table-column label="文件级别" width="150"><template #default="{ row }">{{ levelName(row.fileLevel || docMeta(row).fileLevel) }}</template></el-table-column>
            <el-table-column label="业务领域" width="110"><template #default="{ row }">{{ ptName(row.productType) }}</template></el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }"><span class="tag" :class="statusTag(row.status).cls">{{ statusTag(row.status).text }}</span></template>
            </el-table-column>
            <el-table-column label="生效日" width="110"><template #default="{ row }">{{ row.effectiveDate || '-' }}</template></el-table-column>
            <el-table-column label="版本" width="110">
              <template #default="{ row }">{{ (row.fromVer || '-') + ' → ' + (row.toVer || '-') }}</template>
            </el-table-column>
            <el-table-column label="纸质回收" width="90"><template #default="{ row }">{{ row.recycleProgress || '-' }}</template></el-table-column>
            <el-table-column label="操作" width="80" fixed="right" align="center" class-name="ops-col" label-class-name="ops-col">
              <template #default>
                <div class="ops-cell"><button class="link-btn" @click="navigate('hardCopies')">回收进度</button></div>
              </template>
            </el-table-column>
          </el-table>
          <div class="list-pager">
            <el-pagination v-model:current-page="listPage.changes" :page-size="PAGE_SIZE" :total="roleChanges.length" layout="total, prev, pager, next" background small></el-pagination>
          </div>
        </div>
</template>
