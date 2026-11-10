// The Sanctuary on the page (docs/design/built/presences/MEDITATION-APP.md): the full-screen layer the
// Boundary opens. The rules are MeditationApp's; this draws what it says, paints the scene on a 2D canvas,
// drives the sound and passes every press on. The look is its own on purpose (docs/art/DECISIONS.md §10.8):
// round, soft and slow, with colours from the `med.*` tokens only.

import { onLocaleChange, t, type MessageKey } from '../i18n';
import { palCss } from '../content/palette';
import {
  BREATH_KEY, SEQUENCE, SEQUENCES, blurbKey, lineKey, nameKey, palOf, partKey,
  type Moment, type Outcome, type PaletteRole, type SceneId, type SequenceId,
} from '../content/presences/meditations';
import { MeditationAudio } from '../audio/meditation';
import { makeScene, paintEnding, paintHome, type SceneFrame, type ScenePainter } from '../render/meditation-scenes';
import { activeDevice, type Input } from '../input/input';
import { controlParams } from '../input/labels';
import { localStore, type MetaStore } from './meta';
import { AppClock, MeditationApp, sceneBudget, type Prefs, type Screen } from './meditation-app';

const ROLES: readonly PaletteRole[] = ['high', 'mid', 'deep', 'glow', 'accent', 'accent2', 'mote', 'ink'];
/** The session bar hides after this long without input. */
export const BAR_IDLE_MS = 6000;
const MAX_PIXEL_RATIO = 1.5;
const MAX_CANVAS_WIDTH = 1280;
/** The layer is opaque this long after it opens: from then on the world underneath need not be drawn. */
const COVER_MS = 900;

export const prefsStore: MetaStore = localStore('the-roots.sanctuary');

export function loadPrefs(store: MetaStore = prefsStore, reduced = false): Prefs {
  try {
    const o = JSON.parse(store.read() ?? 'null');
    if (o && typeof o === 'object') return { mute: o.mute === true, calm: typeof o.calm === 'boolean' ? o.calm : reduced };
  } catch { /* a broken record reads as the default */ }
  return { mute: false, calm: reduced };
}

