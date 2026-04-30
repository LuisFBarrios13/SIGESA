// Open/Closed Principle: extend via variant without modifying internals

import type { BadgeVariant } from '../../types';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  uppercase?: boolean;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  success: 'bg-secondary-container/30 text-secondary',
  error: 'bg-error-container text-error',
  warning: 'bg-orange-100 text-orange-700',
  neutral: 'text-stone-400',
  info: 'bg-tertiary-container/10 text-tertiary',
};

const Badge = ({ text, variant = 'neutral', uppercase = false }: BadgeProps) => (
  <span
    className={`text-xs font-bold flex items-center px-2 py-1 rounded-full
      ${VARIANT_STYLES[variant]}
      ${uppercase ? 'uppercase text-[10px] font-black' : ''}`}
  >
    {text}
  </span>
);

export default Badge;