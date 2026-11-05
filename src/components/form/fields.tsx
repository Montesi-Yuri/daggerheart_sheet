import { useEffect, useId, useState, type ReactNode } from "react";
import { useCharacter, useSheet } from "../../state/store";
import { effectiveValue, isOverridden, resetField, setField } from "../../state/suggestions";

const OPEN_KEY = "dh:ui:open";

function loadOpen(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(OPEN_KEY) ?? "null") ?? { identity: true, traits: true };
  } catch {
    return { identity: true, traits: true };
  }
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const [open, setOpen] = useState(() => loadOpen()[id] ?? false);
  const panel = useId();
  useEffect(() => {
    const all = loadOpen();
    all[id] = open;
    try {
      localStorage.setItem(OPEN_KEY, JSON.stringify(all));
    } catch {
      /* ignore */
    }
  }, [id, open]);
  return (
    <section className="acc">
      <h2>
        <button type="button" className="acc-head" aria-expanded={open} aria-controls={panel} onClick={() => setOpen(!open)}>
          <span aria-hidden="true">{open ? "▾" : "▸"}</span> {title}
        </button>
      </h2>
      {open && (
        <div className="acc-body" id={panel}>
          {children}
        </div>
      )}
    </section>
  );
}

export function Warn({ children }: { children: ReactNode }) {
  return (
    <p className="warn" role="status" aria-live="polite">
      <span aria-hidden="true">⚠ </span>
      {children}
    </p>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="note">{children}</p>;
}

export function Row({ children }: { children: ReactNode }) {
  return <div className="row">{children}</div>;
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea id={id} value={value} placeholder={placeholder} rows={3} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  children,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </div>
  );
}

export function Stepper({
  label,
  value,
  onChange,
  min = -99,
  max = 99,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  format?: (v: number) => string;
}) {
  const id = useId();
  return (
    <div className="field stepper" role="group" aria-labelledby={id}>
      <span id={id} className="label">
        {label}
      </span>
      <div className="stepper-ctl">
        <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
          −
        </button>
        <output aria-live="polite">{format ? format(value) : value}</output>
        <button type="button" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
          +
        </button>
      </div>
    </div>
  );
}

/** A text/number field whose value is suggested by a selection; manual edits become overrides. */
export function OverrideInput({
  label,
  path,
  multiline,
  numeric,
}: {
  label: string;
  path: string;
  multiline?: boolean;
  numeric?: boolean;
}) {
  const c = useCharacter();
  const update = useSheet((s) => s.update);
  const id = useId();
  const value = String(effectiveValue(c, path));
  const overridden = isOverridden(c, path);
  const set = (v: string) => update((ch) => setField(ch, path, numeric ? (v === "" ? "" : Number(v)) : v));
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="override">
        {multiline ? (
          <textarea id={id} value={value} rows={2} onChange={(e) => set(e.target.value)} />
        ) : (
          <input id={id} type={numeric ? "number" : "text"} value={value} onChange={(e) => set(e.target.value)} />
        )}
        {overridden && (
          <button
            type="button"
            className="reset"
            title="Edited by hand. Reset to suggested"
            aria-label={`Reset ${label} to suggested`}
            onClick={() => update((ch) => resetField(ch, path))}
          >
            ↺
          </button>
        )}
      </div>
    </div>
  );
}
