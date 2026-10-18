import { useEffect, useRef } from 'react';
import { canvas, emblem, INGREDIENTS, MOODS, mix } from '../game/art';
import type { Level } from '../game/levels';

const cache = new Map<string, HTMLCanvasElement>();
/** The recipe card in miniature: a page of ledger lines; once brewed, the recipe and its potion. */
function paintCard(level: Level, solved: boolean, w: number, h: number, dpr: number) {
  const m = MOODS[level.chapter], { c, g } = canvas(w * dpr, h * dpr);
  g.scale(dpr, dpr);
  g.save(); g.beginPath(); g.roundRect(0, 0, w, h, 8); g.clip();
  const pg = g.createLinearGradient(0, 0, w, 0); pg.addColorStop(0, '#e8d4a8'); pg.addColorStop(0.5, '#f6e8c4'); pg.addColorStop(1, '#e0c898'); g.fillStyle = pg; g.fillRect(0, 0, w, h);
  const n = level.ledger.length, lh = Math.min((h * (solved ? 0.5 : 0.85)) / n, w / (level.slots + 3)), s = lh * 0.7;
  level.ledger.forEach((b, i) => {
    const y = 8 + (i + 0.5) * lh;
    b.guess.forEach((k, j) => { g.fillStyle = INGREDIENTS[k].col; g.beginPath(); g.arc(8 + (j + 0.5) * s * 1.1, y, s * 0.36, 0, Math.PI * 2); g.fill(); });
    for (let j = 0; j < level.slots; j++) { const kind = j < b.gold ? '#e0a820' : j < b.gold + b.silver ? '#b8c0cc' : null; const x = w - 6 - (level.slots - j - 0.5) * s * 0.75; if (kind) { g.fillStyle = kind; g.beginPath(); g.arc(x, y, s * 0.26, 0, Math.PI * 2); g.fill(); } else { g.strokeStyle = 'rgba(90,60,30,0.35)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, s * 0.2, 0, Math.PI * 2); g.stroke(); } }
  });
  if (solved) {
    const potion = level.answer.map((k) => INGREDIENTS[k].col).reduce((a, col) => mix(a, col, 0.5), m.potion), es = Math.min(w / (level.slots + 1), h * 0.2), y = h * 0.66;
    level.answer.forEach((k, j) => emblem(g, k, w / 2 + (j - (level.slots - 1) / 2) * es, y, es * 0.9));
    const gl = g.createRadialGradient(w / 2, h * 0.9, 0, w / 2, h * 0.9, w * 0.5); gl.addColorStop(0, potion); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(0, h * 0.75, w, h * 0.25);
  }
  g.restore();
  return c;
}

export function Postcard({ level, solved, locked, width }: { level: Level; solved: boolean; locked: boolean; width: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const height = Math.round(width * 1.25);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), key = `${level.id}|${solved}|${locked}|${width}|${dpr}`;
    let src = cache.get(key);
    if (!src) { src = paintCard(level, solved && !locked, width, height, dpr); cache.set(key, src); }
    el.width = src.width; el.height = src.height; el.getContext('2d')!.drawImage(src, 0, 0);
  }, [level, solved, locked, width, height]);
  return <canvas ref={ref} className="postcard" style={{ width, height }} aria-hidden />;
}
