// src/components/boletin/Boletin.tsx
// Conversión TypeScript del template HTML del colegio.
// Este componente es el único que se imprime — no contiene lógica de negocio.

import type { BoletinData, AreaBoletin, MateriaBoletin } from '../../types/boletin';

// ── Utilidades ─────────────────────────────────────────────────────────────────

/** Formatea un número de nota con 1 decimal, o muestra '—' si es nulo. */
const fmtNota = (n: number | null | undefined): string =>
  n != null ? n.toFixed(1) : '—';

/** Formatea el promedio general con 1 decimal. */
const fmtPromedio = (n: number): string => n.toFixed(1);

// ── Sub-componentes ────────────────────────────────────────────────────────────

/** Encabezado institucional */
const BoletinHeader = ({ year }: { year: number }) => (
  <header className="flex flex-col items-center mb-4 text-center border-b-2 border-green-900 pb-4">
    <div className="flex items-center justify-center gap-6 w-full mb-2">
      {/* Logo placeholder — reemplazar src con la imagen real del colegio */}
      <div className="h-24 w-24 flex items-center justify-center border-2 border-green-900 rounded-full flex-shrink-0">
        <span className="text-[8px] text-green-900 font-bold text-center leading-tight">
          COLEGIO<br/>PEDAGÓGICO<br/>SAN AGUSTÍN
        </span>
      </div>
      <div className="flex-1">
        <h1 className="text-2xl font-bold uppercase tracking-tight">
          Colegio Pedagógico San Agustín
        </h1>
        <div className="text-[10px] font-semibold mt-1 space-y-0.5">
          <p>Resolución No 1033 del 09 de agosto del 2010</p>
          <p>Resolución 2044 del 25 de noviembre del 2020</p>
          <p>DANE 350001007450</p>
          <p className="italic mt-1">"Educamos con amor para un futuro mejor"</p>
        </div>
      </div>
    </div>
    <h2 className="text-lg font-bold mt-2 uppercase border-y border-black w-full py-1">
      Informe de Valoración Académica {year}
    </h2>
  </header>
);

/** Tabla de información del estudiante */
const EstudianteInfo = ({ data }: { data: BoletinData }) => (
  <section className="mb-6">
    <table className="w-full border-collapse boletin-table">
      <tbody>
        <tr>
          <td className="bg-gray-100 font-bold px-2 py-1 w-24">Estudiante:</td>
          <td className="px-2 py-1 font-semibold uppercase">
            {data.estudiante.nombre}
          </td>
          <td className="bg-gray-100 font-bold px-2 py-1 w-20">Grado:</td>
          <td className="px-2 py-1 font-bold text-center w-32 uppercase">
            {data.grado.nombre}
          </td>
        </tr>
        <tr>
          <td className="bg-gray-100 font-bold px-2 py-1">Año:</td>
          <td className="px-2 py-1 text-center font-bold">{data.matricula.year}</td>
          <td className="bg-gray-100 font-bold px-2 py-1">Jornada:</td>
          <td className="px-2 py-1 text-center font-bold">
            {data.grado.jornada === 'MAÑANA' ? 'Mañana' : 'Tarde'}
          </td>
          <td className="bg-gray-100 font-bold px-2 py-1 w-20">Periodo:</td>
          <td className="px-2 py-1 text-center font-bold w-12 border-l border-black">
            {data.periodo}
          </td>
        </tr>
        <tr>
          <td className="bg-gray-100 font-bold px-2 py-1">Directora:</td>
          <td className="px-2 py-1 font-semibold">{data.directora}</td>
          <td className="bg-gray-100 font-bold px-2 py-1">Puesto:</td>
          <td className="px-2 py-1 text-center font-bold">{data.puesto}</td>
          <td className="bg-gray-100 font-bold px-2 py-1">Prom Gral:</td>
          <td className="px-2 py-1 text-center font-bold">
            {fmtPromedio(data.promedio_general)}
          </td>
        </tr>
      </tbody>
    </table>
  </section>
);

