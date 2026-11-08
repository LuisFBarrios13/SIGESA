// src/lib/queryClient.ts
// Configuración global de TanStack Query (caché de datos del servidor).
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Durante 30 s los datos se consideran "frescos": volver a una página
      // en ese tiempo no repite la petición, muestra lo que ya se tenía.
      staleTime: 30_000,
      // Un reintento ante fallos de red (por defecto serían 3).
      retry: 1,
      // No recargar cada vez que el usuario vuelve a la pestaña del navegador.
      refetchOnWindowFocus: false,
    },
  },
});
