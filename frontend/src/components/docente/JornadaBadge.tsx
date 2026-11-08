// src/components/docente/JornadaBadge.tsx
import type { JornadaDocente } from '../../services/api';
import { JORNADA_COLOR, JORNADA_LABEL } from '../../constants/docentes';

const JornadaBadge = ({ jornada }: { jornada: JornadaDocente }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${JORNADA_COLOR[jornada]}`}>
    {JORNADA_LABEL[jornada]}
  </span>
);

export default JornadaBadge;
