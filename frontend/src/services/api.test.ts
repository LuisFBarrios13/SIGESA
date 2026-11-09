// src/services/api.test.ts — cliente HTTP: sesión vencida y errores de red
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, saveToken, removeToken, suscribirSesionExpirada, tokenVencido } from './api';

/** JWT falso (sin firma válida) con el exp indicado, en segundos. */
const jwtCon = (exp: number) =>
  `x.${btoa(JSON.stringify({ exp })).replace(/=+$/, '')}.y`;

const responder = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

describe('api', () => {
  beforeEach(() => removeToken());
  afterEach(() => vi.unstubAllGlobals());

  it('devuelve data cuando la respuesta es correcta', async () => {
    vi.stubGlobal('fetch', responder(200, { success: true, message: 'OK', data: { a: 1 } }));
    await expect(api.get('/x')).resolves.toEqual({ a: 1 });
  });

  it('usa el mensaje del backend en los errores', async () => {
    vi.stubGlobal('fetch', responder(400, { success: false, message: 'El monto debe ser mayor a 0' }));
    await expect(api.post('/pagos', {})).rejects.toThrow('El monto debe ser mayor a 0');
  });

  it('401 con sesión iniciada: avisa que la sesión expiró', async () => {
    saveToken('token-cualquiera');
    const alExpirar = vi.fn();
    const desuscribir = suscribirSesionExpirada(alExpirar);
    vi.stubGlobal('fetch', responder(401, { success: false, message: 'Token inválido o expirado' }));

    await expect(api.get('/x')).rejects.toThrow('Tu sesión expiró');
    expect(alExpirar).toHaveBeenCalledOnce();
    desuscribir();
  });

  it('401 sin sesión (login fallido) no se trata como sesión vencida', async () => {
    const alExpirar = vi.fn();
    const desuscribir = suscribirSesionExpirada(alExpirar);
    vi.stubGlobal('fetch', responder(401, { success: false, message: 'Credenciales inválidas' }));

    await expect(api.post('/auth/login', {})).rejects.toThrow('Credenciales inválidas');
    expect(alExpirar).not.toHaveBeenCalled();
    desuscribir();
  });

  it('servidor apagado: mensaje claro', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(api.get('/x')).rejects.toThrow('No se pudo conectar con el servidor');
  });

  it('respuesta que no es JSON: no rompe', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>502</html>', { status: 502 })));
    await expect(api.get('/x')).rejects.toThrow('Error en la solicitud (502)');
  });
});

describe('tokenVencido', () => {
  it('distingue tokens vigentes, vencidos y malformados', () => {
    const ahora = Math.floor(Date.now() / 1000);
    expect(tokenVencido(jwtCon(ahora + 3600))).toBe(false);
    expect(tokenVencido(jwtCon(ahora - 1))).toBe(true);
    expect(tokenVencido('basura')).toBe(true);
  });
});
