// src/pages/shared/CapacitacionesPage.tsx
import { useState } from 'react';
import { useAuth }  from '../../hooks/useAuth';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Video {
  id:          string;
  titulo:      string;
  descripcion: string;
  duracion:    string;
  url:         string;
}

interface Seccion {
  rol:    string;
  label:  string;
  icon:   string;
  color:  string;
  bg:     string;
  videos: Video[];
}

// ── Contenido — agrega tus .mp4 en frontend/public/videos/ ────────────────────

const SECCIONES: Seccion[] = [
  {
    rol:   'ADMINISTRADOR',
    label: 'Administrador',
    icon:  'admin_panel_settings',
    color: 'text-orange-700',
    bg:    'bg-orange-100',
    videos: [
      {
        id:          'admin-1',
        titulo:      'Gestión de matrículas',
        descripcion: 'Cómo registrar un nuevo estudiante, asignar grado y crear el acceso del acudiente.',
        duracion:    '5:00',
        url:         '/videos/video.mp4',
      },
      {
        id:          'admin-2',
        titulo:      'Registro de docentes',
        descripcion: 'Cómo crear un docente, asignar jornada y grado a cargo.',
        duracion:    '4:00',
        url:         '/videos/video.mp4',
      },
      {
        id:          'admin-3',
        titulo:      'Gestión de pagos',
        descripcion: 'Cómo configurar tarifas, generar pensiones y registrar pagos.',
        duracion:    '6:00',
        url:         '/videos/video.mp4',
      },
      {
        id:          'admin-4',
        titulo:      'Dashboard y reportes',
        descripcion: 'Cómo interpretar el dashboard y consultar deudores.',
        duracion:    '3:00',
        url:         '/videos/video.mp4',
      },
    ],
  },
  {
    rol:   'DOCENTE',
    label: 'Docente',
    icon:  'person_book',
    color: 'text-blue-700',
    bg:    'bg-blue-100',
    videos: [
      {
        id:          'docente-1',
        titulo:      'Mi grado — lista de estudiantes',
        descripcion: 'Cómo ver la lista de estudiantes matriculados en tu grado.',
        duracion:    '3:00',
        url:         '/videos/docente-mi-grado.mp4',
      },
      {
        id:          'docente-2',
        titulo:      'Registro de notas',
        descripcion: 'Cómo ingresar notas, fallas e intensidad horaria por materia.',
        duracion:    '5:00',
        url:         '/videos/docente-notas.mp4',
      },
      {
        id:          'docente-3',
        titulo:      'Generación del boletín',
        descripcion: 'Cómo generar y descargar el boletín de notas de un estudiante.',
        duracion:    '2:00',
        url:         '/videos/docente-boletin.mp4',
      },
    ],
  },
  {
    rol:   'ACUDIENTE',
    label: 'Acudiente',
    icon:  'family_restroom',
    color: 'text-emerald-700',
    bg:    'bg-emerald-100',
    videos: [
      {
        id:          'acudiente-1',
        titulo:      'Primer ingreso al sistema',
        descripcion: 'Cómo iniciar sesión por primera vez y cambiar la contraseña temporal.',
        duracion:    '2:00',
        url:         '/videos/acudiente-primer-ingreso.mp4',
      },
      {
        id:          'acudiente-2',
        titulo:      'Consulta de pagos',
        descripcion: 'Cómo revisar el estado de cuenta, deudas y pagos realizados.',
        duracion:    '3:00',
        url:         '/videos/acudiente-pagos.mp4',
      },
    ],
  },
];

// ── Video Card ────────────────────────────────────────────────────────────────

