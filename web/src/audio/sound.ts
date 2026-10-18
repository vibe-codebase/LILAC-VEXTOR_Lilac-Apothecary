/**
 * Apothecary sound, synthesised with Web Audio: a harp drifting through a modal tune over a low cello drone, a
 * clock ticking on the wall; glass jars clinking, ingredients dropped into brass, the scratch of a quill, a
 * fizzle and a sour note when a brew fails, and bubbling and a harp glissando when the potion comes out right.
 */
const SCALE = [0, 2, 3, 5, 7, 9, 10]; // dorian
export function noteHz(degree: number) { const o = Math.floor(degree / 7), s = SCALE[((degree % 7) + 7) % 7] + o * 12; return 196 * Math.pow(2, s / 12); }

export class Sound {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private music!: GainNode;
  private sfx!: GainNode;
  private verb!: ConvolverNode;
  private noise!: AudioBuffer;
  private timer: number | null = null;
  private next = 0;
  private beatN = 0;
  private chapter = 0;
  private musicVol = 0.6;
  private sfxVol = 0.8;
  private ducked = false;
  private harps = new Map<number, AudioBuffer>();

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      this.ctx = ctx;
      this.master = ctx.createGain(); this.master.gain.value = 0.9;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
      this.master.connect(comp).connect(ctx.destination);
      this.music = ctx.createGain(); this.sfx = ctx.createGain();
      this.verb = ctx.createConvolver(); this.verb.buffer = this.impulse(2.2);
      const wet = ctx.createGain(); wet.gain.value = 0.3;
      this.verb.connect(wet).connect(this.master);
      this.music.connect(this.master); this.music.connect(this.verb);
      this.sfx.connect(this.master); this.sfx.connect(this.verb);
      this.noise = this.makeNoise();
      this.applyVolumes();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }
  setVolumes(music: number, sfx: number) { this.musicVol = music; this.sfxVol = sfx; this.applyVolumes(); }
  private applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.music.gain.setTargetAtTime(this.musicVol * 0.6 * (this.ducked ? 0.6 : 1), t, 0.3);
    this.sfx.gain.setTargetAtTime(this.sfxVol, t, 0.05);
  }
  duck(on: boolean) { this.ducked = on; this.applyVolumes(); }
  suspend() { void this.ctx?.suspend(); }
  resume() { if (this.ctx?.state === 'suspended') void this.ctx.resume(); }

  startMusic(chapter: number) {
    if (!this.ctx) return;
    if (this.timer !== null && chapter === this.chapter) return;
    this.chapter = chapter;
    this.next = this.ctx.currentTime + 0.4;
    if (this.timer === null) this.timer = window.setInterval(() => this.schedule(), 150);
  }
  /** Harp arpeggios in 3/4 over a drone; a clock ticks every beat. */
  private schedule() {
    const ctx = this.ctx!;
    const roots = [[0, 3, 4, 0], [0, 6, 5, 4], [3, 0, 4, 0]][this.chapter % 3];
    const tunes = [[7, 9, 10, 9, 7, 4], [9, 7, 4, 3, 4, 7], [11, 10, 9, 7, 9, 4], [4, 3, 2, 0, 2, 4]];
    const beat = 0.34;
    while (this.next < ctx.currentTime + 0.8) {
      const t = this.next, bar = Math.floor(this.beatN / 6), pos = this.beatN % 6, root = roots[bar % 4];
      if (pos === 0) this.drone(t, noteHz(root - 14), beat * 6);
      this.harp(t, noteHz(root + [0, 2, 4, 7, 4, 2][pos]), 0.03, this.music);
      if (bar % 2 === 1 && pos % 2 === 0) this.harp(t + 0.01, noteHz(tunes[(bar >> 1) % 4][pos] + 7), 0.04, this.music);
      if (pos % 2 === 0) this.tick(t, pos % 4 === 0);
      this.next += beat; this.beatN++;
    }
  }
  /** Harp: Karplus–Strong with a bright attack, prerendered per pitch. */
  private harp(t: number, f: number, vol: number, bus: GainNode) {
    const ctx = this.ctx!, key = Math.round(f);
    let buf = this.harps.get(key);
    if (!buf) {
      const sr = ctx.sampleRate, len = Math.floor(sr * 2.5), N = Math.max(2, Math.round(sr / f)), d = new Float32Array(len), ring = new Float32Array(N);
      for (let i = 0; i < N; i++) ring[i] = (Math.random() * 2 - 1) * (1 - i / N * 0.5);
      let p = 0; for (let i = 0; i < len; i++) { const a = ring[p], b = ring[(p + 1) % N]; d[i] = a; ring[p] = (a + b) * 0.4985; p = (p + 1) % N; }
      buf = ctx.createBuffer(1, len, sr); buf.copyToChannel(d, 0); this.harps.set(key, buf);
    }
    const src = ctx.createBufferSource(); src.buffer = buf; const g = ctx.createGain(); g.gain.value = vol; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200;
    src.connect(lp).connect(g).connect(bus); src.start(t);
  }
  private drone(t: number, f: number, dur: number) {
    const ctx = this.ctx!, o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(), v = ctx.createOscillator(), vg = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = f; v.frequency.value = 4.5; vg.gain.value = f * 0.004; v.connect(vg).connect(o.frequency); lp.type = 'lowpass'; lp.frequency.value = 520;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.018, t + 0.5); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(lp).connect(g).connect(this.music); o.start(t); v.start(t); o.stop(t + dur + 0.05); v.stop(t + dur + 0.05);
  }
  private tick(t: number, tock: boolean) { this.hiss(t, 0.012, 0.012, tock ? 1800 : 2600, 4, this.music); }
  private hiss(t: number, dur: number, vol: number, freq: number, q = 1, bus?: GainNode, sweep?: number, type: BiquadFilterType = 'bandpass') {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource(); src.buffer = this.noise;
    const bp = ctx.createBiquadFilter(); bp.type = type; bp.Q.value = q; bp.frequency.setValueAtTime(freq, t); if (sweep) bp.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.006, dur * 0.3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(bus ?? this.sfx); src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }
  private ping(t: number, f: number, vol: number, dur: number) { const ctx = this.ctx!, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(this.sfx); o.start(t); o.stop(t + dur + 0.02); }
  /** A jar lifted: a glass clink. */
  clink() { if (!this.ctx) return; const t = this.ctx.currentTime; this.ping(t, 2800 + Math.random() * 300, 0.04, 0.3); this.ping(t, 4300, 0.015, 0.2); }
  /** An ingredient dropped into its brass dish, with a note for the slot. */
  drop(slot: number) { if (!this.ctx) return; const t = this.ctx.currentTime; this.hiss(t, 0.05, 0.05, 1400, 1.5); this.ping(t + 0.01, 900 + slot * 120, 0.03, 0.4); this.harp(t + 0.02, noteHz(7 + slot * 2), 0.04, this.sfx); }
  /** Striking out a jar: a quill scratch. */
  strike() { if (this.ctx) { const t = this.ctx.currentTime; this.hiss(t, 0.12, 0.04, 4500, 1, undefined, 2500); } }
  clear() { if (this.ctx) this.hiss(this.ctx.currentTime, 0.2, 0.03, 1200, 1, undefined, 3000); }
  /** A wrong brew: it fizzles and smokes. */
  fizzle() { if (!this.ctx) return; const t = this.ctx.currentTime; this.hiss(t, 0.5, 0.06, 2000, 0.8, undefined, 300); this.harp(t + 0.05, noteHz(1) * 0.94, 0.05, this.sfx); this.harp(t + 0.2, noteHz(-1) * 0.94, 0.05, this.sfx); }
  tap() { if (this.ctx) this.hiss(this.ctx.currentTime, 0.04, 0.03, 2600, 2); }
  undo() { this.clear(); }
  hint() { if (this.ctx) { const t = this.ctx.currentTime; this.harp(t, noteHz(11), 0.06, this.sfx); this.harp(t + 0.12, noteHz(14), 0.06, this.sfx); } }
  /** The potion is right: bubbling, sparkle and a harp glissando. */
  whole() {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    for (let k = 0; k < 26; k++) { const at = t + Math.random() * 1.6; this.ping(at, 300 + Math.random() * 500, 0.02, 0.06); }
    for (let k = 0; k < 15; k++) this.harp(t + 0.4 + k * 0.05, noteHz(k + 2), 0.045, this.sfx);
    for (let k = 0; k < 10; k++) this.ping(t + 1.1 + k * 0.06, 2600 + k * 220, 0.015, 0.3);
  }
  star(i: number) { if (this.ctx) this.harp(this.ctx.currentTime, noteHz([9, 11, 14][i] ?? 14), 0.08, this.sfx); }

  private makeNoise() {
    const ctx = this.ctx!;
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  private impulse(seconds: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5); }
    return b;
  }
}
export const sound = new Sound();
