import { onLocaleChange, t, type MessageKey } from '../i18n';
import { palCss, type PalToken } from '../content/palette';
import { carriedDef, isFlask, POTIONS, type Flask } from '../content/potions';
import type { Carried } from '../entities/player';
import { iconDataUrl } from '../render/icons';
import { BINDINGS, STICK_RUN_EDGE, TAP_MS, TAP_SLOP, type Action, type Context } from './bindings';
import { onDeviceChange, type Input } from './input';
import type { Game } from '../game/game';
import type { Polarity } from '../combat/polarity';
import { intentPowerLevel } from '../combat/intents';
import { swipeDir } from './gestures';
import { sizePx, slotFor, slotStyle, SLOT, TouchPresence, touchLayerShown, type TouchSlot } from './touch-layout';
import { bodyChoice, bodyDashDir, bodyShown, type BodyChoice } from './context-button';
import { ITEM_BY_ID } from '../content/items';

const STICK_SPLIT = 0.42;
const STICK_DEAD = 0.12;
/** A swipe for the dash starts on the left side (up to the middle) and outside the stick's zone (DASH.md §2). */
const SWIPE_SIDE = 0.5;

/** Whether a touch at `x` may start a dash swipe: the left side of the screen, right of the stick's zone. */
export function swipeStartsAt(x: number, width: number): boolean {
  return x < width * SWIPE_SIDE && x >= width * STICK_SPLIT;
}

/**
 * Whether a touch may start the crouch swipe (RUN-AND-CROUCH.md): the bottom edge of the right side of the screen,
 * the last twelfth of the height, right of the middle.
 */
export function crouchStartsAt(x: number, y: number, width: number, height: number): boolean {
  return x >= width * 0.5 && y >= height * (1 - 1 / 12);
}

export function castPolarityToken(polarity: Polarity): PalToken {
  return polarity === 'positive' ? 'light.gold' : 'light.ember';
}

/** The bomb's glyph: the white seed for a positive intention (a bomb placed then is white), the black seed for a negative one. */
export function bombGlyph(polarity: Polarity): 'seedLove' | 'seed' {
  return polarity === 'positive' ? 'seedLove' : 'seed';
}

/**
 * What the use button shows for the top of the hand when it drinks. Only a flask on top can be drunk (Game.drink
 * takes the top), so the use button drinks in exactly that case and throws for everything else (`updateUse`).
 * `key` changes whenever the button's look must be redrawn (another flask, or an iced one).
 */
export interface DrinkView { show: boolean; key: string; flask?: Flask; liquid?: PalToken }

export function drinkView(top: Carried | undefined): DrinkView {
  if (!top || !isFlask(top)) return { show: false, key: '' };
  return {
    show: true,
    key: `${top.potion}${top.echo ? `.${top.echo}` : ''}${top.iced ? '+iced' : ''}`,
    flask: top,
    liquid: POTIONS[top.potion].liquid,
  };
}

/**
 * Forget a press on a button that is being hidden: its held state and every track still bound to it, so the
 * touch's later end or cancel finds no stale track to act on. Other buttons and the stick are left alone.
 */
export function forgetButtonPress<T extends { kind: string; action?: Action }>(tracks: Map<number, T>, held: Set<Action>, action: Action): void {
  for (const [id, tr] of tracks) if (tr.kind === 'button' && tr.action === action) tracks.delete(id);
  held.delete(action);
}

/**
 * One reading of the phone's orientation (degrees, any sign or turn): the landscape side it is on (90 or
 * 270), or null in portrait and upside down. A reading that is not a side is ignored.
 */
export function landscapeSide(raw: number): number | null {
  const side = ((raw % 360) + 360) % 360;
  return side === 90 || side === 270 ? side : null;
}

/**
 * A half turn of the phone (see TouchControls.turned): `flip` when the side changed from the last one. The
 * first reading only sets the side; a reading that is not a landscape side keeps the last side.
 */
