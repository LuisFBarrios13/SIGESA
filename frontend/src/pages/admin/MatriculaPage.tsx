// src/pages/admin/MatriculaPage.tsx — Nueva matrícula: asistente de 5 pasos.
// Referencia: lienzo de Claude Design, pantallas «Matrícula · Paso 1…5» y «Matrícula creada».
// Se tomaron la estructura y los textos; se quitaron los íconos de cada sección y de cada
// campo, y la pantalla final es sobria (sin el check gigante con halo ni la fila de chips).

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { acudientesApi, estudiantesApi, gradosApi, matriculasApi, type DuenoDocumento, type PeriodoMatricula, type PeriodoInfo, type DestinoRematricula } from '../../services/api';
import { pagosApi, type Tarifa } from '../../services/pagosApi';
import type { EstudianteDetalle, EstudianteListItem, Sexo, TipoDocumento } from '../../types/estudiantes';
import type { AcudienteDetalle } from '../../types/acudientes-admin';
import type { Credenciales, Grado, JornadaEstudiante } from '../../types/shared';
import { NOMBRE_ESTADO } from '../../types/matriculas';
import type { Seccion } from '../../layouts/AdminLayout';
import { documento, edad, fechaDia, fechaEncabezado, iniciales } from '../../utils/formato';
import * as I from '../../components/iconos';

interface Props {
  onIr: (s: Seccion) => void;
  onVerEstudiante: (id: string) => void;
}

type Paso = 1 | 2 | 3 | 4 | 5;
type Modo = 'nuevo' | 'rematricula';

const YEAR_ACTUAL = new Date().getFullYear();
const BORRADOR = 'sigesa_matricula_borrador';

const PASOS: { n: Paso; titulo: string; descripcion: string }[] = [
  { n: 1, titulo: 'Buscar estudiante', descripcion: 'Escribe el documento para saber si el estudiante ya está registrado.' },
  { n: 2, titulo: 'Datos del estudiante', descripcion: 'Completa los datos personales del estudiante.' },
  { n: 3, titulo: 'Acudiente', descripcion: 'Busca primero por cédula: si el acudiente ya existe, se vincula con sus datos actuales.' },
  { n: 4, titulo: 'Matrícula', descripcion: 'Elige el año (este o el próximo), el grado y la jornada.' },
  { n: 5, titulo: 'Revisar y confirmar', descripcion: 'Confirma que todo esté bien antes de guardar.' },
];

const TIPOS_DOCUMENTO: [TipoDocumento, string][] = [
  ['RC', 'Registro civil'], ['TI', 'Tarjeta de identidad'], ['CC', 'Cédula de ciudadanía'],
  ['CE', 'Cédula de extranjería'], ['PPT', 'Permiso por protección temporal'], ['PA', 'Pasaporte'],
];
const NOMBRE_TIPO = Object.fromEntries(TIPOS_DOCUMENTO) as Record<TipoDocumento, string>;
const TIPOS_SANGRE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const PARENTESCOS = ['Madre', 'Padre', 'Abuelo/a', 'Tío/a', 'Hermano/a', 'Otro'];
/** Edad que se cumple a 31 de marzo del año escolar → grado que le corresponde. */
const GRADO_POR_EDAD: Record<number, string> = { 4: 'Jardín', 5: 'Transición', 6: 'Primero', 7: 'Segundo', 8: 'Tercero', 9: 'Cuarto', 10: 'Quinto' };
const DOCUMENTO_VALIDO = /^[A-Za-z0-9-]{3,20}$/;
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormEstudiante {
  tipo_documento: TipoDocumento | ''; nombre: string; fecha_nacimiento: string; sexo: Sexo | '';
  rh: string; eps: string; observaciones: string; direccion: string;
}
interface FormAcudiente {
  cedula: string; nombre: string; parentesco: string; telefono: string; correo: string;
  direccion: string; mismaDireccion: boolean; telefono_trabajo: string; direccion_trabajo: string;
}
interface FormMatricula { year: number; grado: string; jornada: JornadaEstudiante | ''; fecha: string }

type Busqueda<T> =
  | { estado: 'inicial' }
  | { estado: 'buscando' }
  | { estado: 'nuevo'; doc: string; docente?: string }
  | { estado: 'existe'; doc: string; dato: T }
  | { estado: 'error'; mensaje: string };

interface Resultado {
  id: string; nombre: string; grado: string; jornada: JornadaEstudiante; year: number; fecha: string;
  acudiente: string | null; parentesco: string | null; credenciales: Credenciales | null; sexo: Sexo | '' | null | undefined;
}

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
/** La fecha de matrícula no puede ser de antes del 1 de enero del año pasado (igual que el servidor). */
const fechaMinimaMatricula = () => `${new Date().getFullYear() - 1}-01-01`;
const pesos = (v: number) => `$${Math.round(v).toLocaleString('es-CO')}`;
const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

const ESTUDIANTE_VACIO: FormEstudiante = { tipo_documento: '', nombre: '', fecha_nacimiento: '', sexo: '', rh: '', eps: '', observaciones: '', direccion: '' };
const ACUDIENTE_VACIO: FormAcudiente = { cedula: '', nombre: '', parentesco: '', telefono: '', correo: '', direccion: '', mismaDireccion: false, telefono_trabajo: '', direccion_trabajo: '' };
const matriculaVacia = (): FormMatricula => ({ year: YEAR_ACTUAL, grado: '', jornada: '', fecha: hoyISO() });

/** Estado completo del asistente (lo que se guarda como borrador). */
interface Borrador {
  paso: Paso; modo: Modo; doc: string;
  busEst: Busqueda<EstudianteDetalle>; busAcu: Busqueda<AcudienteDetalle | null>;
  est: FormEstudiante; acu: FormAcudiente; mat: FormMatricula;
}
const borradorInicial = (): Borrador => ({
  paso: 1, modo: 'nuevo', doc: '', busEst: { estado: 'inicial' }, busAcu: { estado: 'inicial' },
  est: { ...ESTUDIANTE_VACIO }, acu: { ...ACUDIENTE_VACIO }, mat: matriculaVacia(),
});
function leerBorrador(): Borrador {
  try {
    const b = JSON.parse(localStorage.getItem(BORRADOR) ?? 'null') as Borrador | null;
    // Una búsqueda que quedó «buscando» al cerrar la pestaña se repite.
    if (b && b.busEst.estado === 'buscando') b.busEst = { estado: 'inicial' };
    if (b && b.busAcu.estado === 'buscando') b.busAcu = { estado: 'inicial' };
    return b ?? borradorInicial();
  } catch { return borradorInicial(); }
}

/** El documento de un estudiante nuevo ya es de otra persona (mismo texto que el backend). */
function mensajeDocumentoOcupado(d: string, dueno: DuenoDocumento) {
  if (dueno.tipo === 'docente') return `El documento ${d} es del docente ${dueno.nombre}. Revisa el número del estudiante.`;
  if (dueno.tipo === 'acudiente') return `El documento ${d} es del acudiente ${dueno.nombre}. Revisa el número del estudiante.`;
  return `El documento ${d} ya es el usuario de otra cuenta del sistema. Revisa el número del estudiante.`;
}


