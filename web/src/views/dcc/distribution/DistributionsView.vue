<script>
/**
 * DCC 页面视图：状态与方法来自 App provide 的 dcc 上下文（composables/dccApp.js）。
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "DistributionsView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
        <div class="page-card">
          <div class="toolbar">
            <div class="left" style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;">
              <el-button v-if="canDistribute" type="primary" @click="openDistForm()">新建分发</el-button>
              <el-alert v-else type="warning" show-icon :closable="false" style="flex:1;margin:0;"
                title="普通员工无法分发文件。文控可向任何人分发；本部门负责人仅可向本部门员工分发。" />
              <span v-if="canDistribute" style="font-size:13px;color:#5c6b7a;line-height:1.4;">
                {{ isDocController ? '文控仅可向各部门负责人分发现行有效文件；' : '负责人仅可向本部门员工二次分发；' }}
                对象须在「待我签收」确认后进入「我的受控文件」。
              </span>
            </div>
          </div>
          <el-alert type="info" show-icon :closable="false" style="margin-bottom:12px;"
            :title="isDocController ? '文控可查看全部分发单。' : '负责人仅看本人发出的分发单，以及与本人受控文件关联的分发。'" />
          <el-table :data="pageSlice(roleDistributions,'distributions')" size="small" stripe border>
            <el-table-column label="分发单号" width="150"><template #default="{ row }">{{ row.distNo || '-' }}</template></el-table-column>
            <el-table-column label="文件ID" width="68"><template #default="{ row }">{{ fileIdOf(row) }}</template></el-table-column>
            <el-table-column label="文件编号" width="150"><template #default="{ row }">{{ row.docNo || '-' }}</template></el-table-column>
            <el-table-column label="文件名称" min-width="160"><template #default="{ row }">{{ row.title || '-' }}<span v-if="isSecret(row)" class="sec-mi" title="机密">密</span></template></el-table-column>
            <el-table-column label="文件级别" width="150"><template #default="{ row }">{{ levelName(row.fileLevel) }}</template></el-table-column>
            <el-table-column label="业务领域" min-width="160"><template #default="{ row }">{{ ptName(row.productType) }}</template></el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }"><span class="tag" :class="statusTag(row.status).cls">{{ statusTag(row.status).text }}</span></template>
            </el-table-column>
            <el-table-column label="发送时间" width="150"><template #default="{ row }">{{ row.sentAt || '-' }}</template></el-table-column>
            <el-table-column label="版本" width="70"><template #default="{ row }">{{ row.version || '-' }}</template></el-table-column>
            <el-table-column label="签收进度" width="90"><template #default="{ row }">{{ row.received || '-' }}</template></el-table-column>
            <el-table-column label="操作" width="90" fixed="right" align="center" class-name="ops-col" label-class-name="ops-col">
              <template #default="{ row }">
                <div class="ops-cell">
                <button class="link-btn" @click="openDistDetail(row)">明细</button>
                <button class="link-btn" @click="urgeDist(row)">催办</button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <div class="list-pager">
            <el-pagination v-model:current-page="listPage.distributions" :page-size="PAGE_SIZE" :total="roleDistributions.length" layout="total, prev, pager, next" background small></el-pagination>
          </div>
        </div>
</template>
