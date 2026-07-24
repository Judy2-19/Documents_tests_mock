/** 页面注入 App 提供的 DCC 上下文（createDccSetup 返回值） */
import { inject } from "vue";

export function useDccPage() {
  const dcc = inject("dcc");
  if (!dcc) throw new Error("[DCC] missing provide('dcc') — mount pages under App shell");
  return dcc;
}
