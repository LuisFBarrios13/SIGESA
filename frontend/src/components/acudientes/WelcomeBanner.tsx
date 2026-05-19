// src/components/acudiente/WelcomeBanner.tsx
// Single Responsibility: saludo y datos básicos del acudiente.

import type { AcudientePerfil } from '../../services/acudienteApi';

interface WelcomeBannerProps { perfil: AcudientePerfil }

const WelcomeBanner = ({ perfil }: WelcomeBannerProps) => {
  const firstName = perfil.nombre.split(' ')[0];

  return (
    <div className="bg-orange-900 rounded-2xl p-6 text-white relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-orange-800/50 pointer-events-none" />
      <div className="absolute -bottom-8 right-24 w-28 h-28 rounded-full bg-primary/20 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-orange-200/70 text-xs font-bold uppercase tracking-widest">
            Portal de Acudiente
          </p>
          <h2 className="text-2xl font-black mt-1">Bienvenido, {firstName}</h2>
          <p className="text-orange-100/70 text-sm mt-1">
            {perfil.estudiantes.length === 1
              ? 'Consulta la información académica y financiera de tu estudiante'
              : `Tienes ${perfil.estudiantes.length} estudiantes vinculados`}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-orange-800/50 rounded-xl px-4 py-3">
          <span className="material-symbols-outlined text-orange-200 text-2xl">
            family_restroom
          </span>
          <div>
            <p className="text-[10px] text-orange-200/70 uppercase tracking-wide font-bold">
              Acudiente
            </p>
            <p className="text-sm font-bold text-white">{perfil.nombre}</p>
            {perfil.correo && (
              <p className="text-[11px] text-orange-200/60 mt-0.5">{perfil.correo}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;