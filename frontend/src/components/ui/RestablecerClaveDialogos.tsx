// src/components/ui/RestablecerClaveDialogos.tsx
// Confirmación + resultado de restablecer una contraseña (docentes y acudientes).
import type { useRestablecerClave } from '../../hooks/useRestablecerClave';
import ConfirmModal from './ConfirmModal';
import CredencialesModal from './CredencialesModal';

type Props = { clave: ReturnType<typeof useRestablecerClave> };

const RestablecerClaveDialogos = ({ clave }: Props) => {
  const { objetivo, credenciales } = clave;
  if (!objetivo) return null;

  if (credenciales) {
    return <CredencialesModal nombre={objetivo.nombre} credenciales={credenciales} onClose={clave.cerrar} />;
  }

  return (
    <ConfirmModal
      titulo="Restablecer contraseña"
      icono="key"
      confirmar="Restablecer"
      isLoading={clave.isLoading}
      error={clave.error}
      onConfirm={clave.confirmar}
      onClose={clave.cerrar}
    >
      <p>
        La contraseña de <strong>{objetivo.nombre}</strong> volverá a ser su usuario
        {objetivo.tipo === 'docente' ? ' (su cédula)' : ' (el documento de su primer hijo matriculado)'}.
      </p>
      <p>Al entrar, el sistema le pedirá elegir una nueva.</p>
    </ConfirmModal>
  );
};

export default RestablecerClaveDialogos;
