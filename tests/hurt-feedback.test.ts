import { beforeAll, describe, expect, it, vi } from 'vitest';
import { StatSheet } from '../src/core/stats';
import { createBus } from '../src/game/events';
import { HURT_FLINCH, HURT_HOP, HURT_PUSH, HURT_SWIM, hotFrom, hurtAngle, hurtEdge, hurtKnock, hurtPan } from '../src/game/hurt-feedback';
import { hazardFrom } from '../src/enemies/attacks';
import { Player } from '../src/entities/player';
import { EL_LAVA, elemByte } from '../src/content/elements';
import type { Game } from '../src/game/game';

vi.hoisted(() => {
  const g = globalThis as { matchMedia?: unknown };
  g.matchMedia ??= () => ({ matches: false, addEventListener: () => undefined, removeEventListener: () => undefined });
});
const sounds = vi.hoisted(() => ({ hurt: [] as number[] }));
vi.mock('../src/audio/sfx', async (importOriginal) => {
  const real = await importOriginal<typeof import('../src/audio/sfx')>();
  return { ...real, sfx3: { ...real.sfx3, hurt: (pan = 0) => { sounds.hurt.push(pan); } } };
});

const still = { x: 0, z: 0, vy: 0 };

describe('hurt knockback', () => {
  it('pushes away from the source, with a small hop', () => {
    const k = hurtKnock(still, { x: 2, z: 0 }, 0, 0);
    expect(k.vx).toBeCloseTo(-HURT_PUSH);
    expect(k.vz).toBeCloseTo(0);
    expect(k.vy).toBeCloseTo(HURT_HOP);
  });

  it('with no source, hops straight up', () => {
    const k = hurtKnock(still, null, 0, 0);
    expect(k.vx).toBe(0);
    expect(k.vz).toBe(0);
    expect(k.vy).toBeCloseTo(HURT_HOP);
  });

  it('with no source, flinches a little back along the way the player came', () => {
    const k = hurtKnock(still, null, 0, -1);
    expect(k.vz).toBeCloseTo(HURT_FLINCH);
    expect(k.vx).toBeCloseTo(0);
  });

  it('never stacks the hop on a body already rising', () => {
    expect(hurtKnock({ x: 0, z: 0, vy: 10 }, null, 0, 0).vy).toBe(0);
    expect(hurtKnock({ x: 0, z: 0, vy: 2 }, null, 0, 0).vy).toBeCloseTo(HURT_HOP - 2);
  });

  it('is softer under water and gone at a zero scale', () => {
    const k = hurtKnock(still, { x: 0, z: 3 }, 0, 0, 1, true);
    expect(k.vz).toBeCloseTo(-HURT_PUSH * HURT_SWIM);
    expect(hurtKnock(still, { x: 0, z: 3 }, 0, 0, 0)).toEqual({ vx: 0, vy: 0, vz: 0 });
  });

  it('treats a source on top of the player as no source', () => {
    expect(hurtKnock(still, { x: 0.05, z: 0 }, 0, 0).vx).toBe(0);
  });
});

describe('hurt direction', () => {
  it('reads the source side against the view', () => {
    expect(hurtAngle(still, 0, { x: 0, z: -3 })).toBeCloseTo(0);
    expect(hurtAngle(still, 0, { x: 3, z: 0 })).toBeCloseTo(Math.PI / 2);
    expect(hurtAngle(still, 0, { x: -3, z: 0 })).toBeCloseTo(-Math.PI / 2);
    expect(Math.abs(hurtAngle(still, 0, { x: 0, z: 3 })!)).toBeCloseTo(Math.PI);
    expect(hurtAngle(still, Math.PI / 2, { x: -3, z: 0 })).toBeCloseTo(0);
    expect(hurtAngle(still, 0, null)).toBeNull();
  });

  it('puts the glow on the matching screen edge', () => {
    expect(hurtEdge(0)).toEqual({ x: 50, y: 0 });
    const right = hurtEdge(Math.PI / 2);
    expect(right.x).toBeCloseTo(100);
    expect(right.y).toBeCloseTo(50);
    const back = hurtEdge(Math.PI);
    expect(back.x).toBeCloseTo(50);
    expect(back.y).toBeCloseTo(100);
    const corner = hurtEdge(Math.PI / 4);
    expect(corner.x).toBeCloseTo(100);
    expect(corner.y).toBeCloseTo(0);
  });

  it('pans the sound to the source side', () => {
    expect(hurtPan(null)).toBe(0);
    expect(hurtPan(Math.PI / 2)).toBeGreaterThan(0);
    expect(hurtPan(-Math.PI / 2)).toBeLessThan(0);
  });

  it('finds the side of fire or lava, and none in the middle of a pool', () => {
    const side = hotFrom(5.5, 5.5, (x) => x === 6);
    expect(side!.x).toBeGreaterThan(5.5);
    expect(side!.z).toBeCloseTo(5.5);
    expect(hotFrom(5.5, 5.5, () => true)).toBeNull();
    expect(hotFrom(5.5, 5.5, (x, z) => x === 5 && z === 5)).toBeNull();
    expect(hotFrom(5.5, 5.5, () => false)).toBeNull();
  });

  it('places an attack source on its shape', () => {
    expect(hazardFrom({ kind: 'ring', x: 1, y: 0, z: 2, r: 1, grow: 1, width: 0.5, height: 1 }, 0, 5, 5)).toEqual({ x: 1, z: 2 });
    expect(hazardFrom({ kind: 'line', x0: 0, z0: 0, x1: 10, z1: 0, y: 0, width: 0.5 }, 0, 4, 2)).toEqual({ x: 4, z: 0 });
    expect(hazardFrom({ kind: 'line', x0: 0, z0: 0, x1: 10, z1: 0, y: 0, width: 0.5 }, 0, 4, 0)).toEqual({ x: 0, z: 0 });
    const sweep = hazardFrom({ kind: 'sweep', axis: 'x', from: 0, to: 10, speed: 2, across: [0, 5], y: 0, height: 1, width: 0.5 }, 1, 2.2, 3);
    expect(sweep).toEqual({ x: 1, z: 3 });
  });
});

