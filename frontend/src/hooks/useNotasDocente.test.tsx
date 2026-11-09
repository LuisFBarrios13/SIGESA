// src/hooks/useNotasDocente.test.tsx — borrador de notas y guardado
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { crearWrapper } from '../test/wrapper';
import type { MatriculaDocente, NotasEstudianteResponse } from '../services/docenteApi';

const api = vi.hoisted(() => ({
  getPerfil:              vi.fn(),
  getEstudiantes:         vi.fn(),
  getNotasEstudiante:     vi.fn(),
  guardarNotasEstudiante: vi.fn(),
}));
vi.mock('../services/docenteApi', () => ({ docenteApi: api }));

import { useNotasDocente } from './useNotasDocente';

const MATRICULA = {
  id_matricula: 7,
  year: 2026,
  jornada: 'MAÑANA',
  estado: 'ACTIVO',
  estudiante: { numero_identidad: '1001', nombre: 'Ana', fecha_nacimiento: '2019-01-01' },
  grado: { id_grado: 1, nombre: 'Primero', jornada: 'MAÑANA' },
} as unknown as MatriculaDocente;

const notas = (nota: number | null): NotasEstudianteResponse => ({
  puesto: null,
  observaciones: '',
  materias: [
    { id_materia: 1, nombre: 'Matemáticas', area: 'MATEMÁTICAS', intensidad_horaria: 4, nota, fallas: 0, observacion: null },
    { id_materia: 2, nombre: 'Inglés',      area: 'INGLÉS',      intensidad_horaria: 2, nota: 4, fallas: 1, observacion: null },
  ],
});

/** Monta el hook y selecciona al estudiante. */
const montar = async () => {
  const { Wrapper } = crearWrapper();
  const hook = renderHook(() => useNotasDocente(), { wrapper: Wrapper });
  await waitFor(() => expect(hook.result.current.perfil).not.toBeNull());
  await act(() => hook.result.current.selectStudent(MATRICULA));
  await waitFor(() => expect(hook.result.current.materias).toHaveLength(2));
  return hook;
};

describe('useNotasDocente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getPerfil.mockResolvedValue({ cedula: '9', nombre: 'Profe', grados: [] });
    api.getEstudiantes.mockResolvedValue([MATRICULA]);
    api.getNotasEstudiante.mockImplementation(async (_id: number, periodo: number) =>
      notas(periodo === 1 ? 3 : null));
    api.guardarNotasEstudiante.mockResolvedValue({});
  });

  it('editar marca la materia como modificada', async () => {
    const { result } = await montar();
    expect(result.current.hasDirty).toBe(false);

    act(() => result.current.updateNota(1, 4.5));
    expect(result.current.materias[0]).toMatchObject({ nota: 4.5, savedNota: 3, dirty: true });
    expect(result.current.materias[1].dirty).toBe(false);
    expect(result.current.hasDirty).toBe(true);

    // Volver al valor original ya no cuenta como cambio
    act(() => result.current.updateNota(1, 3));
    expect(result.current.hasDirty).toBe(false);
  });

  it('no guarda si hay una nota fuera de la escala 0.0–5.0', async () => {
    const { result } = await montar();
    act(() => result.current.updateNota(1, 5.1));
    expect(result.current.materias[0].error).toBe('Debe ser entre 0.0 y 5.0');

    await act(() => result.current.handleSave());
    expect(result.current.saveError).toBe('Corrige los errores antes de guardar.');
    expect(api.guardarNotasEstudiante).not.toHaveBeenCalled();
  });

  it('guarda solo lo modificado, incluidas las observaciones, y queda limpio', async () => {
    const { result } = await montar();
    act(() => result.current.updateNota(1, 4.5));
    act(() => result.current.updateObservaciones('Muy buen periodo'));

    await act(() => result.current.handleSave());

    expect(api.guardarNotasEstudiante).toHaveBeenCalledOnce();
    const payload = api.guardarNotasEstudiante.mock.calls[0][0];
    expect(payload).toMatchObject({ id_matricula: 7, numero_periodo: 1, year: 2026, observaciones: 'Muy buen periodo' });
    expect(payload.materias).toEqual([
      { id_materia: 1, nota: 4.5, fallas: 0, intensidad_horaria: 4, observacion: null },
    ]);
    expect(payload.puesto).toBeUndefined(); // no se tocó

    expect(result.current.saveSuccess).toBe(true);
    expect(result.current.hasDirty).toBe(false);
    expect(result.current.materias[0]).toMatchObject({ nota: 4.5, savedNota: 4.5, dirty: false });
    expect(result.current.observaciones).toBe('Muy buen periodo');
  });

  it('guardar solo las observaciones también envía la petición', async () => {
    const { result } = await montar();
    act(() => result.current.updateObservaciones('Solo esto'));
    await act(() => result.current.handleSave());
    expect(api.guardarNotasEstudiante).toHaveBeenCalledOnce();
    expect(api.guardarNotasEstudiante.mock.calls[0][0]).toMatchObject({ materias: [], observaciones: 'Solo esto' });
  });

  it('si falla el guardado, conserva lo editado y muestra el error', async () => {
    api.guardarNotasEstudiante.mockRejectedValue(new Error('Sin conexión'));
    const { result } = await montar();
    act(() => result.current.updateNota(1, 4.5));
    await act(() => result.current.handleSave());

    await waitFor(() => expect(result.current.saveError).toBe('Sin conexión'));
    expect(result.current.materias[0]).toMatchObject({ nota: 4.5, dirty: true });
  });

  it('cambiar de periodo descarta lo no guardado y carga ese periodo', async () => {
    const { result } = await montar();
    act(() => result.current.updateNota(1, 4.5));

    act(() => result.current.setPeriodo(2));
    await waitFor(() => expect(result.current.materias[0]?.nota).toBe(''));
    expect(result.current.hasDirty).toBe(false);

    act(() => result.current.setPeriodo(1));
    await waitFor(() => expect(result.current.materias[0]?.nota).toBe(3));
    expect(result.current.hasDirty).toBe(false);
  });

  it('al recargar (F5) recupera periodo y estudiante desde la URL', async () => {
    const { Wrapper } = crearWrapper('/docente/notas?periodo=2&year=2026&matricula=7');
    const { result } = renderHook(() => useNotasDocente(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.selected?.id_matricula).toBe(7));
    expect(result.current.periodo).toBe(2);
    expect(result.current.year).toBe(2026);
    await waitFor(() => expect(result.current.materias).toHaveLength(2));
    expect(api.getNotasEstudiante).toHaveBeenCalledWith(7, 2, 2026);
  });
});
