import {
  BINDING, BINDINGS, deadzone, lookCurve, PAD, PAD_LOOK_SPEED, PAD_TRIGGER, TOUCH_LOOK_SPEED,
  type Action, type Device,
} from './bindings';

let current: Device = 'keyboard';
const deviceListeners = new Set<(d: Device) => void>();

export const activeDevice = () => current;

export function onDeviceChange(fn: (d: Device) => void) {
  deviceListeners.add(fn);
  return () => { deviceListeners.delete(fn); };
}

export function isTouchDevice() {
  return typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches && 'ontouchstart' in window;
}

const BUTTON_ACTIONS = BINDINGS.filter(b => b.kind !== 'axis').map(b => b.action);

export class Input {
  readonly keys = new Set<string>();
  readonly pressed = new Set<string>();
  readonly mouse = new Set<number>();
  readonly mousePressed = new Set<number>();
  readonly touchHeld = new Set<Action>();
  readonly touchPressed = new Set<Action>();
  readonly touchMove = { x: 0, y: 0 };
  private padHeld = new Set<number>();
  private padPrev = new Set<number>();
  private padMove = { x: 0, y: 0 };
  private padIndex = -1;
  private suppressed = new Set<Action>();
  private lastTouch = -1e9;
  lookDX = 0; lookDY = 0;
  locked = false;
  engaged = false;
  sensitivity = 0.0022;
  onPadChange: ((connected: boolean) => void) | null = null;

  constructor(private el: HTMLElement) {
    addEventListener('keydown', e => {
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
      this.use('keyboard');
      if (e.code === 'Space' || e.code === 'Tab' || e.code.startsWith('Arrow')) e.preventDefault();
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => { this.keys.clear(); this.mouse.clear(); this.touchHeld.clear(); });
    document.addEventListener('mousedown', e => {
      if (performance.now() - this.lastTouch < 1000) return;
      this.use('keyboard');
      if (!this.locked) { this.lock(); return; }
      if (!this.mouse.has(e.button)) this.mousePressed.add(e.button);
      this.mouse.add(e.button);
    });
    addEventListener('mouseup', e => this.mouse.delete(e.button));
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.el;
      if (!this.locked) {
        this.mouse.clear(); this.keys.clear();
        if (current === 'keyboard') this.engaged = false;
      }
    });
    addEventListener('mousemove', e => {
      if (!this.locked) return;
      this.lookDX += e.movementX; this.lookDY += e.movementY;
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

  get portrait() { return current === 'touch' && innerHeight > innerWidth; }

  get playing() { return this.locked || (this.engaged && !this.portrait); }

  use(d: Device) {
    if (d === current) return;
    current = d;
    if (d !== 'keyboard' && this.locked) { this.engaged = true; }
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
    if (current === 'touch') this.fullscreen();
    this.engaged = true;
    this.suppress(...BUTTON_ACTIONS);
  }

  private fullscreen() {
    const doc = document.documentElement;
    if (document.fullscreenElement || !doc.requestFullscreen) return;
    doc.requestFullscreen({ navigationUI: 'hide' })
      .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape'))
      .catch(() => {});
  }

  release() {
    this.engaged = false;
    if (this.locked) document.exitPointerLock?.();
  }

  suppress(...actions: Action[]) { for (const a of actions) this.suppressed.add(a); }

  private raw(a: Action): boolean {
    const b = BINDING[a];
    if (b.keyboard.keys?.some(k => this.keys.has(k))) return true;
    if (b.keyboard.mouse?.some(m => this.mouse.has(m))) return true;
    if (b.gamepad.buttons?.some(i => this.padHeld.has(i))) return true;
    return this.touchHeld.has(a);
  }

  private rawHit(a: Action): boolean {
    const b = BINDING[a];
    if (b.keyboard.keys?.some(k => this.pressed.has(k))) return true;
    if (b.keyboard.mouse?.some(m => this.mousePressed.has(m))) return true;
    if (b.gamepad.buttons?.some(i => this.padHeld.has(i) && !this.padPrev.has(i))) return true;
    return this.touchPressed.has(a);
  }

  held(a: Action) { return !this.suppressed.has(a) && this.raw(a); }

  hit(a: Action) { return !this.suppressed.has(a) && this.rawHit(a); }

  hitBy(a: Action): Device | null {
    if (this.suppressed.has(a)) return null;
    const b = BINDING[a];
    if (b.keyboard.keys?.some(k => this.pressed.has(k)) || b.keyboard.mouse?.some(m => this.mousePressed.has(m))) return 'keyboard';
    if (b.gamepad.buttons?.some(i => this.padHeld.has(i) && !this.padPrev.has(i))) return 'gamepad';
    return this.touchPressed.has(a) ? 'touch' : null;
  }

  get move(): { x: number; y: number } {
    const k = (codes: string[]) => codes.some(c => this.keys.has(c)) ? 1 : 0;
    let x = k(['KeyD', 'ArrowRight']) - k(['KeyA', 'ArrowLeft']);
    let y = k(['KeyW', 'ArrowUp']) - k(['KeyS', 'ArrowDown']);
    x += this.padMove.x + this.touchMove.x;
    y += this.padMove.y + this.touchMove.y;
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    return { x, y };
  }

  navigate(): { x: number; y: number } {
    const k = (code: string, i: number) => this.pressed.has(code) || (this.padHeld.has(i) && !this.padPrev.has(i)) ? 1 : 0;
    return {
      x: k('ArrowRight', PAD.RIGHT) - k('ArrowLeft', PAD.LEFT),
      y: k('ArrowDown', PAD.DOWN) - k('ArrowUp', PAD.UP),
    };
  }

  touchLook(dx: number, dy: number) {
    this.lookDX += dx * TOUCH_LOOK_SPEED / this.sensitivity;
    this.lookDY += dy * TOUCH_LOOK_SPEED / this.sensitivity;
  }

  poll(dt: number) {
    for (const a of [...this.suppressed]) if (!this.raw(a)) this.suppressed.delete(a);
    this.padMove.x = this.padMove.y = 0;
    const pads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
    let pad: Gamepad | null = pads[this.padIndex] ?? null;
    if (!pad) {
      pad = null;
      for (const p of pads) if (p?.connected) { pad = p; break; }
      this.padIndex = pad?.index ?? -1;
    }
    this.padPrev = this.padHeld;
    this.padHeld = new Set();
    if (!pad) return;
    pad.buttons.forEach((b, i) => { if (b.pressed || b.value > PAD_TRIGGER) this.padHeld.add(i); });
    const [mx, my] = deadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
    const [lx, ly] = deadzone(pad.axes[2] ?? 0, pad.axes[3] ?? 0);
    if (this.padHeld.size || mx || my || lx || ly) this.use('gamepad');
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
    this.pressed.clear(); this.mousePressed.clear(); this.touchPressed.clear();
    this.lookDX = 0; this.lookDY = 0;
  }
}
