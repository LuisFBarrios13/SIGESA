// src/components/ui/FormField.tsx

interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

/**
 * Wraps a form control with a label and optional error message.
 * Single Responsibility: layout + label + error only.
 */
const FormField = ({ label, id, error, required, children }: FormFieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label
      htmlFor={id}
      className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase"
    >
      {label}
      {required && <span className="text-error ml-1">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-xs text-error font-medium flex items-center gap-1">
        <span className="material-symbols-outlined text-[14px]">error</span>
        {error}
      </p>
    )}
  </div>
);

export default FormField;

// ── Shared input styles (exported so form pages can reuse) ────

export const inputClass =
  'w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-white text-sm text-on-surface ' +
  'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ' +
  'placeholder:text-stone-400';

export const selectClass =
  'w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-white text-sm text-on-surface ' +
  'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer';