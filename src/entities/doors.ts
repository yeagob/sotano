// Isaac-style doors (owner, 2026-10-27): a solid 3×3 slab filling the doorway that stays up (open)
// whenever its rooms hold no projections, slides down to seal a room while you fight, and rises
// again by itself when the room is cleared. Locked doors still wait for you to walk up and ask the
// game (keys, item hooks) through the `request` callback. A breakthrough that catches a door
// destroys it for good (`broken`): its doorway stays open forever.

import * as THREE from 'three';
import { doorTexture, type DoorLook } from '../render/atlas';
import type { DoorSpec } from '../world/floor';

const OPEN_DIST = 3.2;   // start opening within this distance of the doorway centre
const CLOSE_DIST = 5.5;  // a locked door may ask again once you are this far away
const SPEED = 2.8;       // fraction of the travel per second
const TRAVEL = 3.05;     // how far it slides up

export interface Door extends DoorSpec {
  open: number;          // 0 closed … 1 fully open
  wantOpen: boolean;
  /** Already refused this approach (so a locked door doesn't nag every frame). */
  refused: boolean;
  /** Shut by combat: projections in one of its rooms are still around. */
  sealed: boolean;
  /** Blown apart by a breakthrough: gone for good, never locks or seals again. */
  broken: boolean;
  mesh: THREE.Mesh;
  cx: number; cy: number; cz: number;
}

export class Doors {
  readonly list: Door[] = [];
  private group = new THREE.Group();
  private mats = new Map<DoorLook, THREE.Material>();

  constructor(private scene: THREE.Scene) { scene.add(this.group); }

  /** Adds a floor's doors (floors are activated one at a time). */
  add(specs: DoorSpec[]) {
    for (const s of specs) {
      const w = s.x1 - s.x0 + 1, h = s.y1 - s.y0 + 1, d = s.z1 - s.z0 + 1;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, h, d - 0.02), this.material(lookOf(s)));
      const cx = (s.x0 + s.x1 + 1) / 2, cy = (s.y0 + s.y1 + 1) / 2, cz = (s.z0 + s.z1 + 1) / 2;
      mesh.position.set(cx, cy, cz);
      this.group.add(mesh);
      this.list.push({ ...s, open: 0, wantOpen: false, refused: false, sealed: false, broken: false, mesh, cx, cy, cz });
    }
  }

  /** Seal or unseal every door of a room (combat). */
  seal(room: number, sealed: boolean) {
    for (const d of this.list) if (d.rooms.includes(room) && !d.broken) { d.sealed = sealed; if (sealed) d.refused = false; }
  }

  dispose() {
    this.scene.remove(this.group);
    for (const d of this.list) d.mesh.geometry.dispose();
  }

  private material(look: DoorLook) {
    let m = this.mats.get(look);
    if (!m) { m = new THREE.MeshLambertMaterial({ map: doorTexture(look) }); this.mats.set(look, m); }
    return m;
  }

  /** Is this cell blocked by a (mostly) closed door? */
  solidAt(x: number, y: number, z: number): boolean {
    for (const d of this.list) {
      if (d.broken || x < d.x0 || x > d.x1 || z < d.z0 || z > d.z1 || y < d.y0 || y > d.y1) continue;
      // the slab's bottom rises as it opens; doorway cells below it are free
      if (y + 1 > d.y0 + d.open * TRAVEL + 0.15) return true;
    }
    return false;
  }

  /** Is any part of the box inside a doorway? (doors never close on you) */
  private occupied(d: Door, px: number, py: number, pz: number, hw: number, h: number) {
    return px + hw > d.x0 && px - hw < d.x1 + 1 && pz + hw > d.z0 && pz - hw < d.z1 + 1 && py < d.y1 + 1 && py + h > d.y0;
  }

  /**
   * `request(door)` is asked once per approach when a door wants to open: it returns true to
   * let it open (and may consume a key), false to keep it shut.
   */
  update(dt: number, px: number, py: number, pz: number, hw: number, h: number, request: (d: Door) => boolean) {
    for (const d of this.list) {
      if (d.broken) continue;
      const dist = Math.hypot(px - d.cx, pz - d.cz);
      const near = dist < OPEN_DIST && Math.abs(py - d.y0) < 2.5;
      if (d.sealed) {
        // never shuts on you: it waits until you are out of the doorway
        if (!this.occupied(d, px, py, pz, hw, h)) d.wantOpen = false;
      } else if (!d.locked) {
        // an open room: its doors stand open (the game still hears about each opening)
        if (!d.wantOpen && request(d)) d.wantOpen = true;
      } else if (near && !d.wantOpen && !d.refused) {
        if (request(d)) d.wantOpen = true;
        else d.refused = true;
      }
      if (dist > CLOSE_DIST && d.locked) d.refused = false;
      const target = d.wantOpen ? 1 : 0;
      if (d.open !== target) {
        d.open = target > d.open ? Math.min(1, d.open + SPEED * dt) : Math.max(0, d.open - SPEED * dt);
        d.mesh.position.y = d.cy + d.open * TRAVEL;
      }
    }
  }

  /** A breakthrough blew the door apart: its slab is gone and its doorway stays open forever. */
  break(d: Door) {
    d.broken = true; d.sealed = false; d.locked = false; d.open = 1; d.wantOpen = true;
    d.mesh.visible = false;
  }

  /** Turns a locked door into a normal one (its look changes to what lies behind it). */
  unlock(d: Door) {
    d.locked = false;
    d.mesh.material = this.material(d.kind === 'vault' ? 'treasure' : d.kind === 'challenge' ? 'boss' : d.kind);
  }

  /** Doors whose doorway contains this cell (to block placing blocks there). */
  inDoorway(x: number, y: number, z: number) {
    return this.list.some(d => x >= d.x0 && x <= d.x1 && y >= d.y0 && y <= d.y1 && z >= d.z0 && z <= d.z1);
  }
}

function lookOf(s: DoorSpec): DoorLook {
  if (s.locked) return 'locked';
  return s.kind === 'vault' ? 'locked' : s.kind === 'challenge' ? 'boss' : s.kind;
}
