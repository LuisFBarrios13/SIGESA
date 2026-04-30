// Dependency Inversion: page depends on abstractions (components + typed data),
// not on concrete implementations or direct DOM manipulation.

import { useState } from 'react';

import WelcomeHeader from '../components/acudientes/WelcomeHeader';
import GradesSummaryCard from '../components/acudientes/GradesSummaryCard';
import FinancialStatementCard from '../components/acudientes/FinancialStatementCard';
import AttendanceWidget from '../components/acudientes/AttendanceWidget';
import EventsNoticesGrid from '../components/acudientes/EventsNoticesGrid';
import FloatingActionButton from '../components/dashboard/FloatingActionButton';

import {
  CHILDREN,
  SUBJECT_GRADES,
  FINANCIAL_ITEMS,
  OVERDUE_ALERT,
  TOTAL_PENDING,
  ATTENDANCE_DATA,
  SCHOOL_EVENTS,
} from '../constants/acudientes';

const AcudientesPage = () => {
  const [activeChildId, setActiveChildId] = useState<string>(CHILDREN[0].id);

  const activeChild = CHILDREN.find((c) => c.id === activeChildId) ?? CHILDREN[0];

  return (
    <>
      {/* Welcome + Child Selector */}
      <WelcomeHeader
        parentFirstName="Carlos"
        children={CHILDREN}
        activeChildId={activeChildId}
        onSelectChild={setActiveChildId}
      />

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Academic Grades — 8 cols */}
        <GradesSummaryCard
          activeChild={activeChild}
          grades={SUBJECT_GRADES}
          onDownloadReport={() => console.log('Download report')}
          onViewAll={() => console.log('View all grades')}
        />

        {/* Right Column — 4 cols */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <FinancialStatementCard
            totalPending={TOTAL_PENDING}
            items={FINANCIAL_ITEMS}
            overdueAlert={OVERDUE_ALERT}
            onMakePayment={() => console.log('Make payment')}
          />
          <AttendanceWidget data={ATTENDANCE_DATA} />
        </div>

        {/* Events & Notices — full width */}
        <EventsNoticesGrid
          events={SCHOOL_EVENTS}
          onEventClick={(id) => console.log('Event clicked:', id)}
        />
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-stone-200 flex flex-col md:flex-row justify-between items-center gap-4 text-stone-500 text-sm">
        <p>© 2023 SIGESA Academic Management System. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-primary transition-colors">Contact Support</a>
        </div>
      </footer>

      {/* FAB */}
      <FloatingActionButton icon="chat" label="Quick message" />
    </>
  );
};

export default AcudientesPage;