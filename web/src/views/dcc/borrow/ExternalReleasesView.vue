<script>

/**

 * DCC 页面视图：状态与方法来自 App provide 的 dcc 上下文（composables/dccApp.js）。

 */

import { defineComponent } from "vue";

import { useDccPage } from "../useDccPage.js";



export default defineComponent({

  name: "ExternalReleasesView",

  setup() {

    return useDccPage();

  },

});

</script>



<template>

        <div class="page-card">

          <div class="toolbar">

            <div class="left">

              <el-button v-if="canCreateExternal" type="primary" @click="openExternalForm">新建外发</el-button>

              <span v-else style="color:#909399;font-size:13px;">仅文控或部门负责人可新建外发</span>

            </div>

          </div>

          <el-alert type="warning" show-icon :closable="false" style="margin-bottom:12px;"

            title="外发默认禁止下载，仅水印预览链接；审批通过后生成访问令牌与专用水印包，可复制链接发给外部人员；到期/撤销令牌失效。" />

          <el-alert type="info" show-icon :closable="false" style="margin-bottom:12px;"

            :title="isDocController ? '文控可查看全部外发申请。' : (String(data.user.roleCode||'').indexOf('DCC_LEADER_')===0 ? '负责人可看本部门人员及本人的外发申请。' : '普通员工仅能看本人提交的外发申请。')" />

          <el-table :data="pageSlice(roleExternals,'externals')" size="small" stripe border>

            <el-table-column label="外发单号" width="150"><template #default="{ row }">{{ row.releaseNo || '-' }}</template></el-table-column>

            <el-table-column label="文件ID" width="68"><template #default="{ row }">{{ fileIdOf(row) }}</template></el-table-column>

            <el-table-column label="文件编号" width="150"><template #default="{ row }">{{ row.docNo || '-' }}</template></el-table-column>

            <el-table-column label="文件名称" min-width="150"><template #default="{ row }">{{ row.title || '-' }}<span v-if="isSecret(row)" class="sec-mi" title="机密">密</span></template></el-table-column>

            <el-table-column label="文件级别" width="150"><template #default="{ row }">{{ levelName(row.fileLevel) }}</template></el-table-column>

            <el-table-column label="业务领域" min-width="160"><template #default="{ row }">{{ ptName(row.productType) }}</template></el-table-column>

            <el-table-column label="状态" width="100">

              <template #default="{ row }"><span class="tag" :class="statusTag(row.status).cls">{{ statusTag(row.status).text }}</span></template>

            </el-table-column>

            <el-table-column label="有效期至" width="110"><template #default="{ row }">{{ row.expireDate || '-' }}</template></el-table-column>

            <el-table-column label="访问令牌" width="130" show-overflow-tooltip>

              <template #default="{ row }">{{ row.accessToken || '-' }}</template>

            </el-table-column>

            <el-table-column label="接收单位" min-width="140"><template #default="{ row }">{{ row.receiver || '-' }}</template></el-table-column>

            <el-table-column label="申请人" width="80"><template #default="{ row }">{{ row.applicant || '-' }}</template></el-table-column>

            <el-table-column label="操作" width="220" fixed="right" align="center" class-name="ops-col" label-class-name="ops-col">

              <template #default="{ row }">

                <div class="ops-cell">

                  <button class="link-btn" @click="openPreview(row,'EXTERNAL')">预览</button>

                  <button

                    v-if="row.status==='APPROVED' && row.tokenActive!==false"

                    class="link-btn"

                    @click="copyExternalLink(row)"

                  >复制链接</button>

                  <button

                    v-if="row.status==='APPROVED' && row.tokenActive!==false"

                    class="link-btn"

                    @click="downloadExternalWatermarkPack(row)"

                  >水印包</button>

                  <button

                    v-if="row.status==='IN_APPROVAL' && isDocController"

                    class="link-btn"

                    @click="openApprove({bizType:'EXTERNAL', releaseId:row.id, docNo:row.docNo, title:row.title, productType:row.productType, applicant:row.applicant+' / 外发', node:'文控审核（外发）', time:row.expireDate || '-'})"

                  >审批</button>

                  <button

                    v-else-if="row.status==='APPROVED' && (isDocController || row.applicant===data.user.name)"

                    class="link-btn"

                    @click="revokeExternal(row)"

                  >撤销</button>

                  <span v-else-if="row.status==='REVOKED' || row.status==='EXPIRED'" style="color:#909399;font-size:12px;">已失效</span>

                </div>

              </template>

            </el-table-column>

          </el-table>

          <div class="list-pager">

            <el-pagination v-model:current-page="listPage.externals" :page-size="PAGE_SIZE" :total="roleExternals.length" layout="total, prev, pager, next" background small></el-pagination>

          </div>

        </div>

</template>


