<script>
/**
 * 复审任务：到期先到部门负责人；维持有效须选顺延月数并更新到期日。
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "ReviewsView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
  <div class="page-card">
    <div class="section-title"><span>复审任务</span></div>
    <el-alert
      type="info"
      show-icon
      :closable="false"
      style="margin-bottom: 12px"
      title="文件到期复审进入本部门负责人任务。维持有效须选择顺延月数，系统自动更新复审到期日；亦可发起修订或作废。与「待我审批」不同。"
    />
    <el-empty v-if="!roleReviews.length" description="当前角色暂无复审任务" :image-size="64" />
    <el-table v-if="roleReviews.length" :data="pageSlice(roleReviews, 'reviews')" size="small" stripe border>
      <el-table-column label="文件ID" width="68">
        <template #default="{ row }">{{ fileIdOf(row) }}</template>
      </el-table-column>
      <el-table-column label="文件编号" width="150">
        <template #default="{ row }">{{ row.docNo || "-" }}</template>
      </el-table-column>
      <el-table-column label="文件名称" min-width="160">
        <template #default="{ row }"
          >{{ row.title || "-" }}<span v-if="isSecret(row)" class="sec-mi" title="机密">密</span></template
        >
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }"
          ><span class="tag" :class="statusTag(row.status).cls">{{ statusTag(row.status).text }}</span></template
        >
      </el-table-column>
      <el-table-column label="到期日" width="110">
        <template #default="{ row }">{{ row.dueDate || "-" }}</template>
      </el-table-column>
      <el-table-column label="责任人" width="100">
        <template #default="{ row }">{{ row.assignee || "-" }}</template>
      </el-table-column>
      <el-table-column label="结论" width="90">
        <template #default="{ row }">{{ row.conclusion || "-" }}</template>
      </el-table-column>
      <el-table-column label="备注" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">{{ row.note || "-" }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right" align="center" class-name="ops-col" label-class-name="ops-col">
        <template #default="{ row }">
          <div class="ops-cell">
            <template v-if="row.status !== 'DONE'">
              <button class="link-btn" @click="openKeepReview(row)">维持有效</button>
              <button class="link-btn" @click="startRevise(row)">发起修订</button>
              <button class="link-btn danger" @click="startObsolete(row)">作废</button>
            </template>
            <span v-else style="color: #909399; font-size: 12px">已完成</span>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <div class="list-pager" v-if="roleReviews.length">
      <el-pagination
        v-model:current-page="listPage.reviews"
        :page-size="PAGE_SIZE"
        :total="roleReviews.length"
        layout="total, prev, pager, next"
        background
        small
      />
    </div>
  </div>
</template>
