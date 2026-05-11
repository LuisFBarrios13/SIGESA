// src/components/boletin/Boletin.tsx
// Layout exacto según modelo institucional — papel oficio 8.5" × 13"

import type { BoletinData, AreaBoletin, MateriaBoletin } from '../../types/boletin';

// ── Utilidades ─────────────────────────────────────────────────────────────────

const fmtNota = (n: number | null | undefined): string =>
  n != null ? n.toFixed(1) : '—';

const getDesempeño = (nota: number | null | undefined): string => {
  if (nota == null) return '';
  if (nota >= 4.6) return 'SUPERIOR';
  if (nota >= 4.0) return 'ALTO';
  if (nota >= 3.0) return 'BÁSICO';
  return 'BAJO';
};

// ── Encabezado ─────────────────────────────────────────────────────────────────

const BoletinHeader = ({ year }: { year: number }) => (
  <header style={{ borderBottom: '2px solid #14532d', paddingBottom: 8, marginBottom: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {/* Logo */}
      <img
        src="/Escudo.png"
        alt="Escudo Colegio Pedagógico San Agustín"
        style={{ width: 88, height: 88, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }}
      />

      {/* Info escuela */}
      <div style={{ flex: 1, textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.3px' }}>
          Colegio Pedagógico San Agustín
        </div>
        <div style={{ fontSize: 8, marginTop: 2, lineHeight: 1.5 }}>
          <div>Resolución No 1033 del 09 de agosto del 2010</div>
          <div>Resolución 2044 del 25 de noviembre del 2020</div>
          <div>DANE 350001007450</div>
          <div style={{ fontStyle: 'italic', marginTop: 2 }}>
            "Educamos con amor para un futuro mejor"
          </div>
        </div>
      </div>
    </div>

    {/* Título */}
    <div style={{
      marginTop: 8,
      borderTop: '1.5px solid black',
      borderBottom: '1.5px solid black',
      textAlign: 'center',
      fontWeight: 900,
      fontSize: 12,
      padding: '4px 0',
      letterSpacing: '0.5px',
    }}>
      INFORME DE VALORACION ACADEMICA {year}
    </div>
  </header>
);

// ── Tabla info estudiante ──────────────────────────────────────────────────────

const cell = (label: string, value: React.ReactNode, style?: React.CSSProperties) => (
  <>
    <td style={{ background: '#e5e7eb', fontWeight: 700, fontSize: 8, padding: '2px 4px', border: '1px solid black', whiteSpace: 'nowrap' }}>
      {label}
    </td>
    <td style={{ fontSize: 9, padding: '2px 6px', border: '1px solid black', ...style }}>
      {value}
    </td>
  </>
);

const EstudianteInfo = ({ data }: { data: BoletinData }) => (
  <section style={{ marginBottom: 8 }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        <tr>
          {cell('Estudiante:', <strong style={{ fontSize: 9 }}>{data.estudiante.nombre.toUpperCase()}</strong>)}
          {cell('Grado:', <strong style={{ fontSize: 9 }}>{data.grado.nombre.toUpperCase()}</strong>, { textAlign: 'center' })}
        </tr>
        <tr>
          {cell('Año:', <strong>{data.matricula.year}</strong>)}
          {cell('Jornada:', <strong>{data.grado.jornada === 'MAÑANA' ? 'Mañana' : 'Tarde'}</strong>)}
          {cell('Periodo:', <strong>{data.periodo}</strong>, { textAlign: 'center', width: 40 })}
        </tr>
        <tr>
          {cell('Directora de grado:', <strong>{data.directora}</strong>)}
          {cell('Puesto:', <strong>{data.puesto ?? '—'}</strong>, { textAlign: 'center', width: 50 })}
          {cell('Prom Gral:', <strong>{data.promedio_general?.toFixed(1) ?? '—'}</strong>, { textAlign: 'center', width: 50 })}
        </tr>
      </tbody>
    </table>
  </section>
);

// ── Tabla de notas ─────────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  background: '#f3f4f6',
  fontWeight: 900,
  fontSize: 8,
  textAlign: 'center',
  padding: '3px 2px',
  border: '1px solid black',
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
};

const areaThStyle: React.CSSProperties = {
  background: '#d1fae5',
  fontWeight: 800,
  fontSize: 8,
  padding: '2px 4px',
  border: '1px solid black',
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
};

const tdStyle: React.CSSProperties = {
  border: '1px solid black',
  padding: '2px 4px',
  fontSize: 8,
};

const MateriaRows = ({ materia }: { materia: MateriaBoletin }) => {
  const nivel   = materia.desempeño ?? getDesempeño(materia.nota_periodo_actual);
  const notaTxt = materia.nota_periodo_actual != null
    ? `${fmtNota(materia.nota_periodo_actual)}  ${nivel}`
    : '—';

  return (
    <>
      {/* Fila principal */}
      <tr>
        <td style={{ ...tdStyle, fontWeight: 700 }}>{materia.nombre}</td>
        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{materia.intensidad_horaria}</td>
        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{materia.fallas ?? 0}</td>
        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }} colSpan={4}>
          {notaTxt}
        </td>
      </tr>

      {/* Fila de desempeño por periodos */}
      <tr>
        <td style={{ ...tdStyle, fontStyle: 'italic', fontSize: 7 }}>DESEMPEÑO:</td>
        <td style={{ ...tdStyle }} colSpan={2} />
        {([1, 2, 3, 4] as const).map((p) => (
          <td key={p} style={{ ...tdStyle, textAlign: 'center', padding: 0, fontSize: 7 }}>
            <div style={{ borderBottom: '1px solid black', padding: '1px 0', fontWeight: 600 }}>P{p}</div>
            <div style={{ padding: '1px 0', fontWeight: 700 }}>{fmtNota(materia.notas_periodos[p])}</div>
          </td>
        ))}
      </tr>
    </>
  );
};

const AreaSection = ({ area }: { area: AreaBoletin }) => (
  <>
    <tr>
      <td style={areaThStyle} colSpan={7}>ÁREA: {area.nombre}</td>
    </tr>
    {area.materias.map((m) => (
      <MateriaRows key={m.id_materia} materia={m} />
    ))}
  </>
);

const TablaNotas = ({ areas }: { areas: AreaBoletin[] }) => (
  <section>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ ...thStyle, textAlign: 'left', padding: '3px 4px', width: '46%' }}>
            ÁREA - ASIGNATURAS
          </th>
          <th style={{ ...thStyle, width: '6%' }}>I.H.</th>
          <th style={{ ...thStyle, width: '8%' }}>FALLAS</th>
          <th style={{ ...thStyle }} colSpan={4}>DESEMPEÑO</th>
        </tr>
      </thead>
      <tbody>
        {areas.map((area) => (
          <AreaSection key={area.nombre} area={area} />
        ))}
      </tbody>
    </table>
  </section>
);

