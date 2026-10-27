import { onLocaleChange, t, type MessageKey } from '../i18n';
import { materialTexture } from '../render/atlas';
import { palCss } from '../content/palette';
import { BINDINGS, DOUBLE_TAP_MS, TAP_MS, type Action, type Context } from './bindings';
import { onDeviceChange, type Input } from './input';
import type { Game } from '../game/game';

const STICK_SPLIT = 0.42;
const STICK_DEAD = 0.12;

interface Track { kind: 'stick' | 'look' | 'button'; action?: Action; x: number; y: number; ox: number; oy: number; t: number }

const PAD_ACTIONS = BINDINGS.filter(b => b.touch.control === 'button' || b.touch.control === 'systemButton');
const DOUBLE_TAPS = BINDINGS.filter(b => b.touch.control === 'doubleTap' && b.touch.on);

export class TouchControls {
  private root: HTMLElement;
  private stick: HTMLElement;
  private knob: HTMLElement;
  private buttons = new Map<Action, HTMLElement>();
  private tracks = new Map<number, Track>();
  private stickId = -1;
  private key = '';
  private placeUrls = new Map<number, string>();
  private lastTap = new Map<Action, number>();

  constructor(private input: Input) {
    this.root = document.createElement('div');
    this.root.id = 'touch';
    this.stick = document.createElement('div');
    this.stick.className = 'stick';
    this.knob = document.createElement('i');
    this.stick.appendChild(this.knob);
    this.root.appendChild(this.stick);
    for (const b of PAD_ACTIONS) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `tb tb-${b.action}${b.touch.control === 'systemButton' ? ' sys' : ''}`;
      el.dataset.a = b.action;
      if (b.touch.icon) el.style.setProperty('--glyph', `var(--ico-${b.touch.icon})`);
      el.appendChild(document.createElement('span'));
      this.buttons.set(b.action, el);
      this.root.appendChild(el);
    }
    const canvas = document.getElementById('game');
    canvas?.after(this.root);
    const opts = { passive: false } as const;
    this.root.addEventListener('touchstart', e => this.start(e), opts);
    this.root.addEventListener('touchmove', e => this.moveTouches(e), opts);
    this.root.addEventListener('touchend', e => this.end(e), opts);
    this.root.addEventListener('touchcancel', e => this.end(e), opts);
    this.label();
    onLocaleChange(() => this.label());
    onDeviceChange(() => this.clear());
  }

  private label() {
    for (const [a, el] of this.buttons) el.setAttribute('aria-label', t(`controls.${a}` as MessageKey));
  }

  private start(e: TouchEvent) {
    e.preventDefault();
    const inp = this.input;
    for (const tc of e.changedTouches) {
      const btn = (tc.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-a]');
      const x = tc.clientX, y = tc.clientY;
      inp.touchPressed.add('confirm');
      if (btn) {
        const a = btn.dataset.a as Action;
        inp.touchHeld.add(a); inp.touchPressed.add(a);
        const now = performance.now();
        const doubles = DOUBLE_TAPS.filter(d => d.touch.on === a);
        if (doubles.length && now - (this.lastTap.get(a) ?? -1e9) < DOUBLE_TAP_MS) {
          for (const d of doubles) inp.touchPressed.add(d.action);
          inp.suppress(a);
          this.lastTap.delete(a);
        }
        btn.classList.add('on');
        this.tracks.set(tc.identifier, { kind: 'button', action: a, x, y, ox: x, oy: y, t: performance.now() });
      } else if (x < innerWidth * STICK_SPLIT && this.stickId < 0) {
        this.stickId = tc.identifier;
        this.tracks.set(tc.identifier, { kind: 'stick', x, y, ox: x, oy: y, t: 0 });
        this.stick.classList.add('on');
        this.placeStick(x, y, 0, 0);
      } else this.tracks.set(tc.identifier, { kind: 'look', x, y, ox: x, oy: y, t: 0 });
    }
  }

  private moveTouches(e: TouchEvent) {
    e.preventDefault();
    for (const tc of e.changedTouches) {
      const tr = this.tracks.get(tc.identifier);
      if (!tr) continue;
      const x = tc.clientX, y = tc.clientY;
      if (tr.kind === 'stick') {
        const r = this.radius();
        let dx = x - tr.ox, dy = y - tr.oy;
        const l = Math.hypot(dx, dy);
        if (l > r) { tr.ox = x - dx / l * r; tr.oy = y - dy / l * r; dx = dx / l * r; dy = dy / l * r; }
        const m = Math.hypot(dx, dy) / r;
        const k = m < STICK_DEAD ? 0 : (m - STICK_DEAD) / (1 - STICK_DEAD) / (m || 1);
        this.input.touchMove.x = dx / r * k;
        this.input.touchMove.y = -dy / r * k;
        this.placeStick(tr.ox, tr.oy, dx, dy);
      } else if (tr.kind === 'look' || tr.action === 'cast') this.input.touchLook(x - tr.x, y - tr.y);
      tr.x = x; tr.y = y;
    }
  }

  private end(e: TouchEvent) {
    e.preventDefault();
    for (const tc of e.changedTouches) {
      const tr = this.tracks.get(tc.identifier);
      this.tracks.delete(tc.identifier);
      if (!tr) continue;
      if (tr.kind === 'stick') this.releaseStick();
      else if (tr.kind === 'button' && tr.action) {
        const now = performance.now();
        if (now - tr.t < TAP_MS && Math.hypot(tr.x - tr.ox, tr.y - tr.oy) < 12) this.lastTap.set(tr.action, now);
        if (![...this.tracks.values()].some(o => o.action === tr.action)) {
          this.input.touchHeld.delete(tr.action);
          this.buttons.get(tr.action)?.classList.remove('on');
        }
      }
    }
  }

  private radius() { return Math.min(innerWidth, innerHeight) * 0.13; }

  private placeStick(x: number, y: number, dx: number, dy: number) {
    this.stick.style.left = `${x}px`;
    this.stick.style.top = `${y}px`;
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  private releaseStick() {
    this.stickId = -1;
    this.input.touchMove.x = this.input.touchMove.y = 0;
    this.stick.classList.remove('on');
    this.stick.style.left = this.stick.style.top = '';
    this.knob.style.transform = '';
  }

  clear() {
    this.tracks.clear();
    this.input.touchHeld.clear();
    this.releaseStick();
    for (const el of this.buttons.values()) el.classList.remove('on');
  }

  update(g: Game, ctx: Context) {
    const show = this.input.device === 'touch' && (ctx === 'play' || ctx === 'prompt');
    if (!show && this.tracks.size) this.clear();
    this.root.classList.toggle('show', show);
    if (!show) return;
    const p = g.player;
    const key = `${p.top}:${p.hand.length}:${p.bombs}:${g.inventory.items.length}:${g.polarityNow}`;
    if (key === this.key) return;
    this.key = key;
    const place = this.buttons.get('place')!, thr = this.buttons.get('throw')!, bomb = this.buttons.get('bomb')!;
    place.classList.toggle('off', !p.hand.length);
    thr.classList.toggle('off', !p.hand.length);
    place.style.setProperty('--block', p.top ? `url("${this.blockUrl(p.top)}")` : 'none');
    bomb.classList.toggle('off', p.bombs <= 0);
    bomb.querySelector('span')!.textContent = String(p.bombs);
    this.buttons.get('inventory')!.querySelector('span')!.textContent = g.inventory.items.length ? String(g.inventory.items.length) : '';
    const pol = this.buttons.get('cast')!;
    pol.dataset.polarity = g.polarityNow;
    pol.style.setProperty('--pol', palCss(g.polarityNow === 'positive' ? 'light.gold' : 'light.ember'));
  }

  private blockUrl(m: number) {
    let url = this.placeUrls.get(m);
    if (!url) { url = (materialTexture(m).image as HTMLCanvasElement).toDataURL(); this.placeUrls.set(m, url); }
    return url;
  }
}
