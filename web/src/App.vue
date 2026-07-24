<!--
  App 壳：侧栏 / 顶栏 / 多页签 + <router-view>。
  路由见 router/index.js；逻辑在 composables/dccApp.js；页面在 views/dcc。
-->
<script lang="ts">
import { defineComponent, provide } from "vue";
import { createDccSetup } from "./composables/dccApp.js";
import { DccOverlays } from "./views/dcc/index.js";

export default defineComponent({
  name: "App",
  components: { DccOverlays },
  setup() {
    const dcc = createDccSetup();
    provide("dcc", dcc);
    return { ...dcc };
  },
});
</script>

<template>
  <div class="layout">
    <aside class="aside">
      <div class="brand" @click="navigate('dashboard')">
        <div class="brand-mark">DCC</div>
        <div>
          <div class="brand-text">米格实验室</div>
          <span class="brand-sub">DCC 文控系统 · Vue</span>
        </div>
      </div>
      <div class="aside-scroll">
        <template v-for="g in menus" :key="g.group">
          <div class="menu-group-title">{{ g.group }}</div>
          <div
            v-for="item in g.items"
            :key="item.key"
            class="menu-item"
            :class="{ active: route === item.key }"
            @click="navigate(item.key)"
          >
            <span class="mi">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
            <span v-if="item.badge && badgeCount(item.badge)" class="badge">{{ badgeCount(item.badge) }}</span>
          </div>
        </template>
      </div>
    </aside>

    <div class="main-wrap">
      <header class="topbar">
        <div class="topbar-left">
          <div class="crumb">
            DCC文控系统 / <strong>{{ PAGE_TITLES[route] || '工作台' }}</strong>
          </div>
        </div>
        <div class="topbar-right">
          <span class="pill">Vue 工程 · 需求 V1.5.3</span>
          <el-select v-model="roleCode" size="small" style="width:168px" @change="switchRole">
            <el-option v-for="r in data.demoRoles" :key="r.roleCode" :label="r.role" :value="r.roleCode"></el-option>
          </el-select>
          <span>{{ data.user.dept }} · {{ data.user.post }}</span>
          <div class="avatar">{{ data.user.short }}</div>
          <span>{{ data.user.name }}</span>
        </div>
      </header>

      <div class="tabs-bar">
        <div
          v-for="t in openTabs"
          :key="t.key"
          class="tab-chip"
          :class="{ active: route === t.key }"
          @click="navigate(t.key)"
        >
          {{ t.title }}
          <span class="x" @click="closeTab(t.key, $event)">×</span>
        </div>
      </div>

      <main class="content">
        <router-view />
        <div class="footer-note">© 2026 米格实验室 · DCC文控原型 P2 · 对齐需求说明书 V1.5.3（阶段水印 / 角色视图 / 合规按级别）</div>
      </main>
    </div>

    <DccOverlays />
  </div>
</template>
