// src/components/ui/SectionCard.tsx
import type { ReactNode } from 'react';
import Icon from './Icon';

interface SectionCardProps {
  title: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  children: ReactNode;
}

/**
 * Visual wrapper for a logical section of a form.
 */
const SectionCard = ({ title, icon, iconBg, iconColor, children }: SectionCardProps) => (
  <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
    <div className={`px-6 py-4 flex items-center gap-3 border-b border-stone-100 ${iconBg}/10`}>
      <div className={`p-2 ${iconBg} rounded-lg`}>
        <Icon name={icon} className={`text-xl ${iconColor}`} />
      </div>
      <h3 className="font-semibold text-on-surface">{title}</h3>
    </div>
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
  </div>
);

export default SectionCard;