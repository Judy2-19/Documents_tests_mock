<script>
/**
 * DCC 页面视图：状态与方法来自 App provide 的 dcc 上下文（composables/dccApp.js）。
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "MyAppliesView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
        <div class="page-card">
          <div class="toolbar">
            <div class="left">
              <el-button type="primary" @click="navigate('applyCreate')">新建申请</el-button>
            </div>
          </div>
          <el-alert
            type="info"
            show-icon
            :closable="false"
            style="margin-bottom:12px;"
            :title="'仅显示当前登录人「' + data.user.name + '」提交的申请；切换顶栏角色后列表同步变化。'"
          ></el-alert>
          <el-empty v-if="!roleMyApplies.length" description="当前角色暂无我的申请" :image-size="64"></el-empty>
          <el-table v-if="roleMyApplies.length" :data="pageSlice(roleMyApplies,'applies')" size="small" stripe border>
            <el-table-column label="申请单号" width="150"><template #default="{ row }">{{ row.applyNo || '-' }}</template></el-table-column>
            <el-table-column label="类型" width="80">
              <template #default="{ row }"><span class="tag" :class="statusTag(row.type).cls">{{ statusTag(row.type).text }}</span></template>
            </el-table-column>
            <el-table-column label="文件ID" width="68"><template #default="{ row }">{{ fileIdOf(row) }}</template></el-table-column>
            <el-table-column label="文件编号" width="150"><template #default="{ row }">{{ row.docNo || '-' }}</template></el-table-column>
            <el-table-column label="文件名称" min-width="160"><template #default="{ row }">{{ row.title || '-' }}<span v-if="isSecret(row)" class="sec-mi" title="机密">密</span></template></el-table-column>
            <el-table-column label="文件级别" width="150"><template #default="{ row }">{{ levelName(row.fileLevel) }}</template></el-table-column>
            <el-table-column label="业务领域" width="110"><template #default="{ row }">{{ ptName(row.productType) }}</template></el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }"><span class="tag" :class="statusTag(row.status).cls">{{ statusTag(row.status).text }}</span></template>
            </el-table-column>
            <el-table-column label="目标版本" width="90"><template #default="{ row }">{{ row.targetVersion || '-' }}</template></el-table-column>
            <el-table-column label="申请人" width="80"><template #default="{ row }">{{ row.applicant || '-' }}</template></el-table-column>
            <el-table-column label="提交时间" width="150"><template #default="{ row }">{{ row.submittedAt || '-' }}</template></el-table-column>
            <el-table-column label="操作" width="72" fixed="right" align="center" class-name="ops-col" label-class-name="ops-col">
              <template #default="{ row }">
                <div class="ops-cell">
                <button class="link-btn" @click="openApplyDetail(row)">详情</button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <div class="list-pager" v-if="roleMyApplies.length">
            <el-pagination v-model:current-page="listPage.applies" :page-size="PAGE_SIZE" :total="roleMyApplies.length" layout="total, prev, pager, next" background small></el-pagination>
          </div>
        </div>
</template>
