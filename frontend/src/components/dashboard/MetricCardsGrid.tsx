// Single Responsibility: grid layout for metric cards

import MetricCard from './MetricCard';
import type { MetricCardData } from '../../types';

interface MetricCardsGridProps {
  cards: MetricCardData[];
}

const MetricCardsGrid = ({ cards }: MetricCardsGridProps) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
    {cards.map((card) => (
      <MetricCard key={card.id} data={card} />
    ))}
  </div>
);

export default MetricCardsGrid;