export const FREEZE_CADENCE = 3;

export class Freeze {
  left = 0;
  cool = 0;

  get frozen(): boolean { return this.left > 0; }

  get open(): boolean { return this.left <= 0 && this.cool <= 0; }

  start(seconds: number): boolean {
    if (!(seconds > 0) || !this.open) return false;
    this.left = seconds;
    return true;
  }

  tick(dt: number): void {
    if (this.left > 0) {
      this.left = Math.max(0, this.left - dt);
      if (this.left === 0) this.cool = FREEZE_CADENCE;
      return;
    }
    this.cool = Math.max(0, this.cool - dt);
  }

  end(): void {
    this.left = 0;
  }

  reset(): void {
    this.left = 0;
    this.cool = 0;
  }
}

export function freezeProjection(e: { frozen: number; thaw: number }, seconds: number): boolean {
  if (!(seconds > 0) || e.frozen > 0 || e.thaw > 0) return false;
  e.frozen = seconds;
  return true;
}
