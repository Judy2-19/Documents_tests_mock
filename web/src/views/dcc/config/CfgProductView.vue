<script>
/**
 * DCC 页面视图：状态与方法来自 App provide 的 dcc 上下文（composables/dccApp.js）。
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "CfgProductView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
  <div class="page-card">
    <div class="section-title"><span>业务领域（product_type）</span></div>
    <el-alert
      :type="isDocController ? 'info' : 'warning'"
      show-icon
      :closable="false"
      style="margin-bottom: 12px"
      :title="
        isDocController
          ? '业务领域由文控维护：可新增、修改。文件级别为固定 L1/L2/L3（只读）。一文件可挂多个业务领域（英文逗号分隔展示）。'
          : '仅文控员可新增/修改业务领域。当前角色为「' + data.user.role + '」，您只能查看。其他部门一律无改配资格。'
      "
    />
    <div class="toolbar">
      <div class="left">
        <el-button type="primary" :disabled="!isDocController" @click="openProductForm()">新增业务领域</el-button>
      </div>
      <div class="right" style="color: #909399; font-size: 12px">共 {{ data.productTypes.length }} 个</div>
    </div>
    <el-table :data="data.productTypes" size="small" border stripe style="width: 100%; margin-bottom: 16px">
      <el-table-column label="编码" width="140"><template #default="{ row }">{{ row.code }}</template></el-table-column>
      <el-table-column label="业务领域" width="160"><template #default="{ row }">{{ row.name }}</template></el-table-column>
      <el-table-column label="说明" min-width="220"><template #default="{ row }">{{ row.remark || "-" }}</template></el-table-column>
      <el-table-column label="操作" width="72" fixed="right" align="center" class-name="ops-col" label-class-name="ops-col">
        <template #default="{ row }">
          <div class="ops-cell">
            <button class="link-btn" :disabled="!isDocController" :class="{ disabled: !isDocController }" @click="openProductForm(row)">修改</button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="section-title"><span>文件级别（固定枚举，只读）</span></div>
    <el-table :data="data.fileLevels" size="small" border stripe style="width: 100%; margin-bottom: 16px">
      <el-table-column label="级别" width="80"><template #default="{ row }">{{ row.code }}</template></el-table-column>
      <el-table-column label="名称" width="160"><template #default="{ row }">{{ row.name }}</template></el-table-column>
      <el-table-column label="网页可编辑" width="110"><template #default="{ row }">{{ row.editable ? "是" : "否" }}</template></el-table-column>
      <el-table-column label="改正文是否审批" width="140"><template #default="{ row }">{{ row.needApproveContent ? "须审批" : "表单直改免审批（rN）" }}</template></el-table-column>
      <el-table-column label="说明" min-width="220"><template #default="{ row }">{{ row.remark }}</template></el-table-column>
    </el-table>

    <div class="section-title"><span>文件清单（含级别与业务领域）</span></div>
    <el-table :data="productTypeFileRows" size="small" border stripe style="width: 100%">
      <el-table-column label="文件ID" width="68"><template #default="{ row }">{{ fileIdOf(row) }}</template></el-table-column>
      <el-table-column label="文件编号" width="160"><template #default="{ row }">{{ row.docNo }}</template></el-table-column>
      <el-table-column label="文件名称" min-width="180">
        <template #default="{ row }">{{ row.title || "-" }}<span v-if="isSecret(row)" class="sec-mi" title="机密">密</span></template>
      </el-table-column>
      <el-table-column label="文件级别" width="150"><template #default="{ row }">{{ row.fileLevelName }}</template></el-table-column>
      <el-table-column label="业务领域" min-width="160"><template #default="{ row }">{{ row.productTypeName }}</template></el-table-column>
      <el-table-column label="所属部门" min-width="160"><template #default="{ row }">{{ deptNames(row.ownerDept) }}</template></el-table-column>
      <el-table-column label="版本" width="90"><template #default="{ row }">{{ displayVersion(row) }}</template></el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }"><span class="tag" :class="statusTag(row.status).cls">{{ statusTag(row.status).text }}</span></template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right" align="center" class-name="ops-col" label-class-name="ops-col">
        <template #default="{ row }">
          <div class="ops-cell">
            <button class="link-btn" @click="openDocByNo(row.docNo)">详情</button>
            <button v-if="row.webEditable" class="link-btn" @click="openFormEdit(row)">编辑表单</button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
