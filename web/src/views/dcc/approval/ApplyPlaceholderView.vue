<script>
/**
 * DCC 页面视图：状态与方法来自 App provide 的 dcc 上下文（composables/dccApp.js）。
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "ApplyPlaceholderView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
        <div class="page-card">
          <el-empty description="正在打开申请表单…">
            <el-button type="primary" @click="openApply(route==='applyCreate'?'CREATE':route==='applyRevise'?'REVISE':'OBSOLETE', createForm.docNo || applySourceDocNo)">重新打开表单</el-button>
          </el-empty>
        </div>
</template>
