type P = { size?: number };
const s = (size = 22) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

export const Pause = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M9 6.5v11M15 6.5v11" /></svg>;
export const Back = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M14.5 5.5 8 12l6.5 6.5" /></svg>;
export const Next = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M9.5 5.5 16 12l-6.5 6.5" /></svg>;
export const Restart = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4 4.5v3.5h3.5" /></svg>;
export const Undo = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M9 7 4.5 11.5 9 16" /><path d="M5 11.5h9a5 5 0 0 1 0 10h-2" /></svg>;
export const Lamp = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></svg>;
export const Gear = ({ size }: P) => (
  <svg {...s(size)} aria-hidden><circle cx="12" cy="12" r="3" /><path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" /></svg>
);
/** A round flask. */
export const Flask = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M10 3.5h4M10.5 3.5v5.2a6.5 6.5 0 1 0 3 0V3.5" /><path d="M6.4 14.5h11.2" opacity=".6" /></svg>;
/** The ledger. */
export const Book = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M5 4.5h11.5a2 2 0 0 1 2 2v13H7a2 2 0 0 1-2-2z" /><path d="M5 17.5a2 2 0 0 1 2-2h11.5" /><path d="M9 8.5h6M9 11h4" opacity=".6" /></svg>;
/** Stars are wax seals, gold when earned. */
export const Star = ({ size = 22, on = true }: P & { on?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d={Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2, r = i % 2 ? 9 : 10.3; return `${i ? 'L' : 'M'}${(12 + Math.cos(a) * r).toFixed(2)} ${(12 + Math.sin(a) * r).toFixed(2)}`; }).join('') + 'Z'} fill={on ? '#c8901e' : 'none'} stroke={on ? 'none' : 'rgba(255,255,255,.5)'} strokeWidth="1.2" />
    {on && <circle cx="12" cy="12" r="7.2" fill="#f0c040" />}
    {on && <circle cx="12" cy="12" r="4.4" fill="none" stroke="#9a6a10" strokeWidth="1.2" />}
    {on && <path d="M8.5 9.2a4.6 4.6 0 0 1 2.4-1.6" stroke="#fff6c0" strokeWidth="1.2" strokeLinecap="round" fill="none" />}
  </svg>
);
