// src/hooks/useGestionMatricula.ts
// Rematricular, retirar y reactivar estudiantes desde la página de Estudiantes.
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gradosApi, matriculasApi, type EstudianteListItem, type Grado } from '../services/api';
import type { MatriculaListItem } from '../types/matriculas';
import { queryKeys } from '../lib/queryKeys';

export type AccionMatricula =
  | { tipo: 'matricular'; estudiante: EstudianteListItem }
  | { tipo: 'estado'; estudiante: EstudianteListItem; matricula: MatriculaListItem; estado: 'ACTIVO' | 'RETIRADO' }
  | null;

const SIN_GRADOS: Grado[] = [];
const mensaje = (e: unknown) => (e instanceof Error ? e.message : 'No se pudo completar la acción');

export const useGestionMatricula = () => {
  const queryClient = useQueryClient();
  const [accion, setAccion] = useState<AccionMatricula>(null);
  const [aviso,  setAviso]  = useState('');

  const gradosQuery = useQuery({ queryKey: queryKeys.grados, queryFn: gradosApi.listar, staleTime: Infinity });

  /** Una matrícula cambió: todo lo que muestra estudiantes, cuentas o deudas queda viejo. */
  const invalidar = () => Promise.all(
    [queryKeys.estudiantes.all, queryKeys.dashboard.all, queryKeys.deudores.all,
     queryKeys.pagos.all, queryKeys.miGrado.all, queryKeys.acudiente.all]
      .map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );

  const matricularMutation = useMutation({
    mutationFn: (p: { id_estudiante: string; id_grado: number; year: number }) => matriculasApi.rematricular(p),
    onSuccess: async (m, p) => {
      await invalidar();
      const nombre = accion?.estudiante.nombre ?? p.id_estudiante;
      setAviso(`${nombre} quedó matriculado en ${m.grado?.nombre ?? 'el grado elegido'} para ${m.year}. ` +
        'Recuerda generar sus cuentas en Pagos.');
      setAccion(null);
    },
  });

  const estadoMutation = useMutation({
    mutationFn: (p: { id_matricula: number; estado: 'ACTIVO' | 'RETIRADO' }) =>
      matriculasApi.cambiarEstado(p.id_matricula, p.estado),
    onSuccess: async (r, p) => {
      await invalidar();
      const nombre = accion?.estudiante.nombre ?? '';
      setAviso(p.estado === 'RETIRADO'
        ? `${nombre} fue retirado.${r.cuentasEliminadas ? ` Se eliminaron ${r.cuentasEliminadas} pensiones futuras sin pagar.` : ''}`
        : `${nombre} fue reactivado. Si faltan pensiones, genéralas de nuevo en Pagos.`);
      setAccion(null);
    },
  });

  const abrir = (a: Exclude<AccionMatricula, null>) => {
    matricularMutation.reset();
    estadoMutation.reset();
    setAccion(a);
  };

  return {
    accion,
    cerrar: () => setAccion(null),
    grados:      gradosQuery.data ?? SIN_GRADOS,
    gradosListos: !!gradosQuery.data,

    abrirMatricular: (estudiante: EstudianteListItem) => abrir({ tipo: 'matricular', estudiante }),
    abrirCambioEstado: (estudiante: EstudianteListItem, matricula: MatriculaListItem) =>
      abrir({ tipo: 'estado', estudiante, matricula, estado: matricula.estado === 'ACTIVO' ? 'RETIRADO' : 'ACTIVO' }),

    matricular: (datos: { id_grado: number; year: number }) => {
      if (accion?.tipo !== 'matricular') return;
      matricularMutation.mutate({ id_estudiante: accion.estudiante.numero_identidad, ...datos });
    },
    confirmarEstado: () => {
      if (accion?.tipo !== 'estado') return;
      estadoMutation.mutate({ id_matricula: accion.matricula.id_matricula, estado: accion.estado });
    },

    isLoading: matricularMutation.isPending || estadoMutation.isPending,
    error:     matricularMutation.error ? mensaje(matricularMutation.error)
             : estadoMutation.error     ? mensaje(estadoMutation.error) : '',
    aviso,
    cerrarAviso: () => setAviso(''),
  };
};
