import Phaser from 'phaser';
import * as A from './art';
import { LEVELS, type Level } from './levels';
import { conflict, starsFor } from './sim';
import { sound } from '../audio/sound';

export type Result = { wrong: number; hints: number; stars: number; hinted: boolean };
export type Finish = { level: Level; result: Result };
type Hooks = { onFinish?: (f: Finish) => void; onFirstAction?: () => void; onHaptic?: (s: 'light' | 'medium' | 'success' | 'warning') => void };
export type HudState = { phase: 'play' | 'done'; filled: number; slots: number; wrong: number; canUndo: boolean; hints: number; msg: string; msgId: number };

/** Bridge between React and the Phaser scene. */
export const shop = {
  hooks: {} as Hooks,
  scene: null as ShopScene | null,
  reducedMotion: false,
  show(mode: 'menu' | 'play', level: Level) { this.scene?.show(mode, level); },
  setPaused(p: boolean) { this.scene?.setPaused(p); },
  state(): HudState | null { return this.scene?.hudState() ?? null; },
  brew() { this.scene?.brew(); },
  undo() { this.scene?.undo(); },
  hint() { this.scene?.hint(); },
  restart() { this.scene?.clearAll(); },
  debug() { return this.scene?.debugState(); },
  /** QA only: CSS centres of a jar and a dish, and the answer. */
  qaJar(k: number) { return this.scene?.qaJar(k); },
  qaDish(i: number) { return this.scene?.qaDish(i); },
  solvePath(): number[] | null { return this.scene?.level.answer.slice() ?? null; },
};
(window as unknown as { __shop: typeof shop }).__shop = shop;

const VIEW_W = 360;
const SHOWCASE = ['b4', 'c3', 'a6'];
const HOLD_MS = 450;
type Pos = { x: number; y: number };

export class ShopScene extends Phaser.Scene {
  level: Level = LEVELS[0];
  private mode: 'menu' | 'play' = 'menu';
  private phase: 'play' | 'done' = 'play';
  private paused = false;
  private acted = false;
  private texSeq = 0;
  private r = 2;
  private viewW = VIEW_W; private viewH = 700;
  private slots: number[] = []; private locked: boolean[] = []; private sel = 0; private struck = new Set<number>();
  private history: { slots: number[]; sel: number }[] = [];
  private wrong = 0; private hints = 0;
  private dishPos: Pos[] = []; private jarPos: Pos[] = []; private lineY: number[] = [];
  private dishSize = 56; private jarSize = 60; private lh = 30; private page: [number, number, number, number] = [0, 0, 0, 0];
  private dishItems: (Phaser.GameObjects.Image | null)[] = []; private jarImgs: Phaser.GameObjects.Image[] = [];
  private emblemTex: string[] = [];
  private fx!: Phaser.GameObjects.Graphics;
  private press: { k: number; t: number; held: boolean } | null = null;
  private msg = ''; private msgId = 0;
  private clock = 0; private flashLine = -1; private flashT = -9; private hintSlot = -1; private hintT = -9;
  private bubbles: { x: number; y: number; vy: number; t: number; col: number }[] = [];
  private demo: number[] = []; private demoWait = 0;
  private gen = 0;

  constructor() { super('shop'); }

