import type { CSSProperties, ReactNode } from "react";

/** Absolutely positioned box in the sheet coordinate space (952x1232, the proportions of the PDF). */
export function Abs({
  x,
  y,
  w,
  h,
  className,
  style,
  children,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <div className={className ? `abs ${className}` : "abs"} style={{ left: x, top: y, width: w, height: h, ...style }}>
      {children}
    </div>
  );
}