export function savePrefs(p: Prefs, store: MetaStore = prefsStore) {
  store.write(JSON.stringify({ mute: p.mute, calm: p.calm }));
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

export class MeditationView {
  app: MeditationApp | null = null;
  private root: HTMLElement | null = null;
  private canvas!: HTMLCanvasElement;
  private c2d!: CanvasRenderingContext2D;
  private ui!: HTMLElement;
  private audio = new MeditationAudio();
  private scenes = new Map<SceneId, ScenePainter>();
  private done: ((o: Outcome) => void) | null = null;
  private key = '';
  private openedAt = 0;
  private lastFrame = 0;
  private lastInput = 0;
  private sceneT = 0;
  private pShown = 0;
  private endAt = 0;
  private shown = { clock: '', part: '', line: '', breath: '', bar: -1 };
  private wake: { release(): Promise<void> } | null = null;
  /** The app's clock: real time, but no more than a short step per call, so a hidden tab does not count. */
  private clock = new AppClock();

  constructor() {
    onLocaleChange(() => { this.key = ''; });
  }

  get open() { return this.app !== null; }

  /** True once the layer hides the whole world, so the frame loop can skip drawing it. */
  get covering() { return this.open && performance.now() - this.openedAt > COVER_MS; }

  private mount() {
    if (this.root) return;
    const root = this.root = el('div', '');
    root.id = 'sanctuary';
    this.canvas = el('canvas', '');
    this.c2d = this.canvas.getContext('2d')!;
    this.ui = el('div', 'ui');
    root.append(this.canvas, el('div', 'veil'), this.ui);
    document.body.appendChild(root);
    // a click on the layer must not move the focus to a button: Enter would then press it twice
    root.addEventListener('mousedown', e => e.preventDefault());
    root.addEventListener('pointermove', () => this.touched());
    root.addEventListener('pointerdown', () => this.touched());
    root.addEventListener('click', e => {
      const b = (e.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-id]');
      if (!b) return;
      e.stopPropagation();
      this.run(app => app.act(b.dataset.id!, this.clock.now(performance.now())));
    });
    root.addEventListener('mouseover', e => {
      const b = (e.target as HTMLElement | null)?.closest?.<HTMLElement>('.tile');
      if (b && this.app && this.app.selected !== b.dataset.id) { this.app.selected = b.dataset.id!; this.audio.ui('move'); }
    });
  }

  /** Opens the app. `done` is called once, with the outcome that closed it. */
  show(done: (o: Outcome) => void, rate = 1, random: () => number = () => 0) {
    if (this.app) return;
    this.mount();
    const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.app = new MeditationApp(loadPrefs(prefsStore, reduced), random);
    this.app.rate = rate;
    this.done = done;
    this.key = '';
    this.openedAt = this.lastFrame = this.lastInput = performance.now();
    this.clock.reset();
    this.sceneT = 0;
    this.endAt = 0;
    this.audio.setMuted(this.app.prefs.mute);
    this.audio.ui('open');
    const root = this.root!;
    root.classList.add('on');
    void root.offsetWidth;
    root.classList.add('show');
    this.frame(this.openedAt);
  }

  private touched() { this.lastInput = performance.now(); }

  /** Runs one press through the app and answers whatever it changed: sound, the sitting's start, the close. */
  private run(press: (app: MeditationApp) => Outcome | null) {
    const app = this.app;
    if (!app) return;
    this.touched();
    const was = { screen: app.screen, selected: app.selected, paused: app.paused, mute: app.prefs.mute, calm: app.prefs.calm };
    const outcome = press(app);
    if (app.prefs.mute !== was.mute || app.prefs.calm !== was.calm) {
      this.audio.setMuted(app.prefs.mute);
      this.audio.ui('toggle');
      savePrefs(app.prefs);
    }
    if (app.paused !== was.paused) { this.audio.pause(app.paused); this.audio.ui('toggle'); }
    if (app.screen !== was.screen) {
      const forward: Record<Screen, number> = { home: 0, library: 1, session: 2, leave: 3, end: 4 };
      this.audio.ui(forward[app.screen] > forward[was.screen] ? 'pick' : 'back');
      if (app.screen === 'session' && was.screen === 'library') this.begin();
      if (app.screen === 'leave') this.audio.pause(true);
      if (app.screen === 'session' && was.screen === 'leave') this.audio.pause(app.paused);
    } else if (app.selected !== was.selected) this.audio.ui('move');
    if (outcome) this.close(outcome);
  }

  private begin() {
    const app = this.app!;
    this.scenes.set(app.seq, makeScene(app.seq));
    this.sceneT = 0;
    this.pShown = 0;
    this.endAt = 0;
    this.audio.start(SEQUENCE[app.seq]);
    const nav = navigator as Navigator & { wakeLock?: { request(kind: 'screen'): Promise<{ release(): Promise<void> }> } };
    nav.wakeLock?.request('screen').then(w => { if (this.app) this.wake = w; else void w.release(); }).catch(() => {});
  }

  private close(outcome: Outcome) {
    const root = this.root!, done = this.done;
    this.app = null;
    this.done = null;
    this.audio.stop();
    this.audio.ui(outcome === 'cancel' ? 'back' : 'pick');
    void this.wake?.release().catch(() => {});
    this.wake = null;
    root.classList.remove('show');
    setTimeout(() => { if (!this.app) root.classList.remove('on'); }, 750);
    done?.(outcome);
  }

  /** One frame of input from the bindings (keyboard and gamepad). The mouse and touch press the buttons. */
  input(inp: Input, now: number) {
    if (!this.app) return;
    const tiles = [...this.ui.querySelectorAll<HTMLElement>('.tile')];
    const cols = Math.max(1, tiles.filter(b => b.offsetTop === tiles[0]?.offsetTop).length);
    const n = inp.navigate();
    const any = n.x || n.y || (['confirm', 'back', 'skip', 'mute', 'calm'] as const).some(a => inp.hit(a));
    if (!any) return;
    this.run(app => app.press(inp, this.clock.now(now), cols));
  }

  /** Called every frame while the app is open: the clock, the sound, the scene and the words. */
  frame(now: number) {
    const app = this.app;
    if (!app || !this.root) return;
    const dt = Math.min(0.1, Math.max(0, (now - this.lastFrame) / 1000));
    this.lastFrame = now;
    const tick = app.tick(this.clock.now(now));
    const m = app.moment;
    if (app.running) this.sceneT += dt;
    if (tick.done) { this.endAt = now; this.audio.end(); this.touched(); }
    else if (m && app.running) {
      if (tick.part) this.audio.part(m.part);
      else if (tick.line) this.audio.line();
      if (tick.beat) this.audio.breath(m.breath, m.beatS);
      this.audio.tick(dt);
    }
    const key = `${app.screen}|${app.selected}|${app.paused}|${app.prefs.mute}|${app.prefs.calm}|${app.seq}|${activeDevice()}`;
    if (key !== this.key) { this.key = key; this.render(app); }
    if (m && (app.screen === 'session' || app.screen === 'leave')) this.words(app, m);
    this.root.classList.toggle('idle', app.screen === 'session' && app.running && now - this.lastInput > BAR_IDLE_MS);
    this.paint(app, m, now, dt);
  }

  private tone(app: MeditationApp): SceneId | 'app' {
    return app.screen === 'home' || app.screen === 'end' ? 'app' : app.screen === 'library' ? (app.selected.slice(4) as SequenceId) : app.seq;
  }

  private paint(app: MeditationApp, m: Moment | null, now: number, dt: number) {
    const w = innerWidth, h = innerHeight;
    const scale = Math.min(devicePixelRatio || 1, MAX_PIXEL_RATIO, MAX_CANVAS_WIDTH / Math.max(1, w));
    const cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
    if (this.canvas.width !== cw || this.canvas.height !== ch) { this.canvas.width = cw; this.canvas.height = ch; }
    const c = this.c2d;
    c.setTransform(scale, 0, 0, scale, 0, 0);
    const budget = sceneBudget(w, h, app.prefs.calm);
    const clock = (now - this.openedAt) / 1000;
    if (app.screen === 'home') { paintHome(c, w, h, clock, budget.effects); return; }
    const sitting = app.screen === 'session' || app.screen === 'leave' || app.screen === 'end';
    const id = this.tone(app) === 'app' ? app.seq : this.tone(app) as SceneId;
    let scene = this.scenes.get(id);
    if (!scene) { scene = makeScene(id); this.scenes.set(id, scene); }
    let f: SceneFrame;
    if (sitting && m) {
      const target = m.done ? 5 : m.part + m.partT;
      this.pShown += (target - this.pShown) * (1 - Math.exp(-dt / 1.2));
      const e = this.endAt ? (now - this.endAt) / 1000 : 0;
      f = { p: this.pShown, lung: m.lung, breath: m.breath, breathT: m.breathT, beat: m.beat, t: this.sceneT, dt: app.running || e > 0 ? dt : 0, cap: budget.particles, effects: budget.effects, sway: budget.sway, gather: Math.min(1, e / 3) };
      scene.paint(c, w, h, f);
      if (e > 0) paintEnding(c, w, h, e, clock, budget.effects);
      return;
    }
    // the library and the length screen show the chosen meditation's scene, in the middle of its practice
    const tide = 0.5 - Math.cos(clock * 0.6) / 2;
    f = { p: 2.75, lung: tide, breath: 'natural', breathT: (clock * 0.095) % 1, beat: Math.floor(clock / 10.5), t: clock, dt, cap: budget.particles, effects: budget.effects, sway: budget.sway, gather: 0 };
    scene.paint(c, w, h, f);
  }

  private colours(tone: SceneId | 'app') {
    const s = this.root!.style;
    for (const r of ROLES) s.setProperty(`--m-${r}`, palCss(palOf(tone, r)));
    s.setProperty('--m-dim', palCss(tone === 'app' ? 'med.app.dim' : palOf(tone, 'mote')));
  }

  private tile(id: string, cls: string, app: MeditationApp, ...kids: (Node | string)[]): HTMLButtonElement {
    const b = el('button', `tile ${cls}${app.selected === id ? ' cur' : ''}`);
    b.type = 'button';
    b.dataset.id = id;
    b.tabIndex = -1;
    b.append(...kids);
    return b;
  }

  private closeButton(label: MessageKey): HTMLButtonElement {
    const b = el('button', 'x', '✕');
    b.type = 'button';
    b.dataset.id = 'close';
    b.tabIndex = -1;
    b.title = t(label);
    b.setAttribute('aria-label', t(label));
    return b;
  }

  private switches(app: MeditationApp): HTMLElement {
    const row = el('div', 'switches');
    for (const [id, on, off, state] of [['mute', 'sanctuary.sound.off', 'sanctuary.sound.on', app.prefs.mute], ['calm', 'sanctuary.calm.on', 'sanctuary.calm.off', app.prefs.calm]] as const) {
      const b = el('button', `sw${state ? ' set' : ''}`, t(state ? on : off));
      b.type = 'button';
      b.dataset.id = id;
      b.tabIndex = -1;
      b.setAttribute('aria-pressed', String(state));
      row.appendChild(b);
    }
    return row;
  }

  /** Rebuilds the words and buttons of the current screen. The scene behind them is the canvas. */
  private render(app: MeditationApp) {
    const root = this.root!, ui = this.ui, params = controlParams(activeDevice());
    root.dataset.screen = app.screen;
    this.colours(this.tone(app));
    this.shown = { clock: '', part: '', line: '', breath: '', bar: -1 };
    ui.replaceChildren();
    const hint = (key: MessageKey) => el('p', 'hint', t(key, params));
    if (app.screen === 'home') {
      const choices = el('div', 'choices');
      choices.append(
        this.tile('meditate', 'choice', app, el('b', '', t('sanctuary.meditate')), el('span', '', t('sanctuary.meditate.sub'))),
        this.tile('quick', 'choice', app, el('b', '', t('sanctuary.quick')), el('span', '', t('sanctuary.quick.sub'))),
      );
      ui.append(this.closeButton('sanctuary.close'), el('i', 'mark'), el('h1', '', t('sanctuary.name')), el('p', 'lead', t('sanctuary.lead')), choices,
        el('p', 'note', t('sanctuary.note')), this.switches(app), hint('sanctuary.hint'), hint('sanctuary.hint.switches'));
    } else if (app.screen === 'library') {
      const grid = el('div', 'library');
      for (const s of SEQUENCES) {
        const sw = el('i', 'swatch');
        for (const r of ['high', 'mid', 'glow', 'accent'] as const) sw.style.setProperty(`--s-${r}`, palCss(palOf(s.id, r)));
        grid.appendChild(this.tile(`seq:${s.id}`, 'card', app, sw, el('b', '', t(nameKey(s))), el('span', '', t(blurbKey(s))), el('em', '', t(`sanctuary.tier.${s.tier}` as MessageKey))));
      }
      ui.append(this.closeButton('sanctuary.backLabel'), el('h2', '', t('sanctuary.library')), grid, hint('sanctuary.hint'));
    } else if (app.screen === 'session') {
      const top = el('div', 'top');
      const bar = el('div', 'progress');
      bar.appendChild(el('i', ''));
      const plan = app.plan!;
      for (const b of plan.bounds.slice(1, -1)) { const k = el('u', ''); k.style.left = `${100 * b / plan.totalMs}%`; bar.appendChild(k); }
      const clock = el('div', 'clock');
      clock.setAttribute('role', 'timer');
      top.append(clock, bar, el('div', 'partname'));
      const guide = el('div', 'guide');
      const line = el('p', 'line');
      line.setAttribute('aria-live', 'polite');
      guide.append(el('p', 'breath'), line);
      const ctl = el('div', 'bar');
      ctl.append(
        this.tile('pause', 'ctl', app, t(app.paused ? 'sanctuary.resume' : 'sanctuary.pause')),
        this.tile('skip', 'ctl', app, t('sanctuary.skip')),
        this.tile('mute', 'ctl', app, t(app.prefs.mute ? 'sanctuary.sound.off' : 'sanctuary.sound.on')),
        this.tile('calm', 'ctl', app, t(app.prefs.calm ? 'sanctuary.calm.on' : 'sanctuary.calm.off')),
        this.tile('leave', 'ctl', app, t('sanctuary.leave')),
      );
      ui.append(top, guide, ctl);
    } else if (app.screen === 'leave') {
      const sheet = el('div', 'sheet'), row = el('div', 'choices');
      row.append(this.tile('stay', 'choice', app, el('b', '', t('sanctuary.stay'))), this.tile('quick', 'choice', app, el('b', '', t('sanctuary.leave.quick'))));
      sheet.append(el('div', 'clock'), el('h2', '', t('sanctuary.leave.title')), el('p', 'lead', t('sanctuary.leave.body')), row, hint('sanctuary.hint'));
      ui.append(sheet);
    } else {
      const row = el('div', 'choices');
      row.append(this.tile('receive', 'choice', app, el('b', '', t('sanctuary.receive'))));
      ui.append(el('h2', '', t('sanctuary.end.title')), el('p', 'lead', t('sanctuary.end.body')), row);
    }
  }

  /** The words that change during a sitting are written only when they change. */
  private words(app: MeditationApp, m: Moment) {
    const ui = this.ui, s = this.shown, seq = SEQUENCE[app.seq];
    const set = (sel: string, field: 'clock' | 'part' | 'line' | 'breath', text: string) => {
      if (s[field] === text) return;
      s[field] = text;
      const node = ui.querySelector<HTMLElement>(sel);
      if (!node) return;
      if (field === 'line') { node.classList.remove('in'); void node.offsetWidth; node.classList.add('in'); }
      node.textContent = text;
    };
    set('.clock', 'clock', t('sanctuary.clock', { m: Math.floor(m.secondsLeft / 60), s: String(m.secondsLeft % 60).padStart(2, '0') }));
    if (app.screen !== 'session') return;
    set('.partname', 'part', t('sanctuary.part', { n: m.part + 1, total: seq.parts.length, name: t(partKey(seq, m.part)) }));
    set('.line', 'line', app.paused ? t('sanctuary.paused') : m.line ? t(lineKey(seq, m.part, m.line)) : '');
    const left = Math.max(1, Math.ceil(m.beatS * (1 - m.breathT)));
    set('.breath', 'breath', m.breath === 'natural' ? t(BREATH_KEY.natural) : `${t(BREATH_KEY[m.breath])} · ${t('sanctuary.count', { n: left })}`);
    const pct = Math.round(1000 * app.elapsed / app.plan!.totalMs);
    if (pct !== s.bar) { s.bar = pct; ui.querySelector<HTMLElement>('.progress i')?.style.setProperty('width', `${pct / 10}%`); }
  }
}
