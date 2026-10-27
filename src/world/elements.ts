// The element simulation: water and lava flow, fire burns and spreads, elements react
// (docs/architecture/ELEMENTS.md §9.2, review in docs/reviews/elements.md). Only active cells are
// ticked (the Noita lesson): any change to a block or an element wakes the cell and its six
// neighbours; a cell that didn't change drops out. Fixed 10 Hz tick with a per-tick budget.
//
// Each tick reads the old state and writes a list of changes, applied afterwards in a fixed
// order (flows, then reactions, then fires catching), so the result never depends on the order
// cells were woken in.
//
// Flow is Minecraft-style and bounded: sources never change; a flowing cell takes its level from
// its neighbours, so it recedes when its source goes. A falling column keeps the level that fed it
// (it never refills), and fluids spread sideways only from cells resting on something solid or on
// a source of their own kind: a pool can never flood more than a source's reach, however far it falls.

import {
  CATCH_LEVEL, EL_FIRE, EL_LAVA, EL_NONE, EL_WATER, ELEMENTS, FIRE_DECAY, IGNITE_CHANCE, IGNITE_PER_TICK, SOURCE,
  elemByte, elemKind, elemLevel, isFalling, isSource, type ElementKey,
} from '../content/elements';
import { AIR, MAT, mat } from '../content/materials';
import { REACTIONS, type ReactionDef } from '../content/reactions';
import { hash3 } from '../core/rng';
import type { VoxelWorld } from './world';

export const ELEMENT_TICK = 0.1;
/** Cells processed per tick at most; the rest wait for the next tick. */
export const ELEMENT_BUDGET = 3000;
/** Ticks per frame at most (a long frame never runs a burst of ticks). */
const MAX_TICKS_PER_FRAME = 3;
const FIRE_DECAY_TICKS = Math.round(FIRE_DECAY / ELEMENT_TICK);

const N6: [number, number, number][] = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]];
const SIDE4 = N6.slice(0, 4);
const KEY: (ElementKey | null)[] = [null, 'water', 'lava', 'fire'];

/** What the simulation asks the game (events, damage pipeline, effects). */
export interface ElementHost {
  /** Seed for spread rolls (`fork('elements')`): each roll is a hash of (seed, cell, tick), so
   *  one fire never changes another's luck. */
  seed: number;
  /** Solid for fluids: blocks and closed doors. */
  blocked(x: number, y: number, z: number): boolean;
  /** A flammable block is about to catch (fire or lava). Return false if an item stopped it.
   *  On true the game breaks the block (kind 'fire') and the simulation leaves a flame there. */
  ignite(x: number, y: number, z: number, material: number, by: 'fire' | 'lava'): boolean;
  /** A reaction is about to happen at (x, y, z). Return the material it leaves (AIR for "gone"),
   *  or null if an item stopped it. */
  react(x: number, y: number, z: number, r: ReactionDef, result: number): number | null;
  /** Effects for a reaction, a catch or a flame going out (particles, sound). */
  fx(kind: 'steam' | 'hiss' | 'catch' | 'out', x: number, y: number, z: number): void;
}

interface Change { x: number; y: number; z: number; v: number; hiss?: boolean }
interface Reaction { x: number; y: number; z: number; r: ReactionDef; source: boolean }
interface Catch { x: number; y: number; z: number; m: number; by: 'fire' | 'lava' }

export class ElementSim {
  private active = new Set<number>();
  private acc = 0;
  private tick = 0;
  /** Cells processed on the last tick (debug HUD). */
  lastWork = 0;

  constructor(private world: VoxelWorld, private host: ElementHost) {
    world.onChange = (x, y, z) => this.wakeAround(x, y, z);
  }

  get pending() { return this.active.size; }

  wake(x: number, y: number, z: number) {
    if (this.world.inside(x, y, z)) this.active.add(this.world.idx(x, y, z));
  }

  wakeAround(x: number, y: number, z: number) {
    this.wake(x, y, z);
    for (const [dx, dy, dz] of N6) this.wake(x + dx, y + dy, z + dz);
  }

