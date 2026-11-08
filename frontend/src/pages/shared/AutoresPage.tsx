// src/pages/shared/AutoresPage.tsx
const AUTORES = [
  {
    nombre:      'Luis Barrios',
    rol:         'Desarrollador Full Stack',
    descripcion: 'Responsable del diseño e implementación del sistema SIGESA, incluyendo la arquitectura backend con Node.js + Express y la interfaz de usuario con React.',
    foto:        '/luis.jpeg',
    correo:      'fernandobarrios2004@gmail.com',
    github:      'github.com/luisbarrios',
  },
  {
    nombre:      'Samuel Pacheco',
    rol:         'Desarrollador Full Stack',
    descripcion: 'Responsable del diseño e implementación del sistema SIGESA, incluyendo la base de datos PostgreSQL y los módulos de pagos y reportes académicos.',
    foto:        '/pacheco.jpeg',
    correo:      'samuel.pacheco@gmail.com',
    github:      'github.com/samuelpacheco',
  },
];

const AutoresPage = () => (
  <>
    <div>
      <h1 className="text-3xl font-semibold text-primary">Autores</h1>
      <p className="text-base text-stone-500 mt-1">
        Equipo de desarrollo del Sistema de Gestión Escolar SIGESA
      </p>
    </div>

    <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
      {/* Banner superior */}
      <div className="bg-orange-900 px-8 py-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-800 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-white text-3xl">school</span>
        </div>
        <h2 className="text-2xl font-black text-white">SIGESA</h2>
        <p className="text-orange-200/70 text-sm mt-1 uppercase tracking-widest">
          Sistema de Gestión Escolar
        </p>
        <p className="text-orange-100/60 text-xs mt-3 max-w-md mx-auto">
          Proyecto desarrollado para el Colegio Pedagógico San Agustín como solución integral
          de gestión académica y financiera.
        </p>
      </div>

      {/* Tarjetas de autores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
        {AUTORES.map((autor) => {
          const initials = autor.nombre
            .split(' ')
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

          return (
            <div
              key={autor.nombre}
              className="flex flex-col items-center text-center rounded-2xl
                border-2 border-outline-variant p-8 gap-5
                hover:border-primary/40 hover:shadow-xl transition-all group"
            >
              {/* Foto grande con anillo de color */}
              <div className="relative">
                <div
                  className="w-48 h-48 rounded-full overflow-hidden border-4 border-orange-900
                    shadow-lg ring-4 ring-orange-200 group-hover:ring-primary/30 transition-all
                    bg-primary-fixed flex items-center justify-center"
                >
                  <img
                    src={autor.foto}
                    alt={`Foto de ${autor.nombre}`}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.initials-fallback')) {
                        const span = document.createElement('span');
                        span.className =
                          'initials-fallback flex items-center justify-center w-full h-full text-5xl font-black text-on-primary-fixed-variant';
                        span.textContent = initials;
                        parent.appendChild(span);
                      }
                    }}
                  />
                </div>
                {/* Badge de rol */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-900
                    text-white text-[11px] font-bold rounded-full shadow border-2 border-white
                    whitespace-nowrap">
                    <span className="material-symbols-outlined text-[13px]">code</span>
                    Dev Full Stack
                  </span>
                </div>
              </div>

              {/* Nombre y rol */}
              <div className="space-y-1 mt-2">
                <h3 className="text-2xl font-black text-on-surface">{autor.nombre}</h3>
                <span className="inline-block px-4 py-1.5 bg-orange-100 text-orange-800
                  text-xs font-bold rounded-full tracking-wide">
                  {autor.rol}
                </span>
              </div>

              {/* Descripción */}
              <p className="text-sm text-stone-500 leading-relaxed max-w-xs">
                {autor.descripcion}
              </p>

              {/* Contacto */}
              <div className="flex flex-col gap-2.5 w-full pt-4 border-t border-stone-200">
                <div className="flex items-center gap-2 text-xs text-stone-500 justify-center">
                  <span className="material-symbols-outlined text-[16px] text-orange-900">mail</span>
                  <span className="font-medium">{autor.correo}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-500 justify-center">
                  <span className="material-symbols-outlined text-[16px] text-orange-900">code</span>
                  <span className="font-medium">{autor.github}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-8 py-6 border-t border-stone-100 bg-stone-50/50 text-center">
        <p className="text-xs text-stone-400">
          Desarrollado con React · Node.js · Express · PostgreSQL · Sequelize · Tailwind CSS
        </p>
        <p className="text-xs text-stone-300 mt-1">
          © {new Date().getFullYear()} SIGESA — Todos los derechos reservados
        </p>
      </div>
    </div>
  </>
);

export default AutoresPage;