describe('a hit on the player', () => {
  let GameClass: typeof Game;
  beforeAll(async () => {
    ({ Game: GameClass } = await import('../src/game/game'));
  }, 120000);

  function rig() {
    const player = new Player();
    player.hp = 24;
    const hud = { hurt: vi.fn(), toast: vi.fn(), shake: vi.fn() };
    const g = Object.assign(Object.create(GameClass.prototype), {
      player, stats: new StatSheet(), bus: createBus(), hud, blasts: { current: null },
      particles: { burst: () => {} }, world: { elemAt: () => 0 },
    }) as Game;
    sounds.hurt.length = 0;
    return { g, player, hud };
  }

  it('from a source pushes the player away from it and flashes that side', () => {
    const { g, player, hud } = rig();
    expect(g.damageActor(player, 2, 'contact', 'test', 'world', 0, 0, undefined, { x: 3, z: 0 })).toBe(true);
    expect(player.body.vx).toBeCloseTo(-HURT_PUSH);
    expect(player.body.vy).toBeCloseTo(HURT_HOP);
    expect(hud.hurt).toHaveBeenCalledTimes(1);
    expect(hud.hurt.mock.calls[0][0]).toBeCloseTo(Math.PI / 2);
    expect(sounds.hurt).toHaveLength(1);
    expect(sounds.hurt[0]).toBeGreaterThan(0);
  });

  it('with no source pushes the player up and flashes every edge', () => {
    const { g, player, hud } = rig();
    expect(g.damagePlayer(1, 'drown', 'drown', 'world')).toBe(true);
    expect(player.body.vx).toBe(0);
    expect(player.body.vz).toBe(0);
    expect(player.body.vy).toBeCloseTo(HURT_HOP);
    expect(hud.hurt).toHaveBeenCalledWith(null);
  });

  it('keeps the damage and the invulnerability window as they were', () => {
    const { g, player } = rig();
    g.damageActor(player, 5, 'contact', 'test', 'world', 0, 0, undefined, { x: 3, z: 0 });
    expect(player.hp).toBe(19);
    expect(player.invulnT).toBe(1);
  });

  it('does nothing at zero damage', () => {
    const { g, player, hud } = rig();
    expect(g.damageActor(player, 0, 'contact', 'test', 'world', 0, 0, undefined, { x: 3, z: 0 })).toBe(false);
    expect(player.body.vx).toBe(0);
    expect(player.body.vy).toBe(0);
    expect(hud.hurt).not.toHaveBeenCalled();
    expect(sounds.hurt).toHaveLength(0);
  });

  it('does nothing while the player is invulnerable', () => {
    const { g, player, hud } = rig();
    player.invulnT = 0.5;
    expect(g.damageActor(player, 4, 'contact', 'test', 'world', 0, 0, undefined, { x: 3, z: 0 })).toBe(false);
    expect(player.body.vx).toBe(0);
    expect(player.body.vy).toBe(0);
    expect(player.hp).toBe(24);
    expect(hud.hurt).not.toHaveBeenCalled();
  });

  it('lets a practice take the knockback away through actorDamage', () => {
    const { g, player, hud } = rig();
    g.bus.on('actorDamage', { priority: 0, source: 'test', fn: e => { e.knockback = 0; } });
    g.damageActor(player, 2, 'contact', 'test', 'world', 0, 0, undefined, { x: 3, z: 0 });
    expect(player.body.vx).toBe(0);
    expect(player.body.vy).toBe(0);
    expect(hud.hurt).toHaveBeenCalledTimes(1);
  });

  it('is never pushed from safe ground into fire or lava', () => {
    const { g, player } = rig();
    Object.assign(g, { world: { elemAt: (x: number) => (x === -1 ? elemByte(EL_LAVA, 7) : 0) } });
    g.damageActor(player, 2, 'contact', 'test', 'world', 0, 0, undefined, { x: 3, z: 0 });
    expect(player.body.vx).toBe(0);
    expect(player.body.vy).toBeCloseTo(HURT_HOP);
  });
});
