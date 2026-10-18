/**
 * Apothecary art, painted with Canvas 2D: a dark oak shop by candlelight, an open ledger of yellowed parchment
 * with gold and silver wax seals, glass jars of eight ingredients (each with its own shape as well as colour),
 * the brass dishes the recipe is laid out in, and the round flask that bubbles when the potion is right.
 */
export type Ingredient = { name: string; col: string };
export const INGREDIENTS: Ingredient[] = [
  { name: 'Lavender', col: '#9a6ae0' }, { name: 'Rose', col: '#ff5a7a' }, { name: 'Mint', col: '#3ab86a' }, { name: 'Saffron', col: '#ff9a2a' },
  { name: 'Moonflower', col: '#e8eef8' }, { name: 'Nightshade', col: '#4a4ab0' }, { name: 'Honey', col: '#ffc23a' }, { name: 'Sea Salt', col: '#7ad8e8' },
];
export type Mood = { name: string; wood: [string, string]; candle: string; potion: string };
export const MOODS: Mood[] = [
  { name: 'herbal', wood: ['#4a3020', '#2a1a10'], candle: '#ffb860', potion: '#7ad070' },
  { name: 'tincture', wood: ['#3e2a26', '#22140f'], candle: '#ffa850', potion: '#e05a8a' },
  { name: 'elixir', wood: ['#2e2234', '#16101c'], candle: '#ffc070', potion: '#7a8aff' },
];
export function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return { c, g: c.getContext('2d')! };
}
export const hash = (a: number, b: number) => { let h = Math.imul(a + 0x9e3779b9, 374761393) ^ Math.imul(b + 7, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const TAU = Math.PI * 2;
export function hexA(hex: string, a: number) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
export function mix(a: string, b: string, t: number) {
  const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((p >> s) & 255) * (1 - t) + ((q >> s) & 255) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}
export const toInt = (hex: string) => parseInt(hex.slice(1), 16);

/** An ingredient's emblem at (x, y), about `s` across. Each has a distinct silhouette. */
export function emblem(g: CanvasRenderingContext2D, kind: number, x: number, y: number, s: number) {
  const col = INGREDIENTS[kind].col, dk = mix(col, '#000000', 0.4), lt = mix(col, '#ffffff', 0.45);
  g.save(); g.translate(x, y); g.lineCap = 'round'; g.lineJoin = 'round';
  switch (kind) {
    case 0: { // lavender: a stem of buds
      g.strokeStyle = '#4a7a3a'; g.lineWidth = s * 0.06; g.beginPath(); g.moveTo(0, s * 0.45); g.quadraticCurveTo(s * 0.05, 0, 0, -s * 0.4); g.stroke();
      for (let i = 0; i < 7; i++) { const yy = -s * 0.38 + i * s * 0.1, xo = (i % 2 ? 1 : -1) * s * 0.07; g.fillStyle = i % 2 ? col : lt; g.beginPath(); g.ellipse(xo, yy, s * 0.08, s * 0.06, 0, 0, TAU); g.fill(); }
      break;
    }
    case 1: { // rose: layered petals
      for (const [r, c] of [[0.42, dk], [0.32, col], [0.2, lt]] as [number, string][]) { g.fillStyle = c; g.beginPath(); for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + r * 3; g.ellipse(Math.cos(a) * s * r * 0.35, Math.sin(a) * s * r * 0.35, s * r * 0.55, s * r * 0.4, a, 0, TAU); } g.fill(); }
      break;
    }
    case 2: { // mint: two leaves with veins
      for (const sg of [-1, 1]) { g.save(); g.rotate(sg * 0.5); g.fillStyle = sg > 0 ? col : dk; g.beginPath(); g.moveTo(0, s * 0.42); g.quadraticCurveTo(s * 0.32, 0, 0, -s * 0.42); g.quadraticCurveTo(-s * 0.32, 0, 0, s * 0.42); g.fill(); g.strokeStyle = lt; g.lineWidth = s * 0.03; g.beginPath(); g.moveTo(0, s * 0.38); g.lineTo(0, -s * 0.36); g.stroke(); g.restore(); }
      break;
    }
    case 3: { // saffron: a bundle of red-orange threads
      for (let i = 0; i < 7; i++) { const a = -0.5 + i * 0.16; g.strokeStyle = i % 2 ? col : '#d8401a'; g.lineWidth = s * 0.06; g.beginPath(); g.moveTo(0, s * 0.4); g.quadraticCurveTo(Math.sin(a) * s * 0.5, 0, Math.sin(a) * s * 0.45, -s * 0.4); g.stroke(); }
      g.fillStyle = '#ffd86a'; for (let i = 0; i < 7; i++) { const a = -0.5 + i * 0.16; g.beginPath(); g.arc(Math.sin(a) * s * 0.45, -s * 0.4, s * 0.04, 0, TAU); g.fill(); }
      break;
    }
    case 4: { // moonflower: a white star flower with a pale glow
      const gl = g.createRadialGradient(0, 0, 0, 0, 0, s * 0.5); gl.addColorStop(0, 'rgba(220,235,255,0.6)'); gl.addColorStop(1, 'rgba(220,235,255,0)'); g.fillStyle = gl; g.fillRect(-s / 2, -s / 2, s, s);
      g.fillStyle = col; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? s * 0.16 : s * 0.42; if (i) g.lineTo(Math.cos(a) * r, Math.sin(a) * r); else g.moveTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill();
      g.strokeStyle = '#a8b8d0'; g.lineWidth = s * 0.025; g.stroke(); g.fillStyle = '#ffe89a'; g.beginPath(); g.arc(0, 0, s * 0.08, 0, TAU); g.fill();
      break;
    }
    case 5: { // nightshade: a cluster of dark berries on a stem
      g.strokeStyle = '#3a5a2a'; g.lineWidth = s * 0.05; g.beginPath(); g.moveTo(0, -s * 0.42); g.lineTo(0, -s * 0.12); g.stroke();
      for (const [bx, by] of [[-0.15, 0], [0.15, 0], [0, 0.22], [-0.2, 0.25], [0.2, 0.25]]) { const gr = g.createRadialGradient(bx * s - s * 0.04, by * s - s * 0.04, 0, bx * s, by * s, s * 0.14); gr.addColorStop(0, lt); gr.addColorStop(1, dk); g.fillStyle = gr; g.beginPath(); g.arc(bx * s, by * s, s * 0.13, 0, TAU); g.fill(); }
      break;
    }
    case 6: { // honey: a golden drop
      const gr = g.createRadialGradient(-s * 0.08, s * 0.05, 0, 0, s * 0.1, s * 0.4); gr.addColorStop(0, '#fff2a0'); gr.addColorStop(1, '#d8901a');
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, -s * 0.44); g.bezierCurveTo(s * 0.18, -s * 0.16, s * 0.34, s * 0.06, s * 0.3, s * 0.22); g.arc(0, s * 0.18, s * 0.3, 0.13, Math.PI - 0.13); g.bezierCurveTo(-s * 0.34, s * 0.06, -s * 0.18, -s * 0.16, 0, -s * 0.44); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(-s * 0.1, s * 0.12, s * 0.05, s * 0.1, 0.3, 0, TAU); g.fill();
      break;
    }
    case 7: { // sea salt: faceted crystals
      for (const [cx, cy, r] of [[-0.12, 0.08, 0.24], [0.16, -0.06, 0.2], [0.04, 0.24, 0.14]]) {
        g.fillStyle = col; g.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; const px = cx * s + Math.cos(a) * r * s, py = cy * s + Math.sin(a) * r * s; if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.closePath(); g.fill();
        g.fillStyle = lt; g.beginPath(); g.moveTo(cx * s, cy * s); for (let i = 3; i <= 5; i++) { const a = (i / 6) * TAU; g.lineTo(cx * s + Math.cos(a) * r * s, cy * s + Math.sin(a) * r * s); } g.closePath(); g.fill();
      }
      break;
    }
  }
  g.restore();
}
/** A glass jar with a cork, holding an ingredient. */
export function jar(kind: number, size: number, r: number) {
  const k = size * r, W = k, H = k * 1.25, { c, g } = canvas(W, H), cx = W / 2;
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(cx, H * 0.95, W * 0.36, H * 0.04, 0, 0, TAU); g.fill();
  const body = () => { g.beginPath(); g.roundRect(W * 0.14, H * 0.22, W * 0.72, H * 0.72, W * 0.14); };
  const gl = g.createLinearGradient(W * 0.14, 0, W * 0.86, 0); gl.addColorStop(0, 'rgba(200,230,240,0.32)'); gl.addColorStop(0.5, 'rgba(200,230,240,0.12)'); gl.addColorStop(1, 'rgba(200,230,240,0.3)');
  g.fillStyle = gl; body(); g.fill();
  g.fillStyle = hexA(INGREDIENTS[kind].col, 0.22); g.beginPath(); g.roundRect(W * 0.16, H * 0.55, W * 0.68, H * 0.37, W * 0.12); g.fill();
  emblem(g, kind, cx, H * 0.6, W * 0.5);
  g.strokeStyle = 'rgba(230,245,255,0.55)'; g.lineWidth = W * 0.025; body(); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = W * 0.04; g.beginPath(); g.moveTo(W * 0.24, H * 0.32); g.lineTo(W * 0.24, H * 0.7); g.stroke();
  // neck and cork
  g.fillStyle = 'rgba(200,230,240,0.3)'; g.fillRect(W * 0.3, H * 0.14, W * 0.4, H * 0.1);
  const ck = g.createLinearGradient(0, H * 0.04, 0, H * 0.18); ck.addColorStop(0, '#d8a870'); ck.addColorStop(1, '#8a5a30');
  g.fillStyle = ck; g.beginPath(); g.roundRect(W * 0.32, H * 0.04, W * 0.36, H * 0.14, W * 0.04); g.fill();
  return c;
}
/** A brass dish for one slot of the recipe. */
export function dish(size: number, r: number) {
  const k = size * r, { c, g } = canvas(k, k), cx = k / 2;
  g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.ellipse(cx + k * 0.03, cx + k * 0.05, k * 0.44, k * 0.44, 0, 0, TAU); g.fill();
  const rim = g.createRadialGradient(cx - k * 0.15, cx - k * 0.15, k * 0.1, cx, cx, k * 0.46); rim.addColorStop(0, '#f8d88a'); rim.addColorStop(0.6, '#c8902e'); rim.addColorStop(1, '#6a4410');
  g.fillStyle = rim; g.beginPath(); g.arc(cx, cx, k * 0.44, 0, TAU); g.fill();
  const bowl = g.createRadialGradient(cx + k * 0.08, cx + k * 0.1, 0, cx, cx, k * 0.36); bowl.addColorStop(0, '#3a2412'); bowl.addColorStop(1, '#8a5a24');
  g.fillStyle = bowl; g.beginPath(); g.arc(cx, cx, k * 0.35, 0, TAU); g.fill();
  return c;
}
/** A wax seal: gold, silver or an empty ring. */
export function seal(kind: 'gold' | 'silver' | 'none', size: number, r: number) {
  const k = size * r, { c, g } = canvas(k, k), cx = k / 2, R = k * 0.42;
  if (kind === 'none') { g.strokeStyle = 'rgba(90,60,30,0.35)'; g.lineWidth = k * 0.07; g.beginPath(); g.arc(cx, cx, R * 0.7, 0, TAU); g.stroke(); return c; }
  const [a, b, d] = kind === 'gold' ? ['#fff0a0', '#e0a820', '#8a5a08'] : ['#ffffff', '#b8c0cc', '#5a6270'];
  g.fillStyle = d; g.beginPath(); for (let i = 0; i < 14; i++) { const t = (i / 14) * TAU, rr = R * (i % 2 ? 0.92 : 1); g.lineTo(cx + Math.cos(t) * rr, cx + Math.sin(t) * rr); } g.closePath(); g.fill();
  const gr = g.createRadialGradient(cx - R * 0.3, cx - R * 0.3, 0, cx, cx, R * 0.85); gr.addColorStop(0, a); gr.addColorStop(0.6, b); gr.addColorStop(1, d);
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cx, R * 0.78, 0, TAU); g.fill();
  g.strokeStyle = hexA(d, 0.7); g.lineWidth = k * 0.05; g.beginPath(); g.arc(cx, cx, R * 0.48, 0, TAU); g.stroke();
  return c;
}
/** The shop: oak panelling, shelves and candlelight; the parchment ledger page in the given rectangle. */
export function shop(m: Mood, W: number, H: number, r: number, page: [number, number, number, number] | null, shelfY: number[]) {
  const { c, g } = canvas(W * r, H * r); g.scale(r, r);
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, m.wood[1]); bg.addColorStop(0.5, m.wood[0]); bg.addColorStop(1, m.wood[1]);
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 46) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, 0, 2, H); g.fillStyle = 'rgba(255,220,180,0.04)'; g.fillRect(x + 2, 0, 1, H); }
  for (let i = 0; i < 120; i++) { g.strokeStyle = `rgba(0,0,0,${0.05 + hash(i, 1) * 0.08})`; g.lineWidth = 0.8; const x = hash(i, 2) * W; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 6, H * 0.3, x - 6, H * 0.6, x + 3, H); g.stroke(); }
  for (const y of shelfY) { const sg = g.createLinearGradient(0, y, 0, y + 12); sg.addColorStop(0, '#8a5a34'); sg.addColorStop(1, '#3a2010'); g.fillStyle = sg; g.fillRect(0, y, W, 12); g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(0, y + 12, W, 6); }
  if (page) {
    const [x, y, w, h] = page;
    g.save(); g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 18; g.shadowOffsetY = 6;
    const pg = g.createLinearGradient(x, 0, x + w, 0); pg.addColorStop(0, '#e8d4a8'); pg.addColorStop(0.5, '#f6e8c4'); pg.addColorStop(1, '#e4cc9c');
    g.fillStyle = pg; g.beginPath(); g.roundRect(x, y, w, h, 6); g.fill(); g.restore();
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(120,80,30,${0.03 + hash(i, 5) * 0.05})`; g.beginPath(); g.arc(x + hash(i, 6) * w, y + hash(i, 7) * h, 1 + hash(i, 8) * 6, 0, TAU); g.fill(); }
    const edge = g.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, x + w / 2, y + h / 2, Math.max(w, h) * 0.7); edge.addColorStop(0, 'rgba(120,70,20,0)'); edge.addColorStop(1, 'rgba(120,70,20,0.28)');
    g.fillStyle = edge; g.beginPath(); g.roundRect(x, y, w, h, 6); g.fill();
    g.strokeStyle = 'rgba(160,40,40,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 30, y + 6); g.lineTo(x + 30, y + h - 6); g.stroke();
  }
  // candlelight from the top corner
  const cl = g.createRadialGradient(W * 0.88, H * 0.08, 10, W * 0.88, H * 0.08, Math.max(W, H) * 0.7); cl.addColorStop(0, hexA(m.candle, 0.25)); cl.addColorStop(1, hexA(m.candle, 0));
  g.fillStyle = cl; g.fillRect(0, 0, W, H);
  return c;
}
/** A round-bottomed flask with a coloured potion at `fill` (0..1). */
export function flask(size: number, r: number, col: string, fill: number) {
  const k = size * r, W = k, H = k * 1.3, { c, g } = canvas(W, H), cx = W / 2, cy = H * 0.66, R = W * 0.38;
  const shape = () => { g.beginPath(); g.moveTo(cx - W * 0.1, H * 0.08); g.lineTo(cx - W * 0.1, cy - R * 0.85); g.arc(cx, cy, R, -Math.PI / 2 - 0.27, -Math.PI / 2 + 0.27, true); g.lineTo(cx + W * 0.1, H * 0.08); g.closePath(); };
  g.save(); shape(); g.clip();
  g.fillStyle = 'rgba(200,230,240,0.15)'; g.fillRect(0, 0, W, H);
  const top = cy + R - fill * R * 2;
  const lq = g.createLinearGradient(0, top, 0, cy + R); lq.addColorStop(0, mix(col, '#ffffff', 0.08)); lq.addColorStop(1, mix(col, '#000000', 0.4));
  g.fillStyle = lq; g.fillRect(0, top, W, H);
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, top, W, Math.max(1, k * 0.015));
  g.restore();
  g.strokeStyle = 'rgba(230,245,255,0.7)'; g.lineWidth = W * 0.025; shape(); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = W * 0.04; g.beginPath(); g.arc(cx, cy, R * 0.75, Math.PI * 1.1, Math.PI * 1.45); g.stroke();
  g.fillStyle = '#8a5a30'; g.beginPath(); g.roundRect(cx - W * 0.13, H * 0.02, W * 0.26, H * 0.07, 3); g.fill();
  return c;
}
/** A soft round glow. */
export function glow(size: number) {
  const { c, g } = canvas(size, size), h = size / 2, d = g.createRadialGradient(h, h, 0, h, h, h);
  d.addColorStop(0, 'rgba(255,255,255,1)'); d.addColorStop(0.35, 'rgba(255,255,255,0.4)'); d.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = d; g.fillRect(0, 0, size, size);
  return c;
}