  create() {
    shop.scene = this;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.pDown(p));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.pUp(p));
    this.input.on('pointerupoutside', () => { this.press = null; });
    this.scale.on('resize', () => this.rebuild());
    this.show('menu', LEVELS.find((l) => l.id === SHOWCASE[0])!);
  }
  isMenu() { return this.mode === 'menu'; }
  setPaused(p: boolean) { this.paused = p; if (p) this.press = null; }
  hudState(): HudState { return { phase: this.phase, filled: this.slots.filter((x) => x >= 0).length, slots: this.level.slots, wrong: this.wrong, canUndo: this.history.length > 0 && this.phase === 'play', hints: this.hints, msg: this.msg, msgId: this.msgId }; }
  debugState() { return { ...this.hudState(), mode: this.mode, recipe: this.slots.slice(), sel: this.sel, struck: [...this.struck] }; }
  private css() { const z = this.cameras.main.zoom, kk = (this.game.canvas.clientWidth || VIEW_W) / this.scale.width; return z * kk; }
  qaJar(k: number) { const p = this.jarPos[k], s = this.css(); return { x: p.x * s, y: p.y * s }; }
  qaDish(i: number) { const p = this.dishPos[i], s = this.css(); return { x: p.x * s, y: p.y * s }; }
  private say(m: string) { this.msg = m; this.msgId++; }
  private later(ms: number, fn: () => void) { const g = this.gen; this.time.delayedCall(ms, () => { if (g === this.gen) fn(); }); }
  private first() { if (!this.acted) { this.acted = true; shop.hooks.onFirstAction?.(); } }

  show(mode: 'menu' | 'play', level: Level) {
    this.mode = mode; this.level = level; this.gen++;
    this.slots = new Array(level.slots).fill(-1); this.locked = new Array(level.slots).fill(false); this.sel = 0; this.struck = new Set();
    this.paused = false; this.acted = false; this.phase = 'play'; this.history = []; this.wrong = 0; this.hints = 0; this.msg = ''; this.flashLine = -1; this.hintSlot = -1; this.press = null; this.bubbles = [];
    this.demo = mode === 'menu' ? level.answer.slice() : []; this.demoWait = 1.2;
    this.rebuild();
  }

  // ── layout ────────────────────────────────────────────────────────────
  private addTex(prefix: string, c: HTMLCanvasElement) { const key = `${prefix}-${++this.texSeq}`; this.textures.addCanvas(key, c); return key; }
  private rebuild() {
    const stale = this.textures.getTextureKeys().filter((k) => /-\d+$/.test(k));
    this.tweens.killAll();
    this.children.removeAll(true);
    if (stale.length) this.events.once('postrender', () => stale.forEach((k) => this.textures.exists(k) && this.textures.remove(k)));
    const pw = this.scale.width, ph = this.scale.height, dpr = Math.min(2, window.devicePixelRatio || 1);
    const zoom = Math.min(pw / VIEW_W, ph / 640);
    this.r = Math.min(2, Math.max(1, zoom));
    this.viewW = pw / zoom; this.viewH = ph / zoom;
    this.cameras.main.setZoom(zoom).centerOn(this.viewW / 2, this.viewH / 2);
    const css = zoom / dpr, play = this.mode === 'play', W = this.viewW, H = this.viewH, l = this.level, m = A.MOODS[l.chapter], r = this.r;
    const top = (play ? 84 : 236) / css, bottom = (play ? 108 : 196) / css, availH = H - top - bottom;
    const n = l.ledger.length, rows = Math.ceil(l.kinds / 4), perRow = Math.ceil(l.kinds / rows);
    // natural sizes, then scale everything down together to fit
    let lh = 34, dish = 60, jar = 64, gap = 14;
    const need = () => (play ? n * lh + 26 + gap : 0) + dish + 12 + gap + rows * (jar * 1.25 + 14);
    const s = Math.min(1, availH / need()); lh *= s; dish *= s; jar = Math.min(jar * s, (W - 24) / perRow / 1.12); gap *= s;
    this.lh = lh; this.dishSize = dish; this.jarSize = jar;
    let y = top + Math.max(0, (availH - need()) / 2);
    const pageW = Math.min(W - 20, 340);
    this.page = [(W - pageW) / 2, y, pageW, n * lh + 26];
    this.lineY = l.ledger.map((_, i) => y + 13 + (i + 0.5) * lh);
    if (play) y += n * lh + 26 + gap;
    this.dishPos = l.answer.map((_, i) => ({ x: W / 2 + (i - (l.slots - 1) / 2) * dish * 1.12, y: y + dish / 2 }));
    y += dish + 12 + gap;
    const shelfY: number[] = [];
    this.jarPos = [];
    for (let k = 0; k < l.kinds; k++) { const row = Math.floor(k / perRow), inRow = Math.min(perRow, l.kinds - row * perRow), i = k - row * perRow; this.jarPos.push({ x: W / 2 + (i - (inRow - 1) / 2) * jar * 1.12, y: y + row * (jar * 1.25 + 14) + jar * 0.62 }); }
    for (let row = 0; row < rows; row++) shelfY.push(y + row * (jar * 1.25 + 14) + jar * 1.22);
    this.add.image(0, 0, this.addTex('sh', A.shop(m, W, H, Math.min(r, 1.5), play ? this.page : null, shelfY))).setOrigin(0, 0).setScale(1 / Math.min(r, 1.5));
    // the ledger
    if (play) {
      const es = lh * 0.78, ss = lh * 0.62, nTex = new Array(l.kinds).fill(0).map((_, k) => { const c = A.canvas(es * r, es * r); A.emblem(c.g, k, (es * r) / 2, (es * r) / 2, es * r * 0.92); return this.addTex('le', c.c); });
      const sTex = { gold: this.addTex('sg', A.seal('gold', ss, r)), silver: this.addTex('ss', A.seal('silver', ss, r)), none: this.addTex('sn', A.seal('none', ss, r)) };
      const [px, , pwid] = this.page;
      l.ledger.forEach((b, i) => {
        const yy = this.lineY[i];
        this.add.text(px + 16, yy, ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][i], { fontFamily: '"Cinzel Decorative", serif', fontStyle: '700', fontSize: `${Math.round(lh * 0.42 * r)}px`, color: '#6a3a1a' }).setOrigin(0.5).setScale(1 / r).setDepth(3);
        b.guess.forEach((k, j) => this.add.image(px + 40 + (j + 0.5) * es * 1.06, yy, nTex[k]).setScale(1 / r).setDepth(3));
        const seals = [...new Array(b.gold).fill('gold'), ...new Array(b.silver).fill('silver'), ...new Array(l.slots - b.gold - b.silver).fill('none')] as ('gold' | 'silver' | 'none')[];
        seals.forEach((kind, j) => this.add.image(px + pwid - 12 - (l.slots - j - 0.5) * ss * 0.95, yy, sTex[kind]).setScale(1 / r).setDepth(3));
        if (i < l.ledger.length - 1) { const gl = this.add.graphics().setDepth(2); gl.lineStyle(1, 0x8a6a3a, 0.25); gl.lineBetween(px + 30, yy + lh / 2, px + pwid - 10, yy + lh / 2); }
      });
    }
    // dishes and what's in them
    const dTex = this.addTex('ds', A.dish(dish, r));
    this.dishPos.forEach((p) => this.add.image(p.x, p.y, dTex).setScale(1 / r).setDepth(3));
    this.emblemTex = new Array(l.kinds).fill(0).map((_, k) => { const sz = dish * 0.72, c = A.canvas(sz * r, sz * r); A.emblem(c.g, k, (sz * r) / 2, (sz * r) / 2, sz * r * 0.9); return this.addTex('de', c.c); });
    this.dishItems = this.slots.map((k, i) => (k >= 0 ? this.add.image(this.dishPos[i].x, this.dishPos[i].y, this.emblemTex[k]).setScale(1 / r).setDepth(4) : null));
    this.jarImgs = this.jarPos.map((p, k) => this.add.image(p.x, p.y, this.addTex('jr', A.jar(k, jar, r))).setScale(1 / r).setDepth(4).setAlpha(this.struck.has(k) ? 0.4 : 1));
    if (!this.textures.exists('glow')) this.textures.addCanvas('glow', A.glow(128));
    this.fx = this.add.graphics().setDepth(9);
  }

  // ── input ─────────────────────────────────────────────────────────────
  private hit(x: number, y: number) {
    for (let i = 0; i < this.dishPos.length; i++) { const p = this.dishPos[i]; if (Math.hypot(p.x - x, p.y - y) < this.dishSize * 0.55) return { dish: i, jar: -1 }; }
    for (let k = 0; k < this.jarPos.length; k++) { const p = this.jarPos[k]; if (Math.abs(p.x - x) < this.jarSize * 0.55 && Math.abs(p.y - y) < this.jarSize * 0.68) return { dish: -1, jar: k }; }
    return null;
  }
  private pDown(p: Phaser.Input.Pointer) {
    if (this.mode !== 'play' || this.paused || this.phase !== 'play') return;
    const w = this.cameras.main.getWorldPoint(p.x, p.y), h = this.hit(w.x, w.y); if (!h) return;
    this.first();
    if (h.dish >= 0) { this.tapDish(h.dish); return; }
    this.press = { k: h.jar, t: performance.now(), held: false };
  }
  private pUp(_p: Phaser.Input.Pointer) { const pr = this.press; this.press = null; if (!pr || pr.held) return; this.put(pr.k); }
  private snapshot() { this.history.push({ slots: this.slots.slice(), sel: this.sel }); }
  private tapDish(i: number) {
    if (this.locked[i]) { sound.tap(); this.say('The hint fixed this one.'); return; }
    if (this.sel === i && this.slots[i] >= 0) { this.snapshot(); this.setSlot(i, -1); sound.clear(); return; }
    this.sel = i; sound.tap();
  }
  /** Put an ingredient in the chosen dish, then move on to the next empty one. */
  private put(k: number) {
    if (this.locked[this.sel]) { const free = this.slots.findIndex((x, i) => x < 0 && !this.locked[i]); if (free < 0) return; this.sel = free; }
    this.snapshot();
    if (!this.level.repeats) { const at = this.slots.indexOf(k); if (at >= 0 && at !== this.sel && !this.locked[at]) this.setSlot(at, -1); }
    this.setSlot(this.sel, k);
    sound.clink(); this.later(90, () => sound.drop(this.sel)); shop.hooks.onHaptic?.('light');
    if (this.struck.has(k)) this.say(`You struck out ${A.INGREDIENTS[k].name} earlier.`);
    const nxt = [...Array(this.level.slots).keys()].map((d) => (this.sel + 1 + d) % this.level.slots).find((i) => this.slots[i] < 0 && !this.locked[i]);
    if (nxt !== undefined) this.sel = nxt;
  }
  private setSlot(i: number, k: number) {
    this.slots[i] = k; this.dishItems[i]?.destroy(); this.dishItems[i] = null;
    if (k >= 0) {
      const p = this.dishPos[i], im = this.add.image(p.x, p.y, this.emblemTex[k]).setScale(1 / this.r).setDepth(4);
      this.dishItems[i] = im;
      if (!shop.reducedMotion) { const from = this.jarPos[k]; im.setPosition(from.x, from.y).setScale(0.6 / this.r); this.tweens.add({ targets: im, x: p.x, y: p.y, scale: 1 / this.r, duration: 220, ease: 'Cubic.easeOut' }); }
    }
  }
  private toggleStrike(k: number) { if (this.struck.has(k)) this.struck.delete(k); else this.struck.add(k); this.jarImgs[k]?.setAlpha(this.struck.has(k) ? 0.4 : 1); sound.strike(); shop.hooks.onHaptic?.('medium'); }
  undo() {
    if (this.mode !== 'play' || this.phase !== 'play' || !this.history.length) return;
    const h = this.history.pop()!; this.sel = h.sel; h.slots.forEach((k, i) => { if (this.slots[i] !== k) { const rm = shop.reducedMotion; shop.reducedMotion = true; this.setSlot(i, k); shop.reducedMotion = rm; } }); sound.undo();
  }
  clearAll() {
    if (this.mode !== 'play' || this.phase !== 'play' || !this.slots.some((x, i) => x >= 0 && !this.locked[i])) return;
    this.snapshot(); this.slots.forEach((_, i) => { if (!this.locked[i]) this.setSlot(i, -1); }); this.sel = this.slots.findIndex((_, i) => !this.locked[i]); sound.clear();
  }
  /** Brew the recipe in the dishes. */
  brew() {
    if (this.mode !== 'play' || this.phase !== 'play') return;
    this.first();
    if (this.slots.some((x) => x < 0)) { this.say('Every dish needs an ingredient first.'); sound.tap(); return; }
    if (this.slots.every((x, i) => x === this.level.answer[i])) { this.win(); return; }
    this.wrong++;
    const c = conflict(this.level, this.slots);
    sound.fizzle(); shop.hooks.onHaptic?.('warning');
    if (!shop.reducedMotion) this.dishItems.forEach((im) => im && this.tweens.add({ targets: im, x: im.x + 4, duration: 50, yoyo: true, repeat: 3 }));
    this.smoke();
    if (c) {
      this.flashLine = c.line; this.flashT = this.clock;
      const want = this.level.ledger[c.line], roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][c.line];
      const sealsTxt = (g: number, s: number) => `${g} gold${s ? ` and ${s} silver` : ''}`;
      this.say(`It fizzles. Line ${roman} shows ${sealsTxt(want.gold, want.silver)}, but this recipe would earn ${sealsTxt(c.gold, c.silver)}.`);
    } else this.say('It fizzles. Every line agrees with this recipe, yet it isn’t the one.');
  }
  private smoke() { if (shop.reducedMotion) return; this.dishPos.forEach((p) => { for (let k = 0; k < 4; k++) this.bubbles.push({ x: p.x + (Math.random() - 0.5) * this.dishSize * 0.5, y: p.y, vy: -this.dishSize * (0.5 + Math.random()), t: 0, col: 0x8a8070 }); }); }
  /** A hint fills one dish with the right ingredient and fixes it there. */
  hint() {
    if (this.mode !== 'play' || this.phase !== 'play') return;
    this.first();
    const order = [...Array(this.level.slots).keys()].sort((a, b) => (this.slots[a] < 0 ? 0 : 1) - (this.slots[b] < 0 ? 0 : 1));
    const i = order.find((j) => this.slots[j] !== this.level.answer[j] && !this.locked[j]) ?? order.find((j) => !this.locked[j]);
    if (i === undefined) return;
    this.snapshot(); this.hints++;
    const k = this.level.answer[i];
    if (!this.level.repeats) { const at = this.slots.indexOf(k); if (at >= 0 && at !== i && !this.locked[at]) this.setSlot(at, -1); }
    this.setSlot(i, k); this.locked[i] = true; this.hintSlot = i; this.hintT = this.clock;
    sound.hint(); this.say(`${A.INGREDIENTS[k].name} belongs in this dish. It’s fixed there now.`);
    const nxt = this.slots.findIndex((x, j) => x < 0 && !this.locked[j]); if (nxt >= 0) this.sel = nxt;
  }
  /** The ingredients pour into a flask that fills and bubbles. */
  private win() {
    this.phase = 'done'; this.flashLine = -1;
    if (this.mode === 'play') sound.whole(); shop.hooks.onHaptic?.('success');
    const POTIONS = ['#e8508a', '#5ac860', '#7a8aff', '#ffb03a', '#3ad0c8', '#c86aff', '#ff6a4a'], potion = POTIONS[this.slots.reduce((a, k, i) => a + k * (i + 3), this.level.chapter) % POTIONS.length];
    const cx = this.viewW / 2, cy = this.dishPos[0].y, fs = this.dishSize * 1.5;
    const rm = shop.reducedMotion;
    this.dishItems.forEach((im, i) => { if (!im) return; this.tweens.add({ targets: im, x: cx, y: cy - fs * 0.2, scale: 0.3 / this.r, alpha: 0, duration: rm ? 0 : 420, delay: rm ? 0 : i * 110, ease: 'Cubic.easeIn' }); });
    const steps = 6, keys = new Array(steps + 1).fill(0).map((_, s) => this.addTex('fl', A.flask(fs, this.r, potion, 0.1 + (s / steps) * 0.75)));
    const fl = this.add.image(cx, cy - fs * 0.05, keys[0]).setScale(1 / this.r).setDepth(8).setAlpha(0);
    this.tweens.add({ targets: fl, alpha: 1, duration: rm ? 0 : 300 });
    keys.forEach((key, s) => this.later(rm ? 0 : 450 + s * 120, () => fl.setTexture(key)));
    const glow = this.add.image(cx, cy, 'glow').setTint(A.toInt(potion)).setBlendMode(Phaser.BlendModes.ADD).setDepth(7).setAlpha(0).setScale(fs * 2.2 / 128);
    this.tweens.add({ targets: glow, alpha: 0.55, duration: rm ? 0 : 900, delay: rm ? 0 : 900 });
    if (!rm) this.later(900, () => { for (let k = 0; k < 40; k++) this.later(k * 40, () => this.bubbles.push({ x: cx + (Math.random() - 0.5) * fs * 0.3, y: cy + fs * 0.1, vy: -fs * (0.6 + Math.random() * 0.6), t: 0, col: A.toInt(A.mix(potion, '#ffffff', 0.5)) })); });
    const st = starsFor(this.wrong, this.hints);
    if (this.mode === 'play') this.later(2600, () => shop.hooks.onFinish?.({ level: this.level, result: { wrong: this.wrong, hints: this.hints, stars: st, hinted: this.hints > 0 } }));
    else this.later(3600, () => { const i = (SHOWCASE.indexOf(this.level.id) + 1) % SHOWCASE.length; this.show('menu', LEVELS.find((x) => x.id === SHOWCASE[i])!); });
  }

  update(_t: number, dms: number) {
    const dt = Math.min(0.05, dms / 1000);
    if (this.paused) return;
    this.clock += dt;
    if (this.press && !this.press.held && performance.now() - this.press.t > HOLD_MS) { this.press.held = true; this.toggleStrike(this.press.k); }
    if (this.mode === 'menu' && this.phase === 'play') { this.demoWait -= dt; if (this.demoWait <= 0) { if (this.demo.length) { const i = this.level.slots - this.demo.length; this.sel = i; const k = this.demo.shift()!; this.setSlot(i, k); this.demoWait = 0.5; } else this.win(); } }
    const fx = this.fx; fx.clear();
    const d = this.dishSize;
    // the chosen dish
    if (this.phase === 'play' && this.mode === 'play') { const p = this.dishPos[this.sel]; if (p) { const a = shop.reducedMotion ? 0.9 : 0.6 + 0.3 * Math.sin(this.clock * 4); fx.lineStyle(3, 0xfff0b0, a); fx.strokeCircle(p.x, p.y, d * 0.5); } }
    this.locked.forEach((on, i) => { if (!on) return; const p = this.dishPos[i]; fx.lineStyle(2, 0xffd25a, 0.85); fx.strokeCircle(p.x, p.y, d * 0.46); });
    // struck jars: a quill cross
    this.struck.forEach((k) => { const p = this.jarPos[k], s = this.jarSize * 0.3; fx.lineStyle(3, 0x6a2a1a, 0.85); fx.lineBetween(p.x - s, p.y - s * 0.6, p.x + s, p.y + s * 1.2); fx.lineBetween(p.x + s, p.y - s * 0.6, p.x - s, p.y + s * 1.2); });
    if (this.press && !this.press.held) { const p = this.jarPos[this.press.k], f = Math.min(1, (performance.now() - this.press.t) / HOLD_MS); if (f > 0.25) { fx.lineStyle(3, 0xfff0b0, 0.8); fx.beginPath(); fx.arc(p.x, p.y, this.jarSize * 0.58, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); fx.strokePath(); } }
    if (this.flashLine >= 0 && this.clock - this.flashT < 3.5) { const e = this.clock - this.flashT, a = shop.reducedMotion ? 0.5 : Math.max(0, 1 - e / 3.5) * (0.5 + 0.5 * Math.sin(e * 8)); fx.fillStyle(0xd84a2a, 0.22 * a); fx.fillRoundedRect(this.page[0] + 4, this.lineY[this.flashLine] - this.lh / 2, this.page[2] - 8, this.lh, 4); }
    if (this.hintSlot >= 0 && this.clock - this.hintT < 3) { const p = this.dishPos[this.hintSlot], e = this.clock - this.hintT; fx.lineStyle(3, 0xffe08a, Math.max(0, 1 - e / 3)); fx.strokeCircle(p.x, p.y, d * (0.55 + 0.05 * Math.sin(e * 6))); }
    this.bubbles = this.bubbles.filter((b) => (b.t += dt) < 1.1);
    for (const b of this.bubbles) { b.y += b.vy * dt; b.x += Math.sin(b.t * 9 + b.y) * 0.4; const a = 1 - b.t / 1.1; fx.lineStyle(1.5, b.col, a * 0.8); fx.strokeCircle(b.x, b.y, d * (0.04 + b.t * 0.06)); }
  }
}

export function startGame(parent: HTMLElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#1a1210',
    scale: { mode: Phaser.Scale.NONE, width: parent.clientWidth * dpr, height: parent.clientHeight * dpr, zoom: 1 / dpr },
    render: { antialias: true, pixelArt: false, powerPreference: 'high-performance' },
    audio: { noAudio: true },
    fps: { target: 60, smoothStep: false },
    input: { activePointers: 1 },
    scene: [ShopScene],
    banner: false,
  });
  const onResize = () => {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    game.scale.setZoom(1 / d);
    game.scale.resize(parent.clientWidth * d, parent.clientHeight * d);
  };
  window.addEventListener('resize', onResize);
  return () => { window.removeEventListener('resize', onResize); game.destroy(true); };
}
