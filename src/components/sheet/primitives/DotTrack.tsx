/** Proficiency: a row of dots, filled up to the current value. */
export function DotTrack({ value, max = 6 }: { value: number; max?: number }) {
  return (
    <span className="dot-track" role="img" aria-label={`Proficiency ${value} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`dot${i < value ? " is-on" : ""}`} />
      ))}
    </span>
  );
}
