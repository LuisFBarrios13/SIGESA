// src/pages/docente/BoletinPage.tsx
// Vista previa e impresión del boletín — papel oficio 8.5" × 13"
// El periodo seleccionado en la barra SIEMPRE se refleja en el boletín.

import { useSearchParams, useNavigate } from 'react-router-dom';
import { useBoletinData }               from '../../hooks/useBoletinData';
import Boletin                          from '../../components/boletin/Boletin';

const PERIODOS  = [1, 2, 3, 4] as const;
const yearOptions = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - 1 + i);

const BoletinPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const idMatricula = Number(params.get('matricula') ?? 0);

  // periodo/year vienen del hook — son la fuente de verdad
  const { data, isLoading, error, periodo, year, setPeriodo, setYear } =
    useBoletinData(idMatricula);

  if (!idMatricula) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: 'red', fontWeight: 600 }}>Parámetro de matrícula inválido.</p>
      </div>
    );
  }

  // Inyectamos el periodo seleccionado en la data para que el boletín siempre lo muestre correctamente,
  // independientemente de lo que devuelva el backend en data.periodo.
  const boletinData = data ? { ...data, periodo } : null;

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh' }}>

      {/* ── Barra de controles (oculta al imprimir) ── */}
      <div
        className="no-print"
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          backgroundColor: '#14532d', color: 'white',
          padding: '0.6rem 1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
          boxShadow: '0 2px 10px rgba(0,0,0,.3)',
        }}
      >
        {/* Volver */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 12px', borderRadius: 6,
            background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.35)',
            color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>arrow_back</span>
          Volver
        </button>

        <span style={{ fontWeight: 700, fontSize: 13 }}>Vista previa — Boletín</span>

        {/* Periodo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <span style={{ fontSize: 11, opacity: 0.85 }}>Periodo:</span>
          <div style={{ display: 'flex', gap: 3 }}>
            {PERIODOS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                style={{
                  width: 30, height: 30, borderRadius: 6,
                  border: '1px solid rgba(255,255,255,.5)',
                  background:  periodo === p ? 'white' : 'transparent',
                  color:       periodo === p ? '#14532d' : 'white',
                  fontWeight: 800, fontSize: 13, cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Año */}
          <span style={{ fontSize: 11, opacity: 0.85, marginLeft: 10 }}>Año:</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={{
              padding: '3px 7px', borderRadius: 6,
              border: '1px solid rgba(255,255,255,.4)',
              background: 'rgba(255,255,255,.15)', color: 'white',
              fontSize: 12, cursor: 'pointer',
            }}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y} style={{ color: 'black' }}>{y}</option>
            ))}
          </select>

          {/* Imprimir */}
          <button
            onClick={() => window.print()}
            disabled={isLoading || !boletinData}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 14px', borderRadius: 6,
              background: isLoading || !boletinData ? 'rgba(255,255,255,.2)' : 'white',
              color: '#14532d', border: 'none',
              fontWeight: 800, fontSize: 12,
              cursor: isLoading || !boletinData ? 'not-allowed' : 'pointer',
              marginLeft: 8,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
            Imprimir / PDF
          </button>
        </div>
      </div>

      {/* ── Indicador de carga ── */}
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 48, color: '#14532d', animation: 'spin 1s linear infinite' }}
          >
            progress_activity
          </span>
        </div>
      )}

      {/* ── Error ── */}
      {error && !isLoading && (
        <div style={{
          maxWidth: 560, margin: '3rem auto', padding: '1rem 1.5rem',
          background: '#ffdad6', borderRadius: 12,
          color: '#93000a', fontWeight: 600, fontSize: 13,
        }}>
          ❌ {error}
        </div>
      )}

      {/* ── Boletín ── */}
      {boletinData && !isLoading && (
        <Boletin data={boletinData} />
      )}
    </div>
  );
};

export default BoletinPage;