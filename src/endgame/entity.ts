// The Spiked Entity: a standalone actor in the chamber of silence that every touch bounces off (docs/architecture/SKY.md §10.1).
//
// It is not a projection and not in CREATURES: it has no health, no warmth, no side and no hooks. Every
// intention, stroke, blast and cube the touch router hands it bounces (a tink, cold motes, a shimmer on
// the spikes, all through `EntityHost.bounce`), whatever the polarity or the kind, and nothing about it
// changes. It draws nothing from any random stream and never moves; the one thing it does is turn toward
// the player at the revelation (encounter.ts).

import type { Polarity } from '../combat/polarity';
import type { DamageKind } from '../core/damage';
import type { Body } from '../physics/voxel-collide';
import type { EntityHost, Pos, SpikedEntityApi, TouchTarget, Vec3 } from '../sky/types';

/** The chamber is 4 high: with its spikes it stands at most this tall. */
export const ENTITY_MAX_H = 3.5;
/** The body box: low and wide. The spikes reach past it (entity-view.ts); touches use the box. */
export const ENTITY_HW = 2;
export const ENTITY_H = 3;

/** The yaw that turns the entity's front (+z in its model) toward `p`. */
export function facingToward(from: Pos, p: Pos): number {
  return Math.atan2(p.x - from.x, p.z - from.z);
}

export class SpikedEntity implements SpikedEntityApi {
  readonly body: Body;
  /** Radians; it turns toward the player at the revelation. The view eases toward it. */
  facing = 0;
  private readonly box: TouchTarget[];

  constructor(readonly id: number, at: Vec3, private host: EntityHost) {
    this.body = { x: at.x, y: at.y, z: at.z, vx: 0, vy: 0, vz: 0, hw: ENTITY_HW, h: ENTITY_H, onGround: true };
    this.box = [{ id, x: at.x, y: at.y, z: at.z, hw: ENTITY_HW, h: ENTITY_H }];
  }

  /** Face the player (the turn of the revelation). */
  turnToward(p: Pos) {
    this.facing = facingToward(this.body, p);
  }

  owns(id: number) {
    return id === this.id;
  }

  /** This entity's id when a sphere of radius `r` at (x, y, z) reaches its box, otherwise −1. */
  at(x: number, y: number, z: number, r: number) {
    const b = this.body;
    const dx = Math.max(0, Math.abs(x - b.x) - b.hw);
    const dz = Math.max(0, Math.abs(z - b.z) - b.hw);
    const dy = y < b.y ? b.y - y : y > b.y + b.h ? y - (b.y + b.h) : 0;
    return dx * dx + dy * dy + dz * dz <= r * r ? this.id : -1;
  }

  targets(): readonly TouchTarget[] {
    return this.box;
  }

  /** Whatever touches it bounces, and nothing changes: no health, no warmth, no side to turn. */
  touch(id: number, _polarity: Polarity, _warm: boolean, p: Vec3, _kind: DamageKind) {
    if (id !== this.id) return;
    this.host.bounce(p.x, p.y, p.z);
  }
}
