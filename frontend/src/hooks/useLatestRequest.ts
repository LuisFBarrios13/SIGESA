// src/hooks/useLatestRequest.ts
import { useCallback, useRef } from 'react';

/**
 * Evita que una respuesta vieja pise a una más nueva.
 *
 * Ejemplo: el usuario cambia el año 2025 → 2026. Si la petición de 2025
 * tarda más y llega de última, sin esta protección se mostrarían sus datos
 * con "2026" seleccionado.
 *
 * Uso:
 *   const startRequest = useLatestRequest();
 *   const isLatest = startRequest();
 *   const data = await api.get(...);
 *   if (!isLatest()) return;   // llegó otra petición después: ignorar
 *   setData(data);
 */
export const useLatestRequest = () => {
  const lastId = useRef(0);

  return useCallback(() => {
    const id = ++lastId.current;
    return () => id === lastId.current;
  }, []);
};
