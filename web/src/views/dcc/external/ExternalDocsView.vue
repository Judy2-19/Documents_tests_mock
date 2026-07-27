<script>
/**
 * DCC 页面视图：状态与方法来自 App provide 的 dcc 上下文（composables/dccApp.js）。
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "ExternalDocsView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
        <div class="page-card">
          <div class="toolbar">
            <div class="left">
              <el-button v-if="canRegisterExtDoc" type="primary" @click="openExtDocForm">登记外来文件</el-button>
              <span v-else style="color:#909399;font-size:13px;">仅文控或部门负责人可登记外来文件</span>
            </div>
          </div>
          <el-table :data="pageSlice(data.externalDocs,'externalDocs')" size="small" stripe border>
            <el-table-column label="文件ID" width="68"><template #default="{ row }">{{ fileIdOf(row) }}</template></el-table-column>
            <el-table-column label="文件编号" width="180"><template #default="{ row }">{{ row.extNo || '-' }}</template></el-table-column>
            <el-table-column label="文件名称" min-width="220">
              <template #default="{ row }">
                {{ row.title || '-' }}
                <span v-if="row.security==='SECRET' || isSecret(row)" class="sec-mi" title="机密">密</span>
              </template>
            </el-table-column>
            <el-table-column label="来源类型" width="90">
              <template #default="{ row }"><span class="tag" :class="statusTag(row.sourceType).cls">{{ statusTag(row.sourceType).text }}</span></template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }"><span class="tag" :class="statusTag(row.status).cls">{{ statusTag(row.status).text }}</span></template>
            </el-table-column>
            <el-table-column label="附件" min-width="140" show-overflow-tooltip>
              <template #default="{ row }">{{ row.fileName || '-' }}</template>
            </el-table-column>
            <el-table-column label="接收日" width="110"><template #default="{ row }">{{ row.receiveDate || '-' }}</template></el-table-column>
            <el-table-column label="失效日" width="110"><template #default="{ row }">{{ row.expireDate || '-' }}</template></el-table-column>
            <el-table-column label="来源单位" min-width="140"><template #default="{ row }">{{ row.sourceOrg || '-' }}</template></el-table-column>
            <el-table-column label="责任人" width="80"><template #default="{ row }">{{ row.owner || '-' }}</template></el-table-column>
            <el-table-column label="操作" width="72" fixed="right" align="center" class-name="ops-col" label-class-name="ops-col">
              <template #default="{ row }">
                <div class="ops-cell">
                <button class="link-btn" @click="openPreview({title:row.title, docNo:row.extNo, version:'-', fileUrl:row.fileUrl})">预览</button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <div class="list-pager">
            <el-pagination v-model:current-page="listPage.externalDocs" :page-size="PAGE_SIZE" :total="data.externalDocs.length" layout="total, prev, pager, next" background small></el-pagination>
          </div>
        </div>
</template>

