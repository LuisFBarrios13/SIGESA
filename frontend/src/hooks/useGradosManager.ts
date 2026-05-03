// src/hooks/useGradosManager.ts
// Single Responsibility: manages all state and side-effects for the grados page.
// The page component stays pure (only renders what this hook provides).

import { useState, useEffect, useCallback } from 'react';
import { gradosManagementApi } from '../services/gradosApi';
import type { GradoConDocente, DocenteConDisponibilidad, JornadaGrado } from '../types/grados';

interface UseGradosManagerReturn {
  // Data
  grados: GradoConDocente[];
  docentes: DocenteConDisponibilidad[];
  isLoading: boolean;
  error: string;

  // Assignment modal state
  assignModal: { open: boolean; grado: GradoConDocente | null };
  openAssignModal: (grado: GradoConDocente) => void;
  closeAssignModal: () => void;

  // Create grado modal state
  createModal: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;

  // Operations
  assignDocente: (id_grado: number, cedula: string | null) => Promise<void>;
  createGrado: (nombre: string, jornada: JornadaGrado) => Promise<void>;
  opLoading: boolean;
  opError: string;

  // Filters
  filterJornada: 'ALL' | JornadaGrado;
  setFilterJornada: (v: 'ALL' | JornadaGrado) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filteredGrados: GradoConDocente[];
}

export const useGradosManager = (): UseGradosManagerReturn => {
  const [grados, setGrados] = useState<GradoConDocente[]>([]);
  const [docentes, setDocentes] = useState<DocenteConDisponibilidad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [assignModal, setAssignModal] = useState<{ open: boolean; grado: GradoConDocente | null }>({
    open: false,
    grado: null,
  });
  const [createModal, setCreateModal] = useState(false);
  const [opLoading, setOpLoading] = useState(false);
  const [opError, setOpError] = useState('');

  const [filterJornada, setFilterJornada] = useState<'ALL' | JornadaGrado>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Load data ────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [g, d] = await Promise.all([
        gradosManagementApi.listar(),
        gradosManagementApi.listarDocentesDisponibilidad(),
      ]);
      setGrados(g);
      setDocentes(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Filters (derived — no extra state) ──────────────────────

  const filteredGrados = grados.filter((g) => {
    const matchesJornada = filterJornada === 'ALL' || g.jornada === filterJornada;
    const matchesSearch = g.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.docente?.nombre ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesJornada && matchesSearch;
  });

  // ── Modal handlers ───────────────────────────────────────────

  const openAssignModal = useCallback((grado: GradoConDocente) => {
    setOpError('');
    setAssignModal({ open: true, grado });
  }, []);

  const closeAssignModal = useCallback(() => {
    setAssignModal({ open: false, grado: null });
    setOpError('');
  }, []);

  const openCreateModal = useCallback(() => {
    setOpError('');
    setCreateModal(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setCreateModal(false);
    setOpError('');
  }, []);

  // ── Operations ───────────────────────────────────────────────

  const assignDocente = useCallback(async (id_grado: number, cedula: string | null) => {
    setOpLoading(true);
    setOpError('');
    try {
      const updated = await gradosManagementApi.asignarDocente(id_grado, { cedula_docente: cedula });
      // Optimistic update: replace the grado in local state
      setGrados((prev) => prev.map((g) => (g.id_grado === id_grado ? { ...updated, tieneDocente: !!updated.id_docente } : g)));
      // Refresh docentes availability
      const d = await gradosManagementApi.listarDocentesDisponibilidad();
      setDocentes(d);
      closeAssignModal();
    } catch (e) {
      setOpError(e instanceof Error ? e.message : 'Error al asignar docente');
    } finally {
      setOpLoading(false);
    }
  }, [closeAssignModal]);

  const createGrado = useCallback(async (nombre: string, jornada: JornadaGrado) => {
    setOpLoading(true);
    setOpError('');
    try {
      const nuevo = await gradosManagementApi.crear(nombre, jornada);
      setGrados((prev) => [...prev, { ...nuevo, tieneDocente: false }].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      closeCreateModal();
    } catch (e) {
      setOpError(e instanceof Error ? e.message : 'Error al crear grado');
    } finally {
      setOpLoading(false);
    }
  }, [closeCreateModal]);

  return {
    grados,
    docentes,
    isLoading,
    error,
    assignModal,
    openAssignModal,
    closeAssignModal,
    createModal,
    openCreateModal,
    closeCreateModal,
    assignDocente,
    createGrado,
    opLoading,
    opError,
    filterJornada,
    setFilterJornada,
    searchQuery,
    setSearchQuery,
    filteredGrados,
  };
};