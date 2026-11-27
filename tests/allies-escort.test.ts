// Issue #327: allies move without getting in the player's way. A headless room (as the other enemy tests),
// a scripted player, and the thresholds of MOVEMENT.md checked tick by tick at 60 Hz. Each scenario also
// runs with no escort (the dungeon before #327) so the findings in the doc can be reproduced. Every
// threshold of the issue's criteria is in the block below, and nowhere else.
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import * as THREE from 'three';
import { Enemies, type EnemyHost } from '../src/entities/enemies';
import { ENEMY_BY_ID } from '../src/content/enemies';
import { CREATURE_BY_ID } from '../src/content/creatures';
import type { Actor } from '../src/entities/actors';
import { birthHp, type Enemy } from '../src/enemies/types';
import { FlowField, type RoomArea } from '../src/enemies/flowfield';
import { setScale } from '../src/entities/growth';
import {
  ALLY_PUSH, DOOR_WALK_TIME, FOLLOW_FAR, FOLLOW_NEAR, PLAYER_PUSH, TELEPORT_RADIUS, boxGap, entrySpot, grounded, holdLedge, isAlly, keepClear, laneSide,
  narrow, nudgePlayer, overlaps, spacing, stepOf, yieldStep,
} from '../src/enemies/escort';
import type { EnemyDef } from '../src/enemies/types';
import type { Tier } from '../src/enemies/tiers';
import type { RoomInfo } from '../src/world/floor';
import { buildRun } from './helpers';

const ROOM: RoomArea = { id: 0, x0: 0, y0: 0, z0: 0, w: 13, d: 7, hx: 0, hz: 0 };
const TICK = 1 / 60;
/** The thresholds (MOVEMENT.md, "Allies and the player"). */
const MAX_OVERLAP_TICKS = 12;
const MAX_DOORWAY_TICKS = 60;
/** A five-block corridor: the doorway allowance plus the time a Doubt (1.7 blocks/s) needs to walk out of its middle. */
const MAX_CORRIDOR_TICKS = 150;
const MAX_LANE_TICKS = 45;
const MAX_REACH_TICKS = 600;
const SETTLE_TICKS = 300;
/** Criterion 1: an ally may overlap the player a little, but never stands this deep inside its box (blocks, in plan)... */
const INSIDE_DEPTH = 0.2;
/** ...for longer than this (0.5 s). */
const MAX_INSIDE_TICKS = 30;
/** Criterion 6: after a door crossing, an ally that was near the player is inside the new room within this (0.5 s)... */
const MAX_CROSS_TICKS = 30;
/** ...and one further away within the walk allowance and one second more. */
const MAX_LATE_CROSS_TICKS = DOOR_WALK_TIME * 60 + 60;
/** Criterion 8: following allies keep at least this between their centres (blocks); a Doubt is 0.64 wide, so a little overlap is allowed. */
const MIN_SPACING = 0.5;

type Blocks = (x: number, y: number, z: number) => boolean;
const flat: Blocks = (_x, y) => y < 0;

interface Script {
  solid?: Blocks; px: number; py?: number; pz: number; aim?: [number, number, number]; walk?: [number, number]; until?: number;
  rooms?: RoomArea[]; unsafe?: Blocks;
}

function rig(s: Script, escort: boolean) {
  const solid = s.solid ?? flat;
  const player = {
    id: 1, kind: 'player', def: 'player', faction: 'self', hp: 24, tags: new Set<string>(), room: 0, alive: true, spawning: 0,
    body: { x: s.px, y: s.py ?? 0, z: s.pz, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true },
  } as Actor;
  const actors: Actor[] = [player];
  const host = {
    solid, worldVersion: () => 0, actors: () => actors, actor: (id: number) => actors.find(a => a.id === id),
    room: (id: number) => s.rooms?.find(r => r.id === id) ?? ROOM, elemVersion: () => 0, pickupsIn: () => [],
    hazard: () => null, contact: () => {}, practices: () => [], health: () => 48, bombs: () => 0, placeBomb: () => {}, rng: () => new Rng(1), projectileHit: () => {}, projectileBlock: () => false,
    smash: () => false, burst: () => {}, died: () => {}, particles: () => {}, hurtActor: () => {},
    affectActor: () => {}, arena: () => {}, summon: () => {}, cue: () => {}, quake: () => {}, drop: () => {},
  } as EnemyHost;
  const aim = s.aim ?? [0, 0, -1];
  const state = { settled: false };
  const en = new Enemies(new THREE.Scene(), host, escort ? {
    player: () => ({ id: 1, room: player.room, body: player.body, eye: 1.6, aim }),
    settled: () => state.settled,
    unsafe: s.unsafe,
  } : undefined);
  let next = 10;
  const add = (def: string | EnemyDef, x: number, y: number, z: number, faction: Actor['faction'], room = 0, tier: Tier = 'black') => {
    const d = typeof def === 'string' ? ENEMY_BY_ID.get(def) ?? CREATURE_BY_ID.get(def)! : def;
    const e = en.spawn(d, next++, room, x, y, z, birthHp(d), d.speed, d.contactDamage, new Set(CREATURE_BY_ID.has(d.id) ? ['creature'] : []), tier);
    e.spawning = 0; e.faction = faction;
    actors.push(e);
    return e;
  };
  /** One tick: the player walks its script (straight, through nothing but blocks), then the beings move. */
  const tick = () => {
    const b = player.body, [vx, vz] = s.walk ?? [0, 0];
    const going = s.until === undefined || (vx ? (vx > 0 ? b.x < s.until : b.x > s.until) : (vz > 0 ? b.z < s.until : b.z > s.until));
    b.vx = going ? vx : 0; b.vz = going ? vz : 0;
    b.x += b.vx * TICK; b.z += b.vz * TICK;
    en.update(TICK);
  };
  return { en, add, tick, player, solid, state, actors };
}

