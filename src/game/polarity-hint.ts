import type { Device } from '../input/bindings';

export const POLARITY_HINT_HITS = 3;

export class PolarityHint {
  private block = -1;
  private hits = 0;
  private shown = false;

  reset() {
    this.block = -1;
    this.hits = 0;
    this.shown = false;
  }

  learned() {
    this.shown = true;
  }

  mended() {
    this.block = -1;
    this.hits = 0;
  }

  idle(block: number, device: Device, aboveZero: boolean): boolean {
    this.hits = this.block === block ? this.hits + 1 : 1;
    this.block = block;
    if (this.hits < POLARITY_HINT_HITS) return false;
    if (device === 'touch' ? aboveZero : this.shown) return false;
    this.shown = true;
    this.hits = 0;
    return true;
  }
}
