/** Hope: a grey bar of diamond pips separated by ticks. */
export function PipRow({ value, max = 6, onToggle }: { value: number; max?: number; onToggle: (n: number) => void }) {
  return (
    <div className="pip-row" role="group" aria-label="Hope">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className="pip-cell">
          <button
            type="button"
            className={`pip${i < value ? " is-marked" : ""}`}
            aria-pressed={i < value}
            aria-label={`Hope ${i + 1} ${i < value ? "marked" : "unmarked"}`}
            onClick={() => onToggle(i + 1)}
          />
          {i < max - 1 && <span className="pip-tick" aria-hidden="true" />}
        </span>
      ))}
    </div>
  );
}
