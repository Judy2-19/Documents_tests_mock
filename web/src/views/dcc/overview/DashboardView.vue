<script>
/**
 * DCC 页面视图：状态与方法来自 App provide 的 dcc 上下文（composables/dccApp.js）。
 */
import { defineComponent } from "vue";
import { useDccPage } from "../useDccPage.js";

export default defineComponent({
  name: "DashboardView",
  setup() {
    return useDccPage();
  },
});
</script>

<template>
        <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);">
          <div class="stat-card primary"><div class="label">现行有效</div><div class="value">{{ roleStats.effective }}</div><div class="hint">可见 {{ roleStats.totalDocs }} 份 · {{ data.user.dept }}</div></div>
          <div class="stat-card"><div class="label">本月新建 / 修订</div><div class="value">{{ roleStats.monthNew }} / {{ roleStats.monthRevise }}</div><div class="hint">近 7 日可见范围</div></div>
          <div class="stat-card danger"><div class="label">待我审批</div><div class="value">{{ roleStats.todoApprove }}</div><div class="hint">含电子签名</div></div>
          <div class="stat-card warn"><div class="label">待签收 / 回收</div><div class="value">{{ roleStats.todoReceipt }} / {{ roleStats.hardRecycle }}</div><div class="hint">分发与纸质</div></div>
          <div class="stat-card warn"><div class="label">超期未复审</div><div class="value">{{ roleStats.reviewOverdue }}</div><div class="hint">复审任务</div></div>
          <div class="stat-card danger"><div class="label">培训待办</div><div class="value">{{ roleStats.todoTrain }}</div><div class="hint">生效联动</div></div>
          <div class="stat-card"><div class="label">打印下载申请</div><div class="value">{{ roleStats.todoAccess }}</div><div class="hint">二次申请中</div></div>
          <div class="stat-card primary"><div class="label">当前数据域</div><div class="value" style="font-size:18px;">{{ statusTag(currentRole.domain).text }}</div><div class="hint">{{ data.user.role }} · 受控 {{ roleMyDocs.length }}</div></div>
        </div>

        <div class="page-card" style="margin-bottom:16px;">
          <div class="section-title">
            <span>变更通知（待阅 {{ roleChangeInboxUnread }}）</span>
            <el-button link type="primary" @click="navigate('notices')">全部通知</el-button>
          </div>
          <el-empty v-if="!roleChangeInbox.length" description="暂无变更通知；催办或换版/废弃后将出现在此" :image-size="48"></el-empty>
          <el-table v-else :data="roleChangeInbox.slice(0, 8)" size="small" stripe class="dash-compact-table" style="width:100%">
            <el-table-column label="类型" width="72" align="center">
              <template #default="{ row }">
                <span class="tag" :class="noticeTypeTag(row).cls">{{ noticeTypeTag(row).text }}</span>
              </template>
            </el-table-column>
            <el-table-column label="文件编号" width="150" show-overflow-tooltip>
              <template #default="{ row }">{{ row.docNo || '-' }}</template>
            </el-table-column>
            <el-table-column label="变更说明" min-width="260" show-overflow-tooltip>
              <template #default="{ row }">
                <span :style="row.read ? '' : 'font-weight:600;'">{{ row.summary || row.title || '-' }}</span>
                <el-tag v-if="row.urged && !row.read" size="small" type="danger" style="margin-left:6px;">催办</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="版本" width="100" align="center">
              <template #default="{ row }">{{ (row.fromVer || row.version || '-') + (row.toVer && row.toVer !== '-' ? ('→' + row.toVer) : '') }}</template>
            </el-table-column>
            <el-table-column label="时间" width="140">
              <template #default="{ row }">{{ row.updatedAt || row.createdAt || '-' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="72" align="center" class-name="ops-col" label-class-name="ops-col">
              <template #default="{ row }">
                <div class="ops-cell">
                  <button v-if="!row.read" class="link-btn" @click="markChangeInboxRead(row)">已阅</button>
                  <span v-else style="color:#909399;font-size:12px;">已读</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="two-col dash-two-col">
          <div class="page-card dash-panel">
            <div class="section-title">
              <span>我的待办审批</span>
              <el-button link type="primary" @click="navigate('todoApprove')">查看全部</el-button>
            </div>
            <el-empty v-if="!roleTodos.length" description="当前角色暂无待办" :image-size="64"></el-empty>
            <el-table v-if="roleTodos.length" :data="roleTodos" size="small" stripe class="dash-compact-table" style="width:100%">
              <el-table-column label="编号" min-width="108" show-overflow-tooltip>
                <template #default="{ row }">{{ row.docNo }}</template>
              </el-table-column>
              <el-table-column label="名称" min-width="96" show-overflow-tooltip>
                <template #default="{ row }">{{ row.title || '-' }}<span v-if="isSecret(row)" class="sec-mi" title="机密">密</span></template>
              </el-table-column>
              <el-table-column label="类型" width="72" align="center">
                <template #default="{ row }">
                  <span class="tag" :class="todoBizTag(row).cls">{{ todoBizTag(row).text }}</span>
                </template>
              </el-table-column>
              <el-table-column label="环节" width="88" show-overflow-tooltip>
                <template #default="{ row }">{{ row.node }}</template>
              </el-table-column>
              <el-table-column label="操作" width="64" align="center" class-name="ops-col" label-class-name="ops-col">
                <template #default="{ row }">
                  <div class="ops-cell"><button class="link-btn" @click="openApprove(row)">处理</button></div>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="page-card dash-panel">
            <div class="section-title">
              <span>近 7 日生效文件（本角色可见）</span>
              <el-button link type="primary" @click="navigate('docs')">打开台账</el-button>
            </div>
            <el-empty v-if="!roleRecentEffective.length" description="当前角色范围内暂无近 7 日生效文件" :image-size="48"></el-empty>
            <el-table v-if="roleRecentEffective.length" :data="roleRecentEffective" size="small" stripe class="dash-compact-table" style="width:100%">
              <el-table-column label="编号" min-width="108" show-overflow-tooltip>
                <template #default="{ row }">{{ row.docNo || '-' }}</template>
              </el-table-column>
              <el-table-column label="名称" min-width="96" show-overflow-tooltip>
                <template #default="{ row }">{{ row.title || '-' }}<span v-if="isSecret(row)" class="sec-mi" title="机密">密</span></template>
              </el-table-column>
              <el-table-column label="生效日" width="92">
                <template #default="{ row }">{{ row.effectiveDate || '-' }}</template>
              </el-table-column>
              <el-table-column label="版本" width="56" align="center">
                <template #default="{ row }">{{ row.version || '-' }}</template>
              </el-table-column>
            </el-table>
            <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;">
              <el-button type="primary" @click="navigate('applies', { openApply: 'CREATE' })">新建申请</el-button>
              <el-button @click="navigate('trainings')">培训待办（{{ roleStats.todoTrain }}）</el-button>
              <el-button @click="navigate('accessApplies')">打印下载申请</el-button>
              <el-button @click="navigate('myDocs')">我的受控文件（{{ roleMyDocs.length }}）</el-button>
              <el-button @click="navigate('docs')">编号/全文检索</el-button>
              <el-button @click="navigate('records')">记录查询</el-button>
            </div>
          </div>
        </div>

        <!-- 一键合规导入 / 导出（工作台；导入在上；一律 Excel） -->
        <div v-if="hasPerm('dcc:audit:export')" class="page-card" style="margin-top:16px;" id="dcc-compliance-export">
          <div class="section-title"><span>一键合规导入（Excel）</span></div>
          <el-alert type="warning" show-icon :closable="false" style="margin-bottom:12px;"
            title="请先下载模板：「文件主档」含「正文」列；也可在「文件正文」表按文件编号提交全文（三级同步写入表单正文）。第 1 行表头已写好，从第 2 行起粘贴即可。"></el-alert>
          <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
            <el-button type="primary" plain @click="downloadComplianceImportTemplate">下载导入模板</el-button>
            <el-button type="primary" @click="pickComplianceImportFile">选择 Excel 导入</el-button>
          </div>
          <div class="section-title" style="margin-top:8px;"><span>导入历史</span></div>
          <el-table :data="pageSlice(data.complianceImports || [],'complianceImport')" size="small" border stripe style="width:100%">
            <el-table-column label="导入单号" width="150"><template #default="{ row }">{{ row.importNo || '-' }}</template></el-table-column>
            <el-table-column label="文件名" min-width="180" show-overflow-tooltip><template #default="{ row }">{{ row.fileName || '-' }}</template></el-table-column>
            <el-table-column label="新增" width="70"><template #default="{ row }">{{ row.added != null ? row.added : '-' }}</template></el-table-column>
            <el-table-column label="更新" width="70"><template #default="{ row }">{{ row.updated != null ? row.updated : '-' }}</template></el-table-column>
            <el-table-column label="跳过" width="70"><template #default="{ row }">{{ row.skipped != null ? row.skipped : '-' }}</template></el-table-column>
            <el-table-column label="正文" width="70"><template #default="{ row }">{{ row.bodyApplied != null ? row.bodyApplied : '-' }}</template></el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }"><span class="tag" :class="statusTag(row.status).cls">{{ statusTag(row.status).text }}</span></template>
            </el-table-column>
            <el-table-column label="操作人" width="80"><template #default="{ row }">{{ row.createdBy || '-' }}</template></el-table-column>
            <el-table-column label="时间" width="160"><template #default="{ row }">{{ row.createdAt || '-' }}</template></el-table-column>
          </el-table>
          <div class="list-pager">
            <el-pagination v-model:current-page="listPage.complianceImport" :page-size="PAGE_SIZE" :total="(data.complianceImports || []).length" layout="total, prev, pager, next" background small></el-pagination>
          </div>

          <div class="section-title" style="margin-top:28px;"><span>一键合规导出（Excel）</span></div>
          <el-alert type="info" show-icon :closable="false" style="margin-bottom:12px;"
            title="一键导出为 Excel（.xlsx）：含文件版本清单、文件正文（开关）、审批记录、分发台账、分发签收台账、培训证明索引。切换「全库/一级/二级/三级」导出对应全部文件，不是只出一条。"></el-alert>
          <el-form label-position="top" class="compliance-form">
            <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:16px;max-width:720px;">
              <el-form-item label="截止时间点">
                <el-input v-model="exportForm.asOfTime" placeholder="YYYY-MM-DD HH:mm" style="width:100%" />
              </el-form-item>
              <el-form-item label="范围">
                <el-select v-model="exportForm.scope" placeholder="请选择导出范围" style="width:100%">
                  <el-option v-for="o in exportScopeOptions" :key="o.value" :label="o.label" :value="o.value"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="含文件正文">
                <el-switch v-model="exportForm.includeBody" active-text="导出正文表" inactive-text="不含正文" />
              </el-form-item>
              <el-form-item label=" ">
                <el-button type="primary" @click="runComplianceExport">生成并下载 Excel 合规包</el-button>
              </el-form-item>
            </div>
          </el-form>
          <div class="section-title" style="margin-top:8px;"><span>导出历史</span></div>
          <el-table :data="pageSlice(data.complianceExports,'compliance')" size="small" border stripe style="width:100%">
            <el-table-column label="导出单号" width="140"><template #default="{ row }">{{ row.exportNo || '-' }}</template></el-table-column>
            <el-table-column label="时间点" width="130"><template #default="{ row }">{{ row.asOfTime || '-' }}</template></el-table-column>
            <el-table-column label="范围" min-width="120"><template #default="{ row }">{{ row.scope || '-' }}</template></el-table-column>
            <el-table-column label="文件数" width="70" align="center">
              <template #default="{ row }">{{ row.docCount != null ? row.docCount : '-' }}</template>
            </el-table-column>
            <el-table-column label="包内容" min-width="200" show-overflow-tooltip><template #default="{ row }">{{ row.pack || '-' }}</template></el-table-column>
            <el-table-column label="操作人" width="80"><template #default="{ row }">{{ row.createdBy || '-' }}</template></el-table-column>
            <el-table-column label="操作" width="72" align="center" class-name="ops-col" label-class-name="ops-col">
              <template #default="{ row }"><div class="ops-cell"><button class="link-btn" @click="downloadCompliancePack(row)">下载</button></div></template>
            </el-table-column>
          </el-table>
          <div class="list-pager">
            <el-pagination v-model:current-page="listPage.compliance" :page-size="PAGE_SIZE" :total="data.complianceExports.length" layout="total, prev, pager, next" background small></el-pagination>
          </div>
        </div>