/** Longest run of consecutive ticks for which `bad` held, over `ticks` ticks. */
function longest(tick: () => void, ticks: number, bad: () => boolean) {
  let run = 0, worst = 0;
  for (let i = 0; i < ticks; i++) { tick(); run = bad() ? run + 1 : 0; worst = Math.max(worst, run); }
  return worst;
}

const ally = (r: ReturnType<typeof rig>, x: number, z: number, y = 0) => r.add('doubt', x, y, z, 'self');
const approached = (r: ReturnType<typeof rig>, e: Enemy) => {
  const p = r.player.body, dx = e.body.x - p.x, dz = e.body.z - p.z, l = Math.hypot(dx, dz) || 1;
  return l <= 4 && (p.vx * dx + p.vz * dz) / l > 0.5;
};

// The scenarios of the investigation. Each returns what the doc records.
const corridorWalls: Blocks = (x, y, z) => y < 0 || (x >= 4 && x <= 8 && z !== 3 && y < 4);
const doorWall: Blocks = (x, y, z) => y < 0 || (x === 6 && z !== 3 && y < 4);
const pit = (deep: number): Blocks => (x, y, z) => (x >= 3 && x <= 5 && z >= 2 && z <= 4 ? y < -deep : y < 0);

const scenarios = {
  /** The player walks across the room, straight through where an idle ally stands. */
  walkThrough(escort: boolean) {
    const r = rig({ px: 1.5, pz: 3.5, walk: [3, 0], until: 11.5 }, escort);
    const e = ally(r, 6.5, 3.5);
    const overlap = longest(r.tick, 300, () => overlaps(e.body, r.player.body));
    return { overlap, distance: Math.hypot(e.body.x - r.player.body.x, e.body.z - r.player.body.z) };
  },
  /** As walkThrough, with a friendly creature love shots have grown to twice its size. */
  grownWalkThrough(escort: boolean) {
    const r = rig({ px: 1.5, pz: 3.5, walk: [3, 0], until: 11.5 }, escort);
    const e = r.add('huddler', 6.5, 0, 3.5, 'neutral');
    setScale(e, 2);
    return { overlap: longest(r.tick, 300, () => overlaps(e.body, r.player.body)) };
  },
  /** The ally's target stands beyond the player, who stands still in the open. */
  hostileBehind(escort: boolean) {
    const r = rig({ px: 6.5, pz: 3.5, aim: [-1, 0, 0] }, escort);
    const e = ally(r, 2.5, 3.5);
    const h = r.add('doubt', 10.5, 0, 3.5, 'projection');
    h.frozen = 1e9;
    let overlap = 0, worst = 0, reached = -1;
    for (let i = 0; i < 900; i++) {
      r.tick();
      overlap = overlaps(e.body, r.player.body) ? overlap + 1 : 0; worst = Math.max(worst, overlap);
      if (reached < 0 && boxGap(e.body, h.body) <= 0.3) reached = i + 1;
    }
    return { overlap: worst, reached };
  },
  /** An idle ally inside a five-block corridor one block wide; the player walks through it. */
  corridor(escort: boolean) {
    const r = rig({ solid: corridorWalls, px: 0.5, pz: 3.5, walk: [3, 0], until: 12.5 }, escort);
    const e = ally(r, 6.5, 3.5);
    let overlap = 0, doorway = 0, wo = 0, wd = 0;
    for (let i = 0; i < 300; i++) {
      r.tick();
      overlap = overlaps(e.body, r.player.body) ? overlap + 1 : 0; wo = Math.max(wo, overlap);
      doorway = narrow(r.solid, e.body.x, e.body.y, e.body.z) && approached(r, e) ? doorway + 1 : 0; wd = Math.max(wd, doorway);
    }
    return { overlap: wo, doorway: wd };
  },
  /** An idle ally in a one-block doorway in a wall across the room; the player walks through the doorway. */
  doorway(escort: boolean) {
    const r = rig({ solid: doorWall, px: 1.5, pz: 3.5, walk: [3, 0], until: 11.5 }, escort);
    const e = ally(r, 6.5, 3.5);
    let overlap = 0, doorway = 0, wo = 0, wd = 0;
    for (let i = 0; i < 300; i++) {
      r.tick();
      overlap = overlaps(e.body, r.player.body) ? overlap + 1 : 0; wo = Math.max(wo, overlap);
      doorway = narrow(r.solid, e.body.x, e.body.y, e.body.z) && approached(r, e) ? doorway + 1 : 0; wd = Math.max(wd, doorway);
    }
    return { overlap: wo, doorway: wd };
  },
  /** An ally at the bottom of a pit, the player across the room with nothing hostile about. */
  pit(escort: boolean, deep: number) {
    const r = rig({ solid: pit(deep), px: 10.5, pz: 3.5 }, escort);
    const e = ally(r, 4.5, 3.5, -deep);
    let out = -1;
    for (let i = 0; i < 600 && out < 0; i++) { r.tick(); if (Math.hypot(e.body.x - 10.5, e.body.z - 3.5) <= FOLLOW_FAR + 0.5) out = i + 1; }
    return { out, y: e.body.y };
  },
  /** The player stands and aims along +x; an ally stands three blocks ahead, in the line of its shots. */
  lineOfFire(escort: boolean) {
    const r = rig({ px: 2.5, pz: 3.5, aim: [1, 0, 0] }, escort);
    const e = ally(r, 5.5, 3.5);
    const lane = longest(r.tick, 300, () => laneSide(e.body, 2.5, 1.6, 3.5, [1, 0, 0], 10) !== 0);
    return { lane, distance: Math.hypot(e.body.x - 2.5, e.body.z - 3.5) };
  },
  /** No hostile in the room, the ally far off: where it is after SETTLE_TICKS. */
  follow(escort: boolean) {
    const r = rig({ px: 10.5, pz: 3.5, aim: [0, 0, -1] }, escort);
    const e = ally(r, 1.5, 1.5);
    for (let i = 0; i < SETTLE_TICKS; i++) r.tick();
    return { distance: Math.hypot(e.body.x - 10.5, e.body.z - 3.5) };
  },
};

