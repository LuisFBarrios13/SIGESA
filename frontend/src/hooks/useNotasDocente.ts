// src/hooks/useNotasDocente.ts
// Registro de notas del docente.
// - Perfil, estudiantes y notas se leen con useQuery (perfil y estudiantes
//   comparten caché con Mi Grado).
// - Lo que el docente va editando es un "borrador" local ligado a
//   estudiante + periodo + año; si cambia cualquiera de los tres, se muestran
//   los datos del servidor de esa combinación.
// - Guardar es un useMutation que, al terminar, actualiza la caché de notas.

import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  docenteApi,
  type DocentePerfil,
  type MatriculaDocente,
  type NotaEstudianteItem,
  type NotasEstudianteResponse,
  type GuardarNotaEstudiantePayload,
} from '../services/docenteApi';
import { queryKeys } from '../lib/queryKeys';
import { NOTA_MIN, NOTA_MAX } from '../constants/notas';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface MateriaEdit extends Omit<NotaEstudianteItem, 'nota'> {
  nota:                  number | '';
  savedNota:             number | '';
  fallas:                number;
  savedFallas:           number;
  intensidad_horaria:    number;
  savedIH:               number;
  savedObservacion:      string | null;
  dirty:                 boolean;
  error:                 string;
}

/** Lo que el docente puede editar de un estudiante en un periodo. */
interface Formulario {
  materias:      MateriaEdit[];
  puesto:        number | null;
  observaciones: string;
}

type ClaveNotas = ReturnType<typeof queryKeys.notas.porEstudiante>;

// ── Helpers ────────────────────────────────────────────────────────────────────

const isDirty = (m: MateriaEdit): boolean =>
  m.nota !== m.savedNota ||
  m.fallas !== m.savedFallas ||
  m.intensidad_horaria !== m.savedIH ||
  (m.observacion ?? null) !== (m.savedObservacion ?? null);

const buildMaterias = (items: NotaEstudianteItem[]): MateriaEdit[] =>
  items.map((m) => {
    const nota   = m.nota ?? '';
    const fallas = m.fallas ?? 0;
    const ih     = m.intensidad_horaria ?? 0;
    return {
      ...m,
      nota,
      savedNota:        nota,
      fallas,
      savedFallas:      fallas,
      intensidad_horaria: ih,
      savedIH:          ih,
      savedObservacion: m.observacion,
      dirty:            false,
      error:            '',
    };
  });

const desdeServidor = (r: NotasEstudianteResponse): Formulario => ({
  materias:      buildMaterias(r.materias),
  puesto:        r.puesto,
  observaciones: r.observaciones ?? '',
});

/** Formulario guardado → forma de la respuesta del servidor (para la caché). */
const aRespuesta = (f: Formulario): NotasEstudianteResponse => ({
  puesto:        f.puesto,
  observaciones: f.observaciones,
  materias: f.materias.map((m) => ({
    id_materia:         m.id_materia,
    nombre:             m.nombre,
    area:               m.area,
    intensidad_horaria: m.intensidad_horaria,
    nota:               m.nota === '' ? null : m.nota,
    fallas:             m.fallas,
    observacion:        m.observacion ?? null,
  })),
});

const FORMULARIO_VACIO: Formulario = { materias: [], puesto: null, observaciones: '' };
const SIN_ESTUDIANTES: MatriculaDocente[] = [];

// ── Hook ───────────────────────────────────────────────────────────────────────

interface UseNotasDocenteReturn {
  perfil:         DocentePerfil | null;
  isSetupLoading: boolean;
  setupError:     string;

  periodo:    number;
  setPeriodo: (p: number) => void;
  year:       number;
  setYear:    (y: number) => void;

  estudiantes:       MatriculaDocente[];
  search:            string;
  setSearch:         (s: string) => void;
  gradoFilter:       number | 'TODOS';
  setGradoFilter:    (g: number | 'TODOS') => void;
  filtered:          MatriculaDocente[];
  isLoadingStudents: boolean;

  selected:       MatriculaDocente | null;
  selectStudent:  (m: MatriculaDocente) => Promise<void>;
  clearSelected:  () => void;
  materias:       MateriaEdit[];
  isLoadingNotas: boolean;
  notasError:     string;
  updateNota:     (id_materia: number, val: number | '') => void;
  updateFallas:   (id_materia: number, val: number) => void;
  updateIH:       (id_materia: number, val: number) => void;
  updateObs:      (id_materia: number, val: string) => void;

  puesto:       number | null;
  savedPuesto:  number | null;
  updatePuesto: (val: number | null) => void;

  observaciones:       string;
  updateObservaciones: (val: string) => void;

  isSaving:    boolean;
  saveError:   string;
  saveSuccess: boolean;
  hasDirty:    boolean;
  handleSave:  () => Promise<void>;
}

export const useNotasDocente = (): UseNotasDocenteReturn => {
  const queryClient = useQueryClient();

  // Periodo, año y estudiante viven en la URL (?periodo=2&year=2026&matricula=10):
  // así al recargar (F5) o compartir el enlace se vuelve al mismo lugar.
  const [params, setParams] = useSearchParams();
  const periodoUrl  = Number(params.get('periodo'));
  const periodo     = periodoUrl >= 1 && periodoUrl <= 4 ? periodoUrl : 1;
  const year        = Number(params.get('year')) || new Date().getFullYear();
  const idSeleccion = Number(params.get('matricula')) || null;

  const actualizarUrl = (cambios: Record<string, number | null>) =>
    setParams((prev) => {
      const nuevos = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(cambios)) {
        if (v === null) nuevos.delete(k); else nuevos.set(k, String(v));
      }
      return nuevos;
    }, { replace: true });

  const [search,      setSearch]       = useState('');
  const [gradoFilter, setGradoFilter]  = useState<number | 'TODOS'>('TODOS');
  const [errorValidacion, setErrorValidacion] = useState('');

  // ── Lecturas ────────────────────────────────────────────────────────────────
  const perfilQuery = useQuery({
    queryKey: queryKeys.miGrado.perfil,
    queryFn:  docenteApi.getPerfil,
  });

  const estudiantesQuery = useQuery({
    queryKey: queryKeys.miGrado.estudiantes(year),
    queryFn:  () => docenteApi.getEstudiantes(year),
    enabled:  !!perfilQuery.data,
  });
  const estudiantes = estudiantesQuery.data ?? SIN_ESTUDIANTES;
  const selected    = estudiantes.find((m) => m.id_matricula === idSeleccion) ?? null;

  const claveNotas = queryKeys.notas.porEstudiante(selected?.id_matricula ?? 0, periodo, year);
  const notasQuery = useQuery({
    queryKey:  claveNotas,
    queryFn:   () => docenteApi.getNotasEstudiante(selected!.id_matricula, periodo, year),
    enabled:   !!selected,
    // Mientras se edita no conviene que una recarga cambie los "valores guardados".
    staleTime: Infinity,
  });

  // ── Borrador ────────────────────────────────────────────────────────────────
  const clave = claveNotas.join('|');
  const [borrador, setBorrador] = useState<(Formulario & { clave: string }) | null>(null);

  const servidor = useMemo(
    () => (selected && notasQuery.data ? desdeServidor(notasQuery.data) : FORMULARIO_VACIO),
    [selected, notasQuery.data],
  );
  const formulario: Formulario = borrador?.clave === clave ? borrador : servidor;

  // ── Guardar ─────────────────────────────────────────────────────────────────
  const guardarMutation = useMutation({
    mutationFn: ({ payload }: { payload: GuardarNotaEstudiantePayload; queryKey: ClaveNotas; guardado: Formulario }) =>
      docenteApi.guardarNotasEstudiante(payload),
    onSuccess: (_res, { payload, queryKey, guardado }) => {
      // Lo guardado pasa a ser el dato del servidor y el borrador se descarta.
      queryClient.setQueryData(queryKey, aRespuesta(guardado));
      setBorrador((b) => (b?.clave === queryKey.join('|') ? null : b));
      // El boletín de este estudiante en caché quedó desactualizado.
      void queryClient.invalidateQueries({ queryKey: queryKeys.boletin.byMatricula(payload.id_matricula) });
    },
  });

  /** Aplica un cambio sobre el formulario actual (crea el borrador si no existe). */
  const editar = (cambio: (f: Formulario) => Formulario) => {
    setBorrador((prev) => ({ ...cambio(prev?.clave === clave ? prev : servidor), clave }));
    guardarMutation.reset(); // quita el "guardado" anterior
  };

  const editarMateria = (id_materia: number, cambio: (m: MateriaEdit) => MateriaEdit) =>
    editar((f) => ({
      ...f,
      materias: f.materias.map((m) => {
        if (m.id_materia !== id_materia) return m;
        const updated = cambio(m);
        return { ...updated, dirty: isDirty(updated) };
      }),
    }));

  // ── Navegación ──────────────────────────────────────────────────────────────
  const limpiarMensajes = () => { guardarMutation.reset(); setErrorValidacion(''); };

  // Cambiar de periodo o de estudiante descarta lo no guardado.
  const setPeriodo = (p: number) => { actualizarUrl({ periodo: p }); setBorrador(null); limpiarMensajes(); };

  const clearSelected = () => {
    actualizarUrl({ matricula: null });
    setBorrador(null);
    limpiarMensajes();
  };

  // Cambiar de año cambia la lista de estudiantes: se suelta la selección.
  const setYear = (y: number) => {
    actualizarUrl({ year: y, matricula: null });
    setBorrador(null);
    limpiarMensajes();
  };

  const selectStudent = async (m: MatriculaDocente) => {
    actualizarUrl({ matricula: m.id_matricula });
    setSearch('');
    setBorrador(null);
    limpiarMensajes();
  };

  // ── Edición ─────────────────────────────────────────────────────────────────
  const updateNota = (id_materia: number, val: number | '') =>
    editarMateria(id_materia, (m) => {
      const isValid = val === '' || (typeof val === 'number' && val >= NOTA_MIN && val <= NOTA_MAX);
      return { ...m, nota: val, error: isValid ? '' : `Debe ser entre ${NOTA_MIN.toFixed(1)} y ${NOTA_MAX.toFixed(1)}` };
    });

  const updateFallas = (id_materia: number, val: number) =>
    editarMateria(id_materia, (m) => ({ ...m, fallas: Math.max(0, Math.floor(val) || 0) }));

  const updateIH = (id_materia: number, val: number) =>
    editarMateria(id_materia, (m) => ({ ...m, intensidad_horaria: Math.max(0, Math.floor(val) || 0) }));

  const updateObs = (id_materia: number, val: string) =>
    editarMateria(id_materia, (m) => ({ ...m, observacion: val }));

  const updatePuesto        = (val: number | null) => editar((f) => ({ ...f, puesto: val }));
  const updateObservaciones = (val: string)        => editar((f) => ({ ...f, observaciones: val }));

  // ── Guardar ─────────────────────────────────────────────────────────────────
  const { materias, puesto, observaciones } = formulario;
  const puestoDirty        = puesto !== servidor.puesto;
  const observacionesDirty = observaciones !== servidor.observaciones;
  const hasDirty           = materias.some((m) => m.dirty) || puestoDirty || observacionesDirty;

  const handleSave = async () => {
    if (!selected) return;
    if (materias.some((m) => m.error)) {
      setErrorValidacion('Corrige los errores antes de guardar.');
      return;
    }
    setErrorValidacion('');
    if (!hasDirty) return;

    try {
      await guardarMutation.mutateAsync({
        queryKey: claveNotas,
        guardado: formulario,
        payload: {
          id_matricula:   selected.id_matricula,
          numero_periodo: periodo,
          year,
          materias: materias.filter((m) => m.dirty).map((m) => ({
            id_materia:         m.id_materia,
            nota:               m.nota,
            fallas:             m.fallas,
            intensidad_horaria: m.intensidad_horaria,
            observacion:        m.observacion ?? null,
          })),
          puesto:        puestoDirty        ? puesto        : undefined,
          observaciones: observacionesDirty ? observaciones : undefined,
        },
      });
    } catch {
      // El error queda visible en saveError.
    }
  };

  // ── Derivados ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return estudiantes.filter((m) => {
      const matchGrado  = gradoFilter === 'TODOS' || m.grado.id_grado === gradoFilter;
      const matchSearch = !q ||
        m.estudiante.nombre.toLowerCase().includes(q) ||
        m.estudiante.numero_identidad.includes(q);
      return matchGrado && matchSearch;
    });
  }, [estudiantes, search, gradoFilter]);

  const errorGuardado = guardarMutation.error
    ? (guardarMutation.error instanceof Error ? guardarMutation.error.message : 'Error al guardar las notas.')
    : '';

  return {
    perfil:         perfilQuery.data ?? null,
    isSetupLoading: perfilQuery.isPending,
    setupError:     perfilQuery.error ? 'No se pudo cargar el perfil del docente.' : '',
    periodo, setPeriodo, year, setYear,
    estudiantes, search, setSearch, gradoFilter, setGradoFilter, filtered,
    isLoadingStudents: estudiantesQuery.isLoading,
    selected, selectStudent, clearSelected,
    materias,
    isLoadingNotas: notasQuery.isLoading,
    notasError:     notasQuery.error ? 'No se pudieron cargar las notas. Verifica tu conexión.' : '',
    updateNota, updateFallas, updateIH, updateObs,
    puesto, savedPuesto: servidor.puesto, updatePuesto,
    observaciones, updateObservaciones,
    isSaving:    guardarMutation.isPending,
    saveError:   errorValidacion || errorGuardado,
    saveSuccess: guardarMutation.isSuccess,
    hasDirty, handleSave,
  };
};
