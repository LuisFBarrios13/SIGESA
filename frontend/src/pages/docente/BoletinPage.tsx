// src/pages/docente/BoletinPage.tsx
// Página standalone (sin sidebar/topbar) para previsualizar e imprimir el boletín.
// Se accede desde MiGradoPage con los query params: matricula, periodo, year.

import { useSearchParams, useNavigate } from 'react-router-dom';
import { useBoletinData }                from '../../hooks/useBoletinData';
import Boletin                           from '../../components/boletin/Boletin';

const PERIODOS = [1, 2, 3, 4] as const;
const yearOptions = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - 1 + i);

const BoletinPage = () => {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();

  const idMatricula = Number(params.get('matricula') ?? 0);

  const { data, isLoading, error, periodo, year, setPeriodo, setYear } =
    useBoletinData(idMatricula);

  const handlePrint = () => window.print();

  if (!idMatricula) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-error font-semibold">Parámetro de matrícula inválido.</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh' }}>

      {/* ── Barra de controles (se oculta al imprimir) ── */}
      <div
        className="no-print"
        style={{
          position:        'sticky',
          top:             0,
          zIndex:          50,
          backgroundColor: '#1c4a14',
          color:           'white',
          padding:         '0.75rem 1.5rem',
          display:         'flex',
          alignItems:      'center',
          gap:             '1rem',
          flexWrap:        'wrap',
          boxShadow:       '0 2px 8px rgba(0,0,0,.25)',
        }}
      >
        {/* Botón volver */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display:         'flex',
            alignItems:      'center',
            gap:             '0.375rem',
            padding:         '0.375rem 0.75rem',
            borderRadius:    8,
            backgroundColor: 'rgba(255,255,255,.15)',
            border:          '1px solid rgba(255,255,255,.3)',
            color:           'white',
            fontSize:        13,
            fontWeight:      600,
            cursor:          'pointer',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Volver
        </button>

        <span style={{ fontWeight: 700, fontSize: 14 }}>
          Vista previa del Boletín
        </span>

        {/* Selector de periodo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Periodo:</span>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {PERIODOS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                style={{
                  width:           32,
                  height:          32,
                  borderRadius:    6,
                  border:          '1px solid rgba(255,255,255,.4)',
                  backgroundColor: periodo === p ? 'white' : 'transparent',
                  color:           periodo === p ? '#1c4a14' : 'white',
                  fontWeight:      700,
                  fontSize:        13,
                  cursor:          'pointer',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Selector de año */}
          <span style={{ fontSize: 12, opacity: 0.8, marginLeft: 8 }}>Año:</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={{
              padding:         '0.25rem 0.5rem',
              borderRadius:    6,
              border:          '1px solid rgba(255,255,255,.4)',
              backgroundColor: 'rgba(255,255,255,.15)',
              color:           'white',
              fontSize:        13,
              cursor:          'pointer',
            }}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y} style={{ color: 'black' }}>{y}</option>
            ))}
          </select>

          {/* Botón imprimir */}
          <button
            onClick={handlePrint}
            disabled={isLoading || !data}
            style={{
              display:         'flex',
              alignItems:      'center',
              gap:             '0.375rem',
              padding:         '0.5rem 1rem',
              borderRadius:    8,
              backgroundColor: isLoading || !data ? 'rgba(255,255,255,.2)' : 'white',
              color:           '#1c4a14',
              border:          'none',
              fontWeight:      700,
              fontSize:        13,
              cursor:          isLoading || !data ? 'not-allowed' : 'pointer',
              marginLeft:      8,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>print</span>
            Imprimir / Descargar PDF
          </button>
        </div>
      </div>

      {/* ── Estado de carga ── */}
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#1c4a14', animation: 'spin 1s linear infinite' }}>
            progress_activity
          </span>
        </div>
      )}

      {/* ── Error ── */}
      {error && !isLoading && (
        <div style={{ maxWidth: 600, margin: '3rem auto', padding: '1rem', backgroundColor: '#ffdad6', borderRadius: 12, color: '#93000a', fontWeight: 600 }}>
          ❌ {error}
        </div>
      )}

      {/* ── Boletín ── */}
      {data && !isLoading && (
        <Boletin data={data} />
      )}
    </div>
  );
};

export default BoletinPage;