describe('allies and the player (#327): the thresholds', () => {
  it('an idle ally the player walks through overlaps its box for no more than MAX_OVERLAP_TICKS in a row', () => {
    const { overlap, distance } = scenarios.walkThrough(true);
    expect(overlap).toBeLessThanOrEqual(MAX_OVERLAP_TICKS);
    expect(distance).toBeGreaterThanOrEqual(FOLLOW_NEAR - 0.5);
  });

  it('a grown friendly creature keeps clear of the player walking at it', () => {
    expect(scenarios.grownWalkThrough(true).overlap).toBeLessThanOrEqual(MAX_OVERLAP_TICKS);
  });

  it('an ally walks round the player to a target beyond it, never through it, and reaches it in time', () => {
    const { overlap, reached } = scenarios.hostileBehind(true);
    expect(overlap).toBe(0);
    expect(reached).toBeGreaterThan(0);
    expect(reached).toBeLessThanOrEqual(MAX_REACH_TICKS);
  });

  it('an ally leaves a one-block corridor the player walks toward', () => {
    const { overlap, doorway } = scenarios.corridor(true);
    expect(doorway).toBeLessThanOrEqual(MAX_CORRIDOR_TICKS);
    expect(overlap).toBeLessThanOrEqual(MAX_OVERLAP_TICKS);
  });

  it('an ally leaves a one-block doorway the player walks toward', () => {
    const { overlap, doorway } = scenarios.doorway(true);
    expect(doorway).toBeLessThanOrEqual(MAX_DOORWAY_TICKS);
    expect(overlap).toBeLessThanOrEqual(MAX_OVERLAP_TICKS);
  });

  it('an ally steps out of the line of the player\'s shots', () => {
    const { lane } = scenarios.lineOfFire(true);
    expect(lane).toBeLessThanOrEqual(MAX_LANE_TICKS);
  });

  it('with nothing hostile in the room an ally comes to the player and stops at the set distance', () => {
    const { distance } = scenarios.follow(true);
    expect(distance).toBeGreaterThanOrEqual(FOLLOW_NEAR - 0.5);
    expect(distance).toBeLessThanOrEqual(FOLLOW_FAR + 0.5);
  });

  it('an ally climbs out of a pit one block deep to follow the player', () => {
    const { out } = scenarios.pit(true, 1);
    expect(out).toBeGreaterThan(0);
    expect(out).toBeLessThanOrEqual(MAX_REACH_TICKS);
  });
});

