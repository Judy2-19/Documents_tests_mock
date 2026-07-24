<script>
/**
 * DCC 页面视图：状态与方法来自 App provide 的 dcc 上下文（composables/dccApp.js）。
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "CfgCategoryView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
        <div class="page-card">
          <el-alert
            :type="isDocController ? 'info' : 'warning'"
            show-icon
            :closable="false"
            style="margin-bottom:12px;"
            :title="isDocController
              ? '文件分类由文控维护：可新增分类，编码建议大写英文字母/下划线，保存后立即出现在台账与申请下拉中。'
              : '仅文控员可新增分类。当前角色为「' + data.user.role + '」，您只能查看。请在顶栏切换为「文控员」后再操作。'"
          ></el-alert>
          <div class="toolbar">
            <div class="left">
              <el-button type="primary" :disabled="!isDocController" @click="openCategoryForm">新增分类</el-button>
            </div>
            <div class="right" style="color:#909399;font-size:12px;">共 {{ data.categories.length }} 个分类</div>
          </div>
          <el-table :data="data.categories" size="small" stripe border>
            <el-table-column label="编码" width="110"><template #default="{ row }">{{ row.code || '-' }}</template></el-table-column>
            <el-table-column label="名称" min-width="160"><template #default="{ row }">{{ row.name || '-' }}</template></el-table-column>
            <el-table-column label="默认复审(月)" width="120"><template #default="{ row }">{{ row.reviewMonths || '-' }}</template></el-table-column>
            <el-table-column label="默认可下载" width="110">
              <template #default="{ row }">{{ row.allowDownload ? '是' : '否' }}</template>
            </el-table-column>
            <el-table-column label="备注" min-width="140" show-overflow-tooltip>
              <template #default="{ row }">{{ row.remark || '-' }}</template>
            </el-table-column>
          </el-table>
        </div>
</template>
