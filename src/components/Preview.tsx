import { useEffect, useRef, useState } from "react";
import { Page1 } from "./sheet/Page1";
import { Page2 } from "./sheet/Page2";

const PAGE_W = 952;
const PAGE_H = 1232;
const VIEW_KEY = "dh:ui:view";

type Mode = "stacked" | "p1" | "p2";
type Zoom = "fit" | "full";

function load<T extends string>(key: string, allowed: T[], fallback: T): T {
  // ?view=p1|p2|stacked and ?zoom=fit|full override the remembered choice (handy for deep links and screenshots).
  const fromUrl = new URLSearchParams(location.search).get(key === "mode" ? "view" : key) as T | null;
  if (fromUrl && allowed.includes(fromUrl)) return fromUrl;
  try {
    const v = JSON.parse(localStorage.getItem(VIEW_KEY) ?? "{}")[key];
    return allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: string) {
  try {
    const all = JSON.parse(localStorage.getItem(VIEW_KEY) ?? "{}");
    all[key] = value;
    localStorage.setItem(VIEW_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export function Preview() {
  const [mode, setMode] = useState<Mode>(() => load("mode", ["stacked", "p1", "p2"], "stacked"));
  const [zoom, setZoom] = useState<Zoom>(() => load("zoom", ["fit", "full"], "fit"));
  const [width, setWidth] = useState(900);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const scale = zoom === "full" ? 1 : Math.min(1.6, Math.max(0.25, (width - 32) / PAGE_W));
  const choose = (m: Mode) => {
    setMode(m);
    save("mode", m);
  };
  const chooseZoom = (z: Zoom) => {
    setZoom(z);
    save("zoom", z);
  };
  const slot = (hidden: boolean, label: string, page: React.ReactNode) => (
    <div className="sheet-slot" hidden={hidden} style={{ width: PAGE_W * scale, height: PAGE_H * scale }} aria-label={label}>
      <div className="sheet-scaler" style={{ transform: `scale(${scale})` }}>
        {page}
      </div>
    </div>
  );

  return (
    <div className="preview" ref={box}>
      <div className="preview-bar" role="toolbar" aria-label="Sheet view">
        {(
          [
            ["stacked", "Both pages"],
            ["p1", "Page 1"],
            ["p2", "Page 2"],
          ] as const
        ).map(([m, label]) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => choose(m)}>
            {label}
          </button>
        ))}
        <span className="bar-gap" />
        <button type="button" aria-pressed={zoom === "fit"} onClick={() => chooseZoom("fit")}>
          Fit width
        </button>
        <button type="button" aria-pressed={zoom === "full"} onClick={() => chooseZoom("full")}>
          100%
        </button>
      </div>
      <div className="preview-pages">
        {slot(mode === "p2", "Page 1", <Page1 />)}
        {slot(mode === "p1", "Page 2", <Page2 />)}
      </div>
    </div>
  );
}
