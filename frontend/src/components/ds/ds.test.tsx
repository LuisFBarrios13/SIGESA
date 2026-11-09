// src/components/ds/ds.test.tsx — AppLayout (menú por rol) y DataTable
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext, type AuthContextValue } from '../../contexts/auth-context';
import AppLayout from './AppLayout';
import DataTable, { type Columna } from './DataTable';

afterEach(cleanup);

const conRol = (rol: string, ruta = '/') => {
  const auth = {
    user: { id: 1, username: 'u', nombre: 'Ana Capera', roles: [rol], primerLogin: false },
    token: 't', isAuthenticated: true, isLoading: false, sesionExpirada: false,
    login: vi.fn(), logout: vi.fn(), changePassword: vi.fn(),
  } as AuthContextValue;
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthContext.Provider value={auth}>
        <AppLayout><p>contenido</p></AppLayout>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
  return auth;
};

/** Hay dos <nav> «Menú principal»: [0] lateral, [1] barra del celular. */
const barraMovil = () => screen.getAllByRole('navigation', { name: 'Menú principal' })[1];

describe('AppLayout', () => {
  it('acudiente: su único ítem y «Salir» en la barra del celular', () => {
    const auth = conRol('ACUDIENTE', '/acudiente');
    const barra = within(barraMovil());
    expect(barra.getByRole('link', { name: /Pagos/ })).toHaveProperty('className', expect.stringContaining('bg-vino-suave'));
    fireEvent.click(barra.getByRole('button', { name: /Salir/ }));
    expect(auth.logout).toHaveBeenCalled();
  });

  it('administrador: 3 ítems + «Más» con el resto y cerrar sesión', () => {
    conRol('ADMINISTRADOR');
    const barra = within(barraMovil());
    expect(barra.getAllByRole('link').map((a) => a.textContent)).toEqual(['dashboardInicio', 'groupEstudiantes', 'paymentsPagos']);

    fireEvent.click(barra.getByRole('button', { name: /Más/ }));
    const menu = within(screen.getByRole('dialog', { name: 'Más opciones' }));
    expect(menu.getAllByRole('link').map((a) => a.textContent?.replace(/^\w+?(?=[A-Z])/, ''))).toEqual(
      ['Nueva Matrícula', 'Docentes', 'Deudores'],
    );
    expect(menu.getByRole('button', { name: /Cerrar sesión/ })).toBeTruthy();
  });
});

type Fila = { id: number; concepto: string; mes: string; estado: string };
const COLS: Columna<Fila>[] = [
  { id: 'c', titulo: 'Concepto', celda: (f) => f.concepto, movil: 'titulo' },
  { id: 'm', titulo: 'Periodo',  celda: (f) => f.mes,      movil: 'subtitulo' },
  { id: 'e', titulo: 'Estado',   celda: (f) => <b>{f.estado}</b>, movil: 'extremo' },
];

describe('DataTable', () => {
  it('pinta tabla y lista con las mismas filas, y despliega el detalle', () => {
    render(
      <DataTable columnas={COLS} claveFila={(f) => f.id}
        filas={[{ id: 1, concepto: 'Pensión', mes: 'Marzo', estado: 'Pagado' }, { id: 2, concepto: 'Matrícula', mes: '2026', estado: 'Pendiente' }]}
        detalle={(f) => (f.id === 1 ? <p>Pago del 3 de marzo</p> : null)} />,
    );
    expect(screen.getAllByRole('row')).toHaveLength(3);          // encabezado + 2
    expect(screen.getAllByRole('listitem')).toHaveLength(2);

    // Solo la fila con detalle tiene botón (uno en la tabla y otro en la lista)
    const botones = screen.getAllByRole('button', { name: 'Ver detalle' });
    expect(botones).toHaveLength(2);
    fireEvent.click(botones[0]);
    // Tabla y lista comparten el estado (solo una se ve según el ancho)
    expect(screen.getAllByText('Pago del 3 de marzo')).toHaveLength(2);
    expect(botones[0].getAttribute('aria-expanded')).toBe('true');
  });

  it('sin filas muestra el contenido vacío', () => {
    render(<DataTable columnas={COLS} filas={[]} claveFila={(f) => f.id} vacio={<p>Nada</p>} />);
    expect(screen.getByText('Nada')).toBeTruthy();
  });
});
