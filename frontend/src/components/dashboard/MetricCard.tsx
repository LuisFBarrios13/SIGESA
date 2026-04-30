// Open/Closed: extend appearance through MetricCardData props, not code edits

import Icon from '../ui/Icon';
import Badge from '../ui/Badge';
import type { MetricCardData } from '../../types';

interface MetricCardProps {
  data: MetricCardData;
}

const MetricCard = ({ data }: MetricCardProps) => {
  const isAlert = data.variant === 'alert';

  return (
    <div
      className={`p-6 rounded-xl border shadow-sm flex flex-col justify-between
        ${isAlert
          ? 'bg-error-container/20 border-error/20'
          : 'bg-surface-container-lowest border-outline-variant'
        }`}
    >
      {/* Top row: icon + badge */}
      <div className="flex justify-between items-start">
        <div className={`p-3 ${data.iconBg} rounded-lg`}>
          <Icon name={data.icon} className={data.iconColor} />
        </div>
        {data.badge && (
          <Badge text={data.badge.text} variant={data.badge.variant} />
        )}
      </div>

      {/* Bottom: label + value */}
      <div className="mt-4">
        <p
          className={`text-[12px] font-semibold tracking-widest uppercase
            ${isAlert ? 'text-error/80' : 'text-stone-500'}`}
        >
          {data.label}
        </p>

        {/* Value with optional progress bar */}
        {data.progress !== undefined ? (
          <div className="flex items-end gap-2">
            <h2 className={`text-2xl font-semibold ${isAlert ? 'text-error' : 'text-on-surface'}`}>
              {data.value}
            </h2>
            <div className="mb-1.5 w-full bg-stone-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-secondary h-full rounded-full"
                style={{ width: `${data.progress}%` }}
              />
            </div>
          </div>
        ) : (
          <h2 className={`text-2xl font-semibold ${isAlert ? 'text-error' : 'text-on-surface'}`}>
            {data.value}
          </h2>
        )}
      </div>
    </div>
  );
};

export default MetricCard;