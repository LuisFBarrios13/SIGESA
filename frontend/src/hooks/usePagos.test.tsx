// src/hooks/usePagos.test.tsx — registrar pagos y efecto sobre otras pantallas
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { crearWrapper } from '../test/wrapper';
import { queryKeys } from '../lib/queryKeys';
import type { CuentaCobro, MatriculaResumen } from '../services/pagosApi';

const api = vi.hoisted(() => ({
  getMetodos:           vi.fn(),
  getTarifa:            vi.fn(),
  buscarMatriculas:     vi.fn(),
  getResumen:           vi.fn(),
  registrarPago:        vi.fn(),
  generarPension:       vi.fn(),
  crearCuentaMatricula: vi.fn(),
  upsertTarifa:         vi.fn(),
}));
vi.mock('../services/pagosApi', () => ({ pagosApi: api }));

import { usePagos } from './usePagos';

const MATRICULA = { id_matricula: 7 } as unknown as MatriculaResumen;
const CUENTA    = { id_cuenta: 55, estado: 'PENDIENTE' } as unknown as CuentaCobro;

const montar = async () => {
  const { Wrapper, queryClient } = crearWrapper();
  const hook = renderHook(() => usePagos(), { wrapper: Wrapper });
  act(() => hook.result.current.selectMatricula(MATRICULA));
  await waitFor(() => expect(hook.result.current.resumen).not.toBeNull());
  return { ...hook, queryClient };
};

describe('usePagos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getMetodos.mockResolvedValue([{ id_metodo: 1, nombre: 'EFECTIVO' }]);
    api.getTarifa.mockResolvedValue(null);
    api.getResumen.mockResolvedValue({ cuentas: [CUENTA], totales: {} });
    api.registrarPago.mockResolvedValue({ estado: 'PAGADO' });
  });

  it('registrar un pago lo envía, cierra el modal y marca deudores/dashboard como viejos', async () => {
    const { result, queryClient } = await montar();
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries');

    act(() => result.current.openPagoModal(CUENTA));
    await act(() => result.current.registrarPago(50000, 1, '2026-03-01'));

    expect(api.registrarPago).toHaveBeenCalledWith({
      id_cuenta: 55, monto_pago: 50000, id_metodo_pago: 1, fecha_pago: '2026-03-01', observaciones: undefined,
    });
    expect(result.current.modal).toBeNull();
    const claves = invalidar.mock.calls.map(([f]) => f?.queryKey);
    expect(claves).toEqual(expect.arrayContaining([
      queryKeys.pagos.all, queryKeys.deudores.all, queryKeys.dashboard.all, queryKeys.acudiente.all,
    ]));
  });

  it('si el backend rechaza el pago, el modal sigue abierto con el error', async () => {
    api.registrarPago.mockRejectedValue(new Error('El monto supera el saldo pendiente'));
    const { result } = await montar();

    act(() => result.current.openPagoModal(CUENTA));
    await act(() => result.current.registrarPago(999999, 1));

    await waitFor(() => expect(result.current.opError).toBe('El monto supera el saldo pendiente'));
    expect(result.current.modal).not.toBeNull();
    expect(result.current.opLoading).toBe(false);

    // Cerrar el modal limpia el error
    act(() => result.current.closeModal());
    expect(result.current.opError).toBe('');
  });
});
