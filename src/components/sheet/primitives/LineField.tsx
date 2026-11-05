import { Abs } from "./Abs";
import { FitText } from "./FitText";

/** A written-in value sitting on a rule, with a small caption underneath (NAME, FEATURE...). */
export function LineField({
  x,
  y,
  w,
  value,
  label,
  labelAlign = "left",
  numeric,
  max = 15,
}: {
  x: number;
  /** y of the rule */
  y: number;
  w: number;
  value: string;
  label?: string;
  labelAlign?: "left" | "center";
  numeric?: boolean;
  max?: number;
}) {
  return (
    <>
      <Abs x={x + 6} y={y - 22} w={w - 8} h={21} className={numeric ? "written center" : "written"}>
        <FitText text={value} max={max} />
      </Abs>
      <Abs x={x} y={y} w={w} className="rule" />
      {label && (
        <Abs x={x + 10} y={y + 5} w={w - 12} className={`caption ${labelAlign === "center" ? "center" : ""}`}>
          {label}
        </Abs>
      )}
    </>
  );
}
