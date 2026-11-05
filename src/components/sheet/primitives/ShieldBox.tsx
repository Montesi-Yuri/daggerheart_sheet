import type { ReactNode } from "react";
import { Abs } from "./Abs";

type Variant = "trait" | "crest";

const PATHS: Record<Variant, string> = {
  trait: "M3 3 H97 V44 Q97 62 50 78 Q3 62 3 44 Z",
  crest: "M3 26 Q3 6 22 4 Q36 14 50 14 Q64 14 78 4 Q97 6 97 26 V50 Q97 66 50 82 Q3 66 3 50 Z",
};

/** Shield-shaped value box (traits, Evasion, Armor, Level). */
export function ShieldBox({
  x,
  y,
  w,
  h,
  variant = "trait",
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  variant?: Variant;
  children?: ReactNode;
}) {
  return (
    <Abs x={x} y={y} w={w} h={h} className="shield">
      <svg width={w} height={h} viewBox="0 0 100 84" preserveAspectRatio="none" aria-hidden="true">
        <path d={PATHS[variant]} fill="var(--sheet-paper)" stroke="var(--sheet-line)" strokeWidth="3.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        <path
          d={PATHS[variant]}
          fill="none"
          stroke="var(--sheet-line-inner)"
          strokeWidth="1.5"
          transform="translate(50 42) scale(0.86) translate(-50 -42)"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="shield-value">{children}</div>
    </Abs>
  );
}
