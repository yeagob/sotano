// Keyboard and mouse with pointer lock. (Touch controls arrive in M1.)

export class Input {
  readonly keys = new Set<string>();
  /** Keys pressed this frame (rising edge). */
  readonly pressed = new Set<string>();
  fireHeld = false;
  placePressed = false;
  lookDX = 0; lookDY = 0;
  locked = false;
  sensitivity = 0.0022;

  constructor(el: HTMLElement) {
    addEventListener('keydown', e => {
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => { this.keys.clear(); this.fireHeld = false; });
    el.addEventListener('mousedown', e => {
      if (!this.locked) { el.requestPointerLock(); return; }
      if (e.button === 0) this.fireHeld = true;
      if (e.button === 2) this.placePressed = true;
    });
    addEventListener('mouseup', e => { if (e.button === 0) this.fireHeld = false; });
    el.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === el;
      if (!this.locked) this.fireHeld = false;
    });
    addEventListener('mousemove', e => {
      if (!this.locked) return;
      this.lookDX += e.movementX; this.lookDY += e.movementY;
    });
  }

  axis(neg: string[], pos: string[]) {
    return (pos.some(k => this.keys.has(k)) ? 1 : 0) - (neg.some(k => this.keys.has(k)) ? 1 : 0);
  }

  /** Call at the end of every frame. */
  endFrame() { this.pressed.clear(); this.placePressed = false; this.lookDX = 0; this.lookDY = 0; }
}