<div class="user-flow-guide">
  <div class="user-flow-head">
    <h3>使用者操作流程指南</h3>
    <p>对齐需求 <strong>V1.5.17</strong>。审批通过后为<strong>待生效</strong>（仅文控台账可见），到生效日变为现行后，文控分发给各部门负责人，负责人再分发给本部门员工；对象须<strong>签收</strong>后进入「我的受控文件」。受控文件台账<strong>全员可查</strong>：台账侧仅可预览/下载/打印<strong>本部门非密</strong>；已签收文件不受此限（含机密）。变更单/变更通知/分发单等按本人关联可见；纸质回收仅曾签收人可点。合规导出含正文+审批+分发签收；导入可提交正文。</p>
  </div>

  <div class="flow-block">
    <div class="flow-block-title"><span class="flow-no">0</span>文件级别 vs 业务领域</div>
    <div class="flow-mini-list">
      <div><b>文件级别</b>：一级宏观 / 二级部门细则 / 三级表单。决定能否网页改正文与审批边界。</div>
      <div><b>业务领域</b>：半导体检测、前沿检测、硅光芯片量产、通用等（可多选）。用于筛选与培训矩阵，<strong>不</strong>代替级别；字典<strong>仅文控</strong>可增改。</div>
      <div><b>三级 · 表单</b>：可「编辑表单」直改；保存递增轻量修订 <b>rN</b>（免审批），<strong>不</strong>改正式 1.0/2.0；正式升版仍走修订审批。</div>
    </div>
    <div class="flow-tip">组织口径：行政部（文控）+ 市场部 / 技术部 / IT部 / 财务部。台账侧对本部门<strong>非机密</strong>可直接预览/下载/打印；已签收「我的受控文件」完整操作。所属部门字典<strong>仅文控</strong>可增改。</div>
  </div>

  <div class="flow-block">
    <div class="flow-block-title"><span class="flow-no">1</span>哪些要审批？哪些不要？</div>
    <div class="flow-mini-list">
      <div><b>需要审批</b>：员工新建/修订/作废（负责人一审→文控二审）；负责人新建/修订/作废（仅文控）；行政部员工申请由文控审；外发；打印/下载二次申请等。</div>
      <div><b>不需要审批</b>：文控办理新建/修订/作废（提交即直办）；三级表单网页日常改内容；台账本部门非密预览/下载/打印；我的受控文件内完整操作。</div>
    </div>
  </div>

  <div class="flow-block">
    <div class="flow-block-title"><span class="flow-no">2</span>生效 → 分发 → 签收</div>
    <div class="flow-steps">
      <div class="flow-step"><em>待生效</em><span>审批通过</span><small>仅文控台账可见</small></div>
      <div class="flow-arrow">→</div>
      <div class="flow-step"><em>现行</em><span>到达生效日</span><small>方可分发</small></div>
      <div class="flow-arrow">→</div>
      <div class="flow-step"><em>文控分发</em><span>→ 各部门负责人</span><small>员工不可分发</small></div>
      <div class="flow-arrow">→</div>
      <div class="flow-step"><em>负责人</em><span>→ 本部门员工</span><small>待我签收 → 我的受控</small></div>
    </div>
  </div>

  <div class="flow-block">
    <div class="flow-block-title"><span class="flow-no">3</span>新建 / 修订 / 作废（按角色）</div>
    <div class="flow-steps">
      <div class="flow-step"><em>文控</em><span>提交即直办</span><small>无需待我审批</small></div>
      <div class="flow-arrow">→</div>
      <div class="flow-step"><em>负责人</em><span>提交 → 文控审</span><small>待我审批仅文控见</small></div>
      <div class="flow-arrow">→</div>
      <div class="flow-step"><em>员工</em><span>提交 → 负责人 → 文控</span><small>一审通过后进文控待办</small></div>
      <div class="flow-arrow">→</div>
      <div class="flow-step"><em>修订生效</em><span>新版新 ID</span><small>旧版已替代 + 变更单/通知/纸质回收</small></div>
    </div>
  </div>

  <div class="flow-block">
    <div class="flow-block-title"><span class="flow-no">4</span>台账 vs 我的受控 · 下载/打印</div>
    <div class="flow-steps">
      <div class="flow-step"><em>①</em><span>台账全员可查</span><small>待生效仅文控见</small></div>
      <div class="flow-arrow">→</div>
      <div class="flow-step"><em>②</em><span>台账侧操作</span><small>仅本部门非密可预览/下载/打印</small></div>
      <div class="flow-arrow">→</div>
      <div class="flow-step"><em>③</em><span>已签收</span><small>我的受控内完整操作（含机密）</small></div>
      <div class="flow-arrow">→</div>
      <div class="flow-step"><em>④</em><span>否则申请</span><small>跨部门/机密走二次申请 · 强制水印</small></div>
    </div>
    <div class="flow-tip">废止/已替代文件除文控外不可预览下载打印。打印/下载申请须<strong>选择文件</strong>。</div>
  </div>

  <div class="flow-block">
    <div class="flow-block-title"><span class="flow-no">5</span>水印怎么看？谁能改？</div>
    <div class="flow-mini-list">
      <div><b>下载 / 打印</b>：强制平铺水印 + 红色阶段水印，<strong>不可关闭</strong></div>
      <div><b>预览</b>：默认加水印；<strong>仅文控</strong>可在「基础配置 → 水印策略」开关「预览加水印」</div>
      <div><b>阶段角标</b>：初级文件 / 审批完成 / 已分发 / 修订 / 失效；借阅、外发场景另有角标；机密正中斜对角「机密文件」</div>
      <div><b>基础配置</b>：分类 / 业务领域 / 所属部门 / 水印等增改<strong>一律仅文控</strong>；其他部门只读</div>
    </div>
  </div>

  <div class="flow-grid-2">
    <div class="flow-block">
      <div class="flow-block-title"><span class="flow-no">6</span>切换角色后看什么？</div>
      <div class="flow-mini-list">
        <div><b>受控文件台账</b>：全员可查（待生效仅文控）</div>
        <div><b>我的受控文件</b>：仅分发给当前角色且已签收的文件</div>
        <div><b>分发单</b>：文控全部；负责人看本人发出的 + 与本人受控关联的</div>
        <div><b>变更单 / 变更通知</b>：文控全部；其他人仅与本人受控文件关联的</div>
        <div><b>借阅 / 外发</b>：员工本人；负责人本部门+本人；文控全部</div>
        <div><b>记录</b>：非文控仅看「我的受控」曾有过的文件相关记录</div>
        <div><b>纸质回收</b>：仅曾签收过该文件的人员可点「回收」</div>
        <div><b>复审</b>：到部门负责人；维持有效须选顺延月数并更新到期日</div>
      </div>
    </div>
    <div class="flow-block">
      <div class="flow-block-title"><span class="flow-no">7</span>审批与其它主路径</div>
      <div class="flow-steps flow-steps-col">
        <div class="flow-step"><em>①</em><span>工作台待办或「申请与审批 → 待我审批」</span></div>
        <div class="flow-arrow flow-arrow-col">↓</div>
        <div class="flow-step"><em>②</em><span>去处理 → 意见 + 电子签名（时间线按单不串台）</span></div>
        <div class="flow-arrow flow-arrow-col">↓</div>
        <div class="flow-step"><em>③</em><span>通过进下一节点；驳回回草稿</span></div>
      </div>
      <div class="flow-mini-list" style="margin-top:12px;">
        <div><b>申请</b>：新建 / 修订 / 作废 + 我的申请（修订/作废可搜索关联编号）</div>
        <div><b>借阅/外发</b>：新建表单 → 选择文件 → 提交审批</div>
        <div><b>作废</b>：必填原因 → 审批 → 废止 → 纸质回收；丢失确认仅文控</div>
        <div><b>合规导出</b>：Excel 多表 = 版本清单 + 文件正文（可关）+ 审批记录 + 分发台账 + 分发签收台账 + 培训</div>
        <div><b>合规导入</b>：主档「正文」列或「文件正文」表按编号写入全文（三级同步表单正文）</div>
        <div><b>复审任务</b>：到期复审（维持/修订/作废），与「待我审批」不同</div>
      </div>
    </div>
  </div>

  <div class="flow-legend">
    <span><i class="lg lg-author"></i>编制人：新建/修订/作废（一二级改正文必经此）</span>
    <span><i class="lg lg-leader"></i>部门负责人：员工申请一审；本人申请直送文控；可向本部门员工分发</span>
    <span><i class="lg lg-ctrl"></i>文控员：申请直办、终审、分发负责人、纸质、合规、基础配置增改</span>
    <span><i class="lg lg-user"></i>部门员工：申请须负责人→文控；不可分发；签收后完整操作受控份</span>
  </div>
</div>
</template>