describe('allies and the player (#327): before the escort (the findings)', () => {
  it('an idle ally stood still and the player walked through it', () => {
    expect(scenarios.walkThrough(false).overlap).toBeGreaterThan(MAX_OVERLAP_TICKS);
    expect(scenarios.follow(false).distance).toBeGreaterThan(FOLLOW_FAR + 4);
  });

  it('an ally walked through the player on its way to a target', () => {
    expect(scenarios.hostileBehind(false).overlap).toBeGreaterThan(MAX_OVERLAP_TICKS);
  });

  it('an ally stayed in the line of the player\'s shots', () => {
    expect(scenarios.lineOfFire(false).lane).toBe(300);
  });
});

describe('the escort is for allies only', () => {
  it('only projections on the player\'s side and grown friendly creatures are allies', () => {
    const r = rig({ px: 6.5, pz: 3.5 }, true);
    const converted = ally(r, 2.5, 2.5);
    const hostile = r.add('doubt', 3.5, 0, 3.5, 'projection');
    const creature = r.add('huddler', 4.5, 0, 4.5, 'neutral');
    expect(isAlly(converted)).toBe(true);
    expect(isAlly(hostile)).toBe(false);
    expect(isAlly(creature)).toBe(false);
    setScale(creature, 1.5);
    expect(isAlly(creature)).toBe(true);
  });

  it('a hostile projection walks the same path with and without the escort', () => {
    const path = (escort: boolean) => {
      const r = rig({ solid: doorWall, px: 10.5, pz: 1.5 }, escort);
      const h = r.add('doubt', 2.5, 0, 5.5, 'projection');
      const out: number[] = [];
      for (let i = 0; i < 240; i++) { r.tick(); out.push(h.body.x, h.body.z); }
      return out;
    };
    expect(path(true)).toEqual(path(false));
  });

  it('a flow field without a soft cost is the field it always was', () => {
    const a = new FlowField(ROOM), b = new FlowField(ROOM);
    a.update(doorWall, 10, 1, 'v'); b.update(doorWall, 10, 1, 'v', () => null, () => 0);
    for (let x = 0; x < 13; x++) for (let z = 0; z < 7; z++) expect(a.direction(x + 0.5, z + 0.5)).toEqual(b.direction(x + 0.5, z + 0.5));
  });
});

describe('the escort rules', () => {
  const body = (x: number, z: number) => ({ x, y: 0, z, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.6, onGround: true });

  it('keepClear takes out the part of a wish that walks into the player, and pushes away inside the gap', () => {
    const [wx] = keepClear(body(1, 0), body(0, 0), [-1, 0]);
    expect(wx).toBeGreaterThan(0);
    expect(keepClear(body(3, 0), body(0, 0), [-1, 0])).toEqual([-1, 0]);
  });

  it('narrow finds doorways and corridors, not cells against one wall', () => {
    expect(narrow(doorWall, 6.5, 0, 3.5)).toBe(true);
    expect(narrow(corridorWalls, 6.5, 0, 3.5)).toBe(true);
    expect(narrow(doorWall, 5.5, 0, 3.5)).toBe(false);
    expect(narrow(flat, 0.5, 0, 0.5)).toBe(false);
  });

  it('yieldStep leads out of a doorway on the side away from the player', () => {
    const step = yieldStep(doorWall, body(6.5, 3.5), { ...body(4.5, 3.5), vx: 3 }, [-1, -1, 13, 7])!;
    expect(step[0]).toBeGreaterThan(0);
    expect(yieldStep(doorWall, body(3.5, 3.5), body(1.5, 3.5), [-1, -1, 13, 7])).toBeNull();
  });
});

