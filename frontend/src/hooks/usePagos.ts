// src/hooks/usePagos.ts
// Single Responsibility: all pagos state + side-effects live here.

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  pagosApi,
  type Tarifa,
  type MetodoPago,
  type ResumenPagos,
  type MatriculaResumen,
  type CuentaCobro,
  type EstadoCuenta,
} from '../services/pagosApi';

export type ModalKind =
  | { type: 'pago'; cuenta: CuentaCobro }
  | { type: 'tarifa'; year: number; tarifa: Tarifa | null }
  | null;

interface UsePagosReturn {
  // Search
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  yearFilter: number;
  setYearFilter: (v: number) => void;
  searchResults: MatriculaResumen[];
  isSearching: boolean;

  // Selected matricula
  selectedMatricula: MatriculaResumen | null;
  resumen: ResumenPagos | null;
  isLoadingResumen: boolean;
  selectMatricula: (m: MatriculaResumen) => void;
  clearSelection: () => void;

  // Reference data
  metodos: MetodoPago[];
  metodosError: string;

  // Tarifa global
  tarifa: Tarifa | null;
  isTarifaLoading: boolean;
  openTarifaModal: () => void;

  // Modal
  modal: ModalKind;
  openPagoModal: (cuenta: CuentaCobro) => void;
  closeModal: () => void;

  // Operations
  opLoading: boolean;
  opError: string;
  registrarPago: (monto: number, id_metodo: number, fecha?: string, obs?: string) => Promise<void>;
  generarPension: () => Promise<void>;
  crearMatricula: () => Promise<void>;
  saveTarifa: (valor_pension: number, valor_matricula: number) => Promise<void>;

  // Estado filter
  estadoFilter: EstadoCuenta | 'TODOS';
  setEstadoFilter: (v: EstadoCuenta | 'TODOS') => void;
  cuentasFiltradas: CuentaCobro[];
}

