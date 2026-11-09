// src/test/wrapper.tsx
// Proveedor de TanStack Query para tests de hooks: una caché nueva por test
// y sin reintentos (un error debe verse de inmediato). Incluye un router en
// memoria porque algunos hooks guardan estado en la URL.
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

/** @param ruta URL inicial, p. ej. '/?periodo=2&matricula=7' */
export const crearWrapper = (ruta = '/') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[ruta]}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
  return { Wrapper, queryClient };
};
