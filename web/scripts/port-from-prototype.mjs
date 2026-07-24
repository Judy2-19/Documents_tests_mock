import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const webSrc = path.resolve(__dirname, "../src");

// —— CSS ——
fs.copyFileSync(
  path.join(root, "assets/css/layout.css"),
  path.join(webSrc, "styles/layout.css")
);

// —— data.js → ESM ——
let dataJs = fs.readFileSync(path.join(root, "assets/js/data.js"), "utf8");
dataJs = dataJs.replace(
  /window\.DCC_DATA\s*=\s*/,
  "const DCC_DATA = "
);
dataJs = dataJs.replace(/window\.DCC_DATA/g, "DCC_DATA");
if (!dataJs.trimEnd().endsWith(";")) dataJs = dataJs.trimEnd() + "\n";
dataJs += "\nexport default DCC_DATA;\nexport { DCC_DATA };\n";
fs.writeFileSync(path.join(webSrc, "mock/data.js"), dataJs);

// —— app.js → composable ——
let appJs = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
appJs = appJs.replace(
  /^const \{ createApp, ref, computed, reactive, watch \} = Vue;\s*/m,
  `import { ref, computed, reactive, watch } from "vue";\nimport { ElMessage } from "element-plus";\nimport DCC_DATA from "../mock/data.js";\n\n`
);
appJs = appJs.replace(/ElementPlus\.ElMessage/g, "ElMessage");
appJs = appJs.replace(
  /createApp\(\{\s*setup\(\)\s*\{/,
  "export function createDccSetup() {"
);
appJs = appJs.replace(
  /const data = reactive\(window\.DCC_DATA\);/,
  "const data = reactive(DCC_DATA);"
);
appJs = appJs.replace(
  /\},\s*\}\)\.use\(ElementPlus\)\.mount\("#app"\);\s*$/,
  "}\n"
);
// Fix trailing: originally `    };\n  },\n}).use...` — after first replace we have return {...};\n  },\n}).use
// The replace above should catch `},\n}).use(ElementPlus).mount("#app");`
// But we already replaced createApp({ setup() { with export function, so ending is still `  },\n}).use...`
// Let me check - after first replace the structure is:
// export function createDccSetup() {
//   ...
//   return { ... };
//   },   <-- leftover from setup
// }).use...
// So need to remove `  },` before `}).use`

if (appJs.includes("}).use(ElementPlus)") || appJs.includes(".mount(\"#app\")")) {
  appJs = appJs.replace(/\n\s*\},\s*\n\s*\}\)\.use\(ElementPlus\)\.mount\("#app"\);\s*$/, "\n}\n");
}
if (appJs.includes(".mount(")) {
  // fallback cleanup
  appJs = appJs.replace(/\n\s*\},\s*\n\s*\}\)\.use\([\s\S]*$/m, "\n}\n");
}

fs.writeFileSync(path.join(webSrc, "composables/dccApp.js"), appJs);

// —— extract template from index.html ——
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const m = html.match(/<div id="app"[^>]*>([\s\S]*)<\/div>\s*\n\s*<!-- 国内用/);
if (!m) {
  throw new Error("Cannot extract #app template from index.html");
}
let template = m[1].trim();
// outer wrapper was <div id="app" class="layout"> ... content ... so we need class="layout" on root
// Looking at original: <div id="app" class="layout"> then aside... so captured content starts with aside or comments
const appOpen = html.match(/<div id="app"([^>]*)>/);
const rootAttrs = appOpen ? appOpen[1].trim() : 'class="layout"';
// If template doesn't include layout class wrapper, wrap it
if (!template.startsWith("<aside") && !template.includes('class="layout"')) {
  // template content is inside #app which had class=layout
}
const attrs = rootAttrs || 'class="layout"';
const vue =
  "<script lang=\"ts\">\n" +
  "import { defineComponent } from \"vue\";\n" +
  "import { createDccSetup } from \"./composables/dccApp.js\";\n\n" +
  "export default defineComponent({\n" +
  "  name: \"App\",\n" +
  "  setup: createDccSetup,\n" +
  "});\n" +
  "</script>\n\n" +
  "<template>\n" +
  `  <div ${attrs}>\n` +
  template +
  "\n  </div>\n" +
  "</template>\n";
fs.writeFileSync(path.join(webSrc, "App.vue"), vue);

console.log("Ported: styles, mock/data.js, composables/dccApp.js, App.vue");
console.log("dccApp.js ends with:", appJs.slice(-120));
