// The Spiked Entity: a standalone actor in the chamber of silence that every touch bounces off (docs/architecture/SKY.md §10.1). Stub (K0): EN builds it.

import type { Polarity } from '../combat/polarity';
import type { DamageKind } from '../core/damage';
import type { Body } from '../physics/voxel-collide';
import type { EntityHost, SpikedEntityApi, TouchTarget, Vec3 } from '../sky/types';

/** The chamber is 4 high: with its spikes it stands at most this tall. */
export const ENTITY_MAX_H = 3.5;

export class SpikedEntity implements SpikedEntityApi {
  readonly body: Body;
  facing = 0;
  constructor(readonly id: number, at: Vec3, _host: EntityHost) {
    this.body = { x: at.x, y: at.y, z: at.z, vx: 0, vy: 0, vz: 0, hw: 0, h: 0, onGround: true };
  }
  owns(_id: number) { return false; }
  at(_x: number, _y: number, _z: number, _r: number) { return -1; }
  targets(): readonly TouchTarget[] { return []; }
  touch(_id: number, _polarity: Polarity, _warm: boolean, _p: Vec3, _kind: DamageKind) {}
}