/** Fila de períodos P1–P4 para una materia */
const PeriodosRow = ({ notas }: { notas: MateriaBoletin['notas_periodos'] }) => (
  <tr className="text-[9px]">
    <td className="px-2 italic">DESEMPEÑO:</td>
    <td colSpan={2} />
    {([1, 2, 3, 4] as const).map((p) => (
      <td key={p} className="text-center border-l border-black p-0">
        <div className="border-b border-black py-0.5">P{p}</div>
        <div className="font-bold py-0.5">{fmtNota(notas[p])}</div>
      </td>
    ))}
  </tr>
);

/** Fila de una materia (dos filas: datos + periodos) */
const MateriaRows = ({ materia }: { materia: MateriaBoletin }) => {
  const desempeñoTexto = materia.nota_periodo_actual != null
    ? `${fmtNota(materia.nota_periodo_actual)} ${materia.desempeño ?? ''}`
    : '—';

  return (
    <>
      <tr>
        <td className="px-2 py-1 font-bold">{materia.nombre}</td>
        <td className="text-center font-bold">{materia.intensidad_horaria}</td>
        <td className="text-center font-bold">{materia.fallas}</td>
        <td className="text-center font-bold" colSpan={4}>{desempeñoTexto}</td>
      </tr>
      <PeriodosRow notas={materia.notas_periodos} />
    </>
  );
};

/** Sección de un área académica con sus materias */
const AreaSection = ({ area }: { area: AreaBoletin }) => (
  <>
    <tr className="bg-gray-50 font-bold">
      <td className="px-2 py-0.5" colSpan={7}>
        ÁREA: {area.nombre}
      </td>
    </tr>
    {area.materias.map((m) => (
      <MateriaRows key={m.id_materia} materia={m} />
    ))}
  </>
);

/** Tabla de notas académicas completa */
const TablaNotas = ({ areas }: { areas: AreaBoletin[] }) => (
  <section>
    <table className="w-full border-collapse boletin-table">
      <thead className="bg-gray-100 uppercase font-bold text-center">
        <tr>
          <th className="py-1 px-2 text-left">Área - Asignaturas</th>
          <th className="w-12">I.H.</th>
          <th className="w-16">Fallas</th>
          <th className="w-48" colSpan={4}>Desempeño</th>
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

/** Sección de observaciones */
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

/** Pie de página con firma y fecha de generación */
const BoletinFooter = ({ directora, generadoEn }: { directora: string; generadoEn: string }) => (
  <footer className="mt-16 flex flex-col items-start gap-12">
    <div>
      <div className="w-64 border-t border-black pt-1">
        <p className="font-bold uppercase text-[10px]">Directora de Grupo</p>
        {directora !== '—' && (
          <p className="text-[9px] text-gray-600 mt-0.5">{directora}</p>
        )}
      </div>
    </div>
    <div className="w-full flex justify-end text-[9px] font-bold text-gray-700 italic">
      Generado el {generadoEn}
    </div>
  </footer>
);

// ── Componente principal ───────────────────────────────────────────────────────

interface BoletinProps {
  data: BoletinData;
}

/**
 * Componente raíz del boletín.
 * Renderiza el informe completo listo para impresión.
 * No tiene lógica de carga ni estado — recibe `data` del hook.
 */
const Boletin = ({ data }: BoletinProps) => (
  <>
    {/* Estilos de impresión — se inyectan en el <head> del documento */}
    <style>{`
      .boletin-table th,
      .boletin-table td {
        border: 1px solid black;
      }
      @media print {
        body { background-color: white !important; }
        .no-print { display: none !important; }
        .boletin-page {
          box-shadow: none !important;
          margin: 0 !important;
          padding: 1.5rem !important;
          max-width: 100% !important;
        }
      }
    `}</style>

    <main
      className="boletin-page"
      style={{
        maxWidth:        900,
        margin:          '2rem auto',
        backgroundColor: 'white',
        padding:         '2.5rem',
        boxShadow:       '0 10px 25px -5px rgba(0,0,0,.1)',
        fontSize:        11,
        lineHeight:      1.25,
        color:           '#111827',
        fontFamily:      'Inter, sans-serif',
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

export default Boletin;