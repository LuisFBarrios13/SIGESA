// src/hooks/useMatriculaForm.ts
// Estado y lógica del formulario de nueva matrícula (la página solo renderiza).
import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { gradosApi, matriculasApi, api, type Grado, type MatriculaPayload } from '../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';

// ── Types ─────────────────────────────────────────────────────

export type Jornada = 'MAÑANA' | 'TARDE';

export interface AcudienteEncontrado {
  cedula:            string;
  nombre:            string;
  telefono:          string | null;
  correo:            string | null;
  direccion:         string | null;
  telefono_trabajo:  string | null;
  direccion_trabajo: string | null;
}

export interface FormState {
  numero_identidad:     string;
  nombre_estudiante:    string;
  fecha_nacimiento:     string;
  rh:                   string;
  direccion_estudiante: string;
  observaciones:        string;
  id_grado:             string;
  year:                 string;
  jornada:              Jornada | '';
  cedula_acudiente:     string;
  nombre_acudiente:     string;
  telefono_acudiente:   string;
  correo_acudiente:     string;
  direccion_acudiente:  string;
  parentesco:           string;
}

export type FormErrors = Partial<Record<keyof FormState, string>>;

export const EMPTY_FORM: FormState = {
  numero_identidad:     '',
  nombre_estudiante:    '',
  fecha_nacimiento:     '',
  rh:                   '',
  direccion_estudiante: '',
  observaciones:        '',
  id_grado:             '',
  year:                 String(new Date().getFullYear()),
  jornada:              '',
  cedula_acudiente:     '',
  nombre_acudiente:     '',
  telefono_acudiente:   '',
  correo_acudiente:     '',
  direccion_acudiente:  '',
  parentesco:           '',
};

const SIN_GRADOS: Grado[] = [];

// ── Hook ──────────────────────────────────────────────────────

