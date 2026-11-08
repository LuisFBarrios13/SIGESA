// src/hooks/usePagos.ts
// Single Responsibility: todo el estado de la página de pagos.
// Lecturas con useQuery y escrituras con useMutation (TanStack Query);
// aquí solo queda el estado propio de la pantalla (búsqueda, selección, modal).

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
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

const SIN_METODOS: MetodoPago[] = [];
const SIN_RESULTADOS: MatriculaResumen[] = [];
const MIN_BUSQUEDA = 2;
const ESPERA_BUSQUEDA_MS = 350;

const mensaje = (err: unknown, porDefecto: string) =>
  err instanceof Error ? err.message : porDefecto;

/** Devuelve `valor` solo cuando deja de cambiar durante `ms` milisegundos. */
const useDebounced = <T,>(valor: T, ms: number): T => {
  const [estable, setEstable] = useState(valor);
  useEffect(() => {
    const id = setTimeout(() => setEstable(valor), ms);
    return () => clearTimeout(id);
  }, [valor, ms]);
  return estable;
};

export const usePagos = (): UsePagosReturn => {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery]             = useState('');
  const [yearFilter, setYearFilter]               = useState(new Date().getFullYear());
  const [selectedMatricula, setSelectedMatricula] = useState<MatriculaResumen | null>(null);
  const [modal, setModal]                         = useState<ModalKind>(null);
  const [estadoFilter, setEstadoFilter]           = useState<EstadoCuenta | 'TODOS'>('TODOS');

  // ── Lecturas ─────────────────────────────────────────────────

  const metodosQuery = useQuery({
    queryKey:  queryKeys.pagos.metodos,
    queryFn:   pagosApi.getMetodos,
    staleTime: Infinity, // catálogo fijo
  });

  const tarifaQuery = useQuery({
    queryKey: queryKeys.pagos.tarifa(yearFilter),
    queryFn:  () => pagosApi.getTarifa(yearFilter),
  });

  // Búsqueda: se consulta cuando el usuario deja de escribir.
  const busqueda       = searchQuery.trim();
  const busquedaEstable = useDebounced(busqueda, ESPERA_BUSQUEDA_MS);
  const busquedaQuery  = useQuery({
    queryKey: queryKeys.pagos.buscar(busquedaEstable, yearFilter),
    queryFn:  () => pagosApi.buscarMatriculas(busquedaEstable, yearFilter),
    enabled:  busquedaEstable.length >= MIN_BUSQUEDA,
  });
  const busquedaActiva = busqueda.length >= MIN_BUSQUEDA;

  const resumenQuery = useQuery({
    queryKey: queryKeys.pagos.resumen(selectedMatricula?.id_matricula ?? 0),
    queryFn:  () => pagosApi.getResumen(selectedMatricula!.id_matricula),
    enabled:  !!selectedMatricula,
  });

  // ── Escrituras ───────────────────────────────────────────────

  /** Tras un pago o cuentas nuevas: todo lo que muestra deudas queda viejo. */
  const invalidarDeudas = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.pagos.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.deudores.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.acudiente.all }),
  ]);

  const pagoMutation = useMutation({
    mutationFn: pagosApi.registrarPago,
    onSuccess:  async () => { await invalidarDeudas(); setModal(null); },
  });

  const pensionMutation = useMutation({
    mutationFn: ({ id, year }: { id: number; year: number }) => pagosApi.generarPension(id, year),
    onSuccess:  invalidarDeudas,
  });

  const cuentaMatriculaMutation = useMutation({
    mutationFn: ({ id, year }: { id: number; year: number }) => pagosApi.crearCuentaMatricula(id, year),
    onSuccess:  invalidarDeudas,
  });

  const tarifaMutation = useMutation({
    mutationFn: ({ year, pension, matricula }: { year: number; pension: number; matricula: number }) =>
      pagosApi.upsertTarifa(year, pension, matricula),
    onSuccess: (guardada, { year }) => {
      queryClient.setQueryData(queryKeys.pagos.tarifa(year), guardada);
      setModal(null);
    },
  });

  const mutaciones = [pagoMutation, pensionMutation, cuentaMatriculaMutation, tarifaMutation];
  const limpiarErrores = () => mutaciones.forEach((m) => m.reset());

  const errores: [unknown, string][] = [
    [pagoMutation.error,            'Error al registrar el pago'],
    [pensionMutation.error,         'Error al generar pensiones'],
    [cuentaMatriculaMutation.error, 'Error al crear cuenta de matrícula'],
    [tarifaMutation.error,          'Error al guardar la tarifa'],
  ];
  const opError = errores.filter(([e]) => e).map(([e, def]) => mensaje(e, def))[0] ?? '';

  /** mutateAsync sin propagar el error: ya queda visible en opError. */
  const ejecutar = async (fn: () => Promise<unknown>) => {
    limpiarErrores();
    try { await fn(); } catch { /* se muestra vía opError */ }
  };

  // ── Selección y modales ──────────────────────────────────────

  const selectMatricula = (m: MatriculaResumen) => {
    setSelectedMatricula(m);
    setSearchQuery('');
    setEstadoFilter('TODOS');
  };

  const clearSelection = () => {
    setSelectedMatricula(null);
    setModal(null);
    limpiarErrores();
  };

  const tarifa = tarifaQuery.data ?? null;

  const openPagoModal   = (cuenta: CuentaCobro) => { limpiarErrores(); setModal({ type: 'pago', cuenta }); };
  const openTarifaModal = () => { limpiarErrores(); setModal({ type: 'tarifa', year: yearFilter, tarifa }); };
  const closeModal      = () => { setModal(null); limpiarErrores(); };

  // ── Operaciones ──────────────────────────────────────────────

  const registrarPago = (monto: number, id_metodo: number, fecha?: string, obs?: string) => {
    if (modal?.type !== 'pago') return Promise.resolve();
    const { id_cuenta } = modal.cuenta;
    return ejecutar(() => pagoMutation.mutateAsync({
      id_cuenta, monto_pago: monto, id_metodo_pago: id_metodo, fecha_pago: fecha, observaciones: obs,
    }));
  };

  const generarPension = () => {
    if (!selectedMatricula) return Promise.resolve();
    return ejecutar(() => pensionMutation.mutateAsync({ id: selectedMatricula.id_matricula, year: yearFilter }));
  };

  const crearMatricula = () => {
    if (!selectedMatricula) return Promise.resolve();
    return ejecutar(() => cuentaMatriculaMutation.mutateAsync({ id: selectedMatricula.id_matricula, year: yearFilter }));
  };

  const saveTarifa = (valor_pension: number, valor_matricula: number) =>
    ejecutar(() => tarifaMutation.mutateAsync({ year: yearFilter, pension: valor_pension, matricula: valor_matricula }));

  // ── Derivados ────────────────────────────────────────────────

  const resumen = selectedMatricula ? (resumenQuery.data ?? null) : null;
  const cuentasFiltradas = (resumen?.cuentas ?? []).filter((c) =>
    estadoFilter === 'TODOS' || c.estado === estadoFilter,
  );

  return {
    searchQuery, setSearchQuery,
    yearFilter, setYearFilter,
    searchResults: busquedaActiva ? (busquedaQuery.data ?? SIN_RESULTADOS) : SIN_RESULTADOS,
    // También "buscando" mientras se espera a que el usuario deje de escribir.
    isSearching:   busquedaActiva && (busqueda !== busquedaEstable || busquedaQuery.isFetching),
    selectedMatricula, resumen,
    isLoadingResumen: resumenQuery.isLoading,
    selectMatricula, clearSelection,
    metodos:      metodosQuery.data ?? SIN_METODOS,
    metodosError: metodosQuery.error ? 'No se pudieron cargar los métodos de pago.' : '',
    tarifa,
    isTarifaLoading: tarifaQuery.isLoading,
    openTarifaModal,
    modal, openPagoModal, closeModal,
    opLoading: mutaciones.some((m) => m.isPending),
    opError,
    registrarPago, generarPension, crearMatricula, saveTarifa,
    estadoFilter, setEstadoFilter, cuentasFiltradas,
  };
};
