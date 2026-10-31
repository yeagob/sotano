import { onLocaleChange, t, type MessageKey } from '../i18n';
import { palCss } from '../content/palette';
import { isFlask } from '../content/potions';
import { BINDINGS, TAP_MS, TAP_SLOP, type Action, type Context } from './bindings';
import { onDeviceChange, type Input } from './input';
import type { Game } from '../game/game';

const STICK_SPLIT = 0.42;
const STICK_DEAD = 0.12;

interface Track { kind: 'stick' | 'look' | 'button'; action?: Action; x: number; y: number; ox: number; oy: number; t: number }

const PAD_ACTIONS = BINDINGS.filter(b => b.touch.control === 'button' || b.touch.control === 'systemButton');

export class TouchControls {
  private root: HTMLElement;
  private stick: HTMLElement;
  private knob: HTMLElement;
  private buttons = new Map<Action, HTMLElement>();
  private tracks = new Map<number, Track>();
  private stickId = -1;
  private key = '';
  /** The side of the phone the last landscape turn ended on (90 or 270); a change of side is a half turn. */
  private side: number | null = null;

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
    screen.orientation?.addEventListener('change', () => this.turned());
    addEventListener('orientationchange', () => this.turned());
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
      const t = performance.now();
      inp.touchPressed.add('confirm');
      if (btn) {
        const a = btn.dataset.a as Action;
        inp.touchHeld.add(a); inp.touchPressed.add(a);
        btn.classList.add('on');
        this.tracks.set(tc.identifier, { kind: 'button', action: a, x, y, ox: x, oy: y, t });
      } else if (x < innerWidth * STICK_SPLIT && this.stickId < 0) {
        this.stickId = tc.identifier;
        this.tracks.set(tc.identifier, { kind: 'stick', x, y, ox: x, oy: y, t });
        this.stick.classList.add('on');
        this.placeStick(x, y, 0, 0);
      } else this.tracks.set(tc.identifier, { kind: 'look', x, y, ox: x, oy: y, t });
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
        if (![...this.tracks.values()].some(o => o.action === tr.action)) {
          this.input.touchHeld.delete(tr.action);
          this.buttons.get(tr.action)?.classList.remove('on');
        }
      }
      // a short touch on the world that does not drag is a tap: the block under it is the one to place
      if (tr.kind !== 'button' && performance.now() - tr.t < TAP_MS && Math.hypot(tr.x - tr.ox, tr.y - tr.oy) < TAP_SLOP) {
        this.input.touchTap.x = tr.ox;
        this.input.touchTap.y = tr.oy;
        this.input.touchPressed.add('place');
      }
    }
  }

  /**
   * A half turn of the phone, like a steering wheel: the screen goes from one landscape side to the
   * other. Each turn flips the intention's polarity. A turn through portrait counts once, and the
   * first reading only sets the side.
   */
  private turned() {
    const raw = screen.orientation?.angle ?? (window as { orientation?: number }).orientation ?? 0;
    const side = ((raw % 360) + 360) % 360;
    if (side !== 90 && side !== 270) return;
    if (this.side !== null && this.side !== side) this.input.touchPressed.add('polarity');
    this.side = side;
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
    const top = p.hand.at(-1), flask = !!top && isFlask(top);
    const key = `${p.hand.length}:${p.bombs}:${g.inventory.items.length}:${g.polarityNow}:${flask}`;
    if (key === this.key) return;
    this.key = key;
    const thr = this.buttons.get('throw')!, bomb = this.buttons.get('bomb')!;
    thr.classList.toggle('off', !p.hand.length);
    this.buttons.get('drink')!.classList.toggle('off', !flask);
    bomb.classList.toggle('off', p.bombs <= 0);
    bomb.querySelector('span')!.textContent = String(p.bombs);
    this.buttons.get('inventory')!.querySelector('span')!.textContent = g.inventory.items.length ? String(g.inventory.items.length) : '';
    const pol = this.buttons.get('cast')!;
    pol.dataset.polarity = g.polarityNow;
    pol.style.setProperty('--pol', palCss(g.polarityNow === 'positive' ? 'light.gold' : 'light.ember'));
  }
}
