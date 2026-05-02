// Single Responsibility: renders the teacher-specific top app bar

import Icon from '../ui/Icon';
import type { TeacherProfile } from '../../types/docente';

interface DocenteTopBarProps {
  teacher: TeacherProfile;
  courseLabel: string;
}

// ── Sub-components (Interface Segregation) ────────────────────

const PageTitle = ({ courseLabel }: { courseLabel: string }) => (
  <div className="flex items-center gap-4">
    <span className="text-h2 font-h2 text-primary">Quick Grade Entry</span>
    <div className="h-6 w-px bg-stone-200" />
    <div className="flex items-center gap-2 text-stone-500 text-body-sm">
      <Icon name="class" className="text-base" />
      <span>{courseLabel}</span>
    </div>
  </div>
);

const TeacherAvatar = ({ teacher }: { teacher: TeacherProfile }) => (
  <div className="flex items-center gap-3 pl-6 border-l border-stone-200">
    <div className="text-right">
      <p className="text-body-sm font-bold text-on-surface leading-none">{teacher.name}</p>
      <p className="text-[11px] text-stone-500 mt-1">{teacher.title}</p>
    </div>
    <img
      src={teacher.avatarUrl}
      alt={`${teacher.name} profile photo`}
      className="w-10 h-10 rounded-full border border-stone-200 object-cover"
    />
  </div>
);

// ── Main Component ────────────────────────────────────────────

const DocenteTopBar = ({ teacher, courseLabel }: DocenteTopBarProps) => (
  <header className="sticky top-0 z-40 w-full flex justify-between items-center px-8 h-16 bg-white border-b border-stone-200 shadow-sm font-sans antialiased text-sm font-medium">
    <PageTitle courseLabel={courseLabel} />

    <div className="flex items-center gap-6">
      <div className="flex items-center gap-4">
        <button className="p-2 text-stone-500 hover:bg-stone-50 rounded-full transition-colors">
          <Icon name="notifications" />
        </button>
        <button className="p-2 text-stone-500 hover:bg-stone-50 rounded-full transition-colors">
          <Icon name="settings" />
        </button>
      </div>
      <TeacherAvatar teacher={teacher} />
    </div>
  </header>
);

export default DocenteTopBar;