const VideoCard = ({
  video,
  color,
  bg,
  onPlay,
  isPlaying,
}: {
  video:     Video;
  color:     string;
  bg:        string;
  onPlay:    (v: Video) => void;
  isPlaying: boolean;
}) => (
  <div
    onClick={() => onPlay(video)}
    className={`bg-white rounded-xl border-2 overflow-hidden transition-all cursor-pointer
      hover:shadow-md
      ${isPlaying
        ? 'border-primary shadow-md'
        : 'border-outline-variant hover:border-primary/40'
      }`}
  >
    {/* Thumbnail */}
    <div className="relative h-36 bg-stone-100 flex items-center justify-center">
      <div className={`w-14 h-14 rounded-full ${bg} flex items-center justify-center shadow-sm`}>
        <span className={`material-symbols-outlined text-3xl ${color}`}
          style={{ fontVariationSettings: "'FILL' 1" }}>
          {isPlaying ? 'pause_circle' : 'play_circle'}
        </span>
      </div>
      <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px]
        font-bold px-2 py-0.5 rounded">
        {video.duracion}
      </span>
      {isPlaying && (
        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-bold text-primary bg-white px-3 py-1 rounded-full shadow">
            Reproduciendo
          </span>
        </div>
      )}
    </div>

    <div className="p-4">
      <h4 className="font-semibold text-sm text-on-surface">{video.titulo}</h4>
      <p className="text-xs text-stone-400 mt-1 leading-relaxed">{video.descripcion}</p>
    </div>
  </div>
);

// ── Video Player ──────────────────────────────────────────────────────────────

const VideoPlayer = ({ video, onClose }: { video: Video; onClose: () => void }) => (
  <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
    <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
      <div>
        <h3 className="font-semibold text-on-surface">{video.titulo}</h3>
        <p className="text-xs text-stone-400 mt-0.5">{video.descripcion}</p>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-stone-50 rounded-lg transition-colors
          text-stone-400 hover:text-on-surface"
      >
        <span className="material-symbols-outlined text-xl">close</span>
      </button>
    </div>
    <video
      key={video.url}
      controls
      autoPlay
      className="w-full"
      style={{ maxHeight: 480, background: '#000' }}
    >
      <source src={video.url} type="video/mp4" />
      Tu navegador no soporta la reproducción de video.
    </video>
  </div>
);

// ── Página principal ──────────────────────────────────────────────────────────

const CapacitacionesPage = () => {
  const { user }                      = useAuth();
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  const rol = user?.roles[0];

  // Admin ve todas las secciones, docente y acudiente solo la suya
  const secciones = rol === 'ADMINISTRADOR'
    ? SECCIONES
    : SECCIONES.filter((s) => s.rol === rol);

  const handlePlay = (video: Video) => {
    setActiveVideo((prev) => prev?.id === video.id ? null : video);
  };

  return (
    <>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-primary">Capacitaciones</h1>
        <p className="text-base text-stone-500 mt-1">
          Videos tutoriales para aprender a usar el sistema
        </p>
      </div>

      {/* Player activo — aparece al hacer clic en una tarjeta */}
      {activeVideo && (
        <VideoPlayer video={activeVideo} onClose={() => setActiveVideo(null)} />
      )}

      {/* Secciones por rol */}
      <div className="space-y-8">
        {secciones.map((seccion) => (
          <div key={seccion.rol}>
            {/* Encabezado de sección */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 ${seccion.bg} rounded-lg`}>
                <span className={`material-symbols-outlined text-xl ${seccion.color}`}>
                  {seccion.icon}
                </span>
              </div>
              <div>
                <h2 className="font-semibold text-on-surface">{seccion.label}</h2>
                <p className="text-xs text-stone-400">
                  {seccion.videos.length} video{seccion.videos.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Grid de tarjetas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {seccion.videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  color={seccion.color}
                  bg={seccion.bg}
                  onPlay={handlePlay}
                  isPlaying={activeVideo?.id === video.id}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Nota al pie */}
      <div className="flex items-start gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
        <span className="material-symbols-outlined text-stone-400 text-xl flex-shrink-0">
          info
        </span>
        <p className="text-xs text-stone-500">
          Si tienes dudas que no están cubiertas en los videos, contacta al administrador
          del sistema.
        </p>
      </div>
    </>
  );
};

export default CapacitacionesPage;