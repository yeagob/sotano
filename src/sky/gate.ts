// RealmGate: the passages between the worlds, run as a fade (docs/architecture/SKY.md §2.4). The
// fade and the hold are the restart's (RESTART_FADE, RESTART_HOLD_MAX): the player never sees the
// new world pop in before its meshes are ready.

import type { Pos, RealmGateApi, RealmGateHost, RealmKind, SkyBounds, Travel } from './types';

/** Realm y below which falling off the arrival deck goes down to the crown (§2.4). */
export const SKY_FLOOR_OUT = 4;
/** Seconds of the fade to black, and of the fade back. */
export const GATE_FADE = 0.45;
/** Longest the new world may take to mesh before the fade back (the restart's RESTART_HOLD_MAX). */
export const GATE_HOLD_MAX = 2;

type Phase = 'idle' | 'out' | 'hold' | 'in';

/** The feet have reached the cloud layer and stand within its reach of its centre (the layer has no solids: a body passes it). */
function inCloud(pos: Pos, c: SkyBounds['cloud']): boolean {
  return pos.y >= c.y && Math.hypot(pos.x - c.x, pos.z - c.z) <= c.r;
}

export class RealmGate implements RealmGateApi {
  /** Pure: which travel, if any, the player's position asks for this frame. Up in the dungeon, the feet passing the cloud
   *  layer above the top pad opens the sky (STARS.md), and so does rising past the top of the dungeon's sky. */
  static check(realm: RealmKind, pos: Pos, sky: SkyBounds, rising = true): Travel | null {
    if (realm === 'dungeon') return (rising && inCloud(pos, sky.cloud)) || pos.y > sky.top ? { to: 'sky', at: sky.deck, float: true } : null;
    return pos.y < sky.floorOut ? { to: 'dungeon', at: sky.crown, float: true } : null;
  }

  private phase: Phase = 'idle';
  private t = 0;
  private travel: Travel | null = null;

  constructor(private host: RealmGateHost) {}

  get busy(): boolean { return this.phase !== 'idle'; }

  start(t: Travel) {
    if (this.busy) return;
    this.travel = t;
    this.phase = 'out';
    this.t = 0;
  }

  /** Drops a travel in progress (a new run starts from the dungeon's own state). */
  cancel() {
    if (!this.busy) return;
    this.phase = 'idle';
    this.travel = null;
    this.host.fade(0);
  }

  update(dt: number) {
    if (this.phase === 'idle') return;
    this.t += dt;
    if (this.phase === 'out') {
      this.host.fade(Math.min(1, this.t / GATE_FADE));
      if (this.t < GATE_FADE) return;
      this.host.pass(this.travel!);
      this.phase = 'hold';
      this.t = 0;
      this.host.fade(1);
      // the hold is checked from the next frame on: a world that is ready at once still gets this frame to mesh
      return;
    }
    if (this.phase === 'hold') {
      if (!this.host.ready() && this.t < GATE_HOLD_MAX) return;
      this.phase = 'in';
      this.t = 0;
    }
    if (this.phase === 'in') {
      this.host.fade(Math.max(0, 1 - this.t / GATE_FADE));
      if (this.t < GATE_FADE) return;
      this.phase = 'idle';
      this.travel = null;
      this.host.fade(0);
    }
  }
}
