<script>
/**
 * 台账查询 · 记录：变更 / 分发领用 / 借阅外发 / 访问日志 合一，按类型切换。
 * 非文控仅显示「我的受控文件」曾经有过的文件相关记录。
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "RecordsView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
  <div class="page-card">
    <div class="section-title">
      <span>记录</span>
    </div>
    <el-alert
      type="info"
      show-icon
      :closable="false"
      style="margin-bottom: 12px"
      :title="isDocController
        ? '只读查询：变更、分发/领用、借阅/外发、访问日志。文控可查看全部。'
        : '只读查询：仅显示您「我的受控文件」中曾经有过的文件相关记录。'"
    />
    <div class="filter-row" style="margin-bottom: 14px">
      <div class="filter-item">
        <label>记录类型</label>
        <el-select v-model="recordType" style="width: 220px" @change="onRecordTypeChange">
          <el-option v-for="o in recordTypeOptions" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
      </div>
    </div>

    <template v-if="recordType === 'changes'">
      <el-table :data="pageSlice(roleRecordChanges, 'changes')" size="small" stripe border>
        <el-table-column label="变更单号" width="150"><template #default="{ row }">{{ row.changeNo || "-" }}</template></el-table-column>
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
        <el-table-column label="生效日" width="110"><template #default="{ row }">{{ row.effectiveDate || "-" }}</template></el-table-column>
        <el-table-column label="版本" width="110">
          <template #default="{ row }">{{ (row.fromVer || "-") + " → " + (row.toVer || "-") }}</template>
        </el-table-column>
        <el-table-column label="纸质回收" width="90"><template #default="{ row }">{{ row.recycleProgress || "-" }}</template></el-table-column>
      </el-table>
      <div class="list-pager">
        <el-pagination v-model:current-page="listPage.changes" :page-size="PAGE_SIZE" :total="roleRecordChanges.length" layout="total, prev, pager, next" background small />
      </div>
    </template>

    <template v-else-if="recordType === 'dist'">
      <div class="section-title" style="margin-top: 0"><span>分发记录</span></div>
      <el-table :data="pageSlice(roleRecordDists, 'distributions')" size="small" stripe border>
        <el-table-column label="分发单号" width="150"><template #default="{ row }">{{ row.distNo || "-" }}</template></el-table-column>
        <el-table-column label="文件ID" width="68"><template #default="{ row }">{{ fileIdOf(row) }}</template></el-table-column>
        <el-table-column label="文件编号" width="150"><template #default="{ row }">{{ row.docNo || "-" }}</template></el-table-column>
        <el-table-column label="文件名称" min-width="160">
          <template #default="{ row }">{{ row.title || "-" }}<span v-if="isSecret(row)" class="sec-mi" title="机密">密</span></template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><span class="tag" :class="statusTag(row.status).cls">{{ statusTag(row.status).text }}</span></template>
        </el-table-column>
        <el-table-column label="发送时间" width="150"><template #default="{ row }">{{ row.sentAt || "-" }}</template></el-table-column>
        <el-table-column label="版本" width="70"><template #default="{ row }">{{ row.version || "-" }}</template></el-table-column>
        <el-table-column label="签收进度" width="90"><template #default="{ row }">{{ row.received || "-" }}</template></el-table-column>
      </el-table>
      <div class="list-pager">
        <el-pagination v-model:current-page="listPage.distributions" :page-size="PAGE_SIZE" :total="roleRecordDists.length" layout="total, prev, pager, next" background small />
      </div>

      <div class="section-title" style="margin-top: 24px"><span>领用 / 纸质受控记录</span></div>
      <el-table :data="pageSlice(roleRecordHardCopies, 'hardCopies')" size="small" stripe border>
        <el-table-column label="纸质受控号" width="180"><template #default="{ row }">{{ row.copyNo || "-" }}</template></el-table-column>
        <el-table-column label="文件ID" width="68"><template #default="{ row }">{{ fileIdOf(row) }}</template></el-table-column>
        <el-table-column label="文件编号" width="150"><template #default="{ row }">{{ row.docNo || "-" }}</template></el-table-column>
        <el-table-column label="文件名称" min-width="150">
          <template #default="{ row }">{{ row.title || "-" }}<span v-if="isSecret(row)" class="sec-mi" title="机密">密</span></template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }"><span class="tag" :class="statusTag(row.status).cls">{{ statusTag(row.status).text }}</span></template>
        </el-table-column>
        <el-table-column label="打印日期" width="110"><template #default="{ row }">{{ row.printedAt || "-" }}</template></el-table-column>
        <el-table-column label="版本" width="70"><template #default="{ row }">{{ row.version || "-" }}</template></el-table-column>
        <el-table-column label="持有人/组" width="110"><template #default="{ row }">{{ row.holder || "-" }}</template></el-table-column>
      </el-table>
      <div class="list-pager">
        <el-pagination v-model:current-page="listPage.hardCopies" :page-size="PAGE_SIZE" :total="roleRecordHardCopies.length" layout="total, prev, pager, next" background small />
      </div>
    </template>

    <template v-else-if="recordType === 'borrow'">
      <div class="section-title" style="margin-top: 0"><span>借阅记录</span></div>
      <el-table :data="pageSlice(roleRecordBorrows, 'borrows')" size="small" stripe border>
        <el-table-column label="借阅单号" width="150"><template #default="{ row }">{{ row.borrowNo || "-" }}</template></el-table-column>
        <el-table-column label="文件ID" width="68"><template #default="{ row }">{{ fileIdOf(row) }}</template></el-table-column>
        <el-table-column label="文件编号" width="150"><template #default="{ row }">{{ row.docNo || "-" }}</template></el-table-column>
        <el-table-column label="文件名称" min-width="150">
          <template #default="{ row }">{{ row.title || "-" }}<span v-if="isSecret(row)" class="sec-mi" title="机密">密</span></template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }"><span class="tag" :class="statusTag(row.status).cls">{{ statusTag(row.status).text }}</span></template>
        </el-table-column>
        <el-table-column label="应还日期" width="110"><template #default="{ row }">{{ row.expectReturn || "-" }}</template></el-table-column>
        <el-table-column label="申请人" width="80"><template #default="{ row }">{{ row.applicant || "-" }}</template></el-table-column>
        <el-table-column label="事由" min-width="140"><template #default="{ row }">{{ row.reason || "-" }}</template></el-table-column>
      </el-table>
      <div class="list-pager">
        <el-pagination v-model:current-page="listPage.borrows" :page-size="PAGE_SIZE" :total="roleRecordBorrows.length" layout="total, prev, pager, next" background small />
      </div>

      <div class="section-title" style="margin-top: 24px"><span>外发记录</span></div>
      <el-table :data="pageSlice(roleRecordExternals, 'externals')" size="small" stripe border>
        <el-table-column label="外发单号" width="150"><template #default="{ row }">{{ row.releaseNo || "-" }}</template></el-table-column>
        <el-table-column label="文件ID" width="68"><template #default="{ row }">{{ fileIdOf(row) }}</template></el-table-column>
        <el-table-column label="文件编号" width="150"><template #default="{ row }">{{ row.docNo || "-" }}</template></el-table-column>
        <el-table-column label="文件名称" min-width="140">
          <template #default="{ row }">{{ row.title || "-" }}<span v-if="isSecret(row)" class="sec-mi" title="机密">密</span></template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><span class="tag" :class="statusTag(row.status).cls">{{ statusTag(row.status).text }}</span></template>
        </el-table-column>
        <el-table-column label="有效期至" width="110"><template #default="{ row }">{{ row.expireDate || "-" }}</template></el-table-column>
        <el-table-column label="接收单位" min-width="160"><template #default="{ row }">{{ row.receiver || "-" }}</template></el-table-column>
        <el-table-column label="申请人" width="80"><template #default="{ row }">{{ row.applicant || "-" }}</template></el-table-column>
      </el-table>
      <div class="list-pager">
        <el-pagination v-model:current-page="listPage.externals" :page-size="PAGE_SIZE" :total="roleRecordExternals.length" layout="total, prev, pager, next" background small />
      </div>
    </template>

    <template v-else>
      <div class="toolbar" style="margin-bottom: 10px">
        <div class="left"><el-button @click="exportAccessLog">导出 Excel</el-button></div>
      </div>
      <el-table :data="pageSlice(roleRecordAccessLogs, 'accessLogs')" size="small" stripe border>
        <el-table-column label="时间" width="150"><template #default="{ row }">{{ row.time || "-" }}</template></el-table-column>
        <el-table-column label="用户" width="100"><template #default="{ row }">{{ row.user || "-" }}</template></el-table-column>
        <el-table-column label="文件ID" width="68"><template #default="{ row }">{{ fileIdOf(row) }}</template></el-table-column>
        <el-table-column label="文件编号" width="150"><template #default="{ row }">{{ row.docNo || "-" }}</template></el-table-column>
        <el-table-column label="动作" width="100">
          <template #default="{ row }"><span class="tag" :class="statusTag(row.action).cls">{{ statusTag(row.action).text }}</span></template>
        </el-table-column>
        <el-table-column label="版本" width="70"><template #default="{ row }">{{ row.version || "-" }}</template></el-table-column>
        <el-table-column label="IP" width="130"><template #default="{ row }">{{ row.ip || "-" }}</template></el-table-column>
      </el-table>
      <div class="list-pager">
        <el-pagination v-model:current-page="listPage.accessLogs" :page-size="PAGE_SIZE" :total="roleRecordAccessLogs.length" layout="total, prev, pager, next" background small />
      </div>
    </template>
  </div>
</template>
