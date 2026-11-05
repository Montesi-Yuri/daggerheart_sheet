import type { ReactNode } from "react";
import { Abs } from "./Abs";

/** Bordered section panel. Left and right column panels bleed off the page edge like the printed sheet. */
export function Frame({
  x,
  y,
  w,
  h,
  bleed,
  tone,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  bleed?: "left" | "right";
  tone?: "grey";
  children?: ReactNode;
}) {
  return (
    <Abs x={x} y={y} w={w} h={h} className={`frame ${bleed ? `bleed-${bleed}` : ""} ${tone ? `tone-${tone}` : ""}`}>
      {children}
    </Abs>
  );
}
