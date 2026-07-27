<script>
/**
 * DCC 页面视图：状态与方法来自 App provide 的 dcc 上下文（composables/dccApp.js）。
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "TodoApproveView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
        <div class="page-card">
          <div class="section-title"><span>待我审批（DCC 内置简易审批）</span></div>
          <el-alert type="info" show-icon :closable="false" style="margin-bottom:12px;"
            title="处理新建/修订/作废/外发等审批流（非到期复审）。提交流程：本页待办 →「去处理」签名通过 → 终审后待办消失并回写「申请」列表状态。入口：左侧「申请与审批 → 待我审批」。到期复审请到「复审任务」。"></el-alert>
          <el-empty v-if="!roleTodos.length" description="当前角色暂无待办审批"></el-empty>
          <el-table v-if="roleTodos.length" :data="pageSlice(roleTodos,'todos')" size="small" stripe border style="width:100%">
            <el-table-column label="文件ID" width="68"><template #default="{ row }">{{ fileIdOf(row) }}</template></el-table-column>
            <el-table-column label="文件编号" width="160"><template #default="{ row }">{{ row.docNo }}</template></el-table-column>
            <el-table-column label="文件名称" min-width="180"><template #default="{ row }">{{ row.title || '-' }}<span v-if="isSecret(row)" class="sec-mi" title="机密">密</span></template></el-table-column>
            <el-table-column label="申请类型" width="110" align="center">
              <template #default="{ row }">
                <span class="tag" :class="todoBizTag(row).cls">{{ todoBizTag(row).text }}</span>
              </template>
            </el-table-column>
            <el-table-column label="文件级别" width="150"><template #default="{ row }">{{ levelName(row.fileLevel) }}</template></el-table-column>
            <el-table-column label="业务领域" width="110"><template #default="{ row }">{{ ptName(row.productType) }}</template></el-table-column>
            <el-table-column label="提交人 / 部门" width="160"><template #default="{ row }">{{ row.applicant }}</template></el-table-column>
            <el-table-column label="当前环节" width="130"><template #default="{ row }">{{ row.node }}</template></el-table-column>
            <el-table-column label="提交时间" width="150"><template #default="{ row }">{{ row.time }}</template></el-table-column>
            <el-table-column label="操作" width="80" fixed="right" align="center" class-name="ops-col" label-class-name="ops-col">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="openApprove(row)">去处理</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="list-pager" v-if="roleTodos.length">
            <el-pagination v-model:current-page="listPage.todos" :page-size="PAGE_SIZE" :total="roleTodos.length" layout="total, prev, pager, next" background small></el-pagination>
          </div>
        </div>
</template>
