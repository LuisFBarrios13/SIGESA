// src/components/docente/JornadaBadge.tsx
// Jornada del docente (mañana, tarde o completa) con los colores del diseño.
import type { JornadaDocente } from '../../services/api';
import EstadoBadge from '../ds/EstadoBadge';

const JornadaBadge = ({ jornada }: { jornada: JornadaDocente }) => <EstadoBadge estado={jornada} />;

export default JornadaBadge;
