// Single Responsibility: renders a visual bar chart for financial data

import type { ChartDataPoint } from '../../types';

interface ChartBarProps {
  point: ChartDataPoint;
}

const ChartBar = ({ point }: ChartBarProps) => (
  <div className="w-full flex flex-col items-center gap-2">
    <div className="w-full flex gap-1 items-end h-40">
      <div
        className="bg-primary-container w-1/2 rounded-t-sm transition-all"
        style={{ height: `${point.revenueRatio * 100}%` }}
        title="Revenue"
      />
      <div
        className="bg-tertiary-container w-1/2 rounded-t-sm transition-all"
        style={{ height: `${point.expensesRatio * 100}%` }}
        title="Expenses"
      />
    </div>
    <span className="text-[10px] font-bold text-stone-400">{point.month}</span>
  </div>
);

const ChartLegend = () => (
  <div className="mt-6 flex gap-6 justify-center">
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full bg-primary-container" />
      <span className="text-xs font-medium text-stone-500">Revenue</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full bg-tertiary-container" />
      <span className="text-xs font-medium text-stone-500">Expenses</span>
    </div>
  </div>
);

interface FinancialChartProps {
  data: ChartDataPoint[];
}

const FinancialChart = ({ data }: FinancialChartProps) => (
  <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
    {/* Header */}
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-xl font-medium text-primary">Monthly Revenue vs Expenses</h3>
      <select className="text-xs font-bold bg-stone-50 border-stone-200 rounded-md py-1 px-2">
        <option>Last 6 Months</option>
        <option>Year to Date</option>
      </select>
    </div>

    {/* Bars */}
    <div className="h-64 flex items-end justify-between gap-4 px-4">
      {data.map((point) => (
        <ChartBar key={point.month} point={point} />
      ))}
    </div>

    <ChartLegend />
  </div>
);

export default FinancialChart;