export function halfTurn(last: number | null, raw: number): { side: number | null; flip: boolean } {
  const side = landscapeSide(raw);
  if (side === null) return { side: last, flip: false };
  return { side, flip: last !== null && last !== side };
}

interface Track { kind: 'stick' | 'look' | 'button' | 'slot' | 'body'; action?: Action; slot?: number; x: number; y: number; ox: number; oy: number; t: number; swipe?: boolean; crouch?: boolean }

import { KAIROS_CHARGES } from '../game/kairos';
const PAD_ACTIONS = BINDINGS.filter(b => (b.touch.control === 'button' || b.touch.control === 'systemButton') && !b.touch.shared);
/** The glyph of the body button for each choice: the practice that gives the verb (Child's Pose kneels, Irimi dashes). */
const BODY_GLYPH: Record<Exclude<BodyChoice, null>, string> = { crouch: 'balasana', stand: 'balasana', dash: 'irimi' };

export class TouchControls {
  private root: HTMLElement;
  private stick: HTMLElement;
  private knob: HTMLElement;
  private buttons = new Map<Action, HTMLElement>();
  /** The body button (#377): the context button the crouch and the dash share (context-button.ts). */
  private body: HTMLElement;
  /** The use button (owner, #376): one button for the active hand, throw and drink share it; `data-a` is what a press does now. */
  private use: HTMLElement;
  private bodyStats = { crouch: false, dash: false };
  private bodyGlyph = '';
  private tracks = new Map<number, Track>();
  private stickId = -1;
  private key = '';
  /** The side of the phone the last landscape turn ended on (90 or 270); a change of side is a half turn. */
  private side: number | null = null;
  /** When the set is on screen (issue #376): woken by a touch, gone TOUCH_IDLE_MS after the last one. */
  private presence = new TouchPresence();
  private shown = false;
  /** The contextual buttons shown last frame: one that appears wakes the set, so a new verb is seen. */
  private context = new Set<Action>();