describe.skip('investigation numbers (run by hand to reprint the table in MOVEMENT.md)', () => {
  it('prints', () => {
    for (const escort of [false, true]) {
      console.log(escort ? 'with escort' : 'before', JSON.stringify({
        walkThrough: scenarios.walkThrough(escort), grown: scenarios.grownWalkThrough(escort), hostileBehind: scenarios.hostileBehind(escort),
        corridor: scenarios.corridor(escort), doorway: scenarios.doorway(escort),
        pit1: scenarios.pit(escort, 1), pit2: scenarios.pit(escort, 2),
        lineOfFire: scenarios.lineOfFire(escort), follow: scenarios.follow(escort),
      }));
    }
  });
});

// ───────────────────────── export v1 and the owner's floor rule (#327, criteria 1 and 6 to 10) ─────────────────────────

/** The climber rule on the body every test here knows (the kinds marked climber are listed in MOVEMENT.md). */
const climbingDoubt: EnemyDef = { ...ENEMY_BY_ID.get('doubt')!, climber: true };
const centres = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z);
/** How deep two boxes overlap in plan (blocks; zero or less when they do not). */
const depth = (a: Enemy['body'], b: Enemy['body']) => Math.min(a.hw + b.hw - Math.abs(a.x - b.x), a.hw + b.hw - Math.abs(a.z - b.z));

describe('criterion 1: a little overlap, never inside the player, never a shove off a ledge or into an element', () => {
  it('three allies set down inside the player\'s box are out of it in time', () => {
    const r = rig({ px: 6.5, pz: 3.5 }, true);
    const es = [ally(r, 6.5, 3.5), ally(r, 6.6, 3.4), ally(r, 6.4, 3.6)];
    const inside = longest(r.tick, 300, () => es.some(e => overlaps(e.body, r.player.body) && depth(e.body, r.player.body) > INSIDE_DEPTH));
    expect(inside).toBeLessThanOrEqual(MAX_INSIDE_TICKS);
  });

  it('an ally walking into the player shoves it a little on open ground', () => {
    const r = rig({ px: 6.5, pz: 3.5 }, true);
    const e = ally(r, 6.1, 3.5);
    for (let i = 0; i < 30; i++) { e.body.x = r.player.body.x - 0.4; e.body.z = 3.5; e.body.vx = 3; r.tick(); }
    if (PLAYER_PUSH > 0) expect(r.player.body.x).toBeGreaterThan(6.5);
    expect(r.player.body.x - 6.5).toBeLessThanOrEqual(30 * TICK * 3 * PLAYER_PUSH + 1e-9);
  });

  it('the shove never takes the ground from under the player, nor puts its box over an element', () => {
    const ledge: Blocks = (x, y) => y < 0 && x <= 6;
    const r = rig({ solid: ledge, px: 6.75, pz: 3.5 }, true);
    const e = ally(r, 6.35, 3.5);
    for (let i = 0; i < 120; i++) {
      e.body.x = r.player.body.x - 0.4; e.body.y = 0; e.body.z = 3.5; e.body.vx = 3; r.tick();
      expect(ledge(Math.floor(r.player.body.x), -1, 3)).toBe(true);
    }
    const water: Blocks = x => x >= 8;
    const w = rig({ px: 7.5, pz: 3.5, unsafe: water }, true);
    const f = ally(w, 7.1, 3.5);
    for (let i = 0; i < 120; i++) {
      f.body.x = w.player.body.x - 0.4; f.body.z = 3.5; f.body.vx = 3; w.tick();
      expect(w.player.body.x + w.player.body.hw).toBeLessThan(8);
    }
  });

  it('nudgePlayer refuses a player in the air, a wall, a ledge and an element', () => {
    const b = (x: number, onGround = true) => ({ x, y: 0, z: 3.5, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround });
    const none = () => false;
    expect(nudgePlayer(flat, none, b(5.5), 0.1, 0)).toBe(true);
    expect(nudgePlayer(flat, none, b(5.5, false), 0.1, 0)).toBe(false);
    expect(nudgePlayer((x, y) => y < 0 || x === 6, none, b(5.65), 0.1, 0)).toBe(false);
    expect(nudgePlayer((x, y) => y < 0 && x <= 5, none, b(5.95), 0.1, 0)).toBe(false);
    expect(nudgePlayer(flat, x => x >= 6, b(5.65), 0.1, 0)).toBe(false);
  });
});

