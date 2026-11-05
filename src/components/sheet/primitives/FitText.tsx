import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** Counter that bumps once web fonts finish loading, so fit-to-box measurements get re-run. */
function useFontsReady(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    void document.fonts?.ready.then(() => live && setN((x) => x + 1));
    return () => {
      live = false;
    };
  }, []);
  return n;
}

/**
 * Fills its parent box. Starts at `max` px and shrinks until the text fits (down to `min`),
 * so long entries stay inside the boxes of the sheet. Single-line by default; `multiline` wraps.
 */
export function FitText({
  text,
  max = 15,
  min = 6.5,
  multiline = false,
  className,
}: {
  text: string;
  max?: number;
  min?: number;
  multiline?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fonts = useFontsReady();
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let size = max;
    el.style.fontSize = `${size}px`;
    const overflows = () => (multiline && el.scrollHeight > el.clientHeight + 0.5) || el.scrollWidth > el.clientWidth + 0.5;
    while (size > min && overflows()) {
      size -= 0.5;
      el.style.fontSize = `${size}px`;
    }
  }, [text, max, min, fonts, multiline]);
  return (
    <div ref={ref} className={`fit ${multiline ? "fit-ml" : "fit-sl"} ${className ?? ""}`} style={{ fontSize: max }}>
      {text}
    </div>
  );
}
