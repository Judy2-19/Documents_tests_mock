<script>
/**
 * 我的受控文件（已签收）/ 待我签收（未签收）共用视图，按路由区分。
 */
import { computed, defineComponent, unref } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "MyDocsView",
  setup() {
    const ctx = useDccPage();
    // provide 出来的 route / 列表是 computed，setup 内须 unref，否则永远判不成 receipts
    const isReceipts = computed(() => unref(ctx.route) === "receipts");
    const listRows = computed(() =>
      isReceipts.value ? unref(ctx.rolePendingReceipts) || [] : unref(ctx.roleMyDocs) || []
    );
    const pageKey = computed(() => (isReceipts.value ? "receipts" : "myDocs"));
    return { ...ctx, isReceipts, listRows, pageKey };
  },
});
</script>

<template>
  <div class="page-card">
    <div class="section-title">
      <span>{{ isReceipts ? "待我签收" : "我的受控文件" }}</span>
      <span style="font-size:12px;color:var(--dcc-muted);font-weight:400;">
        {{ data.user.role }} · {{ data.user.name }} · {{ listRows.length }} 份
      </span>
    </div>
    <el-alert
      v-if="isReceipts"
      type="warning"
      show-icon
      :closable="false"
      style="margin-bottom:12px;"
      title="分发到您的文件在此确认签收；系统记录签收人与时间。签收后进入「我的受控文件」，可完整预览/下载/打印（不受本部门非密限制）。"
    />
    <el-alert
      v-else
      type="info"
      show-icon
      :closable="false"
      style="margin-bottom:12px;"
      title="仅显示您已签收的受控文件；本列表内可完整预览/下载/打印（含机密）。受控文件台账全员可查，但台账侧仅限本部门非密操作。"
    />
    <el-empty
      v-if="!listRows.length"
      :description="isReceipts ? '当前无待签收文件' : '暂无已签收的受控文件'"
      :image-size="64"
    />
    <el-table v-if="listRows.length" :data="pageSlice(listRows, pageKey)" size="small" stripe border>
      <el-table-column label="文件ID" width="68">
        <template #default="{ row }">{{ fileIdOf(row) }}</template>
      </el-table-column>
      <el-table-column label="文件编号" width="160">
        <template #default="{ row }">{{ row.docNo || "-" }}</template>
      </el-table-column>
      <el-table-column label="文件名称" min-width="180">
        <template #default="{ row }"
          >{{ row.title || "-" }}<span v-if="isSecret(row)" class="sec-mi" title="机密">密</span></template
        >
      </el-table-column>
      <el-table-column label="版本" width="70">
        <template #default="{ row }">{{ row.version || "-" }}</template>
      </el-table-column>
      <el-table-column label="签收状态" width="100">
        <template #default="{ row }"
          ><span class="tag" :class="statusTag(row.receiptStatus).cls">{{
            statusTag(row.receiptStatus).text
          }}</span></template
        >
      </el-table-column>
      <el-table-column v-if="!isReceipts" label="签收人" width="90">
        <template #default="{ row }">{{ row.receiptBy || data.user.name }}</template>
      </el-table-column>
      <el-table-column v-if="!isReceipts" label="签收时间" width="150">
        <template #default="{ row }">{{ row.receiptAt || "-" }}</template>
      </el-table-column>
      <el-table-column label="分发日期" width="110">
        <template #default="{ row }">{{ row.distDate || "-" }}</template>
      </el-table-column>
      <el-table-column label="操作" width="170" fixed="right" align="center" class-name="ops-col" label-class-name="ops-col">
        <template #default="{ row }">
          <div class="ops-cell">
            <button v-if="isReceipts" class="link-btn" @click="confirmReceipt(row)">确认签收</button>
            <template v-else>
              <button class="link-btn" @click="openPreview(row)">预览</button>
              <button class="link-btn" @click="mockDownload(row)">下载</button>
              <button class="link-btn" @click="controlledPrint(row)">打印</button>
            </template>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <div class="list-pager" v-if="listRows.length">
      <el-pagination
        v-model:current-page="listPage[pageKey]"
        :page-size="PAGE_SIZE"
        :total="listRows.length"
        layout="total, prev, pager, next"
        background
        small
      />
    </div>
  </div>
</template>
