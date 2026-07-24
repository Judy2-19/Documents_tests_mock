<script>
/**
 * DCC 页面视图：状态与方法来自 App provide 的 dcc 上下文（composables/dccApp.js）。
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "CfgWatermarkView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
  <div class="page-card" style="max-width: 760px">
    <div class="section-title"><span>水印策略（全局强制）</span></div>
    <el-alert
      :type="isDocController ? 'error' : 'warning'"
      show-icon
      :closable="false"
      style="margin-bottom: 12px"
      :title="
        isDocController
          ? '下载 / 打印水印全局强制开启，不可关闭。文控可单独开关「预览加水印」，并调整模板与透明度。另叠红色阶段水印：初级文件 / 审批完成 / 已分发 / 修订 / 失效 / 借阅 / 外发；机密另加正中斜对角「机密文件」。'
          : '仅文控员可修改水印策略（含预览是否加水印）。当前角色为「' + data.user.role + '」，您只能查看与预览效果。其他部门一律无改配资格。'
      "
    />
    <el-form label-width="120px" :disabled="!isDocController">
      <el-form-item label="水印模板">
        <el-input v-model="data.watermark.template" />
      </el-form-item>
      <el-form-item label="预览加水印">
        <el-switch v-model="data.watermark.preview" />
      </el-form-item>
      <el-form-item label="下载加水印">
        <el-switch v-model="data.watermark.download" disabled />
      </el-form-item>
      <el-form-item label="打印加水印">
        <el-switch v-model="data.watermark.print" disabled />
      </el-form-item>
      <el-form-item label="透明度">
        <el-slider v-model="data.watermark.opacity" :min="0.05" :max="0.4" :step="0.01" style="width: 280px" />
      </el-form-item>
    </el-form>
    <el-form label-width="120px">
      <el-form-item label="阶段预览">
        <div style="display: flex; flex-wrap: wrap; gap: 8px">
          <el-button size="small" @click="openPreview({ docNo: 'MG-WI-2026-0022', title: '访客入室安全须知', version: '1.0', status: 'DRAFT', security: 'INTERNAL' }, 'CREATE')">初级文件</el-button>
          <el-button
            size="small"
            @click="
              openPreview(
                data.documents.find(function (d) {
                  return d.status === 'EFFECTIVE' && !(data.distributions || []).some(function (x) {
                    return x.docNo === d.docNo;
                  });
                }) || { docNo: 'MG-QM-2025-0003', title: '内部审核控制程序', version: '1.0', status: 'EFFECTIVE', security: 'INTERNAL' }
              )
            "
            >审批完成</el-button
          >
          <el-button size="small" @click="openPreview(data.documents[0])">已分发</el-button>
          <el-button
            size="small"
            @click="
              openPreview(
                data.documents.find(function (d) {
                  return d.status === 'REVISING';
                })
              )
            "
            >修订</el-button
          >
          <el-button
            size="small"
            @click="
              openPreview(
                data.documents.find(function (d) {
                  return d.status === 'OBSOLETE';
                })
              )
            "
            >失效</el-button
          >
          <el-button
            size="small"
            @click="
              openPreview(
                data.documents.find(function (d) {
                  return d.security === 'SECRET';
                })
              )
            "
            >机密</el-button
          >
          <el-button size="small" @click="openPreview(data.borrows[0], 'BORROW')">借阅</el-button>
          <el-button size="small" @click="openPreview(data.externals[0], 'EXTERNAL')">外发</el-button>
        </div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :disabled="!isDocController" @click="saveWatermark">保存</el-button>
        <el-button @click="openPreview(data.documents[0])">预览效果</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