  /** Wakes every element cell in a box (a room that was just carved). */
  wakeBox(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) {
    const w = this.world;
    for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++)
      if (w.inside(x, y, z) && w.elem[w.idx(x, y, z)]) this.active.add(w.idx(x, y, z));
  }

  update(dt: number) {
    this.acc = Math.min(this.acc + dt, ELEMENT_TICK * MAX_TICKS_PER_FRAME);
    while (this.acc >= ELEMENT_TICK) {
      this.acc -= ELEMENT_TICK;
      this.step();
    }
  }

  /** One tick: read a sorted slice of the active set, then apply its changes. */
  step() {
    this.tick++;
    const w = this.world;
    const batch: number[] = [];
    for (const i of this.active) {
      if (batch.length >= ELEMENT_BUDGET) break;
      batch.push(i);
    }
    for (const i of batch) this.active.delete(i);
    batch.sort((a, b) => a - b);
    this.lastWork = batch.length;
    const changes: Change[] = [], reactions: Reaction[] = [], catches: Catch[] = [];
    const sx = w.sx, sxy = w.sx * w.sy;
    for (const i of batch) {
      const x = i % sx, y = Math.floor(i / sx) % w.sy, z = Math.floor(i / sxy);
      this.read(x, y, z, i, changes, reactions, catches);
    }
    // apply: flows, then reactions (they win over a flow into the same cell), then catches
    for (const c of changes) {
      if (c.hiss) this.host.fx('hiss', c.x, c.y, c.z);
      w.setElemByte(c.x, c.y, c.z, c.v);
    }
    const reacted = new Set<number>();
    for (const r of reactions) {
      const i = w.idx(r.x, r.y, r.z);
      if (reacted.has(i) || !w.elem[i]) continue;
      reacted.add(i);
      const key = r.source ? r.r.source : r.r.flow;
      const result = this.host.react(r.x, r.y, r.z, r.r, key ? MAT[key] : AIR);
      if (result === null) continue;
      w.setElemByte(r.x, r.y, r.z, 0);
      if (result !== AIR) w.set(r.x, r.y, r.z, result);
      this.host.fx(r.r.fx, r.x, r.y, r.z);
    }
    let caught = 0;
    for (const c of catches) {
      if (caught >= IGNITE_PER_TICK) { this.wakeAround(c.x, c.y, c.z); continue; }
      if (w.get(c.x, c.y, c.z) !== c.m) continue;
      if (!this.host.ignite(c.x, c.y, c.z, c.m, c.by)) continue;
      caught++;
      if (w.get(c.x, c.y, c.z) === AIR && !w.elemAt(c.x, c.y, c.z)) {
        w.setElem(c.x, c.y, c.z, EL_FIRE, CATCH_LEVEL);
        this.host.fx('catch', c.x, c.y, c.z);
      }
    }
  }

  private read(x: number, y: number, z: number, i: number, changes: Change[], reactions: Reaction[], catches: Catch[]) {
    const w = this.world;
    if (w.data[i] !== AIR) return;
    const b = w.elem[i], kind = elemKind(b), level = elemLevel(b);
    if (this.host.blocked(x, y, z) && !b) return; // a closed door holds fluids back
    // 1. flow: anything but a fluid source takes its state from its neighbours
    if (!(isSource(b) && (kind === EL_WATER || kind === EL_LAVA))) {
      const want = this.blocked(x, y, z) ? 0 : this.flowAt(x, y, z);
      // a fluid flowing into a flame takes its place; a flame never turns into "nothing" by flow
      const changesHere = kind === EL_FIRE ? want !== 0 : want !== b;
      if (changesHere) {
        // lava only moves on its own slower beat
        if ((elemKind(want) === EL_LAVA || kind === EL_LAVA) && this.tick % ELEMENTS[EL_LAVA]!.fluid!.every !== 0) {
          this.active.add(i);
          return;
        }
        changes.push({ x, y, z, v: want, hiss: kind === EL_FIRE });
        return;
      }
    }
    if (!kind) return;
    // 2. reactions with the six neighbours, always seen from the acting element's side
    if (kind === EL_WATER || kind === EL_LAVA) {
      for (const [dx, dy, dz] of N6) {
        const nx = x + dx, ny = y + dy, nz = z + dz, nb = w.elemAt(nx, ny, nz), nk = elemKind(nb);
        if (!nk || nk === kind) continue;
        let r = REACTIONS.find(q => q.a === KEY[kind] && q.b === KEY[nk]);
        if (r) { reactions.push({ x: nx, y: ny, z: nz, r, source: isSource(nb) }); continue; }
        r = REACTIONS.find(q => q.a === KEY[nk] && q.b === KEY[kind]);
        if (r) reactions.push({ x, y, z, r, source: isSource(b) });
      }
    }
    // 3. a flame needs something under it: break its block (a brazier's pillar, the crate it burns on) and it goes out
    if (kind === EL_FIRE && !this.blocked(x, y - 1, z)) {
      changes.push({ x, y, z, v: 0 });
      this.host.fx('out', x, y, z);
      return;
    }
    // 4. fire and lava light flammable neighbours; fire burns out
    if (kind === EL_FIRE || kind === EL_LAVA) {
      const by = kind === EL_FIRE ? 'fire' : 'lava';
      let fuel = false;
      for (let n = 0; n < 6; n++) {
        const [dx, dy, dz] = N6[n];
        const nx = x + dx, ny = y + dy, nz = z + dz, m = w.get(nx, ny, nz);
        if (m === AIR || !mat(m).flammable) continue;
        fuel = true;
        if (hash3(this.host.seed, i, this.tick, n) < IGNITE_CHANCE[by]) catches.push({ x: nx, y: ny, z: nz, m, by });
      }
      if (kind === EL_FIRE && level !== SOURCE) {
        this.active.add(i); // keeps burning down
        if (this.tick % FIRE_DECAY_TICKS === 0) {
          changes.push({ x, y, z, v: level <= 1 ? 0 : elemByte(EL_FIRE, level - 1) });
          if (level <= 1) this.host.fx('out', x, y, z);
        }
      } else if (fuel) this.active.add(i); // keeps rolling for its neighbours
    }
  }

  private blocked(x: number, y: number, z: number) {
    return this.host.blocked(x, y, z);
  }

  /** The fluid byte the empty or flowing cell (x, y, z) should hold, from its neighbours (0 = none). */
  private flowAt(x: number, y: number, z: number): number {
    const w = this.world;
    // falling: the same column keeps the level that fed it
    const above = w.elemAt(x, y + 1, z), ak = elemKind(above);
    let water = 0, lava = 0;
    if ((ak === EL_WATER || ak === EL_LAVA) && !this.blocked(x, y + 1, z)) {
      if (ak === EL_WATER) water = elemLevel(above); else lava = elemLevel(above);
      // a falling cell reports "falling" with the level that fed it
      return elemByte(ak, ak === EL_WATER ? water : lava, true);
    }
    for (const [dx, , dz] of SIDE4) {
      const nx = x + dx, nz = z + dz, nb = w.elemAt(nx, y, nz), nk = elemKind(nb);
      if (nk !== EL_WATER && nk !== EL_LAVA) continue;
      if (!this.rests(nx, y, nz, nk)) continue;
      const lv = elemLevel(nb) - ELEMENTS[nk]!.fluid!.drop;
      if (nk === EL_WATER) water = Math.max(water, lv); else lava = Math.max(lava, lv);
    }
    if (water <= 0 && lava <= 0) return 0;
    return water >= lava ? elemByte(EL_WATER, water) : elemByte(EL_LAVA, lava);
  }

  /** Can this fluid cell spread sideways? Only when it rests on something solid or on a source of its kind. */
  private rests(x: number, y: number, z: number, kind: number): boolean {
    if (this.blocked(x, y - 1, z)) return true;
    const below = this.world.elemAt(x, y - 1, z);
    return elemKind(below) === kind && isSource(below);
  }
}

/** True if a fluid cell is falling (for meshing and tests). */
export { isFalling, EL_NONE };
