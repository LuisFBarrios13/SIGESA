// src/components/iconos.tsx — íconos de línea del panel (24×24, trazo 1.8).
import type { ReactNode, SVGProps } from 'react';

type Props = { tam?: number } & Omit<SVGProps<SVGSVGElement>, 'width' | 'height'>;

function Icono({ tam = 18, children, ...resto }: Props & { children: ReactNode }) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...resto}
    >
      {children}
    </svg>
  );
}

export const Casa = (p: Props) => (
  <Icono {...p}><path d="M4 10.5 12 4l8 6.5" /><path d="M6 9v10h12V9" /><path d="M10 19v-5h4v5" /></Icono>
);
export const Estudiantes = (p: Props) => (
  <Icono {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2" /><path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.6" /><path d="M17.5 13.9c1.8.6 3 2.4 3 4.6" /></Icono>
);
export const Documento = (p: Props) => (
  <Icono {...p}><path d="M6 3h8l4 4v14H6Z" /><path d="M14 3v4h4" /><path d="M9 12h6M9 16h6" /></Icono>
);
export const Persona = (p: Props) => (
  <Icono {...p}><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20c0-3.6 2.9-6.2 6.5-6.2s6.5 2.6 6.5 6.2" /></Icono>
);
export const Grilla = (p: Props) => (
  <Icono {...p}><rect x="4" y="4" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" /></Icono>
);
export const Alerta = (p: Props) => (
  <Icono {...p}><path d="M12 4 2.8 19.5h18.4Z" /><path d="M12 10v4.2" /><path d="M12 17.2v.1" /></Icono>
);
export const Tarjeta = (p: Props) => (
  <Icono {...p}><rect x="3" y="6" width="18" height="12.5" rx="2" /><path d="M3 10h18M7 15h3" /></Icono>
);
export const Barras = (p: Props) => (
  <Icono {...p}><path d="M4 4v16h16" /><path d="M8.5 16v-5M12.5 16V8M16.5 16v-3" /></Icono>
);
export const Familia = (p: Props) => (
  <Icono {...p}><circle cx="8" cy="8" r="2.8" /><circle cx="16" cy="8" r="2.8" /><path d="M3 18.5c0-2.8 2.2-4.8 5-4.8s5 2 5 4.8" /><path d="M13.5 14.1c.8-.3 1.6-.4 2.5-.4 2.8 0 5 2 5 4.8" /></Icono>
);
export const Buscar = (p: Props) => (
  <Icono {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></Icono>
);
export const Campana = (p: Props) => (
  <Icono {...p}><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15Z" /><path d="M10 20.5a2.2 2.2 0 0 0 4 0" /></Icono>
);
export const Sol = (p: Props) => (
  <Icono strokeWidth={2.2} {...p}><circle cx="12" cy="12" r="6" /></Icono>
);
export const SolRayos = (p: Props) => (
  <Icono {...p}><circle cx="12" cy="12" r="3.8" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></Icono>
);
export const Luna = (p: Props) => (
  <Icono {...p}><path d="M19 15.5A8 8 0 0 1 9.5 5a8 8 0 1 0 9.5 10.5Z" /></Icono>
);
export const ChevronAbajo = (p: Props) => (
  <Icono {...p}><path d="m6 9 6 6 6-6" /></Icono>
);
export const ChevronDerecha = (p: Props) => (
  <Icono {...p}><path d="m9 6 6 6-6 6" /></Icono>
);
export const Recargar = (p: Props) => (
  <Icono {...p}><path d="M19.5 12A7.5 7.5 0 1 1 17 6.4" /><path d="M19.5 4v4.5H15" /></Icono>
);
export const Billete = (p: Props) => (
  <Icono {...p}><rect x="3" y="6" width="18" height="12" rx="1.5" /><circle cx="12" cy="12" r="2.5" /><path d="M6.5 9.5v5M17.5 9.5v5" /></Icono>
);
export const Mas = (p: Props) => (
  <Icono {...p}><path d="M12 5v14M5 12h14" /></Icono>
);
export const Rotar = (p: Props) => (
  <Icono {...p}><path d="M5 9a7.5 7.5 0 0 1 13.2-2.3L20 8.5" /><path d="M20 4.5v4h-4" /><path d="M19 15a7.5 7.5 0 0 1-13.2 2.3L4 15.5" /><path d="M4 19.5v-4h4" /></Icono>
);
export const Llave = (p: Props) => (
  <Icono {...p}><circle cx="8" cy="15" r="4" /><path d="m11 12 8.5-8.5M16 7l2.5 2.5M14 9l2 2" /></Icono>
);
export const Salir = (p: Props) => (
  <Icono {...p}><path d="M10 4H5v16h5" /><path d="M14 8l4 4-4 4M18 12H9" /></Icono>
);
export const Puntos = (p: Props) => (
  <Icono {...p}><path d="M6 12h.01M12 12h.01M18 12h.01" strokeWidth={2.6} /></Icono>
);
export const Calendario = (p: Props) => (
  <Icono {...p}><rect x="4" y="5.5" width="16" height="14.5" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></Icono>
);
export const Check = (p: Props) => (
  <Icono {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Icono>
);

/** Libro relleno del logo de SIGESA. */
export const Libro = ({ tam = 22 }: { tam?: number }) => (
  <svg width={tam} height={tam} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M3 5.5c2.8-1.2 5.8-1.1 8 .6v13c-2.2-1.6-5.2-1.8-8-.6Z" />
    <path d="M21 5.5c-2.8-1.2-5.8-1.1-8 .6v13c2.2-1.6 5.2-1.8 8-.6Z" />
  </svg>
);

/* ── Estudiantes ─────────────────────────────────────────────── */
export const CheckCirculo = (p: Props) => (
  <Icono {...p}><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.3 2.4 2.4 4.6-4.9" /></Icono>
);
export const PersonaX = (p: Props) => (
  <Icono {...p}><circle cx="9.5" cy="8" r="3.5" /><path d="M3 20c0-3.6 2.9-6.2 6.5-6.2 1.4 0 2.6.4 3.6 1" /><path d="m16 14 4.5 4.5M20.5 14 16 18.5" /></Icono>
);
export const PersonaCheck = (p: Props) => (
  <Icono {...p}><circle cx="9.5" cy="8" r="3.5" /><path d="M3 20c0-3.6 2.9-6.2 6.5-6.2 1.4 0 2.6.4 3.6 1" /><path d="m15 17 2 2 4-4.5" /></Icono>
);
export const PersonaMenos = (p: Props) => (
  <Icono {...p}><circle cx="9.5" cy="8" r="3.5" /><path d="M3 20c0-3.6 2.9-6.2 6.5-6.2 1.4 0 2.6.4 3.6 1" /><path d="M15.5 16.5h5" /></Icono>
);
export const PersonaMas = (p: Props) => (
  <Icono {...p}><circle cx="9.5" cy="8" r="3.5" /><path d="M3 20c0-3.6 2.9-6.2 6.5-6.2 1.4 0 2.6.4 3.6 1" /><path d="M18 13.5v6M15 16.5h6" /></Icono>
);
export const Birrete = (p: Props) => (
  <Icono {...p}><path d="M2.5 9.5 12 5l9.5 4.5L12 14Z" /><path d="M6.5 11.5V16c1.5 1.5 3.4 2.2 5.5 2.2s4-.7 5.5-2.2v-4.5" /><path d="M21.5 9.5v5" /></Icono>
);
export const Lapiz = (p: Props) => (
  <Icono {...p}><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16Z" /><path d="m13.5 6.5 4 4" /></Icono>
);
export const Lista = (p: Props) => (
  <Icono {...p}><path d="M5 7h14M5 12h14M5 17h14" /></Icono>
);
export const Bandera = (p: Props) => (
  <Icono {...p}><path d="M5 21V4" /><path d="M5 4.5h11l-2 3.5 2 3.5H5" /></Icono>
);
export const Atardecer = (p: Props) => (
  <Icono {...p}><path d="M7 16a5 5 0 0 1 10 0" /><path d="M3 19.5h18M12 5v3M4.6 9.6l1.8 1.8M19.4 9.6l-1.8 1.8" /></Icono>
);
export const Cerrar = (p: Props) => (
  <Icono {...p}><path d="M6 6l12 12M18 6 6 18" /></Icono>
);
export const Telefono = (p: Props) => (
  <Icono {...p}><path d="M5 4h3.5l1.5 4-2 1.3a10 10 0 0 0 6.7 6.7L16 14l4 1.5V19a1.5 1.5 0 0 1-1.6 1.5C10.6 20 4 13.4 3.5 5.6A1.5 1.5 0 0 1 5 4Z" /></Icono>
);
export const Correo = (p: Props) => (
  <Icono {...p}><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></Icono>
);
