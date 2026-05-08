// src/types/deudores.ts

import type { CuentaCobro } from '../services/pagosApi';

export interface EstudianteDeudor {
  numero_identidad: string;
  nombre:           string;
}

export interface GradoDeudor {
  nombre: string;
  jornada: 'MAÑANA' | 'TARDE';
}

/** Un estudiante agrupado con todas sus cuentas vencidas */
export interface DeudorAgrupado {
  estudiante:       EstudianteDeudor;
  grado:            GradoDeudor;
  id_matricula:     number;
  year:             number;
  cuentas_vencidas: CuentaCobro[];
  /** Suma del saldo pendiente real (deuda - pagos parciales) */
  saldo_total:      number;
}