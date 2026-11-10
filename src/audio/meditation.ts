// The Sanctuary's sound (docs/design/built/presences/MEDITATION-APP.md §7), synthesised with Web Audio: no
// audio files. Each meditation's music is generative: a drone, a pad chord that changes with each part, sparse
// bell notes from its scale and, where it has one, a texture of filtered noise. The pad opens on an in-breath
// and closes on an out-breath. Every sound swells in: nothing clicks, nothing peaks. The app has its own
// volume, apart from the game's, so its mute never touches the world's sound.

import { fx } from '../core/fx';
import { audioContext, unlockAudio } from './sfx';
import type { BreathKind, Sequence } from '../content/presences/meditations';

const LEVEL = 0.62;
const semi = (root: number, n: number) => root * 2 ** (n / 12);
/** The shared ending's chord, on D: the same for every meditation. */
const END_ROOT = 146.83;
const END_CHORD = [0, 7, 12, 16, 19];

interface Voice { osc: OscillatorNode; gain: GainNode; level: number }

export class MeditationAudio {
  private ctx: AudioContext | null = null;
  private bus: GainNode | null = null;
  private send: GainNode | null = null;
  private group: GainNode | null = null;
  private padFilter: BiquadFilterNode | null = null;
  private breathNoise: GainNode | null = null;
  private pad: Voice[] = [];
  private live: AudioScheduledSourceNode[] = [];
  private seq: Sequence | null = null;
  private bellIn = 0;
  private muted = false;

  /** Builds the app's bus on first use. Returns false while audio is still locked (no gesture yet). */
  private ready(): boolean {
    if (this.ctx && this.bus) return true;
    unlockAudio();
    const ctx = audioContext();
    if (!ctx) return false;
    this.ctx = ctx;
    const limit = ctx.createDynamicsCompressor();
    limit.threshold.value = -14; limit.ratio.value = 6; limit.attack.value = 0.02; limit.release.value = 0.4;
    limit.connect(ctx.destination);
    this.bus = ctx.createGain();
    this.bus.gain.value = this.muted ? 0 : LEVEL;
    this.bus.connect(limit);
    const room = ctx.createConvolver();
    room.buffer = this.impulse(ctx, 3.2);
    const wet = ctx.createGain();
    wet.gain.value = 0.5;
    this.send = ctx.createGain();
    this.send.gain.value = 1;
    this.send.connect(room).connect(wet).connect(this.bus);
    return true;
  }

  /** A soft room: three seconds of decaying noise, a little different in each ear. */
  private impulse(ctx: AudioContext, seconds: number): AudioBuffer {
    const len = Math.ceil(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (fx.random() * 2 - 1) * (1 - i / len) ** 3.2 * Math.min(1, i / 400);
    }
    return buf;
  }

