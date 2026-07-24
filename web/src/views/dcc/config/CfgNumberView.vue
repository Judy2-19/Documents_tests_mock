<script>
/**
 * DCC 页面视图：状态与方法来自 App provide 的 dcc 上下文（composables/dccApp.js）。
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "CfgNumberView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
        <div class="page-card">
          <el-table :data="data.numberRules" size="small" stripe border>
            <el-table-column label="规则名称" width="140"><template #default="{ row }">{{ row.name || '-' }}</template></el-table-column>
            <el-table-column label="编号模式" min-width="220"><template #default="{ row }">{{ row.pattern || '-' }}</template></el-table-column>
            <el-table-column label="示例" width="180"><template #default="{ row }">{{ row.example || '-' }}</template></el-table-column>
            <el-table-column label="序号重置" width="100"><template #default="{ row }">{{ row.reset || '-' }}</template></el-table-column>
          </el-table>
        </div>
</template>
