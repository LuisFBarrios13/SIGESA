import type { StudentGrades, GradeColumn } from '../types/docente';

/**
 * Computes a weighted final grade from a student's individual scores.
 * Returns null if all grade fields are empty (ungraded student).
 */
export function computeFinalGrade(
  grades: StudentGrades,
  columns: GradeColumn[],
): number | null {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const col of columns) {
    const raw = grades[col.key];
    if (raw === '') continue;
    weightedSum += (raw as number) * (col.weight / 100);
    totalWeight += col.weight;
  }

  if (totalWeight === 0) return null;

  // Normalise in case not all columns have values yet
  return Math.round((weightedSum / totalWeight) * totalWeight * 10) / 10;
}