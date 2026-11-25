// Issue #327: allies move without getting in the player's way. A headless room (as the other enemy tests),
// a scripted player, and the thresholds of MOVEMENT.md checked tick by tick at 60 Hz. Each scenario also
// runs with no escort (the dungeon before #327) so the findings in the doc can be reproduced.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Enemies, type EnemyHost } from '../src/entities/enemies';
import { ENEMY_BY_ID } from '../src/content/enemies';
import { CREATURE_BY_ID } from '../src/content/creatures';
import type { Actor } from '../src/entities/actors';
import type { Enemy } from '../src/enemies/types';
import { FlowField, type RoomArea } from '../src/enemies/flowfield';
import { setScale } from '../src/entities/growth';
import { FOLLOW_FAR, FOLLOW_NEAR, boxGap, isAlly, keepClear, laneSide, narrow, overlaps, yieldStep } from '../src/enemies/escort';

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

type Blocks = (x: number, y: number, z: number) => boolean;
const flat: Blocks = (_x, y) => y < 0;

interface Script { solid?: Blocks; px: number; py?: number; pz: number; aim?: [number, number, number]; walk?: [number, number]; until?: number }

function rig(s: Script, escort: boolean) {
  const solid = s.solid ?? flat;
  const player = {
    id: 1, kind: 'player', def: 'player', faction: 'self', hp: 24, tags: new Set<string>(), room: 0, alive: true, spawning: 0,
    body: { x: s.px, y: s.py ?? 0, z: s.pz, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true },
  } as Actor;
  const actors: Actor[] = [player];
  const host = {
    solid, worldVersion: () => 0, actors: () => actors, actor: (id: number) => actors.find(a => a.id === id),
    room: () => ROOM, elemVersion: () => 0, pickupsIn: () => [],
    hazard: () => null, contact: () => {}, projectileHit: () => {}, projectileBlock: () => false,
    smash: () => false, burst: () => {}, died: () => {}, particles: () => {}, hurtActor: () => {},
    affectActor: () => {}, arena: () => {}, summon: () => {}, cue: () => {}, quake: () => {}, drop: () => {},
  } as EnemyHost;
  const aim = s.aim ?? [0, 0, -1];
  const en = new Enemies(new THREE.Scene(), host, escort ? { player: () => ({ id: 1, room: 0, body: player.body, eye: 1.6, aim }) } : undefined);
  let next = 10;
  const add = (def: string, x: number, y: number, z: number, faction: Actor['faction']) => {
    const d = ENEMY_BY_ID.get(def) ?? CREATURE_BY_ID.get(def)!;
    const e = en.spawn(d, next++, 0, x, y, z, d.hp, d.speed, d.contactDamage, new Set(CREATURE_BY_ID.has(def) ? ['creature'] : []));
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
  return { en, add, tick, player, solid };
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
