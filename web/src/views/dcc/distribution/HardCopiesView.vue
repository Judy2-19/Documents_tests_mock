<script>
/**
 * DCC 页面视图：状态与方法来自 App provide 的 dcc 上下文（composables/dccApp.js）。
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "HardCopiesView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
        <div class="page-card">
          <div class="toolbar">
            <div class="left">
              <el-button type="primary" @click="controlledPrint()">受控打印登记</el-button>
              <el-tag type="danger" effect="plain">待回收 {{ hardRecycleCount }} 份</el-tag>
            </div>
            <div class="right" style="color:#909399;font-size:12px;">筛选后 {{ filteredHardCopies.length }} 条 · 在用仅查看；待回收→实物回收→盖废章</div>
          </div>
          <div class="filter-row">
            <div class="filter-item">
              <label>文件ID</label>
              <el-input v-model="hardCopyFilters.fileId" placeholder="纯数字流水" clearable style="width:100px" />
            </div>
            <div class="filter-item">
              <label>文件编号</label>
              <el-input v-model="hardCopyFilters.docNo" placeholder="如 MG-SOP-2026" clearable style="width:180px" />
            </div>
            <div class="filter-item">
              <label>文件名称</label>
              <el-input v-model="hardCopyFilters.title" placeholder="名称关键词" clearable style="width:180px" />
            </div>
            <div class="filter-item">
              <label>状态</label>
              <el-select v-model="hardCopyFilters.status" clearable placeholder="全部" style="width:130px">
                <el-option v-for="o in hardCopyStatusOptions" :key="o.value" :label="o.label" :value="o.value"></el-option>
              </el-select>
            </div>
            <el-button type="primary" @click="toast('已按条件刷新（实时过滤）')">搜索</el-button>
            <el-button @click="resetHardCopyFilters">重置</el-button>
          </div>
          <el-alert type="info" show-icon :closable="false" style="margin-bottom:12px;"
            title="①「在用」不可回收。②「待回收」点「回收」办理实物回收。③「已回收」后再点「盖废章」。文控或曾签收/持有人可操作；已回收/盖废后非文控不可再预览下载打印。" />
          <el-table :data="pageSlice(filteredHardCopies,'hardCopies')" size="small" stripe border>
            <el-table-column label="纸质受控号" width="180"><template #default="{ row }">{{ row.copyNo || '-' }}</template></el-table-column>
            <el-table-column label="文件ID" width="68"><template #default="{ row }">{{ fileIdOf(row) }}</template></el-table-column>
            <el-table-column label="文件编号" width="150"><template #default="{ row }">{{ row.docNo || '-' }}</template></el-table-column>
            <el-table-column label="文件名称" min-width="150"><template #default="{ row }">{{ row.title || '-' }}<span v-if="isSecret(row)" class="sec-mi" title="机密">密</span></template></el-table-column>
            <el-table-column label="状态" width="110">
              <template #default="{ row }"><span class="tag" :class="statusTag(row.status).cls">{{ statusTag(row.status).text }}</span></template>
            </el-table-column>
            <el-table-column label="打印日期" width="110"><template #default="{ row }">{{ row.printedAt || '-' }}</template></el-table-column>
            <el-table-column label="版本" width="70"><template #default="{ row }">{{ row.version || '-' }}</template></el-table-column>
            <el-table-column label="持有人/组" width="110"><template #default="{ row }">{{ row.holder || '-' }}</template></el-table-column>
            <el-table-column label="存放位置" min-width="120"><template #default="{ row }">{{ row.location || '-' }}</template></el-table-column>
            <el-table-column label="操作" width="160" fixed="right" align="center" class-name="ops-col" label-class-name="ops-col">
              <template #default="{ row }">
                <div class="ops-cell">
                  <button class="link-btn" @click="openHardDetail(row)">详情</button>
                  <button
                    v-if="row.status==='RECYCLE_PENDING' && canRecycleHardCopy(row)"
                    class="link-btn danger"
                    @click="openRecycle(row)"
                  >回收</button>
                  <button
                    v-else-if="row.status==='RECYCLED' && canVoidStampHardCopy(row)"
                    class="link-btn"
                    @click="openVoidStamp(row)"
                  >盖废章</button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <div class="list-pager">
            <el-pagination v-model:current-page="listPage.hardCopies" :page-size="PAGE_SIZE" :total="filteredHardCopies.length" layout="total, prev, pager, next" background small></el-pagination>
          </div>
        </div>
</template>
