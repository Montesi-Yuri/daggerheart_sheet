/** One tickable slot. Real slots are buttons; unavailable ones are dashed, inert boxes. */
export function SlotBox({
  index,
  marked,
  label,
  onToggle,
  shape = "box",
}: {
  index: number;
  marked: boolean;
  label: string;
  onToggle: (n: number) => void;
  shape?: "box" | "shield";
}) {
  return (
    <button
      type="button"
      className={`slot slot-${shape}${marked ? " is-marked" : ""}`}
      aria-pressed={marked}
      aria-label={`${label} ${index} ${marked ? "marked" : "unmarked"}`}
      onClick={() => onToggle(index)}
    />
  );
}

/** A row of up to `max` slots: the first `available` are solid, the rest dashed and unavailable. */
export function SlotRow({
  label,
  available,
  marked,
  max = 12,
  onToggle,
}: {
  label: string;
  available: number;
  marked: number;
  max?: number;
  onToggle: (n: number) => void;
}) {
  return (
    <div className="slot-row" role="group" aria-label={`${label} slots`}>
      {Array.from({ length: max }, (_, i) =>
        i < available ? (
          <SlotBox key={i} index={i + 1} marked={i < marked} label={label} onToggle={onToggle} />
        ) : (
          <span key={i} className="slot slot-off" aria-hidden="true" />
        ),
      )}
    </div>
  );
}