describe('criterion 6: allies come through the door with the player', () => {
  const A: RoomArea = { id: 0, x0: 0, y0: 0, z0: 0, w: 13, d: 7, hx: 0, hz: 0 };
  const B: RoomArea = { id: 1, x0: 14, y0: 0, z0: 0, w: 13, d: 7, hx: 14, hz: 0 };
  const wall: Blocks = (x, y, z) => y < 0 || (x === 13 && z !== 3 && y < 4);
  /** The player walks from room A through the door at x = 13 into room B; the crossing is the game's (Game.trackPlace). */
  function crossing(settled = false) {
    const r = rig({ solid: wall, rooms: [A, B], px: 10.5, pz: 3.5, walk: [3, 0], until: 19.5 }, true);
    const near = [ally(r, 6.5, 1.5), ally(r, 5.5, 5.5)];
    const far = ally(r, 1.5, 0.5);
    const other = r.add('huddler', 2.5, 0, 6.5, 'neutral');
    r.state.settled = settled;
    let crossed = -1;
    const inB = (e: Enemy) => e.room === 1 && e.body.x >= 14 && e.body.x <= 27;
    const when = new Map<Enemy, number>();
    for (let i = 0; i < MAX_LATE_CROSS_TICKS + 120; i++) {
      r.tick();
      if (crossed < 0 && r.player.body.x > 13.5) {
        crossed = i;
        if (!settled) expect(near.every(e => centres(e.body, r.player.body) <= TELEPORT_RADIUS)).toBe(true);
        expect(centres(far.body, r.player.body)).toBeGreaterThan(TELEPORT_RADIUS);
        r.player.room = 1;
        r.en.crossDoor(0, 1);
      }
      for (const e of [...near, far]) if (crossed >= 0 && !when.has(e) && inB(e)) when.set(e, i - crossed);
    }
    return { near: near.map(e => when.get(e) ?? Infinity), far: when.get(far) ?? Infinity, other, r, all: [...near, far] };
  }

  it('an ally near the player is inside the new room within MAX_CROSS_TICKS, one further off within the walk allowance', () => {
    const { near, far, other, r, all } = crossing();
    for (const t of near) expect(t).toBeLessThanOrEqual(MAX_CROSS_TICKS);
    expect(far).toBeLessThanOrEqual(MAX_LATE_CROSS_TICKS);
    // set down on the floor, clear of the player and of each other; a being that is no ally stays where it was
    for (const e of all) expect(e.body.y).toBe(0);
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) expect(centres(all[i].body, all[j].body)).toBeGreaterThanOrEqual(MIN_SPACING);
    expect(other.room).toBe(0);
    expect(r.en.list.filter(e => e.room === 1).length).toBe(3);
  });

  it('on a settled floor nobody comes through', () => {
    const { near, far } = crossing(true);
    expect([...near, far].every(t => t === Infinity)).toBe(true);
  });

  it('entrySpot sets a body down inside the door, on the floor, clear of the player and of the bounds', () => {
    const player = { x: 14.2, y: 0, z: 3.5, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
    const at = entrySpot(wall, () => false, player, [1, 0], 0.32, 1.6, [player], [14, 0, 27, 7])!;
    expect(at.x).toBeGreaterThan(14.5);
    expect(at.y).toBe(0);
    expect(centres(at, player)).toBeGreaterThanOrEqual(0.62);
    expect(entrySpot(wall, () => true, player, [1, 0], 0.32, 1.6, [player], [14, 0, 27, 7])).toBeNull();
  });
});

describe('criterion 7: every ally steps up one block, a climber two', () => {
  const rise = (h: number): Blocks => (x, y) => y < 0 || (x >= 7 && y < h);
  function climb(def: EnemyDef | string, h: number) {
    const r = rig({ solid: rise(h), px: 11.5, py: h, pz: 3.5 }, true);
    const e = r.add(def, 2.5, 0, 3.5, 'self');
    let up = -1;
    for (let i = 0; i < MAX_REACH_TICKS && up < 0; i++) { r.tick(); if (e.body.onGround && e.body.y >= h - 0.01) up = i + 1; }
    return up;
  }

  it('a walking ally steps up a one-block rise to follow the player', () => {
    expect(climb('doubt', 1)).toBeGreaterThan(0);
  });

  it('a climber steps up two blocks; an ally that is not one stays below', () => {
    expect(climb(climbingDoubt, 2)).toBeGreaterThan(0);
    expect(climb('doubt', 2)).toBe(-1);
  });

  it('a climber climbs out of a pit two blocks deep with sheer walls', () => {
    const r = rig({ solid: pit(2), px: 10.5, pz: 3.5 }, true);
    const e = r.add(climbingDoubt, 4.5, -2, 3.5, 'self');
    let out = -1;
    for (let i = 0; i < MAX_REACH_TICKS && out < 0; i++) { r.tick(); if (e.body.y >= -0.01 && centres(e.body, r.player.body) <= FOLLOW_FAR + 0.5) out = i + 1; }
    expect(out).toBeGreaterThan(0);
  });

  it('the climber kinds are data, and a hostile of a climber kind keeps the one-block field', () => {
    const climbers = [...ENEMY_BY_ID.values()].filter(d => d.climber).map(d => d.id).sort();
    expect(climbers).toEqual(['impulse', 'scarcity', 'shortcut']);
    const path = (escort: boolean) => {
      const r = rig({ solid: rise(2), px: 11.5, py: 2, pz: 3.5 }, escort);
      const h = r.add(climbingDoubt, 2.5, 0, 3.5, 'projection');
      const out: number[] = [];
      for (let i = 0; i < 240; i++) { r.tick(); out.push(h.body.x, h.body.y, h.body.z); }
      return out;
    };
    expect(path(true)).toEqual(path(false));
    expect(stepOf({ spec: climbingDoubt } as Enemy)).toBe(2);
  });
});

