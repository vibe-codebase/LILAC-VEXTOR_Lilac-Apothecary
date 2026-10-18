// Store icon, adaptive-icon layers, splash and feature graphic: a glowing flask, jars on oak shelves, the ledger.
import * as A from '../src/game/art';
import { LEVELS } from '../src/game/levels';

const HB = A.MOODS[0], TI = A.MOODS[1];
function glowAt(g: CanvasRenderingContext2D, x: number, y: number, R: number, col: string, a: number) { const gr = g.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, A.hexA(col, a)); gr.addColorStop(1, A.hexA(col, 0)); g.fillStyle = gr; g.fillRect(x - R, y - R, R * 2, R * 2); }
function bubbles(g: CanvasRenderingContext2D, x: number, y: number, s: number) { g.strokeStyle = 'rgba(255,255,255,0.6)'; for (let i = 0; i < 9; i++) { g.lineWidth = s * 0.012; g.beginPath(); g.arc(x + Math.sin(i * 2.3) * s * 0.08, y - i * s * 0.07, s * (0.015 + (i % 3) * 0.008), 0, Math.PI * 2); g.stroke(); } }
function iconArt(g: CanvasRenderingContext2D, S: number, bg: boolean) {
  if (bg) { g.drawImage(A.shop(TI, S, S, 1, null, [S * 0.88]), 0, 0); }
  glowAt(g, S / 2, S * 0.58, S * 0.45, '#ff6aa8', 0.55);
  const f = A.flask(S * 0.56, 1, '#e8508a', 0.7); g.drawImage(f, S / 2 - f.width / 2, S * 0.52 - f.height / 2);
  bubbles(g, S / 2, S * 0.36, S * 0.45);
  const sl = A.seal('gold', S * 0.24, 1); g.drawImage(sl, S * 0.66, S * 0.66);
}
export function icon() { const { c, g } = A.canvas(1024, 1024); iconArt(g, 1024, true); return c; }
export function adaptive() { const { c, g } = A.canvas(1024, 1024); g.translate(512, 512); g.scale(0.78, 0.78); g.translate(-512, -512); iconArt(g, 1024, false); return c; }
export function adaptiveBg() { const { c, g } = A.canvas(1024, 1024); g.drawImage(A.shop(TI, 1024, 1024, 1, null, [900]), 0, 0); return c; }
export function splash() {
  const W = 1284, H = 2778, { c, g } = A.canvas(W, H);
  g.drawImage(A.shop(HB, W, H, 1, null, [1700, 2150]), 0, 0);
  for (let k = 0; k < 4; k++) { const j = A.jar(k, 230, 1); g.drawImage(j, W / 2 + (k - 1.5) * 270 - j.width / 2, 1700 - j.height + 10); }
  for (let k = 4; k < 8; k++) { const j = A.jar(k, 230, 1); g.drawImage(j, W / 2 + (k - 5.5) * 270 - j.width / 2, 2150 - j.height + 10); }
  glowAt(g, W / 2, 1150, 420, '#7ad070', 0.5);
  const f = A.flask(520, 1, '#5ac860', 0.72); g.drawImage(f, W / 2 - f.width / 2, 1150 - f.height / 2);
  g.textAlign = 'center'; g.font = '900 150px "Cinzel Decorative", serif'; g.fillStyle = '#fbf3e2'; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 30; g.fillText('Apothecary', W / 2, 720); g.shadowBlur = 0;
  g.font = '600 58px Sora, sans-serif'; g.fillStyle = '#c9a8ff'; try { g.letterSpacing = '34px'; } catch { /* */ } g.fillText('LILAC', W / 2 + 17, 560); try { g.letterSpacing = '0px'; } catch { /* */ }
  return c;
}
/** The feature graphic: the ledger page, three jars and a glowing flask; the words on the left. */
export function feature() {
  const W = 1024, H = 500, { c, g } = A.canvas(W, H);
  g.drawImage(A.shop(TI, W, H, 1, [600, 40, 300, 170], [440]), 0, 0);
  const l = LEVELS.find((x) => x.id === 'b4')!;
  l.ledger.slice(0, 4).forEach((b, i) => {
    const y = 40 + 22 + i * 38;
    g.fillStyle = '#6a3a1a'; g.font = '700 16px "Cinzel Decorative", serif'; g.textAlign = 'center'; g.fillText(['I', 'II', 'III', 'IV'][i], 618, y + 6);
    b.guess.forEach((k, j) => A.emblem(g, k, 652 + j * 34, y, 28));
    const seals = [...new Array(b.gold).fill('gold'), ...new Array(b.silver).fill('silver'), ...new Array(l.slots - b.gold - b.silver).fill('none')] as ('gold' | 'silver' | 'none')[];
    seals.forEach((kind, j) => g.drawImage(A.seal(kind, 26, 1), 790 + j * 25, y - 13));
  });
  [0, 6, 7].forEach((k, i) => { const j = A.jar(k, 88, 1); g.drawImage(j, 540 + i * 100, 440 - j.height + 6); });
  glowAt(g, 900, 330, 150, '#e05a8a', 0.55);
  const f = A.flask(150, 1, '#e8508a', 0.7); g.drawImage(f, 900 - f.width / 2, 330 - f.height / 2); bubbles(g, 900, 262, 170);
  const shade = g.createLinearGradient(0, 0, 590, 0); shade.addColorStop(0, 'rgba(18,10,8,0.94)'); shade.addColorStop(0.8, 'rgba(18,10,8,0.65)'); shade.addColorStop(1, 'rgba(18,10,8,0)'); g.fillStyle = shade; g.fillRect(0, 0, 590, H);
  g.textAlign = 'left';
  g.font = '600 22px Sora, sans-serif'; g.fillStyle = '#c9a8ff'; try { g.letterSpacing = '13px'; } catch { /* */ } g.fillText('LILAC', 48, 104); try { g.letterSpacing = '0px'; } catch { /* */ }
  g.fillStyle = '#fbf3e2'; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 16; g.font = '900 60px "Cinzel Decorative", serif'; g.fillText('Apothecary', 44, 170); g.shadowBlur = 0;
  g.fillStyle = '#f0c060'; g.font = '700 26px "Cinzel Decorative", serif'; g.fillText('Deduce the one true recipe.', 48, 216);
  g.drawImage(A.seal('gold', 22, 1), 48, 232); g.drawImage(A.seal('silver', 22, 1), 72, 232); g.drawImage(A.seal('none', 22, 1), 96, 232);
  g.fillStyle = 'rgba(251,243,226,0.9)'; g.font = '500 18px Sora, sans-serif';
  g.fillText('Read the ledger of earlier brews and their', 50, 290);
  g.fillText('gold and silver seals. Only one recipe fits', 50, 316);
  g.fillText('them all. 24 potions of pure logic.', 50, 342);
  return c;
}
(window as unknown as { brand: unknown }).brand = { icon, adaptive, adaptiveBg, splash, feature };