// ── Observaciones ──────────────────────────────────────────────────────────────

const Observaciones = ({ texto }: { texto: string }) => (
  <section style={{ marginTop: 16 }}>
    <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 4 }}>OBSERVACIONES:</div>
    {texto ? (
      <p style={{ fontSize: 8, borderBottom: '1px solid black', paddingBottom: 2 }}>{texto}</p>
    ) : (
      <>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ borderBottom: '1px solid black', height: 16, marginBottom: 6 }} />
        ))}
      </>
    )}
  </section>
);

// ── Pie de página ──────────────────────────────────────────────────────────────

const BoletinFooter = ({ directora, generadoEn }: { directora: string; generadoEn: string }) => (
  <footer style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 4 }}>
    <div>
      <div style={{ width: 180, borderTop: '1px solid black', paddingTop: 2 }}>
        <div style={{ fontSize: 8, fontWeight: 700 }}>Directora de Grupo</div>
        {directora !== '—' && (
          <div style={{ fontSize: 7, color: '#374151', marginTop: 1 }}>{directora}</div>
        )}
      </div>
    </div>
    <div style={{ textAlign: 'right', fontSize: 7, fontStyle: 'italic', color: '#4b5563', marginTop: 8 }}>
      Generado el {generadoEn}
    </div>
  </footer>
);

// ── Componente raíz ────────────────────────────────────────────────────────────

export default function Boletin({ data }: { data: BoletinData }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');
        @page {
          size: 8.5in 13in;
          margin: 0.45in 0.5in;
        }
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .boletin-page { box-shadow: none !important; margin: 0 !important; padding: 0 !important; max-width: 100% !important; min-height: auto !important; }
        }
      `}</style>

      <main
        className="boletin-page"
        style={{
          maxWidth:        816,
          minHeight:       1056,
          margin:          '2rem auto',
          backgroundColor: 'white',
          padding:         '36px 44px',
          boxShadow:       '0 4px 24px rgba(0,0,0,.15)',
          fontFamily:      '"Roboto", "Arial", sans-serif',
          color:           '#000',
          lineHeight:      1.3,
        }}
      >
        <BoletinHeader year={data.matricula.year} />
        <EstudianteInfo data={data} />
        <TablaNotas areas={data.areas} />
        <Observaciones texto={data.observaciones} />
        <BoletinFooter directora={data.directora} generadoEn={data.generado_en} />
      </main>
    </>
  );
}