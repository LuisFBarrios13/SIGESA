// src/components/estudiantes/GestionMatriculaDialogos.tsx
// Diálogos para matricular, retirar o reactivar a un estudiante.
import type { useGestionMatricula } from '../../hooks/useGestionMatricula';
import ConfirmModal from '../ui/ConfirmModal';
import RematricularModal from './RematricularModal';

type Props = { gestion: ReturnType<typeof useGestionMatricula> };

const GestionMatriculaDialogos = ({ gestion }: Props) => {
  const { accion } = gestion;

  return (
    <>
      {gestion.aviso && (
        <div className="flex items-start gap-3 p-4 bg-secondary-container/20 rounded-xl border border-secondary/30">
          <span className="material-symbols-outlined text-secondary text-xl">check_circle</span>
          <p className="text-sm text-on-surface flex-1">{gestion.aviso}</p>
          <button onClick={gestion.cerrarAviso} aria-label="Cerrar aviso"
            className="text-stone-400 hover:text-stone-600">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {accion?.tipo === 'matricular' && gestion.gradosListos && (
        <RematricularModal
          key={accion.estudiante.numero_identidad}
          estudiante={accion.estudiante}
          grados={gestion.grados}
          isLoading={gestion.isLoading}
          error={gestion.error}
          onConfirm={gestion.matricular}
          onClose={gestion.cerrar}
        />
      )}

      {accion?.tipo === 'estado' && (
        <ConfirmModal
          titulo={accion.estado === 'RETIRADO' ? 'Retirar estudiante' : 'Reactivar matrícula'}
          icono={accion.estado === 'RETIRADO' ? 'person_remove' : 'person_check'}
          confirmar={accion.estado === 'RETIRADO' ? 'Retirar' : 'Reactivar'}
          peligro={accion.estado === 'RETIRADO'}
          isLoading={gestion.isLoading}
          error={gestion.error}
          onConfirm={gestion.confirmarEstado}
          onClose={gestion.cerrar}
        >
          {accion.estado === 'RETIRADO' ? (
            <>
              <p>
                <strong>{accion.estudiante.nombre}</strong> quedará retirado de{' '}
                {accion.matricula.grado?.nombre ?? 'su grado'} ({accion.matricula.year}) y ya no aparecerá
                en las listas de los docentes.
              </p>
              <p>
                Se eliminarán las pensiones de los <strong>meses siguientes</strong> que no tengan pagos.
                Lo que ya debe (meses vencidos y el mes actual) se conserva.
              </p>
            </>
          ) : (
            <p>
              <strong>{accion.estudiante.nombre}</strong> volverá a estar activo en{' '}
              {accion.matricula.grado?.nombre ?? 'su grado'} ({accion.matricula.year}). Si se le
              eliminaron pensiones, genéralas otra vez desde Pagos.
            </p>
          )}
        </ConfirmModal>
      )}
    </>
  );
};

export default GestionMatriculaDialogos;
