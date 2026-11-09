// src/hooks/useRestablecerClave.ts
// Restablecer la contraseña de un docente o de un acudiente (solo administrador).
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { clavesApi } from '../services/api';

export interface ObjetivoClave {
  tipo:   'docente' | 'acudiente';
  cedula: string;
  nombre: string;
}

export const useRestablecerClave = () => {
  const [objetivo, setObjetivo] = useState<ObjetivoClave | null>(null);

  const mutation = useMutation({
    mutationFn: (o: ObjetivoClave) => clavesApi.restablecer(o.tipo, o.cedula),
  });

  return {
    objetivo,
    /** Abre la confirmación. */
    pedir: (o: ObjetivoClave) => { mutation.reset(); setObjetivo(o); },
    confirmar: () => { if (objetivo) mutation.mutate(objetivo); },
    cerrar: () => { setObjetivo(null); mutation.reset(); },
    isLoading:    mutation.isPending,
    error:        mutation.error instanceof Error ? mutation.error.message : '',
    /** Credenciales nuevas (cuando ya se restableció). */
    credenciales: mutation.data ?? null,
  };
};
