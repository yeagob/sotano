// Enemies are projections: patterns that block intention, given a body of cubes
// (docs/design/STORY.md §4). Like items, they are data plus code: a definition with stats,
// a cube model and a behaviour built by a factory (see behaviours.ts). One file per enemy
// in src/content/enemies/.

import type { PickupKind } from '../game/events';
import type { Actor } from '../entities/actors';
import type { ElementAffinity, ElementKey } from '../content/elements';

/** How a projection lives with one element: its affinity (content/elements.ts DEFAULT_AFFINITY
 *  fills what is left out) and an optional reaction when its body goes in. */
export type ElementSense = Partial<ElementAffinity> & {
  /** Called once when the projection's body enters the element. */
  enter?(e: Enemy): void;
};

/** One texel: creature boxes are whole texels (docs/art/DECISIONS.md §8.2). */
export const TX = 1 / 16;

/** One box of an enemy's cube model, relative to its feet. */
export interface ModelPart {
  size: [number, number, number];
  pos: [number, number, number];
  color: number;
  /** Unlit and bright (eyes, glows). */
  glow?: boolean;
  /** Tilt around X in radians (a hunched head, a pointing arm). */
  tilt?: number;
  /** Full rotation [x, y, z] in radians (overrides `tilt`). */
  rot?: [number, number, number];
  /** Attach to the first part with this name: `pos` and rotation become relative to it (eyes on a tilted head). */
  parent?: string;
  /** Named parts can be animated: legL/legR/armL/armR (walk), head; 'tell' and 'core' glow brighter as
   *  it winds up or swells (the telegraph, docs/art/DECISIONS.md §8.5). */
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
  /** Damage points dealt on touch (4 = half a heart to the player). */
  contactDamage: number;
  model: ModelPart[];
  behaviour: Behaviour;
  /** Chance of each drop when it dissolves. */
  drops?: Partial<Record<PickupKind, number>>;
  /** Spawn budget cost and the earliest floor it appears on. */
  cost: number;
  minFloor: number;
  /** How it reacts to, avoids or lives in each element (docs/architecture/ELEMENTS.md §9.3).
   *  Its meaning comes from the pattern: Panic calms in water and goes off in fire. */
  elements?: Partial<Record<ElementKey, ElementSense>>;
  /** Blocks it can smash when they stop it: any block of material tier ≤ `tier` (0 soft, 1 walls), at
   *  `power` block damage per second (docs/design/BESTIARY.md §3.3). Never lava, never unbreakable blocks. */
  breaks?: { tier: number; power: number };
  /** Optional extra reaction on death (e.g. splitting). */
  onDeath?(e: Enemy, ctx: EnemyCtx): void;
}

/** A projection: an actor with a definition, a behaviour and spawn-time numbers. */
export interface Enemy extends Actor {
  readonly kind: 'projection';
  /** The definition (`Actor.def` holds its id). */
  spec: EnemyDef;
  maxHp: number;
  speed: number;
  contactDamage: number;
  /** The actor it is after (−1: none) and seconds until it looks again (retargets at 4 Hz). */
  targetId: number;
  retarget: number;
  /** Behaviour state machine slot and timer, free for the behaviour to use. */
  state: string;
  /** False while it can't hurt by touch (Doubt before its reach telegraph ends). */
  armed: boolean;
  timer: number;
  /** Desired horizontal direction this frame (set by the behaviour). */
  wishX: number; wishZ: number;
  /** Speed multiplier from the element it stands in (1 on dry ground). */
  elemSpeed: number;
  /** The element its body is in now (null on dry ground), and seconds until the element can hurt it again. */
  inElement: ElementKey | null;
  elemT: number;
  /** Intention warmth, 0–1: positive intentions fill it, and at full warmth it turns to your side (combat/polarity.ts). */
  warmth: number;
  /** Visual-only: hit flash and scale pulse. */
  flash: number;
  pulse: number;
}

/** Where a target is (a snapshot for this frame). */
export interface TargetView { id: number; x: number; y: number; z: number }

/** What a behaviour can see and do. Behaviours never look for the player: they ask for their
 *  target, the nearest actor hostile to them (docs/architecture/ACTORS.md §4). */
export interface EnemyCtx {
  dt: number;
  /** The enemy's current target, or null (then it idles). */
  target(e: Enemy): TargetView | null;
  /** The nearest actor of the self (the player, its allies), whatever the enemy's side: peaceful
   *  creatures use it to keep you company. */
  near(e: Enemy): TargetView | null;
  /** Horizontal distance to a target. */
  dist(e: Enemy, t: TargetView): number;
  /** Direction to walk towards a target inside the room (flow field), or straight at it. */
  toward(e: Enemy, t: TargetView): [number, number];
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