export const usePagos = (): UsePagosReturn => {
  const [searchQuery, setSearchQuery]           = useState('');
  const [yearFilter, setYearFilter]             = useState(new Date().getFullYear());
  const [searchResults, setSearchResults]       = useState<MatriculaResumen[]>([]);
  const [isSearching, setIsSearching]           = useState(false);

  const [selectedMatricula, setSelectedMatricula] = useState<MatriculaResumen | null>(null);
  const [resumen, setResumen]                   = useState<ResumenPagos | null>(null);
  const [isLoadingResumen, setIsLoadingResumen] = useState(false);

  const [metodos, setMetodos]                   = useState<MetodoPago[]>([]);
  const [metodosError, setMetodosError]         = useState('');

  const [tarifa, setTarifa]                     = useState<Tarifa | null>(null);
  const [isTarifaLoading, setIsTarifaLoading]   = useState(false);

  const [modal, setModal]                       = useState<ModalKind>(null);
  const [opLoading, setOpLoading]               = useState(false);
  const [opError, setOpError]                   = useState('');

  const [estadoFilter, setEstadoFilter]         = useState<EstadoCuenta | 'TODOS'>('TODOS');

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Bootstrap ────────────────────────────────────────────────

  useEffect(() => {
    pagosApi.getMetodos()
      .then(setMetodos)
      .catch(() => setMetodosError('No se pudieron cargar los métodos de pago.'));
  }, []);

  // ── Load tarifa when year changes ────────────────────────────

  useEffect(() => {
    setIsTarifaLoading(true);
    pagosApi.getTarifa(yearFilter)
      .then(setTarifa)
      .catch(() => setTarifa(null))
      .finally(() => setIsTarifaLoading(false));
  }, [yearFilter]);

  // ── Debounced search ─────────────────────────────────────────

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await pagosApi.buscarMatriculas(searchQuery.trim(), yearFilter);
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery, yearFilter]);

  // ── Load resumen when matricula selected ─────────────────────

  const selectMatricula = useCallback(async (m: MatriculaResumen) => {
    setSelectedMatricula(m);
    setSearchQuery('');
    setSearchResults([]);
    setIsLoadingResumen(true);
    setEstadoFilter('TODOS');
    try {
      const data = await pagosApi.getResumen(m.id_matricula);
      setResumen(data);
    } catch {
      setResumen(null);
    } finally {
      setIsLoadingResumen(false);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedMatricula(null);
    setResumen(null);
    setModal(null);
    setOpError('');
  }, []);

  const refreshResumen = useCallback(async () => {
    if (!selectedMatricula) return;
    const data = await pagosApi.getResumen(selectedMatricula.id_matricula);
    setResumen(data);
  }, [selectedMatricula]);

  // ── Modals ───────────────────────────────────────────────────

  const openPagoModal    = useCallback((cuenta: CuentaCobro) => {
    setOpError('');
    setModal({ type: 'pago', cuenta });
  }, []);

  const openTarifaModal  = useCallback(() => {
    setOpError('');
    setModal({ type: 'tarifa', year: yearFilter, tarifa });
  }, [yearFilter, tarifa]);

  const closeModal       = useCallback(() => { setModal(null); setOpError(''); }, []);

  // ── Operations ───────────────────────────────────────────────

  const registrarPago = useCallback(async (
    monto: number, id_metodo: number, fecha?: string, obs?: string,
  ) => {
    if (modal?.type !== 'pago') return;
    setOpLoading(true); setOpError('');
    try {
      await pagosApi.registrarPago({
        id_cuenta: modal.cuenta.id_cuenta,
        monto_pago: monto,
        id_metodo_pago: id_metodo,
        fecha_pago: fecha,
        observaciones: obs,
      });
      await refreshResumen();
      closeModal();
    } catch (e) {
      setOpError(e instanceof Error ? e.message : 'Error al registrar el pago');
    } finally {
      setOpLoading(false);
    }
  }, [modal, refreshResumen, closeModal]);

  const generarPension = useCallback(async () => {
    if (!selectedMatricula) return;
    setOpLoading(true); setOpError('');
    try {
      await pagosApi.generarPension(selectedMatricula.id_matricula, yearFilter);
      await refreshResumen();
    } catch (e) {
      setOpError(e instanceof Error ? e.message : 'Error al generar pensiones');
    } finally {
      setOpLoading(false);
    }
  }, [selectedMatricula, yearFilter, refreshResumen]);

  const crearMatricula = useCallback(async () => {
    if (!selectedMatricula) return;
    setOpLoading(true); setOpError('');
    try {
      await pagosApi.crearCuentaMatricula(selectedMatricula.id_matricula, yearFilter);
      await refreshResumen();
    } catch (e) {
      setOpError(e instanceof Error ? e.message : 'Error al crear cuenta de matrícula');
    } finally {
      setOpLoading(false);
    }
  }, [selectedMatricula, yearFilter, refreshResumen]);

  const saveTarifa = useCallback(async (valor_pension: number, valor_matricula: number) => {
    setOpLoading(true); setOpError('');
    try {
      const saved = await pagosApi.upsertTarifa(yearFilter, valor_pension, valor_matricula);
      setTarifa(saved);
      closeModal();
    } catch (e) {
      setOpError(e instanceof Error ? e.message : 'Error al guardar la tarifa');
    } finally {
      setOpLoading(false);
    }
  }, [yearFilter, closeModal]);

  // ── Derived: filtered cuentas ────────────────────────────────

  const cuentasFiltradas = (resumen?.cuentas ?? []).filter((c) =>
    estadoFilter === 'TODOS' || c.estado === estadoFilter,
  );

  return {
    searchQuery, setSearchQuery,
    yearFilter, setYearFilter,
    searchResults, isSearching,
    selectedMatricula, resumen, isLoadingResumen,
    selectMatricula, clearSelection,
    metodos, metodosError,
    tarifa, isTarifaLoading, openTarifaModal,
    modal, openPagoModal, closeModal,
    opLoading, opError,
    registrarPago, generarPension, crearMatricula, saveTarifa,
    estadoFilter, setEstadoFilter, cuentasFiltradas,
  };
};