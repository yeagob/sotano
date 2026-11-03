// Actors: everything that has a body, health and a side (docs/architecture/ACTORS.md §3).
// The player and every projection are actors in one registry with one id space, so damage,
// contact, targeting and item effects work the same for any of them (clones and allies later).

import type { Body } from '../physics/voxel-collide';
import type { RealmKind } from '../sky/types';

export type ActorId = number;
/** 'sky': a sky creature (deity or minion, SKY.md §5.2). It has no health that can reach zero. */
export type ActorKind = 'player' | 'projection' | 'sky';
/** Sides (ACTORS.md §4). A projection that changes side becomes part of the self. */
export type Faction = 'self' | 'projection' | 'neutral';
/** Who caused something: an actor, or the world itself. */
export type Owner = ActorId | 'world';

/** Health is damage points for every actor. The player sees them as hearts of 8 points, drawn
 *  in quarters (2 points each), so even a small damage reduction shows and counts. */
export const HEART = 8;
export const HALF_HEART = HEART / 2;
export const QUARTER_HEART = HEART / 4;

/** Quarters (0–4) to draw in heart `i` (0-based) for `hp` points: a partly filled quarter shows as full. */
export const heartQuarters = (hp: number, i: number) => {
  const left = Math.max(0, Math.min(HEART, hp - i * HEART));
  return left > 0 ? Math.ceil(left / QUARTER_HEART - 1e-9) : 0;
};

export const hostile = (a: Faction, b: Faction) => a !== b && a !== 'neutral' && b !== 'neutral';

export interface Actor {
  readonly id: ActorId;
  readonly kind: ActorKind;
  /** 'player' or the projection's definition id. */
  readonly def: string;
  faction: Faction;
  body: Body;
  /** Health in damage points. */
  hp: number;
  tags: Set<string>;
  /** Global id of the room it belongs to (−1: none). */
  room: number;
  alive: boolean;
  /** Seconds left materialising: harmless and unhittable meanwhile. */
  spawning: number;
}

/**
 * One registry and one id space for both worlds (SKY.md §2.2). Each actor belongs to a realm; `all()`
 * yields the player and the active realm's actors only, so a blast in the sky never touches a dungeon
 * projection that happens to stand at the same numbers. `get` is by id and does not filter.
 */
export class ActorRegistry {
  private map = new Map<ActorId, Actor>();
  private realmOf = new Map<ActorId, RealmKind>();
  private active: RealmKind = 'dungeon';
  private next = 1;

  /** Forget everyone, restart ids and the active realm (a new run). */
  reset() { this.map.clear(); this.realmOf.clear(); this.active = 'dungeon'; this.next = 1; }

  newId(): ActorId { return this.next++; }

  /** Adds an actor to a realm (the dungeon unless said otherwise). */
  register(a: Actor, realm: RealmKind = 'dungeon') {
    this.map.set(a.id, a);
    this.realmOf.set(a.id, realm);
  }

  add(a: Actor) { this.register(a); }

  remove(id: ActorId) { this.map.delete(id); this.realmOf.delete(id); }

  get(id: ActorId | 'world'): Actor | undefined { return id === 'world' ? undefined : this.map.get(id); }

  /** The realm an actor was registered in, or undefined if it is not registered. */
  realm(id: ActorId): RealmKind | undefined { return this.realmOf.get(id); }

  /** The realm the game is in now. Actors of the other realm are hidden from `all()`. */
  get activeRealm(): RealmKind { return this.active; }

  setRealm(kind: RealmKind) { this.active = kind; }

  /** The player (in either realm) and the actors of the active realm. */
  *all(): IterableIterator<Actor> {
    for (const a of this.map.values()) {
      if (a.kind === 'player' || this.realmOf.get(a.id) === this.active) yield a;
    }
  }

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
