// Dependency Inversion: page depends on abstractions (components + typed data),
// not on concrete implementations or direct DOM manipulation.

import PageHeader from '../../components/dashboard/PageHeader';
import MetricCardsGrid from '../../components/dashboard/MetricCardsGrid';
import FinancialChart from '../../components/dashboard/FinancialChart';
import PendingTasks from '../../components/dashboard/PendingTasks';
import ActivityTable from '../../components/dashboard/ActivityTable';
import FloatingActionButton from '../../components/dashboard/FloatingActionButton';

import {
  METRIC_CARDS,
  CHART_DATA,
  PENDING_TASKS,
  ACTIVITY_LOG,
} from '../../constants/dashboard';

const DashboardPage = () => (
  <>
    {/* Page Heading */}
    <PageHeader
      title="Academic Overview"
      subtitle="Welcome back. Here is what's happening today at the institution."
    />

    {/* KPI Cards */}
    <MetricCardsGrid cards={METRIC_CARDS} />

    {/* Bento Grid: Chart + Tasks */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2">
        <FinancialChart data={CHART_DATA} />
      </div>
      <PendingTasks tasks={PENDING_TASKS} />
    </div>

    {/* Activity Table */}
    <ActivityTable entries={ACTIVITY_LOG} />

    {/* FAB */}
    <FloatingActionButton icon="add" label="Quick action" />
  </>
);

export default DashboardPage;