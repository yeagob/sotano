// Actors: everything that has a body, health and a side (docs/architecture/ACTORS.md §3).
// The player and every projection are actors in one registry with one id space, so damage,
// contact, targeting and item effects work the same for any of them (clones and allies later).

import type { Body } from '../physics/voxel-collide';

export type ActorId = number;
export type ActorKind = 'player' | 'projection';
/** Sides (ACTORS.md §4). A projection that changes side becomes part of the self. */
export type Faction = 'self' | 'projection' | 'neutral';
/** Who caused something: an actor, or the world itself. */
export type Owner = ActorId | 'world';

/** Damage points per half-heart. Everything deals damage in points; the player shows hearts. */
export const HALF_HEART = 4;

/** Half-hearts a hit of `points` costs the player: rounded up, at least one (Isaac-style). */
export const halfHeartsFor = (points: number) => Math.max(1, Math.ceil(points / HALF_HEART - 1e-9));

export const hostile = (a: Faction, b: Faction) => a !== b && a !== 'neutral' && b !== 'neutral';

export interface Actor {
  readonly id: ActorId;
  readonly kind: ActorKind;
  /** 'player' or the projection's definition id. */
  readonly def: string;
  faction: Faction;
  body: Body;
  /** Health in points (in half-hearts when `halfHearts` is set: the player). */
  hp: number;
  halfHearts?: true;
  tags: Set<string>;
  /** Global id of the room it belongs to (−1: none). */
  room: number;
  alive: boolean;
  /** Seconds left materialising: harmless and unhittable meanwhile. */
  spawning: number;
}

export class ActorRegistry {
  private map = new Map<ActorId, Actor>();
  private next = 1;

  /** Forget everyone and restart ids (a new run). */
  reset() { this.map.clear(); this.next = 1; }

  newId(): ActorId { return this.next++; }

  add(a: Actor) { this.map.set(a.id, a); }

  remove(id: ActorId) { this.map.delete(id); }

  get(id: ActorId | 'world'): Actor | undefined { return id === 'world' ? undefined : this.map.get(id); }

  all(): IterableIterator<Actor> { return this.map.values(); }

  get size() { return this.map.size; }
}

/**
 * Rate limit for contact damage between two actors: one hit per pair per `gap` seconds.
 * Without it a touch would land every frame (and per-frame random rolls would depend on frame rate).
 */
export class ContactGate {
  private last = new Map<string, number>();
  constructor(private gap = 0.5) {}

  /** True if `a` may hit `b` at time `t` (and records it). */
  ready(a: ActorId, b: ActorId, t: number): boolean {
    const k = `${a}>${b}`, prev = this.last.get(k);
    if (prev !== undefined && t - prev < this.gap) return false;
    this.last.set(k, t);
    return true;
  }

  /** Forget an actor's pairs (when it is removed). */
  forget(id: ActorId) {
    for (const k of this.last.keys()) {
      const [a, b] = k.split('>');
      if (+a === id || +b === id) this.last.delete(k);
    }
  }

  clear() { this.last.clear(); }
}
