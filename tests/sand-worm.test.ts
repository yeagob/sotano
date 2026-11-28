import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { RIDE_CONTROLS, SandWorm, WORM, type WormBody, type WormHost } from '../src/entities/sand-worm';
import { BINDINGS, DEVICES, contextsFor } from '../src/input/bindings';
import { WORM_STEER_R } from '../src/world/worm-desert';

const GROUND = 20;
const DT = 1 / 60;

function rig(seed = 7) {
  const rng = new Rng(seed);
  const cracks: [number, number, number][] = [];
  const host: WormHost = { ground: () => GROUND, random: () => rng.next(), crack: (x, z, i) => cracks.push([x, z, i]) };
  const worm = new SandWorm(host, 0, 0);
  const body: WormBody = { x: 10, y: GROUND, z: -6, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
  return { worm, body, cracks };
}

/** One frame of a body that does not walk: the worm moves, carries it, gravity pulls, the back holds it. */
function frame(worm: SandWorm, b: WormBody, jumped = false) {
  worm.update(DT, b, true);
  worm.carry(b);
  if (!b.onGround || b.y > GROUND) { b.vy -= 28 * DT; b.y += b.vy * DT; }
  b.onGround = false;
  if (b.y <= GROUND) { b.y = GROUND; b.vy = 0; b.onGround = true; }
  return worm.support(b, jumped);
}

function until(worm: SandWorm, b: WormBody, state: string, max = 60 * 60) {
  for (let i = 0; i < max && worm.state !== state; i++) frame(worm, b);
  expect(worm.state).toBe(state);
}

/** Sets the body on the top of segment k (as if it had climbed there) and lets the back take it. */
function standOn(worm: SandWorm, b: WormBody, k: number) {
  const s = worm.segments[k];
  (worm as { rider: unknown }).rider = null;
  b.x = s.x; b.z = s.z; b.y = s.top; b.vy = 0; b.onGround = false;
  expect(worm.support(b, false)).toBe('mounted');
  expect(worm.rider?.seg).toBe(k);
}

describe('the worm of the deep desert (#354)', () => {
  it('cracks the ground in a line that runs toward the leap point, which points at the player', () => {
    const { worm, body, cracks } = rig();
    until(worm, body, 'telegraph');
    const line = worm.crackLine;
    expect(line.length).toBe(WORM.crackCells);
    // the last crack is the leap point, the first the farthest behind it
    expect(line[line.length - 1]).toEqual([Math.floor(worm.emerge[0]), Math.floor(worm.emerge[1])]);
    for (let i = 1; i < line.length; i++) {
      const [ax, az] = line[i - 1], [bx, bz] = line[i];
      expect((bx - ax) * worm.dir[0] + (bz - az) * worm.dir[1]).toBeGreaterThan(0);
    }
    // the leap goes toward the player: the player stands emergeDist ahead of the point along the line
    expect(worm.emerge[0] + worm.dir[0] * WORM.emergeDist).toBeCloseTo(body.x, 5);
    expect(worm.emerge[1] + worm.dir[1] * WORM.emergeDist).toBeCloseTo(body.z, 5);
    until(worm, body, 'breach');
    // broken one after another, in that order, before the leap
    expect(cracks.map(c => c[2])).toEqual([...Array(WORM.crackCells).keys()]);
    expect(cracks.map(([x, z]) => [x, z])).toEqual(line);
  });

  it('leaps out of the sand toward the player and then swims with its back over the sand', () => {
    const { worm, body } = rig();
    until(worm, body, 'breach');
    const peak = { y: -Infinity };
    for (let i = 0; i < 60 * WORM.breachS + 2; i++) { frame(worm, body); peak.y = Math.max(peak.y, worm.head.y); }
    expect(peak.y).toBeGreaterThan(GROUND + 4);
    until(worm, body, 'cruise');
    for (let i = 0; i < 600; i++) frame(worm, body);
    // the head swims with its back BACK_RISE over the sand
    const s0 = worm.segments[0];
    expect(s0.y + WORM.radius).toBeCloseTo(GROUND + WORM.backRise, 0);
    // diameter 15 to 20 (owner)
    expect(WORM.radius * 2).toBeGreaterThanOrEqual(15);
    expect(WORM.radius * 2).toBeLessThanOrEqual(20);
  });

  it('carries a body that stands on its back, the whole width of the body', () => {
    const { worm, body } = rig();
    until(worm, body, 'cruise');
    for (let i = 0; i < 300; i++) frame(worm, body);
    standOn(worm, body, 5);
    const s = worm.segments[5];
    // the back is a platform across the whole width: a step near the flank lands too
    body.x = s.x - s.hz * (WORM.radius - 0.5); body.z = s.z + s.hx * (WORM.radius - 0.5); body.y = s.top;
    expect(worm.support(body, false)).toBe('none');
    expect(worm.rider?.seg).toBe(5);
    const x0 = body.x, z0 = body.z;
    for (let i = 0; i < 60; i++) frame(worm, body);
    // attached: one second later the body has moved with the worm and is still on its back
    expect(Math.hypot(body.x - x0, body.z - z0)).toBeGreaterThan(WORM.speed * 0.6);
    expect(worm.rider).not.toBeNull();
    expect(body.y).toBeGreaterThan(GROUND + 1);
  });

  it('stops a body against a plate that rises above its step, so the back is climbed by jumps', () => {
    const { worm, body } = rig();
    until(worm, body, 'cruise');
    for (let i = 0; i < 300; i++) frame(worm, body);
    // wait for the wave to lift plate 3 more than a step over plate 4
    for (let i = 0; i < 600 && worm.segments[3].top - worm.segments[4].top < WORM.land + 0.2; i++) worm.update(DT, null, true);
    const s = worm.segments[3], back = worm.segments[4];
    expect(s.top - back.top).toBeGreaterThan(WORM.land);
    // standing on plate 4, walking into the end of plate 3
    standOn(worm, body, 4);
    body.x = s.x - s.hx * (WORM.plate / 2 - 0.1); body.z = s.z - s.hz * (WORM.plate / 2 - 0.1); body.y = back.top;
    body.vx = s.hx * 4; body.vz = s.hz * 4; body.vy = 0;
    worm.support(body, false);
    // held back on plate 4, its walk into plate 3 stopped
    expect(worm.rider?.seg).toBe(4);
    const [u] = [(body.x - s.x) * s.hx + (body.z - s.z) * s.hz];
    expect(u).toBeLessThanOrEqual(-WORM.plate / 2);
    expect(body.vx * s.hx + body.vz * s.hz).toBeLessThanOrEqual(1e-9);
  });

  it('only a positive intention on the head, from a rider on the head, counts; nothing else does anything', () => {
    const { worm, body } = rig();
    until(worm, body, 'cruise');
    for (let i = 0; i < 300; i++) frame(worm, body);
    const head = () => worm.segments[0];
    const at = () => [head().x, head().top - 1, head().z] as const;
    // no rider: a positive intention on the head is spent and does nothing
    expect(worm.intention(...at(), true)).toBe('nothing');
    // a rider away from the head: nothing
    standOn(worm, body, 4);
    expect(worm.intention(...at(), true)).toBe('nothing');
    // a rider on the head, a negative intention: nothing; a thousand of them: still nothing, the worm cannot die
    standOn(worm, body, 0);
    for (let i = 0; i < 1000; i++) expect(worm.intention(...at(), false)).toBe('nothing');
    expect(worm.warmth).toBe(0);
    expect(worm.visible).toBe(true);
    expect(Object.keys(worm)).not.toContain('hp');
    // a positive one on the body (not the head), from the head: nothing
    const s3 = worm.segments[3];
    expect(worm.intention(s3.x, s3.top - 1, s3.z, true)).toBe('nothing');
    // a positive one on the head, from the head: counted
    expect(worm.intention(...at(), true)).toBe('calm');
    expect(worm.warmth).toBe(1);
    // far from the worm: a miss (the intention flies on)
    expect(worm.intention(head().x + 200, head().top, head().z, true)).toBe('miss');
  });

  it('is tame after exactly TAME_HITS positive intentions on the head', () => {
    const { worm, body } = rig();
    until(worm, body, 'cruise');
    for (let i = 0; i < 300; i++) frame(worm, body);
    standOn(worm, body, 0);
    const hit = () => { const h = worm.segments[0]; return worm.intention(h.x, h.top - 1, h.z, true); };
    for (let i = 1; i < WORM.tameHits; i++) { expect(hit()).toBe('calm'); expect(worm.tamed).toBe(false); }
    expect(hit()).toBe('tame');
    expect(worm.tamed).toBe(true);
    expect(worm.seated).toBe(true);
  });

  it('a tame worm is steered from its head, and never out of the desert', () => {
    const { worm, body } = rig();
    until(worm, body, 'cruise');
    for (let i = 0; i < 300; i++) frame(worm, body);
    standOn(worm, body, 0);
    for (let i = 0; i < WORM.tameHits; i++) { const h = worm.segments[0]; worm.intention(h.x, h.top - 1, h.z, true); }
    // steer east, then keep pressing outward for two minutes
    let farthest = 0, sawEdge = false;
    for (let i = 0; i < 60 * 120; i++) {
      const h = worm.head;
      const out = Math.hypot(h.x, h.z) > 1 ? [h.x, h.z] : [1, 0];
      worm.steer(out[0], out[1]);
      frame(worm, body);
      farthest = Math.max(farthest, Math.hypot(worm.head.x, worm.head.z));
      sawEdge ||= worm.heldAtEdge;
      expect(worm.seated, `frame ${i}`).toBe(true);
    }
    expect(sawEdge).toBe(true);
    expect(farthest).toBeLessThanOrEqual(WORM_STEER_R + 1e-6);
    expect(farthest).toBeGreaterThan(WORM_STEER_R - 31);
    // and it turns where it is told: steering north turns the heading north
    worm.steer(0, -1);
    const z0 = worm.head.z;
    for (let i = 0; i < 60 * 20; i++) { worm.steer(0, -1); frame(worm, body); }
    expect(worm.head.z).toBeLessThan(z0);
  });

  it('gives nothing for leaving an untamed worm, and the dismount exactly once after taming', () => {
    const { worm, body } = rig();
    until(worm, body, 'cruise');
    for (let i = 0; i < 300; i++) frame(worm, body);
    standOn(worm, body, 0);
    // untamed: stepping down to the sand is no dismount
    body.x += 60; body.y = GROUND; body.onGround = true;
    expect(worm.support(body, false)).toBe('none');
    // tame it, then jump off from the head
    standOn(worm, body, 0);
    for (let i = 0; i < WORM.tameHits; i++) { const h = worm.segments[0]; worm.intention(h.x, h.top - 1, h.z, true); }
    expect(worm.rewarded).toBe(false);
    frame(worm, body);
    expect(worm.support(body, true)).toBe('dismounted');
    expect(worm.rewarded).toBe(true);
    expect(body.onGround).toBe(true);
    expect(body.y).toBe(GROUND);
    expect(worm.rider).toBeNull();
    // never twice: it dives and leaves the desert for the rest of the run
    let again = 0;
    for (let i = 0; i < 60 * 120; i++) if (frame(worm, body) === 'dismounted') again++;
    expect(again).toBe(0);
    expect(worm.state).toBe('gone');
  });

  it('a tame worm stepped off by walking (not jumping) also pays the dismount, on the ground', () => {
    const { worm, body } = rig();
    until(worm, body, 'cruise');
    for (let i = 0; i < 300; i++) frame(worm, body);
    standOn(worm, body, 0);
    for (let i = 0; i < WORM.tameHits; i++) { const h = worm.segments[0]; worm.intention(h.x, h.top - 1, h.z, true); }
    frame(worm, body);
    // off the back, still in the air: no dismount yet
    body.x += 40; body.y = GROUND + 3; body.vy = 0;
    worm.update(DT, body, true);
    body.onGround = false;
    expect(worm.support(body, false)).toBe('none');
    body.y = GROUND; body.onGround = true;
    expect(worm.support(body, false)).toBe('dismounted');
  });

  it('the head that leaps hits a body in its way once, and a body behind the leap point is safe', () => {
    const { worm, body } = rig();
    until(worm, body, 'breach');
    let hits = 0;
    for (let i = 0; i < 60 * WORM.breachS + 2; i++) if (worm.update(DT, body, true)) hits++;
    expect(hits).toBeLessThanOrEqual(1);
    const r2 = rig();
    until(r2.worm, r2.body, 'breach');
    // behind the leap point, on the crack line
    r2.body.x = r2.worm.emerge[0] - r2.worm.dir[0] * 6; r2.body.z = r2.worm.emerge[1] - r2.worm.dir[1] * 6;
    let hit2 = 0;
    for (let i = 0; i < 60 * WORM.breachS + 2; i++) if (r2.worm.update(DT, r2.body, true)) hit2++;
    expect(hit2).toBe(0);
  });
});

describe('riding the worm is mapped on every device (#354, sotano-controls)', () => {
  it('every verb of the ride is an existing action, live in play on keyboard and mouse, gamepad and touch', () => {
    const verbs = new Set(Object.values(RIDE_CONTROLS).flat());
    for (const v of verbs) {
      const b = BINDINGS.find(x => x.action === v);
      expect(b, v).toBeDefined();
      for (const d of DEVICES) expect(contextsFor(b!, d), `${v} on ${d}`).toContain('play');
      expect((b!.keyboard.keys?.length ?? 0) + (b!.keyboard.mouse?.length ?? 0) + (b!.keyboard.toggle?.length ?? 0) + (b!.keyboard.mouseMove ? 1 : 0), `${v} keyboard`).toBeGreaterThan(0);
      expect((b!.gamepad.buttons?.length ?? 0) + (b!.gamepad.stick ? 1 : 0), `${v} gamepad`).toBeGreaterThan(0);
      expect(b!.touch.control, `${v} touch`).not.toBe('none');
    }
  });
});
