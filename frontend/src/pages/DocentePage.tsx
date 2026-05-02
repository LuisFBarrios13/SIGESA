// Dependency Inversion: page depends on abstractions (components + typed data),
// not on concrete implementations or direct DOM manipulation.

import { useState, useCallback } from 'react';

import DocenteTopBar from '../components/docente/DocenteTopBar';
import GradeFiltersBar from '../components/docente/GradeFiltersBar';
import GradeSpreadsheet from '../components/docente/GradeSpreadsheet';
import DocenteStatsGrid from '../components/docente/DocenteStatsGrid';
import FloatingActionButton from '../components/dashboard/FloatingActionButton';

import {
  TEACHER_PROFILE,
  COURSE_OPTIONS,
  GRADE_COLUMNS,
  INITIAL_STUDENTS,
  GRADING_PROGRESS,
  SUBMISSION_DEADLINE,
} from '../constants/docente';
import { computeFinalGrade } from '../utils/gradeCalculator';

import type { Period, StudentGrades, StudentRow } from '../types/docente';

// ── Helpers ───────────────────────────────────────────────────

const recalcRow = (row: StudentRow): StudentRow => ({
  ...row,
  finalGrade: computeFinalGrade(row.grades, GRADE_COLUMNS),
});

// ── Page ──────────────────────────────────────────────────────

const DocentePage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('Second Quarter');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(COURSE_OPTIONS[0].id);
  const [students, setStudents] = useState<StudentRow[]>(INITIAL_STUDENTS);

  const selectedCourse = COURSE_OPTIONS.find((c) => c.id === selectedCourseId) ?? COURSE_OPTIONS[0];

  // Open/Closed: grade change handler is isolated — no spread of business logic in JSX
  const handleGradeChange = useCallback(
    (studentId: string, field: keyof StudentGrades, value: number | '') => {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? recalcRow({ ...s, grades: { ...s.grades, [field]: value } })
            : s,
        ),
      );
    },
    [],
  );

  return (
    <>
      {/* Teacher Top Bar */}
      <DocenteTopBar teacher={TEACHER_PROFILE} courseLabel={selectedCourse.label} />

      {/* Content Area */}
      <div className="p-8 space-y-6">
        {/* Filters + Actions */}
        <GradeFiltersBar
          selectedPeriod={selectedPeriod}
          selectedCourseId={selectedCourseId}
          courseOptions={COURSE_OPTIONS}
          onPeriodChange={setSelectedPeriod}
          onCourseChange={setSelectedCourseId}
          onExportTemplate={() => console.log('Export template')}
          onSaveChanges={() => console.log('Save changes', students)}
        />

        {/* Editable Grade Spreadsheet */}
        <GradeSpreadsheet
          rows={students}
          columns={GRADE_COLUMNS}
          onGradeChange={handleGradeChange}
        />

        {/* Contextual Stats */}
        <DocenteStatsGrid
          gradingProgress={GRADING_PROGRESS}
          deadline={SUBMISSION_DEADLINE}
          onViewShortcuts={() => console.log('View shortcuts')}
        />
      </div>

      {/* FAB */}
      <FloatingActionButton icon="add" label="Add student" />
    </>
  );
};

export default DocentePage;