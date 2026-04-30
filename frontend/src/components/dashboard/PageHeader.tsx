// Single Responsibility: renders the dashboard page heading + CTA buttons

import Icon from '../ui/Icon';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  onExportReport?: () => void;
  onNewAdmission?: () => void;
}

const PageHeader = ({
  title,
  subtitle,
  onExportReport,
  onNewAdmission,
}: PageHeaderProps) => (
  <div className="flex justify-between items-end">
    <div>
      <h1 className="text-3xl font-semibold text-primary">{title}</h1>
      <p className="text-base text-stone-500 mt-1">{subtitle}</p>
    </div>

    <div className="flex gap-3">
      <button
        onClick={onExportReport}
        className="px-4 py-2 bg-white border border-outline-variant text-primary rounded-lg font-semibold flex items-center gap-2 hover:bg-stone-50 transition-all shadow-sm"
      >
        <Icon name="download" className="text-sm" />
        Export Report
      </button>

      <button
        onClick={onNewAdmission}
        className="px-4 py-2 bg-secondary text-on-secondary rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition-all"
      >
        <Icon name="add" className="text-sm" />
        New Admission
      </button>
    </div>
  </div>
);

export default PageHeader;