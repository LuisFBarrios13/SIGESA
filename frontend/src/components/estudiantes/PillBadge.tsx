// src/components/estudiantes/PillBadge.tsx

interface BadgeProps { label: string; colorClass: string; icon?: string }
const PillBadge = ({ label, colorClass, icon }: BadgeProps) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${colorClass}`}>
    {icon && <span className="material-symbols-outlined text-[12px]">{icon}</span>}
    {label}
  </span>
);

export default PillBadge;
