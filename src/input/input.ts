import {
  BINDING, BINDINGS, deadzone, lookCurve, MOVE_KEYS, NAV_KEYS, NAV_PAD, PAD, PAD_LOOK_SPEED, PAD_TRIGGER, PAD_WAKE, STICK_RUN_EDGE, TOUCH_LOOK_SPEED,
  WHEEL_STEP_MS,
  type Action, type Device,
} from './bindings';
import { enterFullscreen } from './fullscreen';
import { DoubleFlick, DoubleTap, type DashDir } from './gestures';

let current: Device = 'keyboard';

/** The camera-relative direction of each movement key (the double tap of the dash reads them). */
const KEY_DIR: Readonly<Record<string, DashDir>> = Object.fromEntries(
  (Object.entries(MOVE_KEYS) as [keyof typeof MOVE_KEYS, readonly string[]][])
    .flatMap(([d, codes]) => codes.map(c => [c, ({ up: 'forward', down: 'back', left: 'left', right: 'right' } as const)[d]] as const)),
);

/** A gesture that happened since the last frame (a double tap, a double flick, a swipe): the action it is, its direction and device. */
interface Gesture { action: Action; dir: DashDir; device: Device }
const deviceListeners = new Set<(d: Device) => void>();

export const activeDevice = () => current;

export function onDeviceChange(fn: (d: Device) => void) {
  deviceListeners.add(fn);
  return () => { deviceListeners.delete(fn); };
}

export function isTouchDevice() {
  return typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches && 'ontouchstart' in window;
}

/** Largest mouse-look delta taken from one mousemove event, in pixels. */
const LOOK_EVENT_MAX = 300;

const clampLook = (v: number) => Number.isFinite(v) ? Math.max(-LOOK_EVENT_MAX, Math.min(LOOK_EVENT_MAX, v)) : 0;

const BUTTON_ACTIONS =BINDINGS.filter(b => b.kind !== 'axis').map(b => b.action);

export class Input {
  readonly keys = new Set<string>();
  readonly pressed = new Set<string>();
  readonly mouse = new Set<number>();
  readonly mousePressed = new Set<number>();
  /** Wheel steps this frame: -1 scrolled up, 1 scrolled down (`keyboard.wheel` in the bindings). */
  private wheelHit = new Set<number>();
  private lastWheel = -Infinity;
  /** The carried slot a touch tapped on the hand (`pick` on touch); -1 when none. */
  touchSlot = -1;
  readonly touchHeld = new Set<Action>();
  readonly touchPressed = new Set<Action>();
  readonly touchMove = { x: 0, y: 0 };
  /** Where the last tap on the world landed (screen pixels); `place` aims at it. */
  readonly touchTap = { x: 0, y: 0 };
  private padHeld = new Set<number>();
  private padPrev = new Set<number>();
  private padMove = { x: 0, y: 0 };
  private padIndex = -1;
  private doubleTap = new DoubleTap();
  private flick = new DoubleFlick();
  private gestureNow: Gesture | null = null;
  private suppressed = new Set<Action>();
  private lastTouch = -1e9;
  private expectUnlock = false;
  private skipLookEvent = false;
  private stickWake = 0;
  /** Fartlek and Child's Pose on the pad: the stick-click toggles (L3 running, R3 crouching). The run latch ends when the stick returns to centre. */
  private runLatch = false;
  private crouchLatch = false;
  private stickPushed = false;
  /** The left stick is at its edge this frame (the run on the pad). */
  private padEdge = false;
  onBlur: (() => void) | null = null;
  lookDX = 0; lookDY = 0;
  locked = false;
  engaged = false;
  /** A full-screen layer of its own (the Sanctuary) is open: a click belongs to it and never captures the mouse. */
  modal = false;
  sensitivity = 0.0022;
  onPadChange: ((connected: boolean) => void) | null = null;

