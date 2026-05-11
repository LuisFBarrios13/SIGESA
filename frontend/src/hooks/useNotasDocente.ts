// src/hooks/useNotasDocente.ts
// Rediseñado: flujo por estudiante en lugar de por materia.
// El docente selecciona un estudiante y ve TODAS sus materias a la vez.

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  docenteApi,
  type DocentePerfil,
  type MatriculaDocente,
  type NotaEstudianteItem,
} from '../services/docenteApi';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface MateriaEdit extends NotaEstudianteItem {
  nota:      number | '';
  savedNota: number | '';
  dirty:     boolean;
  error:     string;
}

interface UseNotasDocenteReturn {
  // Setup
  perfil:         DocentePerfil | null;
  isSetupLoading: boolean;
  setupError:     string;

  // Filters
  periodo:    number;
  setPeriodo: (p: number) => void;
  year:       number;
  setYear:    (y: number) => void;

  // Students
  estudiantes:      MatriculaDocente[];
  search:           string;
  setSearch:        (s: string) => void;
  filtered:         MatriculaDocente[];
  isLoadingStudents: boolean;

  // Selected student + their notas
  selected:      MatriculaDocente | null;
  selectStudent: (m: MatriculaDocente) => Promise<void>;
  clearSelected: () => void;
  materias:      MateriaEdit[];
  isLoadingNotas: boolean;
  notasError:    string;
  updateNota:    (id_materia: number, val: number | '') => void;
  updateObs:     (id_materia: number, val: string) => void;

  // Save
  isSaving:    boolean;
  saveError:   string;
  saveSuccess: boolean;
  hasDirty:    boolean;
  handleSave:  () => Promise<void>;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

const buildMaterias = (items: NotaEstudianteItem[]): MateriaEdit[] =>
  items.map((m) => {
    const val = m.nota ?? '';
    return {
      ...m,
      nota:      val,
      savedNota: val,
      dirty:     false,
      error:     '',
    };
  });

export const useNotasDocente = (): UseNotasDocenteReturn => {
  // Setup
  const [perfil,         setPerfil]         = useState<DocentePerfil | null>(null);
  const [isSetupLoading, setIsSetupLoading] = useState(true);
  const [setupError,     setSetupError]     = useState('');

  // Filters
  const [periodo, setPeriodo] = useState(1);
  const [year,    setYear]    = useState(new Date().getFullYear());

  // Students
  const [estudiantes,       setEstudiantes]       = useState<MatriculaDocente[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [search,            setSearch]            = useState('');

  // Selected student
  const [selected,       setSelected]       = useState<MatriculaDocente | null>(null);
  const [materias,       setMaterias]       = useState<MateriaEdit[]>([]);
  const [isLoadingNotas, setIsLoadingNotas] = useState(false);
  const [notasError,     setNotasError]     = useState('');

  // Save
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

  // ── Load students when year/perfil changes ────────────────────────────────
  useEffect(() => {
    if (!perfil) return;
    setIsLoadingStudents(true);
    setSelected(null);
    setMaterias([]);
    docenteApi.getEstudiantes(year)
      .then(setEstudiantes)
      .catch(() => {})
      .finally(() => setIsLoadingStudents(false));
  }, [perfil, year]);

  // ── Reload notas when period changes (student already selected) ───────────
  useEffect(() => {
    if (!selected) return;
    loadNotas(selected, periodo, year);
    setSaveSuccess(false);
    setSaveError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const loadNotas = useCallback(
    async (matricula: MatriculaDocente, per: number, yr: number) => {
      setIsLoadingNotas(true);
      setNotasError('');
      setSaveSuccess(false);
      try {
        const items = await docenteApi.getNotasEstudiante(matricula.id_matricula, per, yr);
        setMaterias(buildMaterias(items));
      } catch {
        setNotasError('No se pudieron cargar las notas. Verifica tu conexión.');
        setMaterias([]);
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
    setSaveError('');
    setSaveSuccess(false);
  }, []);

  // ── Edit handlers ─────────────────────────────────────────────────────────
  const updateNota = useCallback((id_materia: number, val: number | '') => {
    setMaterias((prev) =>
      prev.map((m) => {
        if (m.id_materia !== id_materia) return m;
        const isValid = val === '' || (typeof val === 'number' && val >= 0 && val <= 10);
        return {
          ...m,
          nota:  val,
          dirty: val !== m.savedNota,
          error: isValid ? '' : 'Debe ser entre 0 y 10',
        };
      }),
    );
    setSaveSuccess(false);
  }, []);

  const updateObs = useCallback((id_materia: number, val: string) => {
    setMaterias((prev) =>
      prev.map((m) =>
        m.id_materia === id_materia ? { ...m, observacion: val, dirty: true } : m,
      ),
    );
    setSaveSuccess(false);
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!selected) return;
    if (materias.some((m) => m.error)) {
      setSaveError('Corrige los errores antes de guardar.');
      return;
    }

    const dirtyItems = materias.filter((m) => m.dirty && m.nota !== '');
    if (!dirtyItems.length) return;

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      await docenteApi.guardarNotasEstudiante({
        id_matricula:   selected.id_matricula,
        numero_periodo: periodo,
        year,
        materias: dirtyItems.map((m) => ({
          id_materia:  m.id_materia,
          nota:        m.nota,
          observacion: m.observacion || undefined,
        })),
      });

      setMaterias((prev) =>
        prev.map((m) => ({ ...m, savedNota: m.nota, dirty: false })),
      );
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar las notas.');
    } finally {
      setIsSaving(false);
    }
  }, [selected, materias, periodo, year]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return estudiantes;
    return estudiantes.filter(
      (m) =>
        m.estudiante.nombre.toLowerCase().includes(q) ||
        m.estudiante.numero_identidad.includes(q),
    );
  }, [estudiantes, search]);

  const hasDirty = useMemo(() => materias.some((m) => m.dirty), [materias]);

  return {
    perfil, isSetupLoading, setupError,
    periodo, setPeriodo,
    year, setYear,
    estudiantes, search, setSearch, filtered, isLoadingStudents,
    selected, selectStudent, clearSelected,
    materias, isLoadingNotas, notasError,
    updateNota, updateObs,
    isSaving, saveError, saveSuccess, hasDirty, handleSave,
  };
};