  private noiseLoop(ctx: AudioContext): AudioBufferSourceNode {
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = last * 0.6 + (fx.random() * 2 - 1) * 0.4; d[i] = last; }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    return src;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.ctx && this.bus) this.bus.gain.setTargetAtTime(muted ? 0 : LEVEL, this.ctx.currentTime, 0.15);
  }

  /** One soft note: it swells in over `attack` seconds and rings out over `dur`. Dry and into the room. */
  private note(freq: number, dur: number, vol: number, type: OscillatorType, attack = 0.04, at = 0, glideTo = 0) {
    if (!this.ready()) return;
    const ctx = this.ctx!, t = ctx.currentTime + at;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur * 0.9);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.bus!);
    g.connect(this.send!);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private bell(freq: number, vol: number, type: OscillatorType, at = 0, dur = 5) {
    this.note(freq, dur, vol, type, 0.03, at);
    this.note(freq * 2.76, dur * 0.35, vol * 0.12, 'sine', 0.03, at);
  }

  /** The app's own small sounds: moving the selection, choosing, going back, a switch. */
  ui(kind: 'move' | 'pick' | 'back' | 'toggle' | 'open') {
    if (kind === 'move') this.note(660, 0.25, 0.018, 'sine', 0.02);
    else if (kind === 'pick') { this.note(587.33, 0.7, 0.03, 'sine', 0.03); this.note(880, 0.9, 0.022, 'sine', 0.03, 0.09); }
    else if (kind === 'back') this.note(440, 0.5, 0.024, 'sine', 0.03, 0, 330);
    else if (kind === 'toggle') this.note(740, 0.35, 0.022, 'triangle', 0.02);
    else { this.bell(293.66, 0.05, 'sine', 0, 6); this.bell(440, 0.04, 'sine', 0.5, 6); this.bell(587.33, 0.03, 'sine', 1.0, 7); }
  }

  /** A sitting begins: the meditation's drone, pad and texture rise over five seconds. */
  start(seq: Sequence) {
    this.stop();
    this.seq = seq;
    this.bellIn = 6;
    if (!this.ready()) return;
    const ctx = this.ctx!, t = ctx.currentTime, mu = seq.music;
    const group = this.group = ctx.createGain();
    group.gain.setValueAtTime(0.0001, t);
    group.gain.linearRampToValueAtTime(1, t + 5);
    group.connect(this.bus!);
    const toRoom = ctx.createGain();
    toRoom.gain.value = 0.5;
    group.connect(toRoom).connect(this.send!);
    const drone = ctx.createBiquadFilter();
    drone.type = 'lowpass'; drone.frequency.value = 420;
    drone.connect(group);
    for (const [f, v] of [[mu.root / 2, 0.06], [mu.root / 2 * 1.004, 0.05], [mu.root * 0.75, 0.018]] as const) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f; g.gain.value = v;
      o.connect(g).connect(drone);
      o.start(t);
      this.live.push(o);
    }
    const pf = this.padFilter = ctx.createBiquadFilter();
    pf.type = 'lowpass'; pf.frequency.value = 800; pf.Q.value = 0.4;
    pf.connect(group);
    this.pad = [];
    for (let i = 0; i < 4; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = mu.pad;
      o.detune.value = (i % 2 ? 1 : -1) * 4;
      g.gain.value = 0.0001;
      o.connect(g).connect(pf);
      o.start(t);
      this.live.push(o);
      this.pad.push({ osc: o, gain: g, level: mu.pad === 'sine' ? 0.034 : 0.022 });
    }
    this.texture(ctx, group, mu.texture);
    this.chord(0, 0);
    for (const [i, n] of seq.sounds.part.entries()) this.bell(semi(mu.root, n + 12), 0.045, mu.bell, 0.6 + i * 0.45, 6);
  }

  private lfo(ctx: AudioContext, hz: number, depth: number, to: AudioParam) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = hz; g.gain.value = depth;
    o.connect(g).connect(to);
    o.start();
    this.live.push(o);
  }

  private texture(ctx: AudioContext, group: GainNode, kind: Sequence['music']['texture']) {
    this.breathNoise = null;
    if (kind === 'none') return;
    const src = this.noiseLoop(ctx);
    const band = (type: BiquadFilterType, freq: number, q: number, level: number) => {
      const f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.value = level;
      src.connect(f).connect(g).connect(group);
      return g;
    };
    if (kind === 'earth') { band('lowpass', 150, 0.5, 0.5); this.lfo(ctx, 0.05, 0.03, band('bandpass', 320, 0.5, 0.07).gain); }
    else if (kind === 'wind') this.lfo(ctx, 0.07, 0.035, band('bandpass', 460, 0.7, 0.06).gain);
    else if (kind === 'air') this.lfo(ctx, 0.09, 0.008, band('highpass', 4500, 0.5, 0.014).gain);
    else if (kind === 'breath') this.breathNoise = band('bandpass', 700, 0.5, 0.0001);
    else {
      this.lfo(ctx, 0.23, 0.03, band('bandpass', 700, 0.8, 0.07).gain);
      this.lfo(ctx, 0.37, 0.012, band('bandpass', 1900, 1.2, 0.028).gain);
      band('lowpass', 260, 0.5, 0.12);
    }
    src.start();
    this.live.push(src);
  }

  /** The pad moves to a part's chord: each voice fades, changes note in silence and returns. */
  private chord(part: number, fadeS: number) {
    const ctx = this.ctx, seq = this.seq;
    if (!ctx || !seq) return;
    const t = ctx.currentTime, notes = seq.parts[part].chord;
    for (const [i, v] of this.pad.entries()) {
      const f = semi(seq.music.root, notes[i % notes.length] + (i >= notes.length ? 12 : 0));
      v.gain.gain.cancelScheduledValues(t);
      v.gain.gain.setTargetAtTime(0.0001, t, Math.max(0.01, fadeS / 3));
      v.osc.frequency.setValueAtTime(f, t + fadeS + i * 0.4);
      v.gain.gain.setTargetAtTime(v.level, t + fadeS + i * 0.4, 1.4);
    }
  }

  /** A new part begins: the pad changes chord and the meditation's own chime rings. */
  part(index: number) {
    const seq = this.seq;
    if (!seq || !this.ready()) return;
    if (index === 0) return;
    this.chord(index, 2.4);
    for (const [i, n] of seq.sounds.part.entries()) this.bell(semi(seq.music.root, n + 12), 0.045, seq.music.bell, i * 0.45, 6);
  }

  /** A new guidance line: a tick so soft it is only noticed with open ears. */
  line() {
    if (this.seq) this.note(semi(this.seq.music.root, 24), 0.9, 0.012, 'sine', 0.05);
  }

  /** A beat of the breath begins: its cue, and the pad opening or closing with it. */
  breath(kind: BreathKind, seconds: number) {
    const seq = this.seq;
    if (!seq || !this.ready() || kind === 'natural') return;
    const ctx = this.ctx!, t = ctx.currentTime, s = seq.sounds, root = seq.music.root;
    const pf = this.padFilter;
    if (kind === 'in' || kind === 'out') {
      const [a, b] = kind === 'in' ? s.in : s.out;
      this.note(semi(root, a), seconds * 0.95, 0.026, s.timbre, Math.min(1.2, seconds * 0.35), 0, a === b ? 0 : semi(root, b));
      if (pf) pf.frequency.setTargetAtTime(kind === 'in' ? 1500 : 650, t, seconds / 3);
      if (this.breathNoise && kind === 'out') {
        const g = this.breathNoise.gain;
        g.cancelScheduledValues(t);
        g.setTargetAtTime(0.06, t, seconds * 0.15);
        g.setTargetAtTime(0.0001, t + seconds * 0.45, seconds * 0.2);
      }
    } else if (s.hold !== null) this.note(semi(root, s.hold + (kind === 'empty' ? -12 : 0)), 1.6, 0.014, s.timbre, 0.2);
  }

  /** Runs the bells: called every frame with the seconds that passed while the sitting ran. */
  tick(dt: number) {
    const seq = this.seq;
    if (!seq || !this.ctx) return;
    this.bellIn -= dt;
    if (this.bellIn > 0) return;
    const mu = seq.music;
    this.bellIn = fx.range(mu.bellEvery[0], mu.bellEvery[1]);
    const degree = mu.scale[Math.floor(fx.random() * mu.scale.length)];
    const octave = mu.bellOctave + (fx.random() < 0.25 ? 1 : 0);
    this.bell(semi(mu.root, degree + 12 * octave), 0.03 + fx.random() * 0.015, mu.bell, 0, mu.texture === 'river' ? 2.4 : 5.5);
  }

  /** Paused: the music draws back, and returns on resume. */
  pause(paused: boolean) {
    if (this.ctx && this.group) this.group.gain.setTargetAtTime(paused ? 0.25 : 1, this.ctx.currentTime, 0.5);
  }

  /** The shared ending: the meditation's music fades, a chord on D rises note by note and one bell rings. */
  end() {
    this.fade(5);
    if (!this.ready()) return;
    for (const [i, n] of END_CHORD.entries()) this.note(semi(END_ROOT, n), 10 - i * 0.6, 0.04, 'sine', 1.2, 1 + i * 0.7);
    this.bell(semi(END_ROOT, 31), 0.05, 'sine', 5.2, 8);
  }

  private fade(seconds: number) {
    const ctx = this.ctx, group = this.group, live = this.live;
    this.group = null; this.padFilter = null; this.breathNoise = null; this.pad = []; this.live = []; this.seq = null;
    if (!ctx || !group) return;
    const t = ctx.currentTime;
    group.gain.cancelScheduledValues(t);
    group.gain.setTargetAtTime(0.0001, t, seconds / 4);
    for (const n of live) n.stop(t + seconds + 0.2);
    setTimeout(() => group.disconnect(), (seconds + 0.5) * 1000);
  }

  /** The sitting's music stops, eased so it never cuts. */
  stop() { this.fade(1.2); }
}
