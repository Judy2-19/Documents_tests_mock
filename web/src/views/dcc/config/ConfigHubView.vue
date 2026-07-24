<script>
/**
 * 基础配置：页内选择配置类型（分类 / 业务领域 / 部门 / 编号 / 审批 / 水印）
 */
import { computed, defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";
import CfgCategoryView from "./CfgCategoryView.vue";
import CfgProductView from "./CfgProductView.vue";
import CfgOwnerDeptView from "./CfgOwnerDeptView.vue";
import CfgNumberView from "./CfgNumberView.vue";
import CfgApprovalView from "./CfgApprovalView.vue";
import CfgWatermarkView from "./CfgWatermarkView.vue";

const CFG_MAP = {
  category: CfgCategoryView,
  product: CfgProductView,
  ownerDept: CfgOwnerDeptView,
  number: CfgNumberView,
  approval: CfgApprovalView,
  watermark: CfgWatermarkView,
};

export default defineComponent({
  name: "ConfigHubView",
  components: {
    CfgCategoryView,
    CfgProductView,
    CfgOwnerDeptView,
    CfgNumberView,
    CfgApprovalView,
    CfgWatermarkView,
  },
  setup() {
    const dcc = useDccPage();
    const cfgComponent = computed(() => CFG_MAP[dcc.cfgType.value] || CfgCategoryView);
    return { ...dcc, cfgComponent };
  },
});
</script>

<template>
  <div>
    <div class="page-card" style="margin-bottom: 12px">
      <div class="section-title"><span>基础配置</span></div>
      <el-alert
        :type="isDocController ? 'info' : 'warning'"
        show-icon
        :closable="false"
        style="margin-bottom: 12px"
        :title="
          isDocController
            ? '在此选择配置项：文件分类、业务领域、文件所属部门、编号规则、审批流程模板、水印策略。业务领域 / 所属部门 / 水印等由文控增改。'
            : '您可查看基础配置，但业务领域、文件所属部门、水印策略等仅文控员可新增或修改，其他部门一律无改配资格。'
        "
      />
      <div class="filter-row">
        <div class="filter-item">
          <label>配置类型</label>
          <el-select v-model="cfgType" style="width: 220px" @change="onCfgTypeChange">
            <el-option v-for="o in cfgTypeOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </div>
      </div>
    </div>
    <component :is="cfgComponent" />
  </div>
</template>
