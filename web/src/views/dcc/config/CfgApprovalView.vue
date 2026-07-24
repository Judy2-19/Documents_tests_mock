<script>
/**
 * DCC 页面视图：状态与方法来自 App provide 的 dcc 上下文（composables/dccApp.js）。
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "CfgApprovalView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
        <div class="page-card">
          <el-alert type="info" show-icon :closable="false" style="margin-bottom:12px;"
            title="配置：维护各业务类型的审批节点顺序（如 部门负责人 → 文控员终审）。公司暂无质量批准模块，勿增加质量批准节点。"></el-alert>
          <el-table :data="data.approvalTemplates" size="small" stripe border>
            <el-table-column label="模板编码" width="160"><template #default="{ row }">{{ row.code || '-' }}</template></el-table-column>
            <el-table-column label="名称" width="120"><template #default="{ row }">{{ row.name || '-' }}</template></el-table-column>
            <el-table-column label="审批节点" min-width="280"><template #default="{ row }">{{ row.nodes || '-' }}</template></el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <button class="link-btn" @click="openTplConfig(row)">配置节点</button>
              </template>
            </el-table-column>
          </el-table>
        </div>
</template>