  constructor(private el: HTMLElement) {
    addEventListener('keydown', e => {
      if (!e.repeat && !this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
      this.use('keyboard');
      const dir = KEY_DIR[e.code];
      if (dir && !e.repeat && this.doubleTap.press(dir, performance.now() / 1000)) this.gesture('dash', dir, 'keyboard');
      if (e.code === 'Space' || e.code === 'Tab' || e.code.startsWith('Arrow')) e.preventDefault();
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => this.lost());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.lost(); });
    document.addEventListener('mousedown', e => {
      if (performance.now() - this.lastTouch < 1000) return;
      this.use('keyboard');
      if (!this.locked) { if (!this.engaged && !this.modal) this.lock(); return; }
      if (!this.mouse.has(e.button)) this.mousePressed.add(e.button);
      this.mouse.add(e.button);
    });
    addEventListener('mouseup', e => this.mouse.delete(e.button));
    // one step per WHEEL_STEP_MS: a free-spinning wheel must not skip carried slots
    addEventListener('wheel', e => {
      const s = Math.sign(e.deltaY), now = performance.now();
      if (s && now - this.lastWheel >= WHEEL_STEP_MS) { this.wheelHit.add(s); this.lastWheel = now; }
    }, { passive: true });
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.el;
      this.skipLookEvent = this.locked;
      if (!this.locked) {
        this.mouse.clear(); this.keys.clear();
        if (!this.expectUnlock) this.engaged = false;
      }
      this.expectUnlock = false;
    });
    addEventListener('mousemove', e => {
      if (!this.locked) return;
      // Firefox can report a jump for the first move after the lock is taken (measured from the
      // cursor's old spot), so that event is dropped and no single event may exceed LOOK_EVENT_MAX
      if (this.skipLookEvent) { this.skipLookEvent = false; return; }
      this.lookDX += clampLook(e.movementX); this.lookDY += clampLook(e.movementY);
    });
    addEventListener('touchstart', () => { this.lastTouch = performance.now(); this.use('touch'); }, { capture: true, passive: true });
    addEventListener('gamepadconnected', () => this.onPadChange?.(true));
    addEventListener('gamepaddisconnected', () => {
      this.padHeld.clear(); this.padIndex = -1;
      if (current === 'gamepad') this.engaged = false;
      this.onPadChange?.(false);
    });
    if (isTouchDevice()) this.use('touch');
  }

  get device() { return current; }

  /** Whether any input moved this frame: a key, a mouse button, the look, a pad button or stick, or a touch control. The
   *  trust meter's stillness reads it (content/presences/trust.ts); it says nothing about the player beyond the input. */
  get active(): boolean {
    return this.keys.size > 0 || this.mouse.size > 0 || this.lookDX !== 0 || this.lookDY !== 0 || this.padHeld.size > 0
      || this.padMove.x !== 0 || this.padMove.y !== 0 || this.touchHeld.size > 0 || this.touchMove.x !== 0 || this.touchMove.y !== 0;
  }

  get portrait() { return current === 'touch' && innerHeight > innerWidth; }

  get playing() { return this.locked || (this.engaged && !this.portrait); }

  use(d: Device) {
    if (d === current) return;
    current = d;
    for (const fn of deviceListeners) fn(d);
  }

  lock() {
    try {
      const p = this.el.requestPointerLock() as unknown as Promise<void> | undefined;
      p?.catch?.(() => {});
    } catch { /* not allowed right now */ }
  }

  resume() {
    if (current === 'keyboard') { this.lock(); return; }
    // a tap that starts play asks for fullscreen; a refusal here stays quiet (the return button reports it)
    if (current === 'touch') void enterFullscreen(document);
    this.engaged = true;
    this.suppress(...BUTTON_ACTIONS);
    this.touchHeld.clear();
  }

  private lost() {
    this.keys.clear(); this.mouse.clear(); this.touchHeld.clear();
    this.runLatch = this.crouchLatch = this.stickPushed = false;
    this.touchMove.x = this.touchMove.y = 0;
    this.onBlur?.();
    this.release();
  }

  unlockFor() {
    if (!this.locked) return;
    this.expectUnlock = true;
    this.engaged = true;
    document.exitPointerLock?.();
  }

  release() {
    this.engaged = false;
    if (this.locked) document.exitPointerLock?.();
  }

  suppress(...actions: Action[]) { for (const a of actions) this.suppressed.add(a); }

  /** Touch's crouch swipe (and any other toggle source): flips the crouch latch. */
  toggleCrouch() { this.crouchLatch = !this.crouchLatch; }

  private raw(a: Action): boolean {
    if (a === 'run' && (this.runLatch || this.padEdge)) return true;
    if (a === 'crouch' && this.crouchLatch) return true;
    const b = BINDING[a];
    if (b.keyboard.keys?.some(k => this.keys.has(k))) return true;
    if (b.keyboard.mouse?.some(m => this.mouse.has(m))) return true;
    if (b.gamepad.buttons?.some(i => this.padHeld.has(i))) return true;
    return this.touchHeld.has(a);
  }

  /** A gesture (dash) happened this frame: its action is hit, from the device that made it. */
  gesture(action: Action, dir: DashDir, device: Device) {
    this.gestureNow = { action, dir, device };
  }

  /** The direction of the dash gesture this frame, or null: the Player reads it when `hit('dash')`. */
  get dashDir(): DashDir | null {
    return this.gestureNow?.action === 'dash' ? this.gestureNow.dir : null;
  }

  private rawHit(a: Action): boolean {
    if (this.gestureNow?.action === a) return true;
    const b = BINDING[a];
    if (b.keyboard.keys?.some(k => this.pressed.has(k))) return true;
    if (b.keyboard.mouse?.some(m => this.mousePressed.has(m))) return true;
    if (b.keyboard.wheel && this.wheelHit.has(b.keyboard.wheel)) return true;
    if (b.gamepad.buttons?.some(i => this.padHeld.has(i) && !this.padPrev.has(i))) return true;
    return this.touchPressed.has(a);
  }

  /** The number key pressed this frame, 0 for `1` up to 8 for `9`; -1 when none was. */
  digit(): number {
    for (let i = 1; i <= 9; i++) if (this.pressed.has(`Digit${i}`)) return i - 1;
    return -1;
  }

  held(a: Action) { return !this.suppressed.has(a) && this.raw(a); }

  hit(a: Action) { return !this.suppressed.has(a) && this.rawHit(a); }

  hitBy(a: Action): Device | null {
    if (this.suppressed.has(a)) return null;
    const b = BINDING[a];
    if (this.gestureNow?.action === a) return this.gestureNow.device;
    if (b.keyboard.keys?.some(k => this.pressed.has(k)) || b.keyboard.mouse?.some(m => this.mousePressed.has(m))) return 'keyboard';
    if (b.keyboard.wheel && this.wheelHit.has(b.keyboard.wheel)) return 'keyboard';
    if (b.gamepad.buttons?.some(i => this.padHeld.has(i) && !this.padPrev.has(i))) return 'gamepad';
    return this.touchPressed.has(a) ? 'touch' : null;
  }

  get move(): { x: number; y: number } {
    const k = (codes: readonly string[]) => codes.some(c => this.keys.has(c)) ? 1 : 0;
    let x = k(MOVE_KEYS.right) - k(MOVE_KEYS.left);
    let y = k(MOVE_KEYS.up) - k(MOVE_KEYS.down);
    x += this.padMove.x + this.touchMove.x;
    y += this.padMove.y + this.touchMove.y;
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    return { x, y };
  }

  navigate(): { x: number; y: number } {
    const k = (codes: readonly string[], i: number) => codes.some(c => this.pressed.has(c)) || (this.padHeld.has(i) && !this.padPrev.has(i)) ? 1 : 0;
    return {
      x: k(NAV_KEYS.right, NAV_PAD.right) - k(NAV_KEYS.left, NAV_PAD.left),
      y: k(NAV_KEYS.down, NAV_PAD.down) - k(NAV_KEYS.up, NAV_PAD.up),
    };
  }

  touchLook(dx: number, dy: number) {
    this.lookDX += dx * TOUCH_LOOK_SPEED / this.sensitivity;
    this.lookDY += dy * TOUCH_LOOK_SPEED / this.sensitivity;
  }

  poll(dt: number) {
    this.readPad(dt);
    for (const a of [...this.suppressed]) if (!this.raw(a)) this.suppressed.delete(a);
  }

  private readPad(dt: number) {
    this.padMove.x = this.padMove.y = 0;
    const pads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
    let pad: Gamepad | null = pads[this.padIndex] ?? null;
    if (!pad) {
      pad = null;
      for (const p of pads) if (p?.connected && p.mapping === 'standard') { pad = p; break; }
      this.padIndex = pad?.index ?? -1;
    }
    this.padPrev = this.padHeld;
    this.padHeld = new Set();
    this.padEdge = false;
    if (!pad) return;
    pad.buttons.forEach((b, i) => { if (b.pressed || b.value > PAD_TRIGGER) this.padHeld.add(i); });
    // the double flick reads the raw stick (no dead zone: the thresholds are the gesture's own)
    const flick = this.flick.update(pad.axes[0] ?? 0, pad.axes[1] ?? 0, performance.now() / 1000);
    const [mx, my] = deadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
    const [lx, ly] = deadzone(pad.axes[2] ?? 0, pad.axes[3] ?? 0);
    const stick = Math.max(Math.hypot(mx, my), Math.hypot(lx, ly));
    const woke = stick > PAD_WAKE && this.stickWake <= PAD_WAKE;
    this.stickWake = stick;
    if (woke || [...this.padHeld].some(i => !this.padPrev.has(i))) this.use('gamepad');
    this.padEdge = Math.hypot(pad.axes[0] ?? 0, pad.axes[1] ?? 0) >= STICK_RUN_EDGE;
    if (current !== 'gamepad') return;
    if (flick) this.gesture('dash', flick, 'gamepad');
    // the stick-clicks toggle; the run ends once the stick is back at centre after being pushed
    if (this.padHeld.has(PAD.LS) && !this.padPrev.has(PAD.LS)) this.runLatch = !this.runLatch;
    if (this.padHeld.has(PAD.RS) && !this.padPrev.has(PAD.RS)) this.crouchLatch = !this.crouchLatch;
    const pushed = mx !== 0 || my !== 0;
    if (this.stickPushed && !pushed) this.runLatch = false;
    this.stickPushed = pushed;
    this.padMove.x = mx; this.padMove.y = -my;
    this.lookDX += lookCurve(lx) * PAD_LOOK_SPEED * dt / this.sensitivity;
    this.lookDY += lookCurve(ly) * PAD_LOOK_SPEED * 0.75 * dt / this.sensitivity;
  }

  rumble(strength: number, ms: number) {
    if (current === 'gamepad') {
      const pad = navigator.getGamepads?.()[this.padIndex] as (Gamepad & { vibrationActuator?: { playEffect?: (t: string, p: object) => Promise<unknown> } }) | null;
      pad?.vibrationActuator?.playEffect?.('dual-rumble', { duration: ms, strongMagnitude: strength, weakMagnitude: strength * 0.6 })?.catch?.(() => {});
    } else if (current === 'touch') navigator.vibrate?.(Math.round(ms * strength));
  }

  endFrame() {
    this.pressed.clear(); this.mousePressed.clear(); this.touchPressed.clear(); this.wheelHit.clear();
    this.gestureNow = null;
    this.lookDX = 0; this.lookDY = 0;
  }
}
