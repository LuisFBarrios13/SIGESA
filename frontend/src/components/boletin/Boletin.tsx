// src/components/boletin/Boletin.tsx
// Convertido desde el template HTML institucional del Colegio Pedagógico San Agustín.
// Papel oficio 8.5" × 13" — fuente Roboto — escudo real.

import type { BoletinData, AreaBoletin, MateriaBoletin } from '../../types/boletin';

// ── Utilidades ─────────────────────────────────────────────────────────────────

const fmtNota = (n: number | null | undefined): string =>
  n != null ? n.toFixed(1) : '-';

const getDesempeño = (nota: number | null | undefined): string => {
  if (nota == null) return '';
  if (nota >= 4.6) return 'SUPERIOR';
  if (nota >= 4.0) return 'ALTO';
  if (nota >= 3.0) return 'BÁSICO';
  return 'BAJO';
};

// ── Header ─────────────────────────────────────────────────────────────────────

const BoletinHeader = ({ year }: { year: number }) => (
  <header className="flex flex-col items-center mb-4 text-center pb-4">
    <div className="flex flex-row items-center w-full mb-2 gap-4">
      <img
        src="/Escudo.png"
        alt="Escudo Colegio Pedagógico San Agustín"
        className="h-28 w-28 object-contain flex-shrink-0"
      />
      <div className="flex-1 text-center">
        <h1 className="text-2xl font-bold uppercase tracking-tight">
          Colegio Pedagógico San Agustín
        </h1>
        <div className="text-[10px] font-semibold mt-1">
          <p>Resolución No 1033 del 09 de agosto del 2010</p>
          <p>Resolución 2044 del 25 de noviembre del 2020</p>
          <p>DANE 350001007450</p>
          <p className="italic mt-1">"Educamos con amor para un futuro mejor"</p>
        </div>
      </div>
      {/* Espaciador del mismo ancho que el escudo para centrar el texto */}
      <div className="h-28 w-28 flex-shrink-0" />
    </div>
    <h2 className="text-lg font-bold mt-2 uppercase w-full py-1 text-center">
      Informe de Valoración Académica {year}
    </h2>
  </header>
);

// ── Información del estudiante ─────────────────────────────────────────────────

const EstudianteInfo = ({ data }: { data: BoletinData }) => (
  <section className="mb-6">
    <table className="w-full report-table border-collapse">
      <tbody>
        <tr>
          <td className="font-bold px-2 py-1 w-24 border border-black bg-white">Estudiante:</td>
          <td className="px-2 py-1 font-bold uppercase border border-black bg-white">
            {data.estudiante.nombre}
          </td>
          <td className="font-bold px-2 py-1 w-20 border border-black bg-white">Grado:</td>
          <td className="px-2 py-1 font-bold text-center w-32 uppercase border border-black bg-white" colSpan={3}>
            {data.grado.nombre}
          </td>
        </tr>
        <tr>
          <td className="font-bold px-2 py-1 border border-black bg-white">Año:</td>
          <td className="px-2 py-1 text-center font-bold border border-black bg-white">
            {data.matricula.year}
          </td>
          <td className="font-bold px-2 py-1 border border-black bg-white">Jornada:</td>
          <td className="px-2 py-1 text-center font-bold border border-black bg-white">
            {data.grado.jornada === 'MAÑANA' ? 'Mañana' : 'Tarde'}
          </td>
          <td className="font-bold px-2 py-1 w-20 border border-black bg-white">Periodo:</td>
          <td className="px-2 py-1 text-center font-bold w-12 border border-black bg-white">
            {data.periodo}
          </td>
        </tr>
        <tr>
          <td className="font-bold px-2 py-1 border border-black bg-white">Directora:</td>
          <td className="px-2 py-1 font-semibold border border-black bg-white">
            {data.directora}
          </td>
          <td className="font-bold px-2 py-1 border border-black bg-white">Puesto:</td>
          <td className="px-2 py-1 text-center font-bold border border-black bg-white">
            {data.puesto ?? '—'}
          </td>
          <td className="font-bold px-2 py-1 border border-black bg-white">Prom Gral:</td>
          <td className="px-2 py-1 text-center font-bold border border-black bg-white">
            {data.promedio_general != null ? data.promedio_general.toFixed(1) : '—'}
          </td>
        </tr>
      </tbody>
    </table>
  </section>
);

// ── Fila de periodos P1–P4 ─────────────────────────────────────────────────────

