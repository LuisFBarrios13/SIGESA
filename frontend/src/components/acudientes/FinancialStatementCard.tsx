// Single Responsibility: renders the financial statement card

import Icon from '../ui/Icon';
import type { FinancialItem, OverdueAlert } from '../../types/acudientes';

// ── Payment Status Label (Open/Closed via config map) ─────────

const STATUS_STYLES: Record<FinancialItem['status'], string> = {
  paid: 'text-secondary font-medium',
  pending: 'text-orange-600 font-medium',
  overdue: 'text-error font-bold',
};

const STATUS_LABELS: Record<FinancialItem['status'], string> = {
  paid: 'Paid ✓',
  pending: 'Pending',
  overdue: 'Overdue',
};

// ── Financial Line Item ───────────────────────────────────────

const FinancialLineItem = ({ item }: { item: FinancialItem }) => (
  <div className="flex justify-between text-sm">
    <span className="text-stone-500">{item.description}</span>
    <span className={STATUS_STYLES[item.status]}>{STATUS_LABELS[item.status]}</span>
  </div>
);

// ── Overdue Alert Banner ──────────────────────────────────────

const OverdueAlertBanner = ({ alert }: { alert: OverdueAlert }) => (
  <div className="flex items-center gap-3 p-3 bg-warning-yellow/20 rounded-lg border border-warning-yellow/30">
    <span
      className="material-symbols-outlined text-orange-600"
      style={{ fontVariationSettings: "'FILL' 1" }}
    >
      warning
    </span>
    <div>
      <p className="text-xs font-bold text-orange-900">{alert.message}</p>
      <p className="text-[11px] text-orange-800">{alert.dueDate}</p>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────

interface FinancialStatementCardProps {
  totalPending: string;
  items: FinancialItem[];
  overdueAlert: OverdueAlert;
  onMakePayment?: () => void;
}

const FinancialStatementCard = ({
  totalPending,
  items,
  overdueAlert,
  onMakePayment,
}: FinancialStatementCardProps) => (
  <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 flex flex-col relative overflow-hidden">
    {/* Decorative accent */}
    <div className="absolute top-0 right-0 w-24 h-24 bg-warning-yellow/10 rounded-bl-full pointer-events-none" />

    <h3 className="text-xl font-medium text-on-surface mb-4">Statement of Account</h3>

    {/* Total + Overdue Alert */}
    <div className="space-y-4 mb-6">
      <div className="flex justify-between items-center">
        <span className="text-stone-500">Total Pending</span>
        <span className="text-2xl font-bold text-on-surface">{totalPending}</span>
      </div>
      <OverdueAlertBanner alert={overdueAlert} />
    </div>

    {/* Line Items */}
    <div className="space-y-3">
      {items.map((item) => (
        <FinancialLineItem key={item.id} item={item} />
      ))}
    </div>

    {/* CTA */}
    <button
      onClick={onMakePayment}
      className="mt-8 w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-container transition-all shadow-md"
    >
      Make Payment
    </button>
  </div>
);

export default FinancialStatementCard;