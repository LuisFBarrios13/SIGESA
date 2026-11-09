// src/constants/estudiantes.test.ts — qué matrícula se muestra en Estudiantes
import { describe, it, expect, vi, afterEach } from 'vitest';
import { aniosPosteriores, getMatriculaVigente, matriculaMostrada } from './estudiantes';
import type { MatriculaListItem } from '../types/matriculas';

const mat = (year: number, estado: MatriculaListItem['estado'], grado: string) =>
  ({ id_matricula: year, year, estado, grado: { nombre: grado } }) as MatriculaListItem;

// Caso real: retirado en 2026 (con deudas) y ya matriculado para 2027
const MATRICULAS = [mat(2026, 'RETIRADO', 'Transición'), mat(2027, 'ACTIVO', 'Pre Jardín')];

afterEach(() => vi.useRealTimers());

describe('matrícula mostrada', () => {
  it('muestra la del año en curso, no la del año siguiente (igual que Deudores)', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-09T12:00:00'));
    const m = matriculaMostrada(MATRICULAS);
    expect(m?.year).toBe(2026);
    expect(m?.grado?.nombre).toBe('Transición');
    expect(aniosPosteriores(MATRICULAS, m)).toEqual([2027]);
  });

  it('con un año filtrado muestra la de ese año; si no tiene, ninguna', () => {
    expect(matriculaMostrada(MATRICULAS, '2027')?.grado?.nombre).toBe('Pre Jardín');
    expect(matriculaMostrada(MATRICULAS, '2025')).toBeUndefined();
  });

  it('sin matrícula este año usa la más reciente', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2028-03-01T12:00:00'));
    expect(getMatriculaVigente(MATRICULAS)?.year).toBe(2027);
  });
});