describe('criterion 8: following allies keep their spacing and do not fall', () => {
  it('four allies that start in a heap follow the player and spread to MIN_SPACING', () => {
    const r = rig({ px: 10.5, pz: 3.5 }, true);
    const es = [ally(r, 1.5, 1.5), ally(r, 1.6, 1.5), ally(r, 1.5, 1.6), ally(r, 1.7, 1.7)];
    let closest = Infinity;
    for (let i = 0; i < 600; i++) {
      r.tick();
      if (i < 480) continue;
      for (let a = 0; a < es.length; a++) for (let b = a + 1; b < es.length; b++) closest = Math.min(closest, centres(es[a].body, es[b].body));
    }
    expect(closest).toBeGreaterThanOrEqual(MIN_SPACING);
    for (const e of es) expect(centres(e.body, r.player.body)).toBeLessThanOrEqual(FOLLOW_FAR + 1.5);
  });

  it('a knock toward a ledge does not drop an ally; a hostile knocked the same way falls', () => {
    const ledge: Blocks = (x, y) => y < 0 && x <= 6;
    const knock = (escort: boolean, faction: Actor['faction']) => {
      const r = rig({ solid: ledge, px: 2.5, pz: 3.5 }, escort);
      const e = r.add('doubt', 6.6, 0, 3.5, faction);
      if (faction === 'projection') e.frozen = 1e9;
      for (let i = 0; i < 120; i++) { if (i % 20 === 0) e.body.vx += 4; r.tick(); }
      return e.alive ? e.body.y : -Infinity;
    };
    expect(knock(true, 'self')).toBe(0);
    expect(knock(true, 'projection')).toBeLessThan(-1);
  });

  it('grounded reads ground within the step under any part of the box, and holdLedge undoes a move off the edge', () => {
    const cliff: Blocks = (x, y) => (x <= 6 ? y < 0 : x === 7 ? y < -1 : x === 8 ? y < -2 : y < -3);
    expect(grounded(cliff, 7.5, 0, 3.5, 0.32, 1)).toBe(true);
    expect(grounded(cliff, 8.5, 0, 3.5, 0.32, 1)).toBe(false);
    expect(grounded(cliff, 8.5, 0, 3.5, 0.32, 2)).toBe(true);
    expect(grounded(cliff, 9.5, 0, 3.5, 0.32, 2)).toBe(false);
    expect(grounded(cliff, 8.9, 0, 3.5, 0.32, 1)).toBe(false);
    const sheer: Blocks = (x, y) => y < 0 && x <= 6;
    const b = { x: 7.4, y: -0.2, z: 3.9, vx: 2, vy: -3, vz: 1, hw: 0.32, h: 1.6, onGround: false };
    holdLedge(sheer, b, { x: 6.9, y: 0, z: 3.5 }, 1);
    expect([b.x, b.y, b.z, b.vx]).toEqual([6.9, 0, 3.9, 0]);
    expect(b.onGround).toBe(true);
  });

  it('spacing pulls two allies on the same spot apart in opposite ways, and nothing beyond ALLY_SPACING', () => {
    const a = { x: 1, y: 0, z: 1, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.6, onGround: true }, b = { ...a }, c = { ...a, x: 5 };
    const [ax] = spacing(a, [a, b, c]), [bx] = spacing(b, [a, b, c]);
    expect(Math.sign(ax)).toBe(-Math.sign(bx));
    expect(spacing(c, [a, b, c])).toEqual([0, 0]);
    expect(ALLY_PUSH).toBeGreaterThanOrEqual(0);
  });

  it('in the standard room layouts of a run, allies following the player never fall off a ledge', () => {
    const run = buildRun(0x327, 3);
    const solid = (x: number, y: number, z: number) => run.w.solid(x, y, z);
    /** The standing height of a column as the flow field reads it, or null. */
    const stand = (rm: RoomInfo, x: number, z: number) => {
      let y = rm.y0;
      while (y < rm.y0 + 4 && solid(x, y, z)) y++;
      while (y > rm.y0 - 2 && !solid(x, y - 1, z)) y--;
      return solid(x, y - 1, z) && !solid(x, y, z) && !solid(x, y + 1, z) ? y : null;
    };
    let rooms = 0, falls = 0;
    for (const f of run.floors) for (const rm of f.rooms) {
      const cells: [number, number, number][] = [];
      for (let r = 0; r < rm.d; r++) for (let c = 0; c < rm.w; c++) {
        if (!rm.open[c + r * rm.w]) continue;
        const y = stand(rm, rm.x0 + c, rm.z0 + r);
        if (y !== null) cells.push([rm.x0 + c, y, rm.z0 + r]);
      }
      if (cells.length < 8) continue;
      rooms++;
      const [px, py, pz] = cells[Math.floor(cells.length / 2)];
      const t = rig({ solid, rooms: [rm], px: px + 0.5, py, pz: pz + 0.5 }, true);
      t.player.room = rm.id;
      const es = [cells[0], cells[cells.length - 1], cells[Math.floor(cells.length / 4)]].map(([x, y, z]) => t.add('doubt', x + 0.5, y, z + 0.5, 'self', rm.id));
      const ground = es.map(e => e.body.y);
      for (let i = 0; i < 600; i++) {
        t.tick();
        es.forEach((e, k) => {
          if (!e.body.onGround) return;
          if (e.body.y < ground[k] - stepOf(e) - 0.05) falls++;
          ground[k] = e.body.y;
        });
      }
    }
    expect(rooms).toBeGreaterThan(10);
    expect(falls).toBe(0);
  });
});