  constructor(private input: Input) {
    this.root = document.createElement('div');
    this.root.id = 'touch';
    this.stick = document.createElement('div');
    this.stick.className = 'stick';
    this.knob = document.createElement('i');
    this.stick.appendChild(this.knob);
    this.root.appendChild(this.stick);
    place(this.stick, SLOT.stick);
    for (const b of PAD_ACTIONS) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `tb tb-${b.action}${b.touch.control === 'systemButton' ? ' sys' : ''}`;
      el.dataset.a = b.action;
      if (b.touch.icon) el.style.setProperty('--glyph', `var(--ico-${b.touch.icon})`);
      el.appendChild(document.createElement('span'));
      const slot = slotFor(b.action);
      if (slot) place(el, slot);
      this.buttons.set(b.action, el);
      this.root.appendChild(el);
    }
    this.use = document.createElement('button');
    (this.use as HTMLButtonElement).type = 'button';
    this.use.className = 'tb tb-use';
    this.use.dataset.a = 'throw';
    this.use.style.setProperty('--glyph', 'var(--ico-touchThrow)');
    this.use.appendChild(document.createElement('span'));
    this.use.hidden = true;
    place(this.use, SLOT.use);
    this.buttons.set('throw', this.use);
    this.buttons.set('drink', this.use);
    this.root.appendChild(this.use);
    this.body = document.createElement('button');
    (this.body as HTMLButtonElement).type = 'button';
    this.body.className = 'tb tb-body';
    this.body.dataset.body = '1';
    this.body.hidden = true;
    place(this.body, SLOT.body);
    this.root.appendChild(this.body);
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
    this.bodyGlyph = '';
  }

  private start(e: TouchEvent) {
    e.preventDefault();
    this.presence.wake(performance.now());
    const inp = this.input;
    for (const tc of e.changedTouches) {
      const btn = (tc.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-a]');
      const x = tc.clientX, y = tc.clientY;
      const t = performance.now();
      inp.touchPressed.add('confirm');
      if (!btn && (tc.target as HTMLElement | null)?.closest?.('[data-body]')) {
        this.pressBody();
        this.tracks.set(tc.identifier, { kind: 'body', x, y, ox: x, oy: y, t });
        continue;
      }
      const slot = btn ? -1 : this.slotAt(x, y);
      if (slot >= 0) {
        // a tap on the hand chooses that carried item (`pick`); it never places a block
        this.tracks.set(tc.identifier, { kind: 'slot', slot, x, y, ox: x, oy: y, t });
      } else if (btn) {
        const a = btn.dataset.a as Action;
        inp.touchHeld.add(a); inp.touchPressed.add(a);
        btn.classList.add('on');
        this.tracks.set(tc.identifier, { kind: 'button', action: a, x, y, ox: x, oy: y, t });
      } else if (x < innerWidth * STICK_SPLIT && this.stickId < 0) {
        this.stickId = tc.identifier;
        this.tracks.set(tc.identifier, { kind: 'stick', x, y, ox: x, oy: y, t });
        this.stick.classList.add('on');
        this.placeStick(x, y, 0, 0);
      } else {
        // a touch in the left band, outside the stick's zone, may become a swipe (the dash) until its window closes;
        // a touch at the bottom of the right side may become the crouch swipe (Child's Pose) the same way
        this.tracks.set(tc.identifier, { kind: 'look', x, y, ox: x, oy: y, t, swipe: swipeStartsAt(x, innerWidth) || crouchStartsAt(x, y, innerWidth, innerHeight), crouch: crouchStartsAt(x, y, innerWidth, innerHeight) });
      }
    }
  }

  /**
   * A look drag that may be a dash swipe. The look it already turned is taken back on recognition, so a
   * swipe never turns the view; a drag that is not a swipe keeps the look it made.
   */
  private checkSwipe(tr: Track, x: number, y: number) {
    const dir = swipeDir(x - tr.ox, y - tr.oy, (performance.now() - tr.t) / 1000);
    if (tr.crouch) {
      // the crouch swipe is a downward stroke only; it toggles the crouch and takes its look back
      if (dir === 'back') {
        this.input.touchLook(-(x - tr.ox), -(y - tr.oy));
        this.input.toggleCrouch();
        tr.crouch = false;
        tr.swipe = false;
      } else if (performance.now() - tr.t > 250) tr.crouch = false;
      return;
    }
    if (dir) {
      this.input.touchLook(-(x - tr.ox), -(y - tr.oy));
      this.input.gesture('dash', dir, 'touch');
      tr.swipe = false;
    } else if (performance.now() - tr.t > 250) tr.swipe = false;
  }

  private moveTouches(e: TouchEvent) {
    e.preventDefault();
    this.presence.wake(performance.now());
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
        // the stick at its edge runs (Fartlek): a held touch on the run, released when the stick comes back in
        if (m >= STICK_RUN_EDGE) this.input.touchHeld.add('run'); else this.input.touchHeld.delete('run');
        const k = m < STICK_DEAD ? 0 : (m - STICK_DEAD) / (1 - STICK_DEAD) / (m || 1);
        this.input.touchMove.x = dx / r * k;
        this.input.touchMove.y = -dy / r * k;
        this.placeStick(tr.ox, tr.oy, dx, dy);
      } else if (tr.kind === 'look' || tr.action === 'cast') {
        this.input.touchLook(x - tr.x, y - tr.y);
        if (tr.swipe || tr.crouch) this.checkSwipe(tr, x, y);
      }
      tr.x = x; tr.y = y;
    }
  }

  /** The index of the carried slot under a point of the hand row (bottom centre), or -1. */
  private slotAt(x: number, y: number): number {
    const hand = document.getElementById('hand');
    if (!hand) return -1;
    return [...hand.children].findIndex(s => {
      const r = s.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });
  }

  private end(e: TouchEvent) {
    e.preventDefault();
    this.presence.wake(performance.now());
    for (const tc of e.changedTouches) {
      const tr = this.tracks.get(tc.identifier);
      this.tracks.delete(tc.identifier);
      if (!tr) continue;
      if (tr.kind === 'body') {
        if (![...this.tracks.values()].some(o => o.kind === 'body')) this.body.classList.remove('on');
        continue;
      }
      if (tr.kind === 'slot') {
        if (performance.now() - tr.t < TAP_MS && Math.hypot(tr.x - tr.ox, tr.y - tr.oy) < TAP_SLOP) {
          this.input.touchSlot = tr.slot ?? -1;
          this.input.touchPressed.add('pick');
        }
        continue;
      }
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
    const turn = halfTurn(this.side, raw);
    if (turn.flip) this.input.touchPressed.add('polarity');
    this.side = turn.side;
  }

  /** What the body button does now (context-button.ts), from the practices held, the crouch and the stick. */
  private bodyNow(): BodyChoice {
    const { crouch, dash } = this.bodyStats;
    return bodyChoice({ crouch, dash, crouched: crouch && this.input.held('crouch'), stickX: this.input.touchMove.x, stickY: this.input.touchMove.y });
  }

  /** A press of the body button: it kneels, stands or dashes, whichever applies at this moment. */
  private pressBody() {
    const choice = this.bodyNow();
    if (!choice) return;
    this.body.classList.add('on');
    if (choice === 'dash') this.input.gesture('dash', bodyDashDir(this.input.touchMove.x, this.input.touchMove.y), 'touch');
    else this.input.toggleCrouch();
  }

  /** The body button exists only while a practice gives the crouch or the dash; its glyph is what a press would do. */
  private updateBody(g: Game) {
    this.bodyStats.crouch = g.stats.get('crouch') >= 1;
    this.bodyStats.dash = g.stats.get('dash') >= 1;
    const show = bodyShown({ ...this.bodyStats, crouched: false });
    this.body.hidden = !show;
    if (!show) {
      for (const [id, tr] of this.tracks) if (tr.kind === 'body') this.tracks.delete(id);
      this.body.classList.remove('on');
      return;
    }
    const choice = this.bodyNow() ?? 'crouch';
    this.body.classList.toggle('crouched', choice === 'stand');
    if (choice === this.bodyGlyph) return;
    this.bodyGlyph = choice;
    this.body.style.setProperty('--glyph', `url("${iconDataUrl(ITEM_BY_ID.get(BODY_GLYPH[choice])!, 3)}")`);
    this.body.setAttribute('aria-label', t(choice === 'dash' ? 'controls.dash' : 'controls.crouch'));
  }

  /** The stick's reach: half its drawn side, so the knob stops at the ring. */
  private radius() { return sizePx(SLOT.stick, innerWidth, innerHeight) / 2; }

  private placeStick(x: number, y: number, dx: number, dy: number) {
    this.stick.style.left = `${x}px`;
    this.stick.style.top = `${y}px`;
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  private releaseStick() {
    this.stickId = -1;
    this.input.touchMove.x = this.input.touchMove.y = 0;
    this.input.touchHeld.delete('run');
    this.stick.classList.remove('on');
    place(this.stick, SLOT.stick);
    this.knob.style.transform = '';
  }

  clear() {
    this.tracks.clear();
    this.input.touchHeld.clear();
    this.releaseStick();
    for (const el of this.buttons.values()) el.classList.remove('on');
    this.body.classList.remove('on');
  }

  /**
   * The use button (owner, #376) acts on what the active hand holds: it exists only while the hand holds
   * something (hidden, not dimmed, otherwise). With a flask on top it drinks it, drawn as that flask's own
   * pixel icon framed in its liquid colour; with anything else it throws, drawn as the flying block. A change
   * of verb, or hiding it, lets go of the press of the other verb, so no hidden control stays pressed.
   */
  private updateUse(holding: boolean, v: DrinkView) {
    const el = this.use;
    el.hidden = !holding;
    this.noteContext('throw', holding);
    const drink = holding && v.show && !!v.flask && !!v.liquid;
    const verb: Action = drink ? 'drink' : 'throw';
    for (const a of ['throw', 'drink'] as const) if (!holding || a !== verb) forgetButtonPress(this.tracks, this.input.touchHeld, a);
    if (!holding || el.dataset.a !== verb) el.classList.remove('on');
    el.dataset.a = verb;
    el.setAttribute('aria-label', t(`controls.${verb}` as MessageKey));
    el.classList.toggle('flask', drink);
    if (drink) {
      el.style.setProperty('--glyph', `url("${iconDataUrl(carriedDef(v.flask!), 3)}")`);
      el.style.setProperty('--liquid', palCss(v.liquid!));
    } else {
      el.style.setProperty('--glyph', 'var(--ico-touchThrow)');
    }
  }

  /** Show or hide a contextual button; hiding it lets go of its press, showing it wakes the set. */
  private showContext(a: Action, on: boolean) {
    const el = this.buttons.get(a)!;
    el.hidden = !on;
    if (!on) { forgetButtonPress(this.tracks, this.input.touchHeld, a); el.classList.remove('on'); }
    this.noteContext(a, on);
  }

  private noteContext(a: Action, on: boolean) {
    if (on && !this.context.has(a)) this.presence.wake(performance.now());
    if (on) this.context.add(a); else this.context.delete(a);
  }

  update(g: Game, ctx: Context) {
    const show = touchLayerShown(this.input.device, ctx);
    if (!show && this.tracks.size) this.clear();
    this.root.classList.toggle('show', show);
    const now = performance.now();
    // coming into play on a phone shows the set once, so the player sees where everything is
    if (show && !this.shown) this.presence.wake(now);
    this.shown = show;
    if (!show) { this.presence.sleep(); return; }
    this.root.classList.toggle('awake', this.presence.awake(now, this.tracks.size > 0));
    const p = g.player;
    // the miracle button (Kairos, #123) exists only while the practice is held; its ring is the charge
    const miracle = this.buttons.get('miracle')!;
    const kairos = g.inventory.has('kairos');
    miracle.hidden = !kairos;
    this.noteContext('miracle', kairos);
    if (!kairos) forgetButtonPress(this.tracks, this.input.touchHeld, 'miracle');
    else {
      miracle.style.setProperty('--charge', String(g.kairosCharge() / KAIROS_CHARGES));
      miracle.style.setProperty('--kairos', palCss('light.gold'));
    }
    this.updateBody(g);
    const drink = drinkView(p.active);
    // the loaded intention's power (#111): the ring thickens and glows with every step of damage
    const power = intentPowerLevel(g.stats.get('damage')).toFixed(3);
    const key = `${p.hand.length}:${p.bombs}:${g.inventory.items.length}:${g.polarityNow}:${drink.key}:${power}`;
    if (key === this.key) return;
    this.key = key;
    const bomb = this.buttons.get('bomb')!;
    // a contextual button is there only while it can act (issue #376): nothing in hand, no use button; no seed, no bomb
    this.updateUse(p.hand.length > 0, drink);
    this.showContext('bomb', p.bombs > 0);
    bomb.querySelector('span')!.textContent = String(p.bombs);
    // the bomb takes the loaded intention's colour: the white seed and its frame when positive, the black seed when negative
    bomb.dataset.polarity = g.polarityNow;
    bomb.style.setProperty('--pol', palCss(castPolarityToken(g.polarityNow)));
    bomb.style.setProperty('--glyph', `var(--ico-${bombGlyph(g.polarityNow)})`);
    this.buttons.get('inventory')!.querySelector('span')!.textContent = g.inventory.items.length ? String(g.inventory.items.length) : '';
    const pol = this.buttons.get('cast')!;
    pol.dataset.polarity = g.polarityNow;
    pol.style.setProperty('--pol', palCss(castPolarityToken(g.polarityNow)));
    pol.style.setProperty('--power', power);
  }
}

/** Put an element at its slot of the touch layout (src/input/touch-layout.ts, the one place for positions). */
export function place(el: HTMLElement, slot: TouchSlot): void {
  for (const [k, v] of Object.entries(slotStyle(slot))) el.style.setProperty(k.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`), v);
}