export const useMatriculaForm = () => {
  const [form, setForm]         = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors]     = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError]   = useState('');
  const [successData, setSuccessData]   = useState<{
    credenciales: { username: string | null; passwordTemporal: string | null; nota: string };
    acudienteNuevo: boolean;
  } | null>(null);

  // ── Estado del auto-completado de acudiente ───────────────
  const [acudienteEncontrado, setAcudienteEncontrado] = useState<AcudienteEncontrado | null>(null);
  const [buscandoAcudiente, setBuscandoAcudiente]     = useState(false);
  const cedulaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const gradosQuery = useQuery({
    queryKey:  queryKeys.grados,
    queryFn:   gradosApi.listar,
    staleTime: Infinity, // catálogo fijo
  });
  const grados          = gradosQuery.data ?? SIN_GRADOS;
  const isLoadingGrados = gradosQuery.isPending;
  const gradosLoadError = gradosQuery.error ? 'No se pudieron cargar los grados.' : '';

  // ── Buscar acudiente cuando cambia la cédula ──────────────
  useEffect(() => {
    if (cedulaTimer.current) clearTimeout(cedulaTimer.current);

    // handleChange ya limpia el acudiente encontrado al cambiar la cédula.
    const cedula = form.cedula_acudiente.trim();
    if (cedula.length < 4) return;

    // Si la cédula cambia mientras la petición está en curso, se ignora la respuesta.
    let cancelado = false;

    cedulaTimer.current = setTimeout(async () => {
      setBuscandoAcudiente(true);
      try {
        const data = await api.get<AcudienteEncontrado>(`/acudientes/${cedula}`);
        if (cancelado) return;
        // Acudiente encontrado — auto-completar campos
        setAcudienteEncontrado(data);
        setForm((prev) => ({
          ...prev,
          nombre_acudiente:    data.nombre,
          telefono_acudiente:  data.telefono  ?? '',
          correo_acudiente:    data.correo    ?? '',
          direccion_acudiente: data.direccion ?? '',
        }));
      } catch {
        // 404 = acudiente nuevo, no es un error
        if (!cancelado) setAcudienteEncontrado(null);
      } finally {
        if (!cancelado) setBuscandoAcudiente(false);
      }
    }, 600);

    return () => {
      cancelado = true;
      setBuscandoAcudiente(false);
      if (cedulaTimer.current) clearTimeout(cedulaTimer.current);
    };
  }, [form.cedula_acudiente]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));

    // Si cambia la cédula, resetear el acudiente encontrado
    if (name === 'cedula_acudiente') {
      setAcudienteEncontrado(null);
    }
  };

  const handleJornadaSelect = (value: Jornada) => {
    setForm((prev) => ({ ...prev, jornada: value, id_grado: '' }));
    setErrors((prev) => ({ ...prev, jornada: undefined, id_grado: undefined }));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.numero_identidad.trim()) next.numero_identidad  = 'Requerido';
    if (!form.nombre_estudiante.trim()) next.nombre_estudiante = 'Requerido';
    if (!form.fecha_nacimiento)         next.fecha_nacimiento  = 'Requerido';
    if (!form.id_grado)                 next.id_grado          = 'Selecciona un grado';
    if (!form.year || isNaN(Number(form.year))) next.year      = 'Año inválido';
    if (!form.jornada)                  next.jornada           = 'Selecciona una jornada';
    if (!form.cedula_acudiente.trim())  next.cedula_acudiente  = 'Requerido';
    if (!form.nombre_acudiente.trim())  next.nombre_acudiente  = 'Requerido';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    const payload: MatriculaPayload = {
      estudiante: {
        numero_identidad: form.numero_identidad.trim(),
        nombre:           form.nombre_estudiante.trim(),
        fecha_nacimiento: form.fecha_nacimiento,
        rh:               form.rh || undefined,
        direccion:        form.direccion_estudiante || undefined,
        observaciones:    form.observaciones || undefined,
      },
      matricula: {
        id_grado: Number(form.id_grado),
        year:     Number(form.year),
        jornada:  form.jornada as Jornada,
      },
      acudiente: {
        cedula:   form.cedula_acudiente.trim(),
        nombre:   form.nombre_acudiente.trim(),
        telefono: form.telefono_acudiente || undefined,
        correo:   form.correo_acudiente   || undefined,
        direccion: form.direccion_acudiente || undefined,
      },
      relacion: { parentesco: form.parentesco || undefined },
    };

    setIsSubmitting(true);
    try {
      const result = await matriculasApi.crear(payload);
      setSuccessData({
        credenciales:   result.credenciales,
        acudienteNuevo: result.acudienteNuevo ?? true,
      });
      // Nuevo estudiante: dashboard y lista de estudiantes cambiaron.
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.estudiantes.all });
      setForm(EMPTY_FORM);
      setAcudienteEncontrado(null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al crear la matrícula');
    } finally {
      setIsSubmitting(false);
    }
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 1);

  // Si el acudiente fue encontrado, los campos son de solo lectura
  const camposAcudienteReadonly = !!acudienteEncontrado;

  /** Quita el acudiente auto-completado para registrar uno distinto. */
  const limpiarAcudiente = () => {
    setAcudienteEncontrado(null);
    setForm((prev) => ({
      ...prev,
      cedula_acudiente:    '',
      nombre_acudiente:    '',
      telefono_acudiente:  '',
      correo_acudiente:    '',
      direccion_acudiente: '',
    }));
  };

  /** Vuelve el formulario a su estado inicial. */
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setSubmitError('');
    setAcudienteEncontrado(null);
  };

  return {
    form, errors,
    grados, isLoadingGrados, gradosLoadError,
    isSubmitting, submitError,
    successData, cerrarExito: () => setSuccessData(null),
    acudienteEncontrado, buscandoAcudiente, camposAcudienteReadonly,
    yearOptions,
    handleChange, handleJornadaSelect, handleSubmit,
    limpiarAcudiente, resetForm,
  };
};