describe('criterion 9: after the floor boss, allies stand still and face the player', () => {
  it('on a settled floor an ally keeps its place and turns to the player as it walks away', () => {
    const r = rig({ px: 6.5, pz: 3.5, walk: [0, -1], until: 0.5 }, true);
    const e = ally(r, 2.5, 3.5);
    r.state.settled = true;
    const start = { x: e.body.x, z: e.body.z };
    for (let i = 0; i < 300; i++) r.tick();
    expect(centres(e.body, start)).toBeLessThan(0.05);
    const yaw = r.en.viewOf(e.id)!.group.rotation.y;
    expect(yaw).toBeCloseTo(Math.atan2(r.player.body.x - e.body.x, r.player.body.z - e.body.z), 5);
  });
});

describe('a tier climb and the ledge guard agree (#327 with #338)', () => {
  /** A shelf `h` blocks high (x <= 6) over the floor the player stands on. */
  const shelf = (h: number): Blocks => (x, y) => y < 0 || (x <= 6 && y < h);
  function down(tier: Tier, h: number) {
    const r = rig({ solid: shelf(h), px: 11.5, pz: 3.5 }, true);
    const e = r.add('doubt', 2.5, h, 3.5, 'self', 0, tier);
    let at = -1;
    for (let i = 0; i < MAX_REACH_TICKS && at < 0; i++) { r.tick(); if (e.body.onGround && e.body.y < 0.01 && centres(e.body, r.player.body) <= FOLLOW_FAR + 0.5) at = i + 1; }
    return at;
  }

  it('a yellow ally (climb 2) walks down a 2-block ledge and a red one (climb 3) a 3-block ledge to follow the player', () => {
    expect(down('yellow', 2)).toBeGreaterThan(0);
    expect(down('yellow', 2)).toBeLessThanOrEqual(MAX_REACH_TICKS);
    expect(down('red', 3)).toBeGreaterThan(0);
    expect(down('red', 3)).toBeLessThanOrEqual(MAX_REACH_TICKS);
  });

  it('a black ally still stops at a 2-block ledge', () => {
    expect(down('black', 2)).toBe(-1);
  });

  it('a hostile of the same tiers walks the same path with and without the escort', () => {
    for (const [tier, h] of [['yellow', 2], ['red', 3]] as [Tier, number][]) {
      const path = (escort: boolean) => {
        const r = rig({ solid: shelf(h), px: 11.5, pz: 3.5 }, escort);
        const e = r.add('doubt', 2.5, h, 3.5, 'projection', 0, tier);
        const out: number[] = [];
        for (let i = 0; i < 240; i++) { r.tick(); out.push(e.body.x, e.body.y, e.body.z); }
        return out;
      };
      expect(path(true)).toEqual(path(false));
    }
  });
});
