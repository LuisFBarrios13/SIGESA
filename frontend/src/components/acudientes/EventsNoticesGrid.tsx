// Single Responsibility: renders the school events & notices grid

import Icon from '../ui/Icon';
import type { SchoolEvent } from '../../types/acudientes';

// ── Event Card ────────────────────────────────────────────────

interface EventCardProps {
  event: SchoolEvent;
  onClick?: (id: string) => void;
}

const EventCard = ({ event, onClick }: EventCardProps) => (
  <div
    onClick={() => onClick?.(event.id)}
    className="p-4 border border-stone-100 rounded-xl hover:shadow-md transition-shadow group cursor-pointer"
  >
    <div className="flex items-center gap-3 mb-3">
      <div
        className={`w-10 h-10 rounded-full ${event.iconBg} ${event.iconColor} flex items-center justify-center flex-shrink-0`}
      >
        <Icon name={event.icon} />
      </div>
      <div>
        <h4 className={`font-bold transition-colors text-sm ${event.hoverTextColor}`}>
          {event.title}
        </h4>
        <p className="text-[11px] text-stone-500">{event.date}</p>
      </div>
    </div>
    <p className="text-sm text-on-surface-variant line-clamp-2">{event.description}</p>
  </div>
);

// ── Main Component ────────────────────────────────────────────

interface EventsNoticesGridProps {
  events: SchoolEvent[];
  onEventClick?: (id: string) => void;
}

const EventsNoticesGrid = ({ events, onEventClick }: EventsNoticesGridProps) => (
  <div className="md:col-span-12 bg-white rounded-xl shadow-sm border border-stone-100 p-6">
    <h3 className="text-xl font-medium text-on-surface mb-6">
      Upcoming Events &amp; Notices
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} onClick={onEventClick} />
      ))}
    </div>
  </div>
);

export default EventsNoticesGrid;