// Enemies are projections: patterns that block intention, given a body of cubes
// (docs/design/STORY.md §4). Like items, they are data plus code: a definition with stats,
// a cube model and a behaviour built by a factory (see behaviours.ts). One file per enemy
// in src/content/enemies/.

import type { PickupKind } from '../game/events';
import type { Body } from '../physics/voxel-collide';

/** One box of an enemy's cube model, relative to its feet. */
export interface ModelPart {
  size: [number, number, number];
  pos: [number, number, number];
  color: number;
  /** Unlit and bright (eyes, glows). */
  glow?: boolean;
  /** Tilt around X in radians (a hunched head, a pointing arm). */
  tilt?: number;
  name?: string;
}

export interface EnemyDef {
  id: string;
  name: string;
  /** The pattern it stands for (shown in the inventory's bestiary later). */
  pattern: string;
  hp: number;
  speed: number;
  /** Half-width and height of its box. */
  size: [number, number];
  /** Half-hearts dealt on touch. */
  contactDamage: number;
  model: ModelPart[];
  behaviour: Behaviour;
  /** Chance of each drop when it dissolves. */
  drops?: Partial<Record<PickupKind, number>>;
  /** Spawn budget cost and the earliest floor it appears on. */
  cost: number;
  minFloor: number;
  /** Optional extra reaction on death (e.g. splitting). */
  onDeath?(e: Enemy, ctx: EnemyCtx): void;
}

export interface Enemy {
  uid: number;
  def: EnemyDef;
  body: Body;
  hp: number;
  maxHp: number;
  speed: number;
  contactDamage: number;
  tags: Set<string>;
  /** Global id of the room it belongs to (it stays leashed to it). */
  room: number;
  /** Seconds left materialising: harmless and unhittable meanwhile. */
  spawning: number;
  /** Behaviour state machine slot and timer, free for the behaviour to use. */
  state: string;
  timer: number;
  /** Desired horizontal direction this frame (set by the behaviour). */
  wishX: number; wishZ: number;
  /** Visual-only: hit flash and scale pulse. */
  flash: number;
  pulse: number;
  alive: boolean;
}

/** What a behaviour can see and do. */
export interface EnemyCtx {
  dt: number;
  player: { x: number; y: number; z: number };
  /** Distance to the player, horizontally. */
  dist(e: Enemy): number;
  /** Direction to walk towards the player inside the room (flow field), or straight at them. */
  towardPlayer(e: Enemy): [number, number];
  /** Lob a projectile from the enemy towards a point. */
  shootAt(e: Enemy, x: number, y: number, z: number): void;
  /** Explode at the enemy (Panic). */
  burst(e: Enemy, radius: number): void;
  kill(e: Enemy): void;
}

export interface Behaviour {
  name: string;
  update(e: Enemy, ctx: EnemyCtx): void;
}

export const defineEnemy = (d: EnemyDef) => d;
