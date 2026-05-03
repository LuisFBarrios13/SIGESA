// src/pages/GradosPage.tsx
// Dependency Inversion: page only consumes the hook abstraction and renders components.
// All state/logic lives in useGradosManager.

import { useState, type FormEvent } from 'react';
import { useGradosManager } from '../hooks/useGradosManager';
import type { GradoConDocente, DocenteConDisponibilidad, JornadaGrado } from '../types/grados';

// ─────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────

const JORNADA_META = {
  MAÑANA: { label: 'Mañana', icon: 'wb_sunny', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  TARDE: { label: 'Tarde', icon: 'wb_twilight', bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  COMPLETA: { label: 'Completa', icon: 'schedule', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
} as const;

const JornadaBadge = ({ jornada }: { jornada: keyof typeof JORNADA_META }) => {
  const m = JORNADA_META[jornada];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${m.bg} ${m.text} ${m.border}`}>
      <span className="material-symbols-outlined text-[13px]">{m.icon}</span>
      {m.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
// GradoCard — one tile per grado
// ─────────────────────────────────────────────────────────────

interface GradoCardProps {
  grado: GradoConDocente;
  onAssign: (g: GradoConDocente) => void;
}

const GradoCard = ({ grado, onAssign }: GradoCardProps) => {
  const hasDocente = !!grado.docente;

  return (
    <div className={`bg-white rounded-xl border-2 shadow-sm hover:shadow-md transition-all flex flex-col
      ${hasDocente ? 'border-stone-200' : 'border-dashed border-stone-300'}`}>

      {/* Header strip */}
      <div className={`px-4 py-3 rounded-t-[10px] flex items-center justify-between
        ${grado.jornada === 'MAÑANA' ? 'bg-amber-50' : 'bg-indigo-50'}`}>
        <JornadaBadge jornada={grado.jornada} />
        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
          Grado
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex-1 flex flex-col gap-3">
        <h3 className="text-lg font-bold text-on-surface leading-tight">{grado.nombre}</h3>

        {hasDocente ? (
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
            {/* Avatar initials */}
            <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-black text-on-primary-fixed-variant">
                {grado.docente!.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-on-surface truncate">{grado.docente!.nombre}</p>
              <div className="mt-0.5">
                <JornadaBadge jornada={grado.docente!.jornada} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg border border-dashed border-stone-300">
            <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-stone-400 text-lg">person_off</span>
            </div>
            <p className="text-sm text-stone-400 font-medium italic">Sin docente asignado</p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="px-5 pb-4">
        <button
          onClick={() => onAssign(grado)}
          className={`w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all
            ${hasDocente
              ? 'border border-outline-variant text-on-surface-variant hover:bg-stone-50 hover:text-primary'
              : 'bg-primary text-white shadow-sm hover:bg-primary-container'
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {hasDocente ? 'swap_horiz' : 'person_add'}
          </span>
          {hasDocente ? 'Cambiar docente' : 'Asignar docente'}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// DocenteOption — one row inside the assignment modal
// ─────────────────────────────────────────────────────────────

interface DocenteOptionProps {
  docente: DocenteConDisponibilidad;
  targetJornada: JornadaGrado;
  selected: boolean;
  onSelect: () => void;
}

const DocenteOption = ({ docente, targetJornada, selected, onSelect }: DocenteOptionProps) => {
  // Compute whether this docente is compatible with the target grado jornada
  const isCompatible = (() => {
    if (docente.jornada === 'COMPLETA') {
      // COMPLETA docente must have zero grados assigned
      return docente.grados.length === 0;
    }
    // MAÑANA/TARDE docente must match target jornada and not have it occupied
    return docente.jornada === targetJornada && !docente.jornadasOcupadas.includes(targetJornada);
  })();

  return (
    <button
      type="button"
      disabled={!isCompatible}
      onClick={onSelect}
      className={`w-full flex items-center gap-4 p-3 rounded-xl border-2 text-left transition-all
        ${selected
          ? 'border-primary bg-primary-fixed/20'
          : isCompatible
            ? 'border-outline-variant hover:border-primary/40 hover:bg-stone-50'
            : 'border-stone-100 bg-stone-50 opacity-50 cursor-not-allowed'
        }`}
    >
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black
        ${selected ? 'bg-primary text-white' : 'bg-stone-200 text-stone-600'}`}>
        {docente.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('')}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-on-surface truncate">{docente.nombre}</p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          <JornadaBadge jornada={docente.jornada} />
          {docente.jornadasOcupadas.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-orange-100 text-orange-700 border border-orange-300 font-semibold">
              <span className="material-symbols-outlined text-[11px]">warning</span>
              {docente.jornadasOcupadas.map((j) => JORNADA_META[j].label).join(', ')} ocupada
            </span>
          )}
        </div>
        {!isCompatible && (
          <p className="text-[11px] text-stone-400 mt-1">
            {docente.jornada === 'COMPLETA'
              ? 'Ya tiene grado asignado'
              : `Incompatible con jornada ${JORNADA_META[targetJornada].label}`}
          </p>
        )}
      </div>

      {/* Check */}
      {selected && (
        <span className="material-symbols-outlined text-primary text-xl flex-shrink-0">check_circle</span>
      )}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
// AssignModal — full assignment / removal flow
// ─────────────────────────────────────────────────────────────

interface AssignModalProps {
  grado: GradoConDocente;
  docentes: DocenteConDisponibilidad[];
  opLoading: boolean;
  opError: string;
  onAssign: (cedula: string | null) => void;
  onClose: () => void;
}

const AssignModal = ({ grado, docentes, opLoading, opError, onAssign, onClose }: AssignModalProps) => {
  const [selected, setSelected] = useState<string | null>(grado.id_docente ?? null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // If selected is same as current, still allow (idempotent re-assign has no effect but is safe)
    onAssign(selected);
  };

  const compatibleCount = docentes.filter((d) => {
    if (d.jornada === 'COMPLETA') return d.grados.length === 0;
    return d.jornada === grado.jornada && !d.jornadasOcupadas.includes(grado.jornada);
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className={`px-6 py-5 flex items-center justify-between
          ${grado.jornada === 'MAÑANA' ? 'bg-amber-50 border-b border-amber-200' : 'bg-indigo-50 border-b border-indigo-200'}`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <JornadaBadge jornada={grado.jornada} />
            </div>
            <h3 className="text-lg font-bold text-on-surface">{grado.nombre}</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {compatibleCount} docente{compatibleCount !== 1 ? 's' : ''} compatible{compatibleCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/60 rounded-full transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Error */}
        {opError && (
          <div className="mx-6 mt-4 flex items-start gap-3 p-3 bg-error-container rounded-lg border border-error/20">
            <span className="material-symbols-outlined text-error text-xl flex-shrink-0">error</span>
            <p className="text-sm text-error font-medium">{opError}</p>
          </div>
        )}

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">

            {/* None option */}
            <button
              type="button"
              onClick={() => setSelected(null)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl border-2 text-left transition-all
                ${selected === null
                  ? 'border-error/60 bg-error-container/30'
                  : 'border-outline-variant hover:border-stone-300 hover:bg-stone-50'
                }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                ${selected === null ? 'bg-error/10' : 'bg-stone-100'}`}>
                <span className={`material-symbols-outlined text-lg ${selected === null ? 'text-error' : 'text-stone-400'}`}>
                  person_off
                </span>
              </div>
              <div>
                <p className={`text-sm font-semibold ${selected === null ? 'text-error' : 'text-on-surface'}`}>
                  Sin docente
                </p>
                <p className="text-xs text-on-surface-variant">Deja el grado sin director asignado</p>
              </div>
              {selected === null && (
                <span className="material-symbols-outlined text-error text-xl ml-auto flex-shrink-0">check_circle</span>
              )}
            </button>

            <div className="border-t border-stone-100 pt-2">
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2 px-1">
                Docentes disponibles
              </p>
              {docentes.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-6">No hay docentes registrados</p>
              ) : (
                docentes.map((d) => (
                  <DocenteOption
                    key={d.cedula}
                    docente={d}
                    targetJornada={grado.jornada}
                    selected={selected === d.cedula}
                    onSelect={() => setSelected(d.cedula)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 border-t border-stone-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-outline-variant text-on-surface-variant rounded-lg text-sm font-semibold hover:bg-stone-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={opLoading}
              className="flex-1 py-2.5 bg-orange-900 text-white rounded-lg text-sm font-semibold
                hover:bg-primary transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {opLoading ? (
                <>
                  <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                  Guardando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">save</span>
                  Confirmar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// CreateGradoModal
// ─────────────────────────────────────────────────────────────

interface CreateGradoModalProps {
  opLoading: boolean;
  opError: string;
  onCreate: (nombre: string, jornada: JornadaGrado) => void;
  onClose: () => void;
}

const CreateGradoModal = ({ opLoading, opError, onCreate, onClose }: CreateGradoModalProps) => {
  const [nombre, setNombre] = useState('');
  const [jornada, setJornada] = useState<JornadaGrado>('MAÑANA');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setLocalError('El nombre del grado es requerido'); return; }
    setLocalError('');
    onCreate(nombre.trim(), jornada);
  };

  const displayError = opError || localError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant w-full max-w-md overflow-hidden">

        <div className="px-6 py-5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-fixed-variant text-xl">add_circle</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">Nuevo Grado</h3>
              <p className="text-xs text-on-surface-variant">Define nombre y jornada</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {displayError && (
          <div className="mx-6 mt-4 flex items-start gap-3 p-3 bg-error-container rounded-lg border border-error/20">
            <span className="material-symbols-outlined text-error text-xl flex-shrink-0">error</span>
            <p className="text-sm text-error font-medium">{displayError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
              Nombre del grado <span className="text-error">*</span>
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="ej. 5° Primaria, Grado 10"
              className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-white text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-stone-400"
            />
          </div>

          {/* Jornada selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
              Jornada <span className="text-error">*</span>
            </label>
            <div className="flex gap-3">
              {(['MAÑANA', 'TARDE'] as JornadaGrado[]).map((j) => {
                const m = JORNADA_META[j];
                const isSelected = jornada === j;
                return (
                  <button
                    key={j}
                    type="button"
                    onClick={() => setJornada(j)}
                    className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all
                      ${isSelected ? `${m.border} ${m.bg}` : 'border-outline-variant hover:border-stone-300 bg-white'}`}
                  >
                    <span className={`material-symbols-outlined text-xl ${isSelected ? m.text : 'text-stone-400'}`}>
                      {m.icon}
                    </span>
                    <span className={`text-sm font-semibold ${isSelected ? m.text : 'text-on-surface-variant'}`}>
                      {m.label}
                    </span>
                    {isSelected && (
                      <span className={`material-symbols-outlined text-lg ml-auto ${m.text}`}>check_circle</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-outline-variant text-on-surface-variant rounded-lg text-sm font-semibold hover:bg-stone-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={opLoading}
              className="flex-1 py-2.5 bg-orange-900 text-white rounded-lg text-sm font-semibold
                hover:bg-primary transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {opLoading
                ? <><span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>Creando...</>
                : <><span className="material-symbols-outlined text-lg">add</span>Crear Grado</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Stats bar — summary numbers at the top
// ─────────────────────────────────────────────────────────────

const StatsBar = ({ grados }: { grados: GradoConDocente[] }) => {
  const total = grados.length;
  const conDocente = grados.filter((g) => g.tieneDocente).length;
  const sinDocente = total - conDocente;
  const manana = grados.filter((g) => g.jornada === 'MAÑANA').length;
  const tarde = grados.filter((g) => g.jornada === 'TARDE').length;

  const stat = (icon: string, label: string, value: number, color: string) => (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>
      <div>
        <p className="text-xl font-bold text-on-surface leading-none">{value}</p>
        <p className="text-[11px] text-stone-500 mt-0.5">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-sm flex flex-wrap divide-x divide-stone-100 overflow-hidden">
      {stat('school', 'Total grados', total, 'bg-primary-fixed text-on-primary-fixed-variant')}
      {stat('check_circle', 'Con docente', conDocente, 'bg-emerald-100 text-emerald-700')}
      {stat('person_off', 'Sin docente', sinDocente, 'bg-orange-100 text-orange-700')}
      {stat('wb_sunny', 'Jornada mañana', manana, 'bg-amber-100 text-amber-700')}
      {stat('wb_twilight', 'Jornada tarde', tarde, 'bg-indigo-100 text-indigo-700')}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

const GradosPage = () => {
  const {
    grados,
    docentes,
    isLoading,
    error,
    assignModal,
    openAssignModal,
    closeAssignModal,
    createModal,
    openCreateModal,
    closeCreateModal,
    assignDocente,
    createGrado,
    opLoading,
    opError,
    filterJornada,
    setFilterJornada,
    searchQuery,
    setSearchQuery,
    filteredGrados,
  } = useGradosManager();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
          <p className="text-on-surface-variant text-sm">Cargando grados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <span className="material-symbols-outlined text-error text-5xl">error</span>
          <p className="text-on-surface font-semibold">No se pudieron cargar los grados</p>
          <p className="text-on-surface-variant text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modals */}
      {assignModal.open && assignModal.grado && (
        <AssignModal
          grado={assignModal.grado}
          docentes={docentes}
          opLoading={opLoading}
          opError={opError}
          onAssign={(cedula) => assignDocente(assignModal.grado!.id_grado, cedula)}
          onClose={closeAssignModal}
        />
      )}
      {createModal && (
        <CreateGradoModal
          opLoading={opLoading}
          opError={opError}
          onCreate={createGrado}
          onClose={closeCreateModal}
        />
      )}

      {/* Page header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Gestión de Grados</h1>
          <p className="text-base text-stone-500 mt-1">
            Asigna o cambia el director de cada grado respetando la jornada de cada docente
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-secondary text-on-secondary rounded-lg font-semibold flex items-center gap-2
            hover:shadow-lg transition-all text-sm"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nuevo Grado
        </button>
      </div>

      {/* Stats */}
      <StatsBar grados={grados} />

      {/* Filters bar */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-stone-400">
            <span className="material-symbols-outlined text-lg">search</span>
          </span>
          <input
            type="text"
            placeholder="Buscar grado o docente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm
              focus:ring-2 focus:ring-primary/20 w-64 transition-all outline-none"
          />
        </div>

        {/* Jornada filter chips */}
        <div className="flex gap-2">
          {(['ALL', 'MAÑANA', 'TARDE'] as const).map((j) => {
            const isActive = filterJornada === j;
            const label = j === 'ALL' ? 'Todas' : JORNADA_META[j].label;
            const icon = j === 'ALL' ? 'filter_list' : JORNADA_META[j].icon;
            return (
              <button
                key={j}
                onClick={() => setFilterJornada(j)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold transition-all
                  ${isActive
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-on-surface-variant border-outline-variant hover:border-primary/40'
                  }`}
              >
                <span className="material-symbols-outlined text-[16px]">{icon}</span>
                {label}
              </button>
            );
          })}
        </div>

        <span className="ml-auto text-sm text-stone-400">
          {filteredGrados.length} de {grados.length} grados
        </span>
      </div>

      {/* Grid */}
      {filteredGrados.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="material-symbols-outlined text-stone-300 text-6xl">school</span>
          <p className="text-on-surface-variant font-medium">
            {grados.length === 0 ? 'No hay grados registrados aún' : 'No hay resultados para tu búsqueda'}
          </p>
          {grados.length === 0 && (
            <button onClick={openCreateModal}
              className="mt-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">
              Crear primer grado
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredGrados.map((g) => (
            <GradoCard key={g.id_grado} grado={g} onAssign={openAssignModal} />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-2 p-4 bg-white rounded-xl border border-outline-variant">
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
          Reglas de asignación
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-600">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-amber-600 text-base mt-0.5">wb_sunny</span>
            <p><strong>Docente Mañana</strong> — solo puede ser director de grados con jornada Mañana.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-indigo-600 text-base mt-0.5">wb_twilight</span>
            <p><strong>Docente Tarde</strong> — solo puede ser director de grados con jornada Tarde.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-base mt-0.5">schedule</span>
            <p><strong>Docente Completa</strong> — puede dirigir cualquier jornada, pero solo <em>un</em> grado en total.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default GradosPage;