const PeriodosRow = ({ notas }: { notas: MateriaBoletin['notas_periodos'] }) => (
  <tr className="text-[9px]">
    <td className="px-2 italic bg-white border border-black">DESEMPEÑO:</td>
    <td className="bg-white border border-black" colSpan={2} />
    {([1, 2, 3, 4] as const).map((p) => (
      <td key={p} className="text-center border-l border-black p-0 bg-white border border-black">
        <div className="border-b border-black py-0.5">P{p}</div>
        <div className="font-bold py-0.5">{fmtNota(notas[p])}</div>
      </td>
    ))}
  </tr>
);

// ── Filas de una materia ───────────────────────────────────────────────────────

const MateriaRows = ({ materia }: { materia: MateriaBoletin }) => {
  const nivel      = materia.desempeño ?? getDesempeño(materia.nota_periodo_actual);
  const desempeñoTxt = materia.nota_periodo_actual != null
    ? `${fmtNota(materia.nota_periodo_actual)} ${nivel}`
    : '—';

  return (
    <>
      <tr>
        <td className="px-2 py-1 font-bold bg-white border border-black">{materia.nombre}</td>
        <td className="text-center font-bold bg-white border border-black">{materia.intensidad_horaria}</td>
        <td className="text-center font-bold bg-white border border-black">{materia.fallas ?? 0}</td>
        <td className="text-center font-bold bg-white border border-black" colSpan={4}>
          {desempeñoTxt}
        </td>
      </tr>
      <PeriodosRow notas={materia.notas_periodos} />
    </>
  );
};

// ── Sección de área ────────────────────────────────────────────────────────────

const AreaSection = ({ area }: { area: AreaBoletin }) => (
  <>
    {/* Fila de área: sin bordes, fondo transparente — igual que el HTML */}
    <tr className="font-bold">
      <td
        className="px-2 py-2 bg-transparent text-sm uppercase tracking-wide"
        colSpan={7}
        style={{ border: 'none' }}
      >
        ÁREA: {area.nombre}
      </td>
    </tr>
    {area.materias.map((m) => (
      <MateriaRows key={m.id_materia} materia={m} />
    ))}
  </>
);

// ── Tabla de notas ─────────────────────────────────────────────────────────────

const TablaNotas = ({ areas }: { areas: AreaBoletin[] }) => (
  <section>
    <table className="w-full report-table border-collapse">
      <thead className="uppercase font-bold text-center">
        <tr>
          <th className="py-1 px-2 text-left bg-white">Área - Asignaturas</th>
          <th className="w-12 bg-white">I.H.</th>
          <th className="w-16 bg-white">Fallas</th>
          <th className="w-48 bg-white" colSpan={4}>Desempeño</th>
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
  <section className="mt-8">
    <h3 className="font-bold uppercase text-[10px] mb-2">Observaciones:</h3>
    {texto ? (
      <p className="text-[10px] border-b border-black pb-1">{texto}</p>
    ) : (
      <>
        <div className="border-b border-black w-full h-4" />
        <div className="border-b border-black w-full h-4 mt-2" />
        <div className="border-b border-black w-full h-4 mt-2" />
      </>
    )}
  </section>
);

// ── Pie de página ──────────────────────────────────────────────────────────────

const BoletinFooter = ({ directora, generadoEn }: { directora: string; generadoEn: string }) => (
  <footer className="mt-16 flex flex-col items-start gap-12">
    <div className="w-64 border-t border-black pt-1">
      <p className="font-bold uppercase text-[10px]">Directora de Grupo</p>
      {directora !== '—' && (
        <p className="text-[9px] text-gray-600 mt-0.5">{directora}</p>
      )}
    </div>
    <div className="w-full flex justify-end text-[9px] font-bold text-gray-700 italic">
      Generado el {generadoEn}
    </div>
  </footer>
);

// ── Componente raíz ────────────────────────────────────────────────────────────

export default function Boletin({ data }: { data: BoletinData }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700;900&display=swap');

        .report-table th,
        .report-table td {
          border: 1px solid black;
          background-color: white;
        }

        @page {
          size: 8.5in 13in;
          margin: 0.45in 0.5in;
        }

        @media print {
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print  { display: none !important; }
          .page-container {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 2.5rem 2.5cm !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      <main
        className="page-container"
        style={{
          maxWidth:        900,
          margin:          '2rem auto',
          backgroundColor: 'white',
          padding:         '2.5rem 2.5cm',
          boxShadow:       '0 10px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1)',
          fontFamily:      '"Roboto", sans-serif',
          fontSize:        11,
          lineHeight:      '1.25',
          color:           '#111827',
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