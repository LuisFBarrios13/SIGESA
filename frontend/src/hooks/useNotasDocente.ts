// src/hooks/useNotasDocente.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  docenteApi,
  type DocentePerfil,
  type MatriculaDocente,
  type NotaEstudianteItem,
} from '../services/docenteApi';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface MateriaEdit extends NotaEstudianteItem {
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
  const [perfil,         setPerfil]         = useState<DocentePerfil | null>(null);
  const [isSetupLoading, setIsSetupLoading] = useState(true);
  const [setupError,     setSetupError]     = useState('');

  const [periodo, setPeriodo] = useState(1);
  const [year,    setYear]    = useState(new Date().getFullYear());

  const [estudiantes,       setEstudiantes]       = useState<MatriculaDocente[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [search,            setSearch]            = useState('');
  const [gradoFilter,       setGradoFilter]       = useState<number | 'TODOS'>('TODOS');

  const [selected,       setSelected]       = useState<MatriculaDocente | null>(null);
  const [materias,       setMaterias]       = useState<MateriaEdit[]>([]);
  const [isLoadingNotas, setIsLoadingNotas] = useState(false);
  const [notasError,     setNotasError]     = useState('');

  const [puesto,      setPuesto]      = useState<number | null>(null);
  const [savedPuesto, setSavedPuesto] = useState<number | null>(null);

  const [observaciones,      setObservaciones]      = useState('');
  const [savedObservaciones, setSavedObservaciones] = useState('');

  const [isSaving,    setIsSaving]    = useState(false);
  const [saveError,   setSaveError]   = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  useEffect(() => {
    setIsSetupLoading(true);
    docenteApi.getPerfil()
      .then(setPerfil)
      .catch(() => setSetupError('No se pudo cargar el perfil del docente.'))
      .finally(() => setIsSetupLoading(false));
  }, []);

  useEffect(() => {
    if (!perfil) return;
    setIsLoadingStudents(true);
    setSelected(null);
    setMaterias([]);
    setPuesto(null);
    setSavedPuesto(null);
    docenteApi.getEstudiantes(year)
      .then(setEstudiantes)
      .catch(() => {})
      .finally(() => setIsLoadingStudents(false));
  }, [perfil, year]);

  useEffect(() => {
    if (!selected) return;
    loadNotas(selected, periodo, year);
    setSaveSuccess(false);
    setSaveError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo]);

  // ── Load notas ────────────────────────────────────────────────────────────
  const loadNotas = useCallback(
    async (matricula: MatriculaDocente, per: number, yr: number) => {
      setIsLoadingNotas(true);
      setNotasError('');
      setSaveSuccess(false);
      try {
        const result = await docenteApi.getNotasEstudiante(matricula.id_matricula, per, yr);
        setMaterias(buildMaterias(result.materias));
        setPuesto(result.puesto);
        setSavedPuesto(result.puesto);
        setObservaciones(result.observaciones ?? '');
        setSavedObservaciones(result.observaciones ?? '');
      } catch {
        setNotasError('No se pudieron cargar las notas. Verifica tu conexión.');
        setMaterias([]);
        setPuesto(null);
        setSavedPuesto(null);
      } finally {
        setIsLoadingNotas(false);
      }
    },
    [],
  );

  const selectStudent = useCallback(
    async (m: MatriculaDocente) => {
      setSelected(m);
      setSearch('');
      setSaveError('');
      setSaveSuccess(false);
      await loadNotas(m, periodo, year);
    },
    [loadNotas, periodo, year],
  );

  const clearSelected = useCallback(() => {
    setSelected(null);
    setMaterias([]);
    setPuesto(null);
    setSavedPuesto(null);
    setObservaciones('');
    setSavedObservaciones('');
    setSaveError('');
    setSaveSuccess(false);
  }, []);

  // ── Edit handlers ─────────────────────────────────────────────────────────

  const updateNota = useCallback((id_materia: number, val: number | '') => {
    setMaterias((prev) =>
      prev.map((m) => {
        if (m.id_materia !== id_materia) return m;
        const isValid = val === '' || (typeof val === 'number' && val >= 0 && val <= 10);
        const updated = { ...m, nota: val, error: isValid ? '' : 'Debe ser entre 0 y 10' };
        return { ...updated, dirty: isDirty(updated) };
      }),
    );
    setSaveSuccess(false);
  }, []);

  const updateFallas = useCallback((id_materia: number, val: number) => {
    const fallas = Math.max(0, Math.floor(val) || 0);
    setMaterias((prev) =>
      prev.map((m) => {
        if (m.id_materia !== id_materia) return m;
        const updated = { ...m, fallas };
        return { ...updated, dirty: isDirty(updated) };
      }),
    );
    setSaveSuccess(false);
  }, []);

  const updateIH = useCallback((id_materia: number, val: number) => {
    const ih = Math.max(0, Math.floor(val) || 0);
    setMaterias((prev) =>
      prev.map((m) => {
        if (m.id_materia !== id_materia) return m;
        const updated = { ...m, intensidad_horaria: ih };
        return { ...updated, dirty: isDirty(updated) };
      }),
    );
    setSaveSuccess(false);
  }, []);

  const updateObs = useCallback((id_materia: number, val: string) => {
    setMaterias((prev) =>
      prev.map((m) => {
        if (m.id_materia !== id_materia) return m;
        const updated = { ...m, observacion: val };
        return { ...updated, dirty: isDirty(updated) };
      }),
    );
    setSaveSuccess(false);
  }, []);

  const updatePuesto = useCallback((val: number | null) => {
    setPuesto(val);
    setSaveSuccess(false);
  }, []);

  const updateObservaciones = useCallback((val: string) => {
    setObservaciones(val);
    setSaveSuccess(false);
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!selected) return;
    if (materias.some((m) => m.error)) {
      setSaveError('Corrige los errores antes de guardar.');
      return;
    }

    const dirtyItems         = materias.filter((m) => m.dirty);
    const puestoDirty        = puesto !== savedPuesto;
    const observacionesDirty = observaciones !== savedObservaciones;

    if (!dirtyItems.length && !puestoDirty && !observacionesDirty) return;

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      await docenteApi.guardarNotasEstudiante({
        id_matricula:   selected.id_matricula,
        numero_periodo: periodo,
        year,
        materias: dirtyItems.map((m) => ({
          id_materia:         m.id_materia,
          nota:               m.nota,
          fallas:             m.fallas,
          intensidad_horaria: m.intensidad_horaria,
        })),
        puesto:        puestoDirty        ? puesto        : undefined,
        observaciones: observacionesDirty ? observaciones : undefined,
      });

      setMaterias((prev) =>
        prev.map((m) => ({
          ...m,
          savedNota:        m.nota,
          savedFallas:      m.fallas,
          savedIH:          m.intensidad_horaria,
          savedObservacion: m.observacion ?? null,
          dirty:            false,
        })),
      );
      setSavedPuesto(puesto);
      setSavedObservaciones(observaciones);
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar las notas.');
    } finally {
      setIsSaving(false);
    }
  }, [selected, materias, periodo, year, puesto, savedPuesto]);

  // ── Derived ───────────────────────────────────────────────────────────────
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

  const hasDirty = useMemo(
    () => materias.some((m) => m.dirty) || puesto !== savedPuesto || observaciones !== savedObservaciones,
    [materias, puesto, savedPuesto, observaciones, savedObservaciones],
  );

  return {
    perfil, isSetupLoading, setupError,
    periodo, setPeriodo, year, setYear,
    estudiantes, search, setSearch, gradoFilter, setGradoFilter, filtered, isLoadingStudents,
    selected, selectStudent, clearSelected,
    materias, isLoadingNotas, notasError,
    updateNota, updateFallas, updateIH, updateObs,
    puesto, savedPuesto, updatePuesto,
    observaciones, updateObservaciones,
    isSaving, saveError, saveSuccess, hasDirty, handleSave,
  };
};