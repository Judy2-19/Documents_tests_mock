<script>
/**
 * DCC 页面视图：状态与方法来自 App provide 的 dcc 上下文（composables/dccApp.js）。
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "TrainingsView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
        <div class="page-card">
          <el-alert type="success" show-icon :closable="false" style="margin-bottom:12px;"
            title="文件生效后按岗位培训矩阵自动下发任务；完成后生成培训证明（可纳入合规导出包）。" />
          <el-alert type="info" show-icon :closable="false" style="margin-bottom:12px;"
            :title="'当前受训人：' + data.user.name + '（切换角色后列表同步）'"></el-alert>
          <el-empty v-if="!roleTrainings.length" description="当前角色暂无培训待办" :image-size="64"></el-empty>
          <el-table v-if="roleTrainings.length" :data="pageSlice(roleTrainings,'trainings')" size="small" stripe border>
            <el-table-column label="任务号" width="140"><template #default="{ row }">{{ row.taskNo || '-' }}</template></el-table-column>
            <el-table-column label="文件ID" width="68"><template #default="{ row }">{{ fileIdOf(row) }}</template></el-table-column>
            <el-table-column label="文件编号" width="150"><template #default="{ row }">{{ row.docNo || '-' }}</template></el-table-column>
            <el-table-column label="文件名称" min-width="150"><template #default="{ row }">{{ row.title || '-' }}<span v-if="isSecret(row)" class="sec-mi" title="机密">密</span></template></el-table-column>
            <el-table-column label="文件级别" width="150"><template #default="{ row }">{{ levelName(row.fileLevel) }}</template></el-table-column>
            <el-table-column label="业务领域" min-width="160"><template #default="{ row }">{{ ptName(row.productType) }}</template></el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }"><span class="tag" :class="statusTag(row.status).cls">{{ statusTag(row.status).text }}</span></template>
            </el-table-column>
            <el-table-column label="截止日期" width="110"><template #default="{ row }">{{ row.dueDate || '-' }}</template></el-table-column>
            <el-table-column label="版本" width="70"><template #default="{ row }">{{ row.version || '-' }}</template></el-table-column>
            <el-table-column label="受训人" width="80"><template #default="{ row }">{{ row.assignee || '-' }}</template></el-table-column>
            <el-table-column label="岗位" width="110"><template #default="{ row }">{{ row.post || '-' }}</template></el-table-column>
            <el-table-column label="说明" min-width="120"><template #default="{ row }">{{ row.note || '-' }}</template></el-table-column>
            <el-table-column label="操作" width="120" fixed="right" align="center" class-name="ops-col" label-class-name="ops-col">
              <template #default="{ row }">
                <div class="ops-cell">
                  <button v-if="row.status!=='DONE'" class="link-btn" @click="completeTraining(row)">完成并出证明</button>
                  <button v-else class="link-btn" @click="downloadTrainingCert(row)">下载证明</button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <div class="list-pager">
            <el-pagination v-model:current-page="listPage.trainings" :page-size="PAGE_SIZE" :total="roleTrainings.length" layout="total, prev, pager, next" background small></el-pagination>
          </div>
        </div>
</template>
