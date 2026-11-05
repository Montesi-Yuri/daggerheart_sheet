import { Abs } from "./Abs";

/** Angled ribbon section header. `cx` is the horizontal centre; the ribbon straddles the top edge of its frame. */
export function BannerHeader({ title, cx, y, w = 290, h = 26 }: { title: string; cx: number; y: number; w?: number; h?: number }) {
  const x = cx - w / 2;
  const s = h / 2;
  const tail = 16;
  const pts = `${tail + 2},1 ${w - tail - 2},1 ${w - 2},${s} ${w - tail - 2},${h - 1} ${tail + 2},${h - 1} 2,${s}`;
  return (
    <Abs x={x} y={y} w={w} h={h} className="banner">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <polygon points={pts} fill="#fff" stroke="#4a4a4a" strokeWidth="2" strokeLinejoin="round" />
        <polygon points={`2,${s} ${tail + 2},1 ${tail + 2},${h - 1}`} fill="#4a4a4a" />
        <polygon points={`${w - 2},${s} ${w - tail - 2},1 ${w - tail - 2},${h - 1}`} fill="#4a4a4a" />
      </svg>
      <span>{title}</span>
    </Abs>
  );
}
