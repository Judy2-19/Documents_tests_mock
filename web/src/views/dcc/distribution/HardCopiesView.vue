<script>
/**
 * DCC 页面视图：状态与方法来自 App provide 的 dcc 上下文（composables/dccApp.js）。
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "HardCopiesView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
        <div class="page-card">
          <div class="toolbar">
            <div class="left">
              <el-button type="primary" @click="controlledPrint()">受控打印登记</el-button>
              <el-tag type="danger" effect="plain">待回收 {{ hardRecycleCount }} 份</el-tag>
            </div>
            <div class="right" style="color:#909399;font-size:12px;">详情可查看；仅曾签收过对应文件的人员可点击回收</div>
          </div>
          <el-alert type="info" show-icon :closable="false" style="margin-bottom:12px;"
            title="纸质回收仅对「我的受控文件」中已签收过该文件的人员开放；未签收人员仅可查看详情。" />
          <el-table :data="pageSlice(data.hardCopies,'hardCopies')" size="small" stripe border>
            <el-table-column label="纸质受控号" width="180"><template #default="{ row }">{{ row.copyNo || '-' }}</template></el-table-column>
            <el-table-column label="文件ID" width="68"><template #default="{ row }">{{ fileIdOf(row) }}</template></el-table-column>
            <el-table-column label="文件编号" width="150"><template #default="{ row }">{{ row.docNo || '-' }}</template></el-table-column>
            <el-table-column label="文件名称" min-width="150"><template #default="{ row }">{{ row.title || '-' }}<span v-if="isSecret(row)" class="sec-mi" title="机密">密</span></template></el-table-column>
            <el-table-column label="状态" width="110">
              <template #default="{ row }"><span class="tag" :class="statusTag(row.status).cls">{{ statusTag(row.status).text }}</span></template>
            </el-table-column>
            <el-table-column label="打印日期" width="110"><template #default="{ row }">{{ row.printedAt || '-' }}</template></el-table-column>
            <el-table-column label="版本" width="70"><template #default="{ row }">{{ row.version || '-' }}</template></el-table-column>
            <el-table-column label="持有人/组" width="110"><template #default="{ row }">{{ row.holder || '-' }}</template></el-table-column>
            <el-table-column label="存放位置" min-width="120"><template #default="{ row }">{{ row.location || '-' }}</template></el-table-column>
            <el-table-column label="操作" width="110" fixed="right" align="center" class-name="ops-col" label-class-name="ops-col">
              <template #default="{ row }">
                <div class="ops-cell">
                  <button class="link-btn" @click="openHardDetail(row)">详情</button>
                  <button
                    v-if="(row.status==='RECYCLE_PENDING' || row.status==='IN_USE') && canRecycleHardCopy(row)"
                    class="link-btn danger"
                    @click="openRecycle(row)"
                  >回收</button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <div class="list-pager">
            <el-pagination v-model:current-page="listPage.hardCopies" :page-size="PAGE_SIZE" :total="data.hardCopies.length" layout="total, prev, pager, next" background small></el-pagination>
          </div>
        </div>
</template>
