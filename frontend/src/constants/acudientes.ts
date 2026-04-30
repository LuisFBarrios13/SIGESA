import type {
  Child,
  SubjectGrade,
  FinancialItem,
  OverdueAlert,
  AttendanceData,
  SchoolEvent,
  ParentProfile,
} from '../types/acudientes';

// ── Parent ────────────────────────────────────────────────────

export const PARENT_PROFILE: ParentProfile = {
  name: 'Carlos Mendoza',
  role: 'Parent Account',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDZuINtpRDKrXU55J2MdrSben_9CEMosRaaOZ374kZq-gbGXHcyIJAxblh219lFVR-2EyyKR0GAKkCbVWIkYQ14K_l30imcUlPGCdMWBTS_bRwZ1c9FUTzPpGNVALzdLwBsd7GNY0gQqC3JmGRYsqxs3n9Zpx3sUaEaGQGQHUZ-XsoupTM7TFloBHvmcRWZyo597Erlg2RlThC2VksYEqHerCyQedChF1X6Ucg4wvSB8BuourahlhvDhyFDtckxxB0icT9BOlpf0to',
};

// ── Children ──────────────────────────────────────────────────

export const CHILDREN: Child[] = [
  {
    id: 'maria',
    name: 'Maria',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBg9K6-kmMKEZQBqNd3Yvu_yXqv466JwVYVZezjLo4ybHswE4W_r-4pD2ugkwegX3QdRbNBXgbnrvfhtACWxmN9OlN-KDtzBS4bw5mH1AlE-WTnuA1E3Yt4xxAlmLQImfeAKz5lAFexVzFqcgJK532L-ec7jAF4XavGwuFyFPH6GK2afQxx02NvzxO9C8AlZdv7eVcu5Il3uqlfZFWGZoC4gz6DazG1kkiRrpts1qUENbtcdOWSZ7GbqfIR9oJxlnY1sZePEELiVJI',
    grade: '5th Grade',
    section: 'Section B',
  },
  {
    id: 'juan',
    name: 'Juan',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuANkPyCArJJ8Euybc3F8up4rix06E9yd-7cTFbilTxhgyYmhKTi_ZPym4Zm5o71J801f9_g_Pwx6_LVcVJzmYzJ4O8vVvQBPqz2-xrv8I9qnsFRw9qUft1zLJKNkKGfaiApArVmJWA2JzlJatSqvi9g_qF0c8BOAnha7xCUeRi1mWDbUbYkftTmfQTMA6qG6pA89vhNUOFNztVeJflQvVllj8ZAoc4wcdeGsU98g7CWdh7dOL_TZHxM8FQEOuUY1YcmrO3Cj1QezSo',
    grade: '3rd Grade',
    section: 'Section A',
  },
];

// ── Subject Grades ────────────────────────────────────────────

export const SUBJECT_GRADES: SubjectGrade[] = [
  {
    id: 'math',
    subject: 'Mathematics',
    icon: 'calculate',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-800',
    score: 18,
    maxScore: 20,
    trend: 'trending_up',
    trendColor: 'text-secondary',
  },
  {
    id: 'literature',
    subject: 'Literature',
    icon: 'history_edu',
    iconBg: 'bg-blue-100',
    iconColor: 'text-info-blue',
    score: 19,
    maxScore: 20,
    trend: 'trending_flat',
    trendColor: 'text-stone-400',
  },
  {
    id: 'science',
    subject: 'Science',
    icon: 'biotech',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-secondary',
    score: 17,
    maxScore: 20,
    trend: 'trending_down',
    trendColor: 'text-error',
  },
];

// ── Financial ─────────────────────────────────────────────────

export const FINANCIAL_ITEMS: FinancialItem[] = [
  {
    id: 'tuition-october',
    description: 'Tuition (October)',
    status: 'paid',
  },
  {
    id: 'materials-fee',
    description: 'Materials fee',
    status: 'pending',
  },
];

export const OVERDUE_ALERT: OverdueAlert = {
  message: 'Payment Overdue',
  dueDate: 'Enrollment fee due 05/10/23',
};

export const TOTAL_PENDING = '$1,240.00';

// ── Attendance ────────────────────────────────────────────────

export const ATTENDANCE_DATA: AttendanceData = {
  percentage: 98,
  missedDays: 1,
  studentName: 'Maria',
  period: 'trimester',
};

// ── School Events ─────────────────────────────────────────────

export const SCHOOL_EVENTS: SchoolEvent[] = [
  {
    id: 'parent-teacher-meeting',
    title: 'Parent-Teacher Meeting',
    date: 'Oct 24, 2023 • 4:00 PM',
    description:
      'Quarterly review for all students in Section B. Virtual link will be sent via email.',
    icon: 'calendar_month',
    iconBg: 'bg-info-blue/10',
    iconColor: 'text-info-blue',
    hoverTextColor: 'group-hover:text-info-blue',
  },
  {
    id: 'sports-day',
    title: 'Sports Day 2023',
    date: 'Nov 02, 2023 • All Day',
    description:
      "Annual school sports competition. Don't forget the house color t-shirts!",
    icon: 'campaign',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-800',
    hoverTextColor: 'group-hover:text-orange-800',
  },
  {
    id: 'library-return',
    title: 'Library Book Return',
    date: 'Due by tomorrow',
    description:
      '"The Little Prince" needs to be returned to the main library by Maria.',
    icon: 'library_books',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-secondary',
    hoverTextColor: 'group-hover:text-secondary',
  },
];