<script>
/**
 * DCC 页面视图：状态与方法来自 App provide 的 dcc 上下文（composables/dccApp.js）。
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "CfgTrainingView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
        <div class="page-card">
          <div class="section-title"><span>岗位-文件培训矩阵</span></div>
          <el-table :data="data.trainingMatrix" size="small" border stripe>
            <el-table-column label="分类" width="80"><template #default="{ row }">{{ row.category || '-' }}</template></el-table-column>
            <el-table-column label="文件级别" width="150">
              <template #default="{ row }">{{ levelName(row.fileLevel) }}</template>
            </el-table-column>
            <el-table-column label="业务领域" min-width="160">
              <template #default="{ row }">{{ ptName(row.productType) }}</template>
            </el-table-column>
            <el-table-column label="岗位" min-width="140"><template #default="{ row }">{{ row.post || '-' }}</template></el-table-column>
            <el-table-column label="到期天数" width="100"><template #default="{ row }">{{ row.dueDays || '-' }}</template></el-table-column>
            <el-table-column label="强制" width="80">
              <template #default="{ row }">{{ row.mustTrain ? '是' : '否' }}</template>
            </el-table-column>
          </el-table>
        </div>
</template>
