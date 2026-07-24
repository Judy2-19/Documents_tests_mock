<script>
/**
 * 申请：新建/修订/作废入口 + 我的申请列表（统一申请页）
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "AppliesView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
  <div class="page-card">
    <div class="section-title"><span>申请</span></div>
    <el-alert
      type="info"
      show-icon
      :closable="false"
      style="margin-bottom: 12px"
      :title="'发起新建 / 修订 / 作废：文控直接办理；负责人提交后仅文控审；员工须负责人一审再文控二审。下方仅显示「' + data.user.name + '」的申请。'"
    />
    <div class="toolbar">
      <div class="left" style="display: flex; flex-wrap: wrap; gap: 8px">
        <el-button type="primary" @click="openApply('CREATE')">新建申请</el-button>
        <el-button @click="openApply('REVISE')">修订申请</el-button>
        <el-button @click="openApply('OBSOLETE')">作废申请</el-button>
      </div>
    </div>

    <div class="section-title" style="margin-top: 8px"><span>我的申请</span></div>
    <el-empty v-if="!roleMyApplies.length" description="当前角色暂无我的申请" :image-size="64" />
    <el-table v-if="roleMyApplies.length" :data="pageSlice(roleMyApplies, 'applies')" size="small" stripe border>
      <el-table-column label="申请单号" width="150"><template #default="{ row }">{{ row.applyNo || "-" }}</template></el-table-column>
      <el-table-column label="类型" width="80">
        <template #default="{ row }"><span class="tag" :class="statusTag(row.type).cls">{{ statusTag(row.type).text }}</span></template>
      </el-table-column>
      <el-table-column label="文件ID" width="68"><template #default="{ row }">{{ fileIdOf(row) }}</template></el-table-column>
      <el-table-column label="文件编号" width="150"><template #default="{ row }">{{ row.docNo || "-" }}</template></el-table-column>
      <el-table-column label="文件名称" min-width="160">
        <template #default="{ row }">{{ row.title || "-" }}<span v-if="isSecret(row)" class="sec-mi" title="机密">密</span></template>
      </el-table-column>
      <el-table-column label="文件级别" width="150"><template #default="{ row }">{{ levelName(row.fileLevel) }}</template></el-table-column>
      <el-table-column label="业务领域" min-width="160"><template #default="{ row }">{{ ptName(row.productType) }}</template></el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }"><span class="tag" :class="statusTag(row.status).cls">{{ statusTag(row.status).text }}</span></template>
      </el-table-column>
      <el-table-column label="目标版本" width="90"><template #default="{ row }">{{ row.targetVersion || "-" }}</template></el-table-column>
      <el-table-column label="申请人" width="80"><template #default="{ row }">{{ row.applicant || "-" }}</template></el-table-column>
      <el-table-column label="提交时间" width="150"><template #default="{ row }">{{ row.submittedAt || "-" }}</template></el-table-column>
      <el-table-column label="操作" width="72" fixed="right" align="center" class-name="ops-col" label-class-name="ops-col">
        <template #default="{ row }">
          <div class="ops-cell">
            <button class="link-btn" @click="openApplyDetail(row)">详情</button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <div class="list-pager" v-if="roleMyApplies.length">
      <el-pagination
        v-model:current-page="listPage.applies"
        :page-size="PAGE_SIZE"
        :total="roleMyApplies.length"
        layout="total, prev, pager, next"
        background
        small
      />
    </div>
  </div>
</template>
