import { describe, it, expect } from 'vitest';
import { dineroCorto, documento, iniciales, listaY, fechaEncabezado, saludo } from './formato';

describe('formato', () => {
  it('dinero corto en millones, miles y pesos', () => {
    expect(dineroCorto(45_200_000)).toBe('$45,2 M');
    expect(dineroCorto(8_000_000)).toBe('$8 M');
    expect(dineroCorto(980_000)).toBe('$980 mil');
    expect(dineroCorto(500)).toBe('$500');
    expect(dineroCorto(0)).toBe('$0');
  });

  it('documento con puntos solo si es numérico', () => {
    expect(documento('1034567210')).toBe('1.034.567.210');
    expect(documento('AB-12')).toBe('AB-12');
  });

  it('iniciales del primer y último nombre', () => {
    expect(iniciales('Juan Esteban Mora')).toBe('JM');
    expect(iniciales('ana')).toBe('A');
    expect(iniciales('  ')).toBe('?');
  });

  it('lista con "y"', () => {
    expect(listaY(['abril'])).toBe('abril');
    expect(listaY(['abril', 'junio', 'octubre'])).toBe('abril, junio y octubre');
  });

  it('fecha y saludo', () => {
    const d = new Date(2026, 10, 15, 9);
    expect(fechaEncabezado(d)).toBe('DOMINGO · 15 DE NOVIEMBRE');
    expect(saludo(d)).toBe('Buenos días');
    expect(saludo(new Date(2026, 10, 15, 15))).toBe('Buenas tardes');
    expect(saludo(new Date(2026, 10, 15, 21))).toBe('Buenas noches');
  });
});
