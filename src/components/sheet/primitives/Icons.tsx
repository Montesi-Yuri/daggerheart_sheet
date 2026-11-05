import type { ReactElement } from "react";

/** Small SVG glyphs drawn for the sheet (no raster images). All inherit stroke colour from CSS. */

export function HandsIcon({ className }: { className?: string }) {
  const hand = (
    <g fill="#fff" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 26 V13 Q6 10 9 10 Q11 10 11 13 V8 Q11 5 14 5 Q16.5 5 16.5 8 V7 Q16.5 4 19.5 4 Q22 4 22 7 V9 Q22 6.5 25 6.5 Q27.5 6.5 27.5 9.5 V24 Q27.5 31 20 33 H15 Q6 31 6 26 Z" />
      <path d="M11 13 V21 M16.5 8 V20 M22 9 V20" fill="none" strokeWidth="1.1" />
    </g>
  );
  return (
    <svg className={className} viewBox="0 0 72 36" width="100%" height="100%" aria-hidden="true" style={{ color: "#4a4a4a" }}>
      <g>{hand}</g>
      <g transform="translate(72 0) scale(-1 1)">{hand}</g>
    </svg>
  );
}

const DOMAIN_GLYPHS: Record<string, ReactElement> = {
  valor: (
    <g fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M4 5 H28 V17 Q28 26 16 31 Q4 26 4 17 Z" />
      <path d="M10 9 L16 21 L22 9" />
      <path d="M12 12 L16 19 L20 12" />
    </g>
  ),
  blade: (
    <g fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M6 30 L20 8" />
      <path d="M20 8 Q26 2 30 3 Q30 10 24 15 Q22 12 20 8 Z" fill="#fff" />
      <path d="M9 25 L13 27" />
    </g>
  ),
};

/** Domain emblem for the dark header band. Unknown domains fall back to a diamond with their initial. */
export function DomainIcon({ domain }: { domain: string }) {
  const glyph = DOMAIN_GLYPHS[domain.toLowerCase()];
  return (
    <svg viewBox="0 0 34 34" width="100%" height="100%" aria-label={domain} role="img">
      {glyph ?? (
        <g fill="none" stroke="#fff" strokeWidth="2">
          <path d="M17 3 L31 17 L17 31 L3 17 Z" />
          <text x="17" y="22" textAnchor="middle" fontSize="13" fill="#fff" stroke="none" fontFamily="Montserrat, sans-serif" fontWeight="700">
            {domain.charAt(0).toUpperCase()}
          </text>
        </g>
      )}
    </svg>
  );
}

export function CoinIcon() {
  return (
    <svg viewBox="0 0 20 20" width="100%" height="100%" aria-hidden="true">
      <circle className="g-fill" cx="10" cy="10" r="8.5" strokeWidth="1.6" />
      <path d="M6 4.5 Q2.5 10 6 15.5" fill="none" stroke="#9a9a9a" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function BagIcon() {
  return (
    <svg viewBox="0 0 22 26" width="100%" height="100%" aria-hidden="true">
      <path
        className="g-fill"
        d="M8 3 L10 6 H12 L14 3 Q15 2 16 3 L14.5 7 Q20 11 20 17 Q20 24 11 24 Q2 24 2 17 Q2 11 7.5 7 L6 3 Q7 2 8 3 Z"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 8 Q5 11 5 16" fill="none" stroke="#9a9a9a" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ChestIcon() {
  return (
    <svg viewBox="0 0 28 28" width="100%" height="100%" aria-hidden="true">
      <rect className="g-fill" x="3" y="4" width="22" height="20" rx="2.5" strokeWidth="1.6" />
      <path d="M3 11 H25 M12 11 V16 H16 V11" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 7 H22" fill="none" stroke="#9a9a9a" strokeWidth="1.2" />
    </svg>
  );
}