export default function MatriculaPage({ onIr, onVerEstudiante }: Props) {
  const [b, setB] = useState<Borrador>(leerBorrador);
  const { paso, modo, doc, busEst, busAcu, est, acu, mat } = b;
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [grados, setGrados] = useState<Grado[]>([]);
  const [tarifa, setTarifa] = useState<Tarifa | null | undefined>(undefined);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const [resultado, setResultado] = useState<Resultado | null>(null);
  // Años posibles según el servidor: el año en curso (ACTIVO) o el siguiente (PROMOCION).
  const [periodo, setPeriodo] = useState<PeriodoInfo | null>(null);

  const cambiar = (parcial: Partial<Borrador>) => setB(prev => ({ ...prev, ...parcial }));
  const setEst = (p: Partial<FormEstudiante>) => setB(prev => ({ ...prev, est: { ...prev.est, ...p } }));
  const setAcu = (p: Partial<FormAcudiente>) => setB(prev => ({ ...prev, acu: { ...prev.acu, ...p } }));
  const setMat = (p: Partial<FormMatricula>) => setB(prev => ({ ...prev, mat: { ...prev.mat, ...p } }));
  const limpiarError = (...campos: string[]) => setErrores(prev => {
    if (!campos.some(c => c in prev)) return prev;
    const n = { ...prev }; campos.forEach(c => delete n[c]); return n;
  });

  // Borrador: si se cierra la pestaña sin querer, al volver sigue donde iba.
  useEffect(() => {
    if (resultado) return;
    try {
      if (b.paso === 1 && !b.doc) localStorage.removeItem(BORRADOR);
      else localStorage.setItem(BORRADOR, JSON.stringify(b));
    } catch { /* sin almacenamiento: no pasa nada */ }
  }, [b, resultado]);

  useEffect(() => { gradosApi.listar().then(setGrados).catch(() => setGrados([])); }, []);
  useEffect(() => {
    matriculasApi.periodo()
      .then(p => {
        setPeriodo(p);
        // Un borrador viejo con un año que ya no es válido vuelve al año en curso.
        setB(prev => prev.modo === 'nuevo' && !p.opciones.some(o => o.year === prev.mat.year)
          ? { ...prev, mat: { ...prev.mat, year: p.yearEnCurso } } : prev);
      })
      .catch(() => setErrorEnvio('No se pudo saber el año de matrícula. Recarga la página.'));
  }, []);

  const estudianteExistente = busEst.estado === 'existe' ? busEst.dato : null;
  // Re-matrícula: el servidor dice para qué año (activo este año → el siguiente, en promoción) o por qué no.
  const [destino, setDestino] = useState<{ id: string; d: DestinoRematricula | null } | null>(null);
  const idExistente = estudianteExistente?.numero_identidad;
  useEffect(() => {
    if (!idExistente) return;
    let vigente = true;
    matriculasApi.destinoRematricula(idExistente)
      .then(d => { if (vigente) setDestino({ id: idExistente, d }); })
      .catch(e => { if (vigente) setDestino({ id: idExistente, d: { posible: false, motivo: e instanceof Error ? e.message : 'No se pudo consultar.' } }); });
    return () => { vigente = false; };
  }, [idExistente]);
  /** undefined mientras se consulta. */
  const destinoActual = idExistente && destino?.id === idExistente ? destino.d : undefined;
  const destinoPosible = destinoActual?.posible ? destinoActual : null;
  /** Año y estado que se muestran en el paso 4. */
  /** Re-matrícula que ya no se puede hacer (p. ej. un borrador viejo de un estudiante que ya se matriculó). */
  const bloqueoRematricula = modo === 'rematricula' && destinoActual && !destinoActual.posible ? destinoActual.motivo : '';
  const anioMatricula: PeriodoMatricula | null = modo === 'rematricula'
    ? destinoPosible
    : periodo?.opciones.find(o => o.year === mat.year) ?? null;
  useEffect(() => {
    let vigente = true;
    setTarifa(undefined);
    pagosApi.getTarifa(mat.year).then(t => { if (vigente) setTarifa(t); }).catch(() => { if (vigente) setTarifa(null); });
    return () => { vigente = false; };
  }, [mat.year]);

  const acudienteExistente = busAcu.estado === 'existe' ? busAcu.dato : null;
  const acudientePrincipal = estudianteExistente
    ? [...estudianteExistente.acudientes].sort((x, y) => Number(!!y.RelacionEA?.acudiente_principal) - Number(!!x.RelacionEA?.acudiente_principal))[0]
    : undefined;

  // Grados únicos por nombre, en el orden en que vienen (Jardín, Transición, Primero…).
  const nombresGrado = useMemo(() => [...new Set(grados.map(g => g.nombre))], [grados]);
  const jornadasDe = (nombre: string) => grados.filter(g => g.nombre === nombre).map(g => g.jornada);
  const gradoElegido = grados.find(g => g.nombre === mat.grado && g.jornada === mat.jornada);
  const nacimiento = estudianteExistente?.fecha_nacimiento ?? est.fecha_nacimiento;
  const edadEscolar = edad(nacimiento, new Date(mat.year, 2, 31));
  const sugerido = edadEscolar !== null ? GRADO_POR_EDAD[edadEscolar] : undefined;
  const nombreEstudiante = estudianteExistente?.nombre ?? est.nombre.trim();
  const nombreAcudiente = acudienteExistente?.nombre ?? acu.nombre.trim();

  /* ── Búsquedas ──────────────────────────────────────────────── */

  async function buscarEstudiante(docElegido?: string): Promise<Busqueda<EstudianteDetalle>> {
    const d = (docElegido ?? doc).trim();
    if (!DOCUMENTO_VALIDO.test(d)) {
      setErrores({ doc: d ? 'Solo letras, números y guiones (3 a 20 caracteres).' : 'Escribe el número de documento.' });
      return busEst;
    }
    setErrores({});
    cambiar({ busEst: { estado: 'buscando' } });
    let r: Busqueda<EstudianteDetalle>;
    try {
      r = { estado: 'existe', doc: d, dato: await estudiantesApi.obtener(d) };
    } catch (e) {
      if ((e as { status?: number }).status === 404) {
        // No es estudiante. Tampoco puede ser el documento de un docente, un acudiente u otra cuenta.
        try {
          const dueno = await matriculasApi.documento(d);
          r = dueno
            ? { estado: 'error', mensaje: mensajeDocumentoOcupado(d, dueno) }
            : { estado: 'nuevo', doc: d };
        } catch (e2) {
          r = { estado: 'error', mensaje: e2 instanceof Error ? e2.message : 'No se pudo buscar.' };
        }
      } else {
        r = { estado: 'error', mensaje: e instanceof Error ? e.message : 'No se pudo buscar.' };
      }
    }
    cambiar({ busEst: r });
    return r;
  }

  async function buscarAcudiente(): Promise<Busqueda<AcudienteDetalle | null>> {
    const c = acu.cedula.trim();
    if (!DOCUMENTO_VALIDO.test(c)) {
      setErrores({ cedula: c ? 'Solo letras, números y guiones (3 a 20 caracteres).' : 'Escribe la cédula del acudiente.' });
      return busAcu;
    }
    if (c === doc.trim()) {
      setErrores({ cedula: 'Es el documento del estudiante. Escribe la cédula del acudiente.' });
      return busAcu;
    }
    setErrores({});
    cambiar({ busAcu: { estado: 'buscando' } });
    let r: Busqueda<AcudienteDetalle | null>;
    try {
      const a = await acudientesApi.buscar(c);
      if (a) r = { estado: 'existe', doc: c, dato: a };
      else {
        // Un docente también puede ser acudiente: se traen sus datos para no escribirlos otra vez.
        const dueno = await matriculasApi.documento(c).catch(() => null);
        if (dueno?.tipo === 'docente') {
          setB(prev => ({ ...prev, acu: {
            ...prev.acu,
            nombre:   prev.acu.nombre   || (dueno.nombre ?? ''),
            telefono: prev.acu.telefono || (dueno.telefono ?? ''),
            correo:   prev.acu.correo   || (dueno.correo ?? ''),
          } }));
          r = { estado: 'nuevo', doc: c, docente: dueno.nombre ?? '' };
        } else r = { estado: 'nuevo', doc: c };
      }
    } catch (e) {
      r = { estado: 'error', mensaje: e instanceof Error ? e.message : 'No se pudo buscar.' };
    }
    cambiar({ busAcu: r });
    return r;
  }

  /* ── Validación por paso ────────────────────────────────────── */

  function validar(p: Paso): Record<string, string> {
    const e: Record<string, string> = {};
    if (p === 2) {
      if (!est.tipo_documento) e.tipo_documento = 'Elige el tipo de documento.';
      if (est.nombre.trim().length < 3) e.nombre = 'Escribe el nombre completo.';
      if (!est.fecha_nacimiento) e.fecha_nacimiento = 'La fecha de nacimiento es obligatoria.';
      else if (est.fecha_nacimiento > hoyISO()) e.fecha_nacimiento = 'La fecha no puede ser futura.';
      else if ((edad(est.fecha_nacimiento) ?? 0) > 25) e.fecha_nacimiento = 'Revisa el año de nacimiento.';
    }
    if (p === 3) {
      if (!acudienteExistente && acu.nombre.trim().length < 3) e.nombre_acudiente = 'Escribe el nombre completo.';
      if (!acu.parentesco) e.parentesco = 'Elige el parentesco.';
      if (!acudienteExistente && acu.correo.trim() && !CORREO_VALIDO.test(acu.correo.trim())) e.correo = 'Revisa el correo.';
    }
    if (p === 4) {
      if (!mat.grado) e.grado = 'Elige el grado.';
      else if (!mat.jornada) e.jornada = 'Elige la jornada.';
      else if (!gradoElegido) e.jornada = 'Ese grado no tiene esa jornada.';
      if (modo === 'nuevo' && mat.fecha && (mat.fecha > hoyISO() || mat.fecha < fechaMinimaMatricula())) {
        e.fecha = 'La fecha no puede ser futura ni de hace más de un año.';
      }
      if (modo === 'rematricula' && destinoActual && !destinoActual.posible) e.grado = destinoActual.motivo;
    }
    return e;
  }

  /** Pasos que no aplican en una re-matrícula (sus datos y su acudiente ya existen). */
  const omitido = (n: Paso) => modo === 'rematricula' && (n === 2 || n === 3);
  const irA = (n: Paso) => { setErrores({}); setErrorEnvio(''); cambiar({ paso: n }); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  async function siguiente() {
    if (paso === 1) {
      const r = busEst.estado === 'nuevo' && busEst.doc === doc.trim() ? busEst : await buscarEstudiante();
      if (r.estado === 'nuevo') { cambiar({ modo: 'nuevo' }); irA(2); }
      return;
    }
    if (paso === 3 && !(busAcu.estado === 'existe' || busAcu.estado === 'nuevo') ) {
      const r = await buscarAcudiente();
      if (r.estado !== 'existe' && r.estado !== 'nuevo') return;
      // Recién encontrado o nuevo: se muestran sus campos antes de seguir.
      return;
    }
    const e = validar(paso);
    if (Object.keys(e).length) { setErrores(e); return; }
    let n = (paso + 1) as Paso;
    while (omitido(n)) n = (n + 1) as Paso;
    irA(n);
  }

  function atras() {
    let n = (paso - 1) as Paso;
    while (n > 1 && omitido(n)) n = (n - 1) as Paso;
    irA(n);
  }

  function rematricular() {
    if (!estudianteExistente || !destinoPosible) return;
    const ultima = [...estudianteExistente.matriculas].sort((x, z) => z.year - x.year)[0];
    cambiar({ modo: 'rematricula', mat: { year: destinoPosible.year, grado: '', jornada: ultima?.jornada ?? '', fecha: hoyISO() } });
    irA(4);
  }

  /* ── Guardar ────────────────────────────────────────────────── */

  async function confirmar() {
    if (!gradoElegido) { irA(4); return; }
    if (!anioMatricula) return;
    setEnviando(true);
    setErrorEnvio('');
    try {
      if (modo === 'rematricula' && estudianteExistente) {
        await matriculasApi.rematricular({ id_estudiante: estudianteExistente.numero_identidad, id_grado: gradoElegido.id_grado });
        setResultado({
          id: estudianteExistente.numero_identidad, nombre: estudianteExistente.nombre, grado: gradoElegido.nombre,
          jornada: gradoElegido.jornada, year: mat.year, fecha: hoyISO(),
          acudiente: acudientePrincipal?.nombre ?? null, parentesco: acudientePrincipal?.RelacionEA?.parentesco ?? null, credenciales: null,
          sexo: estudianteExistente.sexo,
        });
      } else {
        const t = (s: string) => s.trim() || undefined;
        const direccionAcu = acu.mismaDireccion ? est.direccion : acu.direccion;
        const r = await matriculasApi.crear({
          estudiante: {
            numero_identidad: doc.trim(), nombre: est.nombre.trim(), fecha_nacimiento: est.fecha_nacimiento,
            tipo_documento: est.tipo_documento || undefined, sexo: est.sexo || undefined,
            rh: est.rh || undefined, eps: t(est.eps), direccion: t(est.direccion), observaciones: t(est.observaciones),
          },
          matricula: { id_grado: gradoElegido.id_grado, year: mat.year, jornada: gradoElegido.jornada, fecha_matricula: mat.fecha || undefined },
          acudiente: acudienteExistente
            ? { cedula: acudienteExistente.cedula, nombre: acudienteExistente.nombre }
            : {
                cedula: acu.cedula.trim(), nombre: acu.nombre.trim(), telefono: t(acu.telefono), correo: t(acu.correo),
                direccion: t(direccionAcu), telefono_trabajo: t(acu.telefono_trabajo), direccion_trabajo: t(acu.direccion_trabajo),
              },
          relacion: { parentesco: acu.parentesco },
        });
        setResultado({
          id: doc.trim(), nombre: est.nombre.trim(), grado: gradoElegido.nombre, jornada: gradoElegido.jornada,
          year: mat.year, fecha: mat.fecha || hoyISO(), acudiente: nombreAcudiente, parentesco: acu.parentesco, sexo: est.sexo,
          credenciales: r.credenciales.username && r.credenciales.passwordTemporal
            ? { username: r.credenciales.username, passwordTemporal: r.credenciales.passwordTemporal, nota: r.credenciales.nota }
            : null,
        });
      }
      try { localStorage.removeItem(BORRADOR); } catch { /* nada */ }
      window.scrollTo({ top: 0 });
    } catch (e) {
      setErrorEnvio(e instanceof Error ? e.message : 'No se pudo guardar la matrícula.');
    } finally {
      setEnviando(false);
    }
  }

  function empezarDeNuevo() {
    try { localStorage.removeItem(BORRADOR); } catch { /* nada */ }
    setB(borradorInicial());
    setErrores({});
    setErrorEnvio('');
    setResultado(null);
    window.scrollTo({ top: 0 });
  }

  function cancelar() {
    const hayDatos = paso > 1 || !!doc.trim();
    if (hayDatos && !window.confirm('¿Descartar esta matrícula? Se borrarán los datos que escribiste.')) return;
    empezarDeNuevo();
    onIr('estudiantes');
  }

  /* ── Pantalla final ─────────────────────────────────────────── */

  if (resultado) {
    return (
      <main className="flex-1 flex flex-col">
        <Encabezado titulo="Matrículas" />
        <MatriculaCreada
          r={resultado}
          onNueva={empezarDeNuevo}
          onPago={() => onIr('pagos')}
          onFicha={() => onVerEstudiante(resultado.id)}
        />
      </main>
    );
  }

  const info = PASOS[paso - 1];
  const proximo = PASOS.slice(paso).find(p => !omitido(p.n));
  const estadoPaso = (n: Paso): EstadoPaso => omitido(n) ? 'omitido' : n < paso ? 'completo' : n === paso ? 'actual' : 'pendiente';
  const bloqueado = paso === 1 && busEst.estado === 'existe' && busEst.doc === doc.trim();

  return (
    <main className="flex-1 flex flex-col">
      <Encabezado
        titulo="Nueva matrícula"
        accion={
          <button type="button" onClick={cancelar} aria-label="Cancelar matrícula"
            className="presionable shrink-0 flex items-center justify-center gap-2.5 whitespace-nowrap size-11 sm:size-auto sm:h-12 sm:px-5 rounded-xl border border-(--p-borde) text-[13px] font-bold hover:bg-(--p-hover)">
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 5 L15 15 M15 5 L5 15" />
            </svg>
            <span className="hidden sm:inline">Cancelar</span>
          </button>
        }
      />

      <div className="aparecer mt-5 lg:mt-6 grid gap-4 lg:gap-5 lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start">
        {/* Pasos (computador) */}
        <aside aria-label="Pasos de la matrícula" className="hidden lg:block lg:sticky lg:top-4 rounded-[22px] border border-(--p-borde) bg-(--p-sup) p-5">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-(--p-suave)">Pasos</p>
          <ol className="mt-4">
            {PASOS.map((p, i) => (
              <ItemPaso key={p.n} n={p.n} titulo={p.titulo} estado={estadoPaso(p.n)} ultimo={i === PASOS.length - 1}
                onIr={estadoPaso(p.n) === 'completo' ? () => irA(p.n) : undefined} />
            ))}
          </ol>
          <p className="mt-5 pt-4 border-t border-(--p-borde) text-[12.5px] leading-relaxed text-(--p-suave)">
            Los campos con <b className="text-(--p-tinta)">*</b> son obligatorios.
          </p>
        </aside>

        {/* Formulario del paso */}
        <section aria-labelledby="titulo-paso" className="min-w-0 rounded-[22px] border border-(--p-borde) bg-(--p-sup)">
          <div className="px-4 sm:px-7 pt-5 sm:pt-7">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[12px] font-bold tracking-[0.12em] uppercase text-(--p-suave)">Paso {paso} de 5</p>
              {proximo && <p className="lg:hidden text-[12px] text-(--p-suave)">Siguiente: {proximo.titulo}</p>}
            </div>
            {/* Barra de avance (celular y tablet) */}
            <div className="lg:hidden mt-2.5 h-1.5 rounded-full bg-(--p-menta) overflow-hidden" role="progressbar"
              aria-label="Avance de la matrícula" aria-valuemin={0} aria-valuemax={5} aria-valuenow={paso}>
              <div className="h-full rounded-full bg-(--p-acento) transition-[width] duration-300" style={{ width: `${paso * 20}%` }} />
            </div>
            <h2 id="titulo-paso" className="mt-3 text-[22px] sm:text-[24px] font-extrabold tracking-tight">{info.titulo}</h2>
            <p className="mt-1 text-[14px] text-(--p-suave)">{modo === 'rematricula' && paso === 4 ? `Elige el grado y la jornada de ${nombreEstudiante}.` : info.descripcion}</p>
          </div>

          <div key={paso} className="fundido px-4 sm:px-7 py-6 sm:py-7 max-w-[960px]">
            {paso === 1 && (
              <PasoBuscar
                doc={doc}
                onDoc={v => { cambiar({ doc: v, busEst: { estado: 'inicial' } }); limpiarError('doc'); }}
                error={errores.doc}
                busqueda={busEst}
                onBuscar={() => buscarEstudiante()}
                onElegir={id => { cambiar({ doc: id }); limpiarError('doc'); buscarEstudiante(id); }}
                onRematricular={rematricular}
                destino={destinoActual}
              />
            )}
            {paso === 2 && <PasoEstudiante doc={doc} est={est} setEst={setEst} errores={errores} limpiar={limpiarError} />}
            {paso === 3 && (
              <PasoAcudiente
                acu={acu} setAcu={setAcu} errores={errores} limpiar={limpiarError}
                busqueda={busAcu} onBuscar={buscarAcudiente}
                onCedula={v => { setAcu({ cedula: v }); cambiar({ busAcu: { estado: 'inicial' } }); limpiarError('cedula'); }}
                nombreEstudiante={est.nombre.trim().split(/\s+/)[0] || 'el estudiante'}
                direccionEstudiante={est.direccion}
              />
            )}
            {(paso === 4 || paso === 5) && bloqueoRematricula && <div className="mb-5"><Aviso tono="error">{bloqueoRematricula}</Aviso></div>}
            {paso === 4 && (
              <PasoMatricula
                mat={mat} setMat={setMat} errores={errores} limpiar={limpiarError}
                seleccion={anioMatricula} opciones={modo === 'nuevo' ? periodo?.opciones ?? [] : null} nombresGrado={nombresGrado} jornadasDe={jornadasDe}
                sugerido={sugerido && nombresGrado.includes(sugerido) ? sugerido : undefined}
                edadEscolar={edadEscolar} tarifa={tarifa}
              />
            )}
            {paso === 5 && (
              <PasoRevisar
                modo={modo} doc={doc} est={est} acu={acu} mat={mat} tarifa={tarifa}
                estudianteExistente={estudianteExistente} acudienteExistente={acudienteExistente}
                acudientePrincipal={acudientePrincipal} gradoElegido={gradoElegido}
                onCambiar={irA} error={errorEnvio}
              />
            )}
          </div>

          {/* Acciones: fijas abajo en el celular (sobre la barra de navegación). Con el estudiante
              ya encontrado no se fijan, para no tapar su botón «Matricular para…». */}
          <div className={`${bloqueado ? '' : 'sticky bottom-[88px] lg:bottom-0 z-10'} flex items-center gap-3 px-4 sm:px-7 py-4 border-t border-(--p-borde) bg-(--p-sup) rounded-b-[22px]`}>
            <button type="button" onClick={atras} disabled={paso === 1}
              className="presionable h-12 px-5 flex items-center justify-center gap-2.5 whitespace-nowrap rounded-xl border border-(--p-borde) text-[13px] font-bold hover:bg-(--p-hover) disabled:opacity-40 disabled:pointer-events-none">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 10 H4 M9 5 L4 10 L9 15" />
              </svg>
              Atrás
            </button>
            <p className="hidden sm:block flex-1 text-right text-[13px] text-(--p-suave)">
              {bloqueado && destinoPosible ? 'Usa «Matricular para…» para continuar' : ''}
            </p>
            {paso < 5 ? (
              <button type="button" onClick={siguiente} disabled={bloqueado || busEst.estado === 'buscando' || busAcu.estado === 'buscando'}
                className="presionable max-sm:flex-1 h-12 flex items-stretch overflow-hidden rounded-xl bg-(--p-acento) text-[#160c28] hover:brightness-105 disabled:opacity-45 disabled:pointer-events-none">
                <span className="flex-1 flex items-center justify-center px-3 sm:px-[22px] text-[12px] sm:text-[13px] font-extrabold tracking-[0.1em] sm:tracking-[0.14em] uppercase whitespace-nowrap">
                  {busEst.estado === 'buscando' || busAcu.estado === 'buscando' ? 'Buscando…' : 'Siguiente'}
                </span>
                <span className="w-12 flex-none flex items-center justify-center bg-[rgba(22,12,40,0.12)]">
                  <svg aria-hidden="true" width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 10 H16 M11 5 L16 10 L11 15" />
                  </svg>
                </span>
              </button>
            ) : (
              <button type="button" onClick={confirmar} disabled={enviando || !anioMatricula}
                className="presionable max-sm:flex-1 h-12 px-7 rounded-xl bg-(--p-acento) text-[#160c28] text-[12.5px] font-bold tracking-[0.12em] uppercase hover:brightness-105 disabled:opacity-60">
                {enviando ? 'Guardando…' : 'Confirmar matrícula'}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

/* ── Piezas de la página ───────────────────────────────────────── */

function Encabezado({ titulo, accion }: { titulo: string; accion?: ReactNode }) {
  return (
    <div className="aparecer flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[28px] lg:text-[32px] leading-tight font-extrabold tracking-tight">{titulo}</h1>
        <p className="mt-1 text-[10px] lg:text-[11.5px] font-semibold tracking-[0.18em] text-(--p-suave)">
          {fechaEncabezado(new Date(), true)}<span className="hidden sm:inline"> · AÑO ESCOLAR {YEAR_ACTUAL}</span>
        </p>
      </div>
      {accion}
    </div>
  );
}

type EstadoPaso = 'completo' | 'actual' | 'pendiente' | 'omitido';

function ItemPaso({ n, titulo, estado, ultimo, onIr }: { n: number; titulo: string; estado: EstadoPaso; ultimo: boolean; onIr?: () => void }) {
  const textoEstado = { completo: 'Completo', actual: 'Paso actual', pendiente: 'Pendiente', omitido: 'No aplica' }[estado];
  const contenido = (
    <>
      <span className={`grid place-items-center shrink-0 size-8 rounded-full text-[13px] font-bold ${
        estado === 'actual' ? 'bg-(--p-acento) text-[#160c28]'
          : estado === 'completo' ? 'bg-(--p-banda) text-white'
            : 'border border-(--p-borde) text-(--p-suave)'
      }`}>
        {estado === 'completo' ? <I.Check tam={15} /> : n}
      </span>
      <span className="min-w-0 pt-0.5 leading-tight text-left">
        <span className={`block text-[14px] ${estado === 'actual' ? 'font-bold' : estado === 'omitido' ? 'text-(--p-suave) line-through decoration-(--p-borde)' : 'font-semibold'}`}>{titulo}</span>
        <span className="block mt-0.5 text-[12px] text-(--p-suave)">{textoEstado}</span>
      </span>
    </>
  );
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!ultimo && <span aria-hidden className="absolute left-4 top-9 bottom-1 w-px bg-(--p-borde)" />}
      {onIr ? (
        <button type="button" onClick={onIr} className="flex gap-3 rounded-lg -m-1 p-1 hover:bg-(--p-hover)" aria-label={`Volver a ${titulo}`}>{contenido}</button>
      ) : (
        <div className="flex gap-3" aria-current={estado === 'actual' ? 'step' : undefined}>{contenido}</div>
      )}
    </li>
  );
}

/* ── Campos ────────────────────────────────────────────────────── */

const claseCampo =
  'w-full h-12 px-4 rounded-xl border border-(--p-borde) bg-(--p-campo) text-[14.5px] outline-none transition-colors ' +
  'placeholder:text-(--p-tenue) focus:border-(--p-acento) focus:ring-3 focus:ring-(--p-acento)/25 aria-invalid:border-red-500 ' +
  '[&[readonly]]:bg-(--p-menta) [&[readonly]]:focus:ring-0 [&[readonly]]:focus:border-(--p-borde)';

function Campo({ etiqueta, requerido = false, extra, error, ayuda, className = '', children }: {
  etiqueta: string; requerido?: boolean; extra?: ReactNode; error?: string; ayuda?: string; className?: string; children: ReactNode;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="flex items-baseline gap-2 mb-2 text-[11px] font-bold tracking-[0.14em] uppercase text-(--p-suave)">
        <span>{etiqueta}{requerido && <span className="text-(--p-tinta)"> *</span>}</span>
        {extra && <span className="normal-case tracking-normal text-[12px] font-medium">{extra}</span>}
      </span>
      {children}
      {error
        ? <span role="alert" className="block mt-1.5 text-[12.5px] font-medium text-red-600">{error}</span>
        : ayuda && <span className="block mt-1.5 text-[12.5px] text-(--p-suave)">{ayuda}</span>}
    </label>
  );
}

function Selector({ value, onChange, invalido, children }: { value: string; onChange: (v: string) => void; invalido?: boolean; children: ReactNode }) {
  return (
    <span className="relative block">
      <select value={value} onChange={e => onChange(e.target.value)} aria-invalid={invalido || undefined}
        className={`${claseCampo} appearance-none pr-10 cursor-pointer`}>
        {children}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-(--p-suave)"><I.ChevronAbajo tam={16} /></span>
    </span>
  );
}

/** Grupo de opciones tipo cápsula (sexo, jornada, año, parentesco). */
function Opciones<T extends string | number>({ etiqueta, opciones, valor, onCambio, invalido, envolver = false }: {
  etiqueta: string; opciones: { valor: T; texto: string; deshabilitada?: boolean }[]; valor: T | ''; onCambio: (v: T) => void;
  invalido?: boolean; envolver?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={etiqueta} aria-invalid={invalido || undefined}
      className={`flex gap-1 p-1 rounded-xl bg-(--p-menta) ${envolver ? 'flex-wrap' : ''} ${invalido ? 'ring-1 ring-red-500' : ''}`}>
      {opciones.map(o => {
        const activo = o.valor === valor;
        return (
          <button key={String(o.valor)} type="button" role="radio" aria-checked={activo} disabled={o.deshabilitada}
            onClick={() => onCambio(o.valor)}
            className={`${envolver ? 'px-4' : 'flex-1'} h-10 rounded-[9px] text-[14px] transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${
              activo ? 'bg-(--p-acento) text-[#160c28] font-bold' : 'font-medium hover:bg-(--p-sup)/60'
            }`}>
            {o.texto}
          </button>
        );
      })}
    </div>
  );
}

function BloqueCampos({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mb-8 last:mb-0">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-[12px] font-bold tracking-[0.14em] uppercase">{titulo}</h3>
        <span aria-hidden className="flex-1 h-px bg-(--p-borde)" />
      </div>
      <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Aviso({ children, tono = 'menta' }: { children: ReactNode; tono?: 'menta' | 'error' }) {
  return (
    <div role={tono === 'error' ? 'alert' : 'status'}
      className={`rounded-[14px] px-4 py-3 text-[14px] leading-relaxed ${tono === 'error' ? 'border border-red-500/50 bg-red-500/10' : 'bg-(--p-menta)'}`}>
      {children}
    </div>
  );
}

/** Campo con botón «Buscar» al lado (documento del estudiante, cédula del acudiente). */
function CampoBuscar({ id, etiqueta, valor, onCambio, onBuscar, buscando, error, placeholder }: {
  id: string; etiqueta: string; valor: string; onCambio: (v: string) => void; onBuscar: () => void; buscando: boolean; error?: string; placeholder?: string;
}) {
  const enviar = (e: FormEvent) => { e.preventDefault(); onBuscar(); };
  return (
    <form onSubmit={enviar} className="max-w-[560px]">
      <label htmlFor={id} className="block mb-2 text-[11px] font-bold tracking-[0.14em] uppercase text-(--p-suave)">
        {etiqueta}<span className="text-(--p-tinta)"> *</span>
      </label>
      <div className="flex gap-2.5">
        <input id={id} value={valor} onChange={e => onCambio(e.target.value)} inputMode="numeric" autoComplete="off" autoFocus
          placeholder={placeholder} aria-invalid={!!error || undefined} className={`${claseCampo} text-[16px] tracking-wide`} />
        <button type="submit" disabled={buscando}
          className="presionable shrink-0 h-12 px-6 rounded-xl bg-(--p-banda) text-white text-[12.5px] font-bold tracking-[0.12em] uppercase hover:brightness-125 disabled:opacity-60">
          {buscando ? 'Buscando…' : 'Buscar'}
        </button>
      </div>
      {error && <span role="alert" className="block mt-1.5 text-[12.5px] font-medium text-red-600">{error}</span>}
    </form>
  );
}

/* ── Paso 1 · Buscar estudiante ────────────────────────────────── */

function PasoBuscar({ doc, onDoc, error, busqueda, onBuscar, onElegir, onRematricular, destino }: {
  doc: string; onDoc: (v: string) => void; error?: string; busqueda: Busqueda<EstudianteDetalle>;
  onBuscar: () => void; onElegir: (id: string) => void; onRematricular: () => void; destino: DestinoRematricula | null | undefined;
}) {
  // Coincidencias mientras se escribe (por documento o por nombre), sin tener que darle «Buscar».
  const q = doc.trim();
  const activa = busqueda.estado === 'inicial' && q.length >= 2;
  const [sugerencias, setSugerencias] = useState<{ q: string; lista: EstudianteListItem[] } | null>(null);
  useEffect(() => {
    if (!activa) return;
    let vigente = true;
    const t = setTimeout(() => {
      estudiantesApi.buscar(q)
        .then(lista => { if (vigente) setSugerencias({ q, lista }); })
        .catch(() => { if (vigente) setSugerencias({ q, lista: [] }); });
    }, 250);
    return () => { vigente = false; clearTimeout(t); };
  }, [q, activa]);
  const lista = activa && sugerencias ? sugerencias.lista : [];
  const cargando = activa && sugerencias?.q !== q;

  return (
    <div className="space-y-5">
      <CampoBuscar id="doc-estudiante" etiqueta="Número de documento del estudiante" valor={doc} onCambio={onDoc}
        onBuscar={onBuscar} buscando={busqueda.estado === 'buscando'} error={error} placeholder="Documento o nombre" />

      {activa && (lista.length > 0 || !cargando) && (
        <div className={`max-w-[720px] transition-opacity ${cargando ? 'opacity-60' : ''}`}>
          {lista.length > 0 ? (
            <>
              <p className="mb-2 text-[11px] font-bold tracking-[0.14em] uppercase text-(--p-suave)">
                {lista.length === 1 ? '1 coincidencia' : `${lista.length}${lista.length === 20 ? '+' : ''} coincidencias`}
              </p>
              <ul className="rounded-[18px] border border-(--p-borde) divide-y divide-(--p-borde) overflow-hidden">
                {lista.map(e => {
                  const ultima = [...e.matriculas].sort((a, b) => b.year - a.year)[0];
                  return (
                    <li key={e.numero_identidad}>
                      <button type="button" onClick={() => onElegir(e.numero_identidad)}
                        className="w-full flex items-center gap-3.5 px-4 sm:px-5 py-3 text-left hover:bg-(--p-hover) focus-visible:bg-(--p-hover) outline-none">
                        <span className="grid place-items-center shrink-0 size-10 rounded-full bg-(--p-menta) text-[13px] font-bold">{iniciales(e.nombre)}</span>
                        <span className="flex-1 min-w-0 leading-tight">
                          <span className="block text-[15px] font-bold truncate">{e.nombre}</span>
                          <span className="block mt-0.5 text-[13px] text-(--p-suave) truncate">
                            {documento(e.numero_identidad)}{ultima ? ` · ${ultima.grado?.nombre ?? ''} ${ultima.year}` : ''}
                          </span>
                        </span>
                        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-(--p-suave)">
                          <path d="M8 5 L13 10 L8 15" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="text-[13.5px] text-(--p-suave)">Ningún estudiante coincide con «{q}». Si es nuevo, escribe su documento y dale Siguiente.</p>
          )}
        </div>
      )}

      {busqueda.estado === 'error' && <Aviso tono="error">{busqueda.mensaje}</Aviso>}
      {busqueda.estado === 'nuevo' && (
        <Aviso>No hay ningún estudiante con el documento <b>{documento(busqueda.doc)}</b>. Continúa con sus datos.</Aviso>
      )}
      {busqueda.estado === 'existe' && <EstudianteEncontrado e={busqueda.dato} onRematricular={onRematricular} destino={destino} />}
    </div>
  );
}

function EstudianteEncontrado({ e, onRematricular, destino }: { e: EstudianteDetalle; onRematricular: () => void; destino: DestinoRematricula | null | undefined }) {
  const ultima = [...e.matriculas].sort((a, b) => b.year - a.year)[0];
  const y = destino?.posible ? destino.year : null;
  return (
    <div className="max-w-[720px] rounded-[18px] border border-(--p-borde)">
      <div className="flex items-center gap-3.5 px-5 py-4 border-b border-(--p-borde)">
        <span className="grid place-items-center shrink-0 size-11 rounded-full bg-(--p-acento) text-[#160c28] text-[14px] font-bold">{iniciales(e.nombre)}</span>
        <div className="flex-1 min-w-0 leading-tight">
          <p className="text-[16px] font-bold truncate">{e.nombre}</p>
          <p className="mt-0.5 text-[13px] text-(--p-suave) truncate">{e.tipo_documento ? NOMBRE_TIPO[e.tipo_documento] : 'Documento'} · {documento(e.numero_identidad)}</p>
        </div>
        <span className="hidden sm:inline-flex shrink-0 h-6 px-2.5 items-center rounded-[9px] bg-(--p-menta) text-[12px] font-bold">Ya está registrado</span>
      </div>
      {ultima && (
        <dl className="grid grid-cols-3 divide-x divide-(--p-borde) border-b border-(--p-borde)">
          <DatoCorto etiqueta="Grado" valor={ultima.grado?.nombre ?? '—'} />
          <DatoCorto etiqueta="Año" valor={String(ultima.year)} />
          <DatoCorto etiqueta="Estado" valor={NOMBRE_ESTADO[ultima.estado]} />
        </dl>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4">
        <p className="flex-1 text-[13.5px] leading-relaxed text-(--p-suave)">
          {!destino
            ? 'Cargando…'
            : destino.posible
              ? destino.estado === 'PROMOCION'
                ? <>Es una <b className="text-(--p-tinta)">promoción</b>: queda matriculado para {destino.year} y se activa el 1 de enero. Sus datos y su acudiente ya están guardados; solo eliges el grado y la jornada.</>
                : <>Es una <b className="text-(--p-tinta)">re-matrícula</b>: sus datos y su acudiente ya están guardados. Solo eliges el grado y la jornada de {destino.year}.</>
              : destino.motivo}
        </p>
        {y && (
          <button type="button" onClick={onRematricular}
            className="presionable shrink-0 h-12 px-6 rounded-xl bg-(--p-acento) text-[#160c28] text-[12.5px] font-bold tracking-[0.12em] uppercase hover:brightness-105">
            Matricular para {y}
          </button>
        )}
      </div>
    </div>
  );
}

function DatoCorto({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="px-3.5 sm:px-5 py-3 min-w-0">
      <dt className="text-[10px] sm:text-[10.5px] font-bold tracking-[0.1em] sm:tracking-[0.14em] uppercase text-(--p-suave) truncate">{etiqueta}</dt>
      <dd className="mt-1 text-[14px] sm:text-[15px] font-bold truncate">{valor}</dd>
    </div>
  );
}

/* ── Paso 2 · Datos del estudiante ─────────────────────────────── */

function PasoEstudiante({ doc, est, setEst, errores, limpiar }: {
  doc: string; est: FormEstudiante; setEst: (p: Partial<FormEstudiante>) => void; errores: Record<string, string>; limpiar: (...c: string[]) => void;
}) {
  const anos = edad(est.fecha_nacimiento);
  const set = <K extends keyof FormEstudiante>(k: K, v: FormEstudiante[K]) => { setEst({ [k]: v } as Partial<FormEstudiante>); limpiar(k); };
  return (
    <>
      <BloqueCampos titulo="Identificación">
        <Campo etiqueta="Tipo de documento" requerido error={errores.tipo_documento}>
          <Selector value={est.tipo_documento} onChange={v => set('tipo_documento', v as TipoDocumento)} invalido={!!errores.tipo_documento}>
            <option value="">Elegir…</option>
            {TIPOS_DOCUMENTO.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </Selector>
        </Campo>
        <Campo etiqueta="Número" requerido ayuda="Viene del paso 1.">
          <input value={documento(doc)} readOnly className={claseCampo} />
        </Campo>
        <Campo etiqueta="Nombre completo" requerido error={errores.nombre} className="sm:col-span-2">
          <input value={est.nombre} onChange={e => set('nombre', e.target.value)} autoComplete="off" maxLength={150}
            aria-invalid={!!errores.nombre || undefined} className={claseCampo} />
        </Campo>
        <Campo etiqueta="Fecha de nacimiento" requerido error={errores.fecha_nacimiento}
          extra={anos !== null && anos >= 0 && !errores.fecha_nacimiento ? `· ${anos} ${anos === 1 ? 'año' : 'años'}` : undefined}>
          <input type="date" value={est.fecha_nacimiento} max={hoyISO()} onChange={e => set('fecha_nacimiento', e.target.value)}
            aria-invalid={!!errores.fecha_nacimiento || undefined} className={claseCampo} />
        </Campo>
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-bold tracking-[0.14em] uppercase text-(--p-suave)">Sexo</p>
          <Opciones etiqueta="Sexo" valor={est.sexo} onCambio={v => set('sexo', v)}
            opciones={[{ valor: 'F' as Sexo, texto: 'Femenino' }, { valor: 'M' as Sexo, texto: 'Masculino' }]} />
        </div>
      </BloqueCampos>

      <BloqueCampos titulo="Salud">
        <Campo etiqueta="Tipo de sangre">
          <Selector value={est.rh} onChange={v => set('rh', v)}>
            <option value="">Elegir…</option>
            {TIPOS_SANGRE.map(t => <option key={t} value={t}>{t}</option>)}
          </Selector>
        </Campo>
        <Campo etiqueta="EPS">
          <input value={est.eps} onChange={e => set('eps', e.target.value)} maxLength={100} className={claseCampo} />
        </Campo>
        <Campo etiqueta="Observaciones" className="sm:col-span-2">
          <textarea value={est.observaciones} onChange={e => set('observaciones', e.target.value)} rows={3} maxLength={2000}
            placeholder="Alergias, condiciones médicas y notas importantes"
            className={`${claseCampo} h-auto min-h-24 py-3 leading-relaxed resize-y`} />
        </Campo>
      </BloqueCampos>

      <BloqueCampos titulo="Residencia">
        <Campo etiqueta="Dirección" className="sm:col-span-2">
          <input value={est.direccion} onChange={e => set('direccion', e.target.value)} maxLength={200} className={claseCampo} />
        </Campo>
      </BloqueCampos>
    </>
  );
}

/* ── Paso 3 · Acudiente ────────────────────────────────────────── */

function PasoAcudiente({ acu, setAcu, errores, limpiar, busqueda, onBuscar, onCedula, nombreEstudiante, direccionEstudiante }: {
  acu: FormAcudiente; setAcu: (p: Partial<FormAcudiente>) => void; errores: Record<string, string>; limpiar: (...c: string[]) => void;
  busqueda: Busqueda<AcudienteDetalle | null>; onBuscar: () => void; onCedula: (v: string) => void;
  nombreEstudiante: string; direccionEstudiante: string;
}) {
  const existente = busqueda.estado === 'existe' ? busqueda.dato : null;
  const listo = busqueda.estado === 'existe' || busqueda.estado === 'nuevo';
  const set = <K extends keyof FormAcudiente>(k: K, v: FormAcudiente[K], err = k as string) => { setAcu({ [k]: v } as Partial<FormAcudiente>); limpiar(err); };

  const parentesco = (
    <div className="min-w-0 sm:col-span-2">
      <p className="mb-2 text-[11px] font-bold tracking-[0.14em] uppercase text-(--p-suave)">
        Parentesco con {nombreEstudiante}<span className="text-(--p-tinta)"> *</span>
      </p>
      <Opciones etiqueta="Parentesco" envolver valor={acu.parentesco} onCambio={v => set('parentesco', v)} invalido={!!errores.parentesco}
        opciones={PARENTESCOS.map(p => ({ valor: p, texto: p }))} />
      {errores.parentesco && <span role="alert" className="block mt-1.5 text-[12.5px] font-medium text-red-600">{errores.parentesco}</span>}
    </div>
  );

  return (
    <div className="space-y-7">
      <CampoBuscar id="cedula-acudiente" etiqueta="Cédula del acudiente" valor={acu.cedula} onCambio={onCedula}
        onBuscar={onBuscar} buscando={busqueda.estado === 'buscando'} error={errores.cedula} />

      {busqueda.estado === 'error' && <Aviso tono="error">{busqueda.mensaje}</Aviso>}
      {!listo && busqueda.estado !== 'error' && (
        <p className="text-[13.5px] text-(--p-suave)">Si tiene otro hijo en el colegio, ya está registrado y solo se vincula.</p>
      )}

      {existente && (
        <>
          <Aviso><b>{existente.nombre}</b> ya está registrado (acudiente de otro estudiante). Se vinculará a esta matrícula con sus datos y su acceso actuales.</Aviso>
          <section>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-[12px] font-bold tracking-[0.14em] uppercase">Datos del acudiente</h3>
              <span className="text-[12px] text-(--p-suave)">· solo lectura</span>
              <span aria-hidden className="flex-1 h-px bg-(--p-borde)" />
            </div>
            <dl className="grid sm:grid-cols-2 gap-x-5">
              <FilaLectura etiqueta="Nombre completo" valor={existente.nombre} />
              <FilaLectura etiqueta="Teléfono" valor={existente.telefono} />
              <FilaLectura etiqueta="Correo" valor={existente.correo} />
              <FilaLectura etiqueta="Dirección" valor={existente.direccion} />
            </dl>
            <p className="mt-2 text-[12.5px] text-(--p-suave)">Para cambiar sus datos, edítalos desde la ficha de cualquiera de sus estudiantes.</p>
          </section>
          <div className="grid">{parentesco}</div>
        </>
      )}

      {busqueda.estado === 'nuevo' && (
        <>
          {busqueda.docente !== undefined
            ? <Aviso>Esta cédula es del docente <b>{busqueda.docente}</b>. Trajimos su nombre, teléfono y correo: revísalos y completa el resto. Tendrá un acceso aparte al portal de acudientes.</Aviso>
            : <Aviso>Usuario no registrado</Aviso>}
          <BloqueCampos titulo="Datos del acudiente">
            <Campo etiqueta="Nombre completo" requerido error={errores.nombre_acudiente} className="sm:col-span-2">
              <input value={acu.nombre} onChange={e => set('nombre', e.target.value, 'nombre_acudiente')} maxLength={150} autoComplete="off"
                aria-invalid={!!errores.nombre_acudiente || undefined} className={claseCampo} />
            </Campo>
            {parentesco}
            <Campo etiqueta="Teléfono">
              <input value={acu.telefono} onChange={e => set('telefono', e.target.value)} inputMode="tel" maxLength={20} className={claseCampo} />
            </Campo>
            <Campo etiqueta="Correo" error={errores.correo}>
              <input type="email" value={acu.correo} onChange={e => set('correo', e.target.value)} maxLength={150}
                aria-invalid={!!errores.correo || undefined} className={claseCampo} />
            </Campo>
            <div className="sm:col-span-2 min-w-0">
              <Campo etiqueta="Dirección">
                <input value={acu.mismaDireccion ? direccionEstudiante : acu.direccion} onChange={e => set('direccion', e.target.value)}
                  readOnly={acu.mismaDireccion} maxLength={200} className={claseCampo} />
              </Campo>
              {direccionEstudiante.trim() && (
                <label className="mt-2.5 inline-flex items-center gap-2.5 text-[13.5px] cursor-pointer select-none">
                  <input type="checkbox" checked={acu.mismaDireccion} onChange={e => set('mismaDireccion', e.target.checked)}
                    className="size-4 accent-(--p-acento)" />
                  Usar la misma dirección del estudiante
                </label>
              )}
            </div>
          </BloqueCampos>

          <details className="group rounded-[14px] border border-(--p-borde)" open={!!(acu.telefono_trabajo || acu.direccion_trabajo)}>
            <summary className="flex items-center justify-between gap-3 px-4 h-12 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="text-[13.5px] font-semibold">Datos de trabajo <span className="font-normal text-(--p-suave)">(opcional)</span></span>
              <span className="text-(--p-suave) transition-transform group-open:rotate-180"><I.ChevronAbajo tam={16} /></span>
            </summary>
            <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2 px-4 pb-4 pt-1">
              <Campo etiqueta="Teléfono del trabajo">
                <input value={acu.telefono_trabajo} onChange={e => set('telefono_trabajo', e.target.value)} inputMode="tel" maxLength={20} className={claseCampo} />
              </Campo>
              <Campo etiqueta="Dirección del trabajo">
                <input value={acu.direccion_trabajo} onChange={e => set('direccion_trabajo', e.target.value)} maxLength={200} className={claseCampo} />
              </Campo>
            </div>
          </details>
        </>
      )}
    </div>
  );
}

function FilaLectura({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div className="py-3 border-b border-(--p-borde) min-w-0">
      <dt className="text-[10.5px] font-bold tracking-[0.14em] uppercase text-(--p-suave)">{etiqueta}</dt>
      <dd className="mt-0.5 text-[15px] font-semibold break-words">{valor || <span className="font-normal italic text-(--p-tenue)">Sin dato</span>}</dd>
    </div>
  );
}

/* ── Paso 4 · Matrícula ────────────────────────────────────────── */

function PasoMatricula({ mat, setMat, errores, limpiar, seleccion, opciones, nombresGrado, jornadasDe, sugerido, edadEscolar, tarifa }: {
  mat: FormMatricula; setMat: (p: Partial<FormMatricula>) => void; errores: Record<string, string>; limpiar: (...c: string[]) => void;
  /** Año elegido y su estado. */
  seleccion: PeriodoMatricula | null;
  /** Estudiante nuevo: los dos años posibles. Re-matrícula: null (el año lo decide el servidor). */
  opciones: PeriodoMatricula[] | null;
  nombresGrado: string[]; jornadasDe: (n: string) => JornadaEstudiante[];
  sugerido?: string; edadEscolar: number | null; tarifa: Tarifa | null | undefined;
}) {
  const disponibles = mat.grado ? jornadasDe(mat.grado) : [];
  const elegirGrado = (g: string) => {
    const js = jornadasDe(g);
    // Si el grado solo tiene una jornada se elige sola; si la que estaba no existe, se borra.
    setMat({ grado: g, jornada: js.length === 1 ? js[0] : js.includes(mat.jornada as JornadaEstudiante) ? mat.jornada : '' });
    limpiar('grado', 'jornada');
  };
  return (
    <>
      <BloqueCampos titulo="Datos de la matrícula">
        {/* Solo el año en curso o el siguiente (este queda en promoción hasta el 1 de enero). */}
        {opciones ? (
          <div className="min-w-0">
            <p className="mb-2 text-[11px] font-bold tracking-[0.14em] uppercase text-(--p-suave)">Año<span className="text-(--p-tinta)"> *</span></p>
            {opciones.length ? (
              <Opciones etiqueta="Año" valor={mat.year} onCambio={v => { setMat({ year: v }); limpiar('year'); }}
                opciones={opciones.map(o => ({ valor: o.year, texto: o.estado === 'PROMOCION' ? `${o.year} · Próximo año` : `${o.year} · Este año` }))} />
            ) : (
              <input value="Cargando…" readOnly className={claseCampo} />
            )}
            <span className="block mt-1.5 text-[12.5px] text-(--p-suave)">
              {seleccion?.estado === 'PROMOCION' ? `Queda en promoción y se activa el 1 de enero de ${seleccion.year}.` : 'Año escolar en curso.'}
            </span>
          </div>
        ) : (
          <Campo etiqueta="Año" ayuda={seleccion?.estado === 'PROMOCION'
            ? `Promoción: queda en ${seleccion.year} y se activa el 1 de enero.`
            : 'Año escolar en curso.'}>
            <input value={seleccion ? String(seleccion.year) : 'Cargando…'} readOnly className={claseCampo} />
          </Campo>
        )}
        {/* En una re-matrícula la fecha es hoy (el servidor la pone); aquí no se elige. */}
        {opciones && (
          <Campo etiqueta="Fecha de matrícula" ayuda="Por defecto, hoy." error={errores.fecha}>
            <input type="date" value={mat.fecha} min={fechaMinimaMatricula()} max={hoyISO()}
              onChange={e => { setMat({ fecha: e.target.value }); limpiar('fecha'); }}
              aria-invalid={!!errores.fecha || undefined} className={claseCampo} />
          </Campo>
        )}
        <div className="min-w-0">
          <Campo etiqueta="Grado" requerido error={errores.grado}>
            <Selector value={mat.grado} onChange={elegirGrado} invalido={!!errores.grado}>
              <option value="">Elegir…</option>
              {nombresGrado.map(n => <option key={n} value={n}>{n}</option>)}
            </Selector>
          </Campo>
          {sugerido && mat.grado !== sugerido && (
            <p className="mt-2 text-[13px] text-(--p-suave)">
              Por su edad ({edadEscolar} años a marzo de {mat.year}) le corresponde <b className="text-(--p-tinta)">{sugerido}</b>.{' '}
              <button type="button" onClick={() => elegirGrado(sugerido)} className="font-semibold text-(--p-tinta) underline decoration-(--p-acento) decoration-2 underline-offset-4">
                Usar {sugerido}
              </button>
            </p>
          )}
        </div>
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-bold tracking-[0.14em] uppercase text-(--p-suave)">Jornada<span className="text-(--p-tinta)"> *</span></p>
          <Opciones etiqueta="Jornada" valor={mat.jornada} onCambio={v => { setMat({ jornada: v }); limpiar('jornada'); }} invalido={!!errores.jornada}
            opciones={(['MAÑANA', 'TARDE'] as JornadaEstudiante[]).map(j => ({
              valor: j, texto: capitalizar(j), deshabilitada: !!mat.grado && !disponibles.includes(j),
            }))} />
          {errores.jornada
            ? <span role="alert" className="block mt-1.5 text-[12.5px] font-medium text-red-600">{errores.jornada}</span>
            : mat.grado && disponibles.length === 1 && <span className="block mt-1.5 text-[12.5px] text-(--p-suave)">{mat.grado} solo tiene jornada {capitalizar(disponibles[0]).toLowerCase()}.</span>}
        </div>
      </BloqueCampos>

      <section aria-label="Valores del año" className="rounded-[16px] bg-(--p-menta) px-5 py-4">
        <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-(--p-suave)">Valores {mat.year}</p>
        {tarifa === undefined ? (
          <p className="mt-2 text-[14px] text-(--p-suave)">Cargando…</p>
        ) : tarifa === null ? (
          <p className="mt-2 text-[14px]">Aún no hay tarifas para {mat.year}. Puedes matricular igual y configurarlas en Pagos.</p>
        ) : (
          <dl className="mt-3 grid grid-cols-2 gap-5">
            <div>
              <dt className="text-[13px] text-(--p-suave)">Valor de la matrícula</dt>
              <dd className="mt-0.5 text-[22px] font-extrabold tabular-nums">{pesos(Number(tarifa.valor_matricula))}</dd>
              <dd className="text-[12.5px] text-(--p-suave)">Un solo pago</dd>
            </div>
            <div>
              <dt className="text-[13px] text-(--p-suave)">Pensión mensual</dt>
              <dd className="mt-0.5 text-[22px] font-extrabold tabular-nums">{pesos(Number(tarifa.valor_pension))}</dd>
              <dd className="text-[12.5px] text-(--p-suave)">De febrero a noviembre</dd>
            </div>
          </dl>
        )}
      </section>
    </>
  );
}

/* ── Paso 5 · Revisar y confirmar ──────────────────────────────── */

function PasoRevisar({ modo, doc, est, acu, mat, tarifa, estudianteExistente, acudienteExistente, acudientePrincipal, gradoElegido, onCambiar, error }: {
  modo: Modo; doc: string; est: FormEstudiante; acu: FormAcudiente; mat: FormMatricula; tarifa: Tarifa | null | undefined;
  estudianteExistente: EstudianteDetalle | null; acudienteExistente: AcudienteDetalle | null;
  acudientePrincipal: AcudienteDetalle | undefined; gradoElegido: Grado | undefined;
  onCambiar: (p: Paso) => void; error: string;
}) {
  const re = modo === 'rematricula' && estudianteExistente;
  const e = re ? estudianteExistente : null;
  const anos = edad(e?.fecha_nacimiento ?? est.fecha_nacimiento);
  const nombreAcu = re ? acudientePrincipal?.nombre : (acudienteExistente?.nombre ?? acu.nombre.trim());
  const tipo = (e?.tipo_documento ?? est.tipo_documento) || '';

  return (
    <div className="space-y-4">
      <p className="text-[14px] leading-relaxed">
        {re
          ? <>Al confirmar se crea la matrícula de <b>{mat.year}</b>. Los datos del estudiante y su acudiente no cambian.</>
          : acudienteExistente
            ? <>Al confirmar se crea la matrícula y se vincula a <b>{nombreAcu}</b>, que ya tiene acceso al portal.</>
            : <>Al confirmar se crea la matrícula y el acceso al portal para <b>{nombreAcu}</b>.</>}
      </p>

      <Resumen titulo="Estudiante" onCambiar={re ? undefined : () => onCambiar(2)}>
        <DatoResumen etiqueta="Nombre" valor={e?.nombre ?? est.nombre} />
        <DatoResumen etiqueta="Documento" valor={`${tipo ? NOMBRE_TIPO[tipo as TipoDocumento] + ' · ' : ''}${documento(e?.numero_identidad ?? doc.trim())}`} />
        <DatoResumen etiqueta="Nacimiento" valor={`${fechaDia(e?.fecha_nacimiento ?? est.fecha_nacimiento)}${anos !== null ? ` · ${anos} años` : ''}`} />
        <DatoResumen etiqueta="Sexo" valor={{ F: 'Femenino', M: 'Masculino', '': '' }[(e?.sexo ?? est.sexo) || '']} />
        <DatoResumen etiqueta="Salud" valor={[e?.rh ?? est.rh, e?.eps ?? est.eps].filter(Boolean).join(' · ')} />
        <DatoResumen etiqueta="Dirección" valor={e?.direccion ?? est.direccion} />
        <DatoResumen etiqueta="Observaciones" valor={e?.observaciones ?? est.observaciones} ancho />
      </Resumen>

      <Resumen titulo="Acudiente" onCambiar={re ? undefined : () => onCambiar(3)}>
        {re ? (
          <>
            <DatoResumen etiqueta="Nombre" valor={acudientePrincipal?.nombre} />
            <DatoResumen etiqueta="Parentesco" valor={acudientePrincipal?.RelacionEA?.parentesco ? capitalizar(acudientePrincipal.RelacionEA.parentesco) : ''} />
            <DatoResumen etiqueta="Teléfono" valor={acudientePrincipal?.telefono} />
            <DatoResumen etiqueta="Correo" valor={acudientePrincipal?.correo} />
          </>
        ) : (
          <>
            <DatoResumen etiqueta="Nombre" valor={nombreAcu} />
            <DatoResumen etiqueta="Cédula" valor={documento(acudienteExistente?.cedula ?? acu.cedula.trim())} />
            <DatoResumen etiqueta="Parentesco" valor={acu.parentesco} />
            <DatoResumen etiqueta="Teléfono" valor={acudienteExistente?.telefono ?? acu.telefono} />
            <DatoResumen etiqueta="Correo" valor={acudienteExistente?.correo ?? acu.correo} />
            <DatoResumen etiqueta="Dirección" valor={acudienteExistente ? acudienteExistente.direccion : acu.mismaDireccion ? 'La misma del estudiante' : acu.direccion} />
          </>
        )}
      </Resumen>

      <Resumen titulo="Matrícula" onCambiar={() => onCambiar(4)}>
        <DatoResumen etiqueta="Año" valor={String(mat.year)} />
        <DatoResumen etiqueta="Grado" valor={gradoElegido?.nombre} />
        <DatoResumen etiqueta="Jornada" valor={gradoElegido ? capitalizar(gradoElegido.jornada) : ''} />
        <DatoResumen etiqueta="Fecha de matrícula" valor={fechaDia(re ? hoyISO() : mat.fecha || hoyISO())} />
        {tarifa && <DatoResumen etiqueta="Valor de la matrícula" valor={pesos(Number(tarifa.valor_matricula))} />}
        {tarifa && <DatoResumen etiqueta="Pensión mensual" valor={pesos(Number(tarifa.valor_pension))} />}
      </Resumen>

      {error && <Aviso tono="error">{error}</Aviso>}
    </div>
  );
}

function Resumen({ titulo, onCambiar, children }: { titulo: string; onCambiar?: () => void; children: ReactNode }) {
  return (
    <section className="rounded-[16px] border border-(--p-borde)">
      <div className="flex items-center justify-between gap-3 px-5 h-12 border-b border-(--p-borde)">
        <h3 className="text-[12px] font-bold tracking-[0.14em] uppercase">{titulo}</h3>
        {onCambiar && (
          <button type="button" onClick={onCambiar} className="text-[13px] font-semibold underline decoration-(--p-acento) decoration-2 underline-offset-4 hover:text-(--p-suave)">
            Cambiar
          </button>
        )}
      </div>
      <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 px-5 py-4">{children}</dl>
    </section>
  );
}

function DatoResumen({ etiqueta, valor, ancho = false }: { etiqueta: string; valor: string | null | undefined; ancho?: boolean }) {
  return (
    <div className={`min-w-0 ${ancho ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
      <dt className="text-[12.5px] text-(--p-suave)">{etiqueta}</dt>
      <dd className="mt-0.5 text-[14.5px] font-semibold break-words">{valor?.trim() ? valor : <span className="font-normal italic text-(--p-tenue)">Sin dato</span>}</dd>
    </div>
  );
}

/* ── Matrícula creada ──────────────────────────────────────────── */

function MatriculaCreada({ r, onNueva, onPago, onFicha }: { r: Resultado; onNueva: () => void; onPago: () => void; onFicha: () => void }) {
  return (
    <section aria-labelledby="titulo-creada" className="aparecer mt-5 lg:mt-6 w-full flex-1 flex items-center justify-center rounded-[22px] border border-(--p-borde) bg-(--p-sup) px-0 sm:px-6 py-2 sm:py-8">
      <div className="w-full max-w-[860px]">
      <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-6 text-center">
        <p className="inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.12em] uppercase text-(--p-suave)">
          <span className="grid place-items-center size-5 rounded-full bg-(--p-acento) text-[#160c28]"><I.Check tam={12} /></span>
          Matrícula registrada
        </p>
        <h2 id="titulo-creada" role="status" className="mt-3 text-[22px] sm:text-[26px] leading-snug font-extrabold tracking-tight">
          {r.sexo === 'F' || r.sexo === 'M'
            ? `${r.nombre} quedó ${r.sexo === 'F' ? 'matriculada' : 'matriculado'} en ${r.grado} ${r.year}.`
            : `Se registró la matrícula de ${r.nombre} en ${r.grado} ${r.year}.`}
        </h2>
        <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-px rounded-[14px] overflow-hidden border border-(--p-borde) bg-(--p-borde) text-left [&>div]:bg-(--p-sup)">
          <DatoCorto etiqueta="Documento" valor={documento(r.id)} />
          <DatoCorto etiqueta="Grado" valor={r.grado} />
          <DatoCorto etiqueta="Jornada" valor={capitalizar(r.jornada)} />
          <DatoCorto etiqueta="Fecha" valor={fechaDia(r.fecha)} />
        </dl>
      </div>

      <div className="px-5 sm:px-8 py-6 border-t border-(--p-borde)">
        <h3 className="text-[15.5px] font-bold">Acceso al portal de acudientes</h3>
        {r.credenciales ? (
          <>
            <p className="mt-1 text-[14px] leading-relaxed text-(--p-suave)">
              Entrégale estos datos a <b className="text-(--p-tinta)">{r.acudiente}</b>{r.parentesco ? ` (${r.parentesco.toLowerCase()})` : ''}.
              La contraseña es temporal: deberá cambiarla la primera vez que ingrese. Se muestra solo ahora.
            </p>
            <div className="mt-4 rounded-[14px] border border-(--p-borde) divide-y divide-(--p-borde)">
              <Credencial etiqueta="Usuario" valor={r.credenciales.username} />
              <Credencial etiqueta="Contraseña temporal" valor={r.credenciales.passwordTemporal} />
            </div>
          </>
        ) : (
          <p className="mt-1 text-[14px] leading-relaxed text-(--p-suave)">
            {r.acudiente
              ? <><b className="text-(--p-tinta)">{r.acudiente}</b> ya tenía acceso al portal: sigue usando su usuario y contraseña de siempre.</>
              : 'El acudiente ya tenía acceso al portal: sigue usando su usuario y contraseña de siempre.'}
          </p>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 px-5 sm:px-8 py-5 border-t border-(--p-borde)">
        <button type="button" onClick={onFicha} className="sm:mr-auto h-11 text-[13.5px] font-semibold underline decoration-(--p-acento) decoration-2 underline-offset-4 hover:text-(--p-suave)">
          Ver ficha del estudiante
        </button>
        <button type="button" onClick={onNueva}
          className="presionable h-12 px-5 rounded-xl border border-(--p-borde) text-[12.5px] font-bold tracking-[0.12em] uppercase hover:bg-(--p-hover)">
          Nueva matrícula
        </button>
        <button type="button" onClick={onPago}
          className="presionable h-12 px-6 rounded-xl bg-(--p-acento) text-[#160c28] text-[12.5px] font-bold tracking-[0.12em] uppercase hover:brightness-105">
          Registrar pago de matrícula
        </button>
      </div>
      </div>
    </section>
  );
}

function Credencial({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try { await navigator.clipboard.writeText(valor); setCopiado(true); window.setTimeout(() => setCopiado(false), 1500); } catch { /* sin permiso */ }
  }
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-[10.5px] font-bold tracking-[0.14em] uppercase text-(--p-suave)">{etiqueta}</p>
        <p className="mt-0.5 font-mono text-[16.5px] font-semibold tracking-wide truncate">{valor}</p>
      </div>
      <button type="button" onClick={copiar} aria-label={`Copiar ${etiqueta.toLowerCase()}`}
        className="presionable shrink-0 inline-flex items-center gap-2 h-9 px-3 rounded-[10px] border border-(--p-borde) text-[12.5px] font-semibold hover:bg-(--p-hover)">
        {copiado ? <I.Check tam={14} /> : <I.Copiar tam={14} />}
        {copiado ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  );
}
