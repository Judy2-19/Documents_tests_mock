<script>
/**
 * DCC 页面视图：状态与方法来自 App provide 的 dcc 上下文（composables/dccApp.js）。
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "AccessAppliesView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
        <div class="page-card">
          <el-alert type="warning" show-icon :closable="false" style="margin-bottom:12px;"
            title="常态只读：非本部门或机密文件的打印/下载须二次申请；审批通过后限时使用并留痕。" />
          <div class="toolbar">
            <div class="left" style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;">
              <el-button type="primary" @click="openAccessApply('PRINT')">新建打印申请</el-button>
              <el-button @click="openAccessApply('DOWNLOAD')">新建下载申请</el-button>
              <span style="font-size:13px;color:#5c6b7a;line-height:1.4;">
                审批去向：申请人所属部门负责人初审 → 文控备案（「申请与审批 → 待我审批」）。
              </span>
            </div>
          </div>
          <el-alert type="info" show-icon :closable="false" style="margin-bottom:12px;"
            title="顶栏可切换「××部负责人」完成初审，再切「文控员」做备案。文控看全部申请；员工仅看本人提交的。"></el-alert>
          <el-empty v-if="!roleAccessApplies.length" description="当前角色暂无打印/下载申请" :image-size="64"></el-empty>
          <el-table v-if="roleAccessApplies.length" :data="pageSlice(roleAccessApplies,'accessApplies')" size="small" stripe border>
            <el-table-column label="申请单号" width="150"><template #default="{ row }">{{ row.applyNo || '-' }}</template></el-table-column>
            <el-table-column label="动作" width="80">
              <template #default="{ row }"><span class="tag" :class="statusTag(row.action).cls">{{ statusTag(row.action).text }}</span></template>
            </el-table-column>
            <el-table-column label="文件ID" width="68"><template #default="{ row }">{{ fileIdOf(row) }}</template></el-table-column>
            <el-table-column label="文件编号" width="150"><template #default="{ row }">{{ row.docNo || '-' }}</template></el-table-column>
            <el-table-column label="文件名称" min-width="150"><template #default="{ row }">{{ row.title || '-' }}<span v-if="isSecret(row)" class="sec-mi" title="机密">密</span></template></el-table-column>
            <el-table-column label="所属部门" min-width="140" show-overflow-tooltip>
              <template #default="{ row }">{{ ownerDeptOf(row) }}</template>
            </el-table-column>
            <el-table-column label="文件级别" width="150"><template #default="{ row }">{{ levelName(row.fileLevel || docMeta(row).fileLevel) }}</template></el-table-column>
            <el-table-column label="业务领域" width="110"><template #default="{ row }">{{ ptName(row.productType) }}</template></el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }"><span class="tag" :class="statusTag(row.status).cls">{{ statusTag(row.status).text }}</span></template>
            </el-table-column>
            <el-table-column label="提交时间" width="140"><template #default="{ row }">{{ row.submittedAt || '-' }}</template></el-table-column>
            <el-table-column label="申请人" width="80"><template #default="{ row }">{{ row.applicant || '-' }}</template></el-table-column>
            <el-table-column label="用途" min-width="140"><template #default="{ row }">{{ row.reason || '-' }}</template></el-table-column>
          </el-table>
          <div class="list-pager">
            <el-pagination v-model:current-page="listPage.accessApplies" :page-size="PAGE_SIZE" :total="roleAccessApplies.length" layout="total, prev, pager, next" background small></el-pagination>
          </div>
        </div>
</template>
