// src/components/acudientes/cuotas.test.ts
import { describe, it, expect } from 'vitest';
import { matriculasPorAnio, prepararCuotas, resumirCuotas, fmtCorto } from './cuotas';
import type { MatriculaResumenAcudiente } from '../../services/acudienteApi';
import type { CuentaCobro } from '../../services/pagosApi';

const mat = (id: number, year: number, estado: MatriculaResumenAcudiente['estado']) =>
  ({ id_matricula: id, year, estado }) as MatriculaResumenAcudiente;

const cuenta = (id: number, concepto: string, mes: number, valor: number, estado: string, pagos: number[] = []) =>
  ({
    id_cuenta: id, mes, year: 2026, valor_deuda: String(valor), estado,
    concepto: { nombre: concepto },
    pagos: pagos.map((m, i) => ({ id_pago: i, monto_pago: String(m) })),
  }) as unknown as CuentaCobro;

describe('matriculasPorAnio', () => {
  it('un botón por año aunque haya dos matrículas del mismo año (prefiere la activa)', () => {
    const r = matriculasPorAnio([mat(12, 2026, 'RETIRADO'), mat(6, 2026, 'ACTIVO'), mat(13, 2027, 'ACTIVO')]);
    expect(r.map((m) => [m.year, m.id_matricula])).toEqual([[2026, 6], [2027, 13]]);
  });
});

describe('prepararCuotas / resumirCuotas', () => {
  const cuotas = prepararCuotas([
    cuenta(3, 'PENSIÓN', 3, 280000, 'PENDIENTE', [100000]),
    cuenta(1, 'MATRÍCULA', 1, 320000, 'PAGADO', [320000]),
    cuenta(2, 'PENSIÓN', 2, 280000, 'VENCIDO'),
  ]);

  it('matrícula primero y pensiones por mes, con saldo', () => {
    expect(cuotas.map((c) => c.nombre)).toEqual(['Matrícula 2026', 'Febrero', 'Marzo']);
    expect(cuotas[2]).toMatchObject({ pagado: 100000, saldo: 180000, corto: 'Mar' });
  });

  it('cuenta estados y la próxima cuota sin pagar', () => {
    const r = resumirCuotas(cuotas);
    expect(r).toMatchObject({ total: 3, pagadas: 1, pendientes: 1, vencidas: 1 });
    expect(r.pensiones).toEqual({ total: 2, pagadas: 0 });
    expect(r.proxima?.nombre).toBe('Febrero');
  });

  it('formato corto', () => {
    expect(fmtCorto(280000)).toBe('280k');
    expect(fmtCorto(1440000)).toBe('1,44 M');
  });
});
