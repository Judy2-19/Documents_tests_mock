/**
 * DCC 视图汇总：按侧栏分组目录（英文）组织，供 router/modules/dcc.js 引用。
 * 同组件多路由（如 docs / reportDocs）在此映射到同一文件。
 */
import DashboardView from "./overview/DashboardView.vue";
import DocsView from "./library/DocsView.vue";
import MyDocsView from "./library/MyDocsView.vue";
import AppliesView from "./approval/AppliesView.vue";
import TodoApproveView from "./approval/TodoApproveView.vue";
import ChangesView from "./change/ChangesView.vue";
import NoticesView from "./change/NoticesView.vue";
import DistributionsView from "./distribution/DistributionsView.vue";
import HardCopiesView from "./distribution/HardCopiesView.vue";
import BorrowsView from "./borrow/BorrowsView.vue";
import ExternalReleasesView from "./borrow/ExternalReleasesView.vue";
import AccessAppliesView from "./borrow/AccessAppliesView.vue";
import TrainingsView from "./training/TrainingsView.vue";
import CfgTrainingView from "./training/CfgTrainingView.vue";
import ExternalDocsView from "./external/ExternalDocsView.vue";
import ReviewsView from "./external/ReviewsView.vue";
import RecordsView from "./report/RecordsView.vue";
import ConfigHubView from "./config/ConfigHubView.vue";
import DccOverlays from "./DccOverlays.vue";

export { DccOverlays };

export const DCC_VIEWS = {
  dashboard: DashboardView,
  docs: DocsView,
  reportDocs: DocsView,
  myDocs: MyDocsView,
  receipts: MyDocsView,
  applies: AppliesView,
  todoApprove: TodoApproveView,
  changes: ChangesView,
  notices: NoticesView,
  distributions: DistributionsView,
  hardCopies: HardCopiesView,
  borrows: BorrowsView,
  externalReleases: ExternalReleasesView,
  externalDocs: ExternalDocsView,
  reviews: ReviewsView,
  records: RecordsView,
  accessApplies: AccessAppliesView,
  trainings: TrainingsView,
  cfgTraining: CfgTrainingView,
  config: ConfigHubView,
};

export function resolveDccView(routeKey) {
  return DCC_VIEWS[routeKey] || null;
}
