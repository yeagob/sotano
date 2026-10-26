// Keyboard and mouse. A click anywhere captures the mouse (pointer lock) until Esc.
// (Touch controls are still to come.)

export class Input {
  readonly keys = new Set<string>();
  /** Keys pressed this frame (rising edge). */
  readonly pressed = new Set<string>();
  fireHeld = false;
  placePressed = false;
  /** Any mouse button went down this frame (while captured). */
  clicked = false;
  lookDX = 0; lookDY = 0;
  locked = false;
  sensitivity = 0.0022;

  constructor(private el: HTMLElement) {
    addEventListener('keydown', e => {
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
      if (e.code === 'Space' || e.code === 'Tab' || e.code.startsWith('Arrow')) e.preventDefault();
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => { this.keys.clear(); this.fireHeld = false; });
    // listen on the whole document: overlays (pause card, HUD) must not swallow the click
    document.addEventListener('mousedown', e => {
      if (!this.locked) { this.lock(); return; }
      this.clicked = true;
      if (e.button === 0) this.fireHeld = true;
      if (e.button === 2) this.placePressed = true;
    });
    addEventListener('mouseup', e => { if (e.button === 0) this.fireHeld = false; });
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.el;
      if (!this.locked) { this.fireHeld = false; this.keys.clear(); }
    });
    addEventListener('mousemove', e => {
      if (!this.locked) return;
      this.lookDX += e.movementX; this.lookDY += e.movementY;
    });
  }

  /** Request pointer lock (browsers refuse it for ~1 s right after Esc: just click again). */
  lock() {
    try {
      const p = this.el.requestPointerLock() as unknown as Promise<void> | undefined;
      p?.catch?.(() => {});
    } catch { /* not allowed right now */ }
  }

  axis(neg: string[], pos: string[]) {
    return (pos.some(k => this.keys.has(k)) ? 1 : 0) - (neg.some(k => this.keys.has(k)) ? 1 : 0);
  }

  /** Call at the end of every frame. */
  endFrame() { this.pressed.clear(); this.placePressed = false; this.clicked = false; this.lookDX = 0; this.lookDY = 0; }
}
