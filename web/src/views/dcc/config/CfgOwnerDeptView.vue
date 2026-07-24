<script>
/**
 * DCC 页面视图：状态与方法来自 App provide 的 dcc 上下文（composables/dccApp.js）。
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "CfgOwnerDeptView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
  <div class="page-card">
    <div class="section-title"><span>文件所属部门</span></div>
    <el-alert
      :type="isDocController ? 'info' : 'warning'"
      show-icon
      :closable="false"
      style="margin-bottom: 12px"
      :title="
        isDocController
          ? '文件所属部门由文控维护：可新增、修改。一文件可属多部门（英文逗号分隔）；用户部门命中任一且非密即可直下直打，机密仍须申请。'
          : '仅文控员可新增/修改文件所属部门。当前角色为「' + data.user.role + '」，您只能查看。其他部门一律无改配资格。'
      "
    />
    <div class="toolbar">
      <div class="left">
        <el-button type="primary" :disabled="!isDocController" @click="openOwnerDeptForm()">新增所属部门</el-button>
      </div>
      <div class="right" style="color: #909399; font-size: 12px">共 {{ data.ownerDepts.length }} 个</div>
    </div>
    <el-table :data="data.ownerDepts" size="small" border stripe style="width: 100%; margin-bottom: 16px">
      <el-table-column label="编码" width="100"><template #default="{ row }">{{ row.code }}</template></el-table-column>
      <el-table-column label="部门名称" min-width="160"><template #default="{ row }">{{ row.name }}</template></el-table-column>
      <el-table-column label="文件数" width="100">
        <template #default="{ row }">{{ countDocsByOwnerDept(row.name) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="72" fixed="right" align="center" class-name="ops-col" label-class-name="ops-col">
        <template #default="{ row }">
          <div class="ops-cell">
            <button class="link-btn" :disabled="!isDocController" :class="{ disabled: !isDocController }" @click="openOwnerDeptForm(row)">修改</button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <div class="section-title"><span>各部门文件清单</span></div>
    <el-table :data="ownerDeptFileRows" size="small" border stripe style="width: 100%">
      <el-table-column label="所属部门" min-width="160"><template #default="{ row }">{{ deptNames(row.ownerDept) }}</template></el-table-column>
      <el-table-column label="文件ID" width="68"><template #default="{ row }">{{ fileIdOf(row) }}</template></el-table-column>
      <el-table-column label="文件编号" width="160"><template #default="{ row }">{{ row.docNo }}</template></el-table-column>
      <el-table-column label="文件名称" min-width="180">
        <template #default="{ row }">{{ row.title || "-" }}<span v-if="isSecret(row)" class="sec-mi" title="机密">密</span></template>
      </el-table-column>
      <el-table-column label="文件级别" width="150"><template #default="{ row }">{{ row.fileLevelName }}</template></el-table-column>
      <el-table-column label="业务领域" min-width="160"><template #default="{ row }">{{ row.productTypeName }}</template></el-table-column>
      <el-table-column label="密级" width="80">
        <template #default="{ row }"><span class="tag" :class="statusTag(row.security).cls">{{ statusTag(row.security).text }}</span></template>
      </el-table-column>
      <el-table-column label="操作" width="72" fixed="right" align="center" class-name="ops-col" label-class-name="ops-col">
        <template #default="{ row }">
          <div class="ops-cell"><button class="link-btn" @click="openDocByNo(row.docNo)">详情</button></div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
