// Single Responsibility: renders the academic grades summary card

import Icon from '../ui/Icon';
import type { SubjectGrade, Child } from '../../types/acudientes';

// ── Grade Score Badge ─────────────────────────────────────────

const ScoreBadge = ({ score, maxScore }: { score: number; maxScore: number }) => (
  <span className="px-3 py-1 bg-secondary-container/30 text-secondary font-bold rounded-full text-sm">
    {score}/{maxScore}
  </span>
);

// ── Trend Icon ────────────────────────────────────────────────

interface TrendIconProps {
  trend: SubjectGrade['trend'];
  trendColor: SubjectGrade['trendColor'];
}

const TrendIcon = ({ trend, trendColor }: TrendIconProps) => (
  <Icon name={trend} className={trendColor} />
);

// ── Table Header ──────────────────────────────────────────────

const GradesTableHeader = () => (
  <div className="grid grid-cols-4 gap-4 p-4 bg-surface-container-low rounded-lg">
    <div className="col-span-2 font-semibold text-on-surface-variant text-sm">Course</div>
    <div className="text-center font-semibold text-on-surface-variant text-sm">Average</div>
    <div className="text-center font-semibold text-on-surface-variant text-sm">Trend</div>
  </div>
);

// ── Table Row ─────────────────────────────────────────────────

interface GradeRowProps {
  grade: SubjectGrade;
}

const GradeRow = ({ grade }: GradeRowProps) => (
  <div className="grid grid-cols-4 gap-4 px-4 py-3 items-center hover:bg-stone-50 transition-colors rounded-lg">
    <div className="col-span-2 flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg ${grade.iconBg} ${grade.iconColor} flex items-center justify-center`}>
        <Icon name={grade.icon} className="text-[18px]" />
      </div>
      <span className="font-medium text-sm">{grade.subject}</span>
    </div>
    <div className="text-center">
      <ScoreBadge score={grade.score} maxScore={grade.maxScore} />
    </div>
    <div className="text-center">
      <TrendIcon trend={grade.trend} trendColor={grade.trendColor} />
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────

interface GradesSummaryCardProps {
  activeChild: Child;
  grades: SubjectGrade[];
  onDownloadReport?: () => void;
  onViewAll?: () => void;
}

const GradesSummaryCard = ({
  activeChild,
  grades,
  onDownloadReport,
  onViewAll,
}: GradesSummaryCardProps) => (
  <div className="md:col-span-8 bg-white rounded-xl shadow-sm border border-stone-100 p-6 flex flex-col">
    {/* Header */}
    <div className="flex justify-between items-center mb-6">
      <div>
        <h3 className="text-xl font-medium text-on-surface">Academic Progress</h3>
        <p className="text-sm text-stone-500">
          {activeChild.name} Mendoza – {activeChild.grade} {activeChild.section}
        </p>
      </div>
      <button
        onClick={onDownloadReport}
        className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg font-semibold hover:opacity-90 transition-all shadow-sm text-sm"
      >
        <Icon name="download" className="text-sm" />
        <span>Boletín de Notas</span>
      </button>
    </div>

    {/* Grades Table */}
    <div className="space-y-1 flex-grow">
      <GradesTableHeader />
      {grades.map((grade) => (
        <GradeRow key={grade.id} grade={grade} />
      ))}
    </div>

    {/* Footer Link */}
    <div className="mt-6 pt-6 border-t border-stone-100">
      <button
        onClick={onViewAll}
        className="text-info-blue font-semibold flex items-center gap-1 hover:underline text-sm"
      >
        View all subject details
        <Icon name="arrow_forward" className="text-[16px]" />
      </button>
    </div>
  </div>
);

export default GradesSummaryCard;