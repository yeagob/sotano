// The sky realm's contracts (docs/architecture/SKY.md §16.4, K0): the registries are complete and
// in order, the catalog, palette, gallery, audio and ledger parts are wired once and disjoint, every
// stub matches its contract and constructs, and the VoxelSpace suite holds on the dungeon's world.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { SKY_SOUND_PARTS, cuePart, playSkyCue, skyAmbience } from '../src/audio/sky';
import { PALETTE } from '../src/content/palette';
import { SKY_BLOCKS_PALETTE } from '../src/content/palette/sky-blocks';
import { SKY_ELEPHANT_PALETTE } from '../src/content/palette/sky-elephant';
import { SKY_ENTITY_PALETTE } from '../src/content/palette/sky-entity';
import { SKY_HORSE_PALETTE } from '../src/content/palette/sky-horse';
import { SKY_KOALA_PALETTE } from '../src/content/palette/sky-koala';
import { SKY_LION_PALETTE } from '../src/content/palette/sky-lion';
import { SKY_PANDA_PALETTE } from '../src/content/palette/sky-panda';
import { SKY_TOTALITY_PALETTE } from '../src/content/palette/sky-totality';
import { Rng } from '../src/core/rng';
import { Encounter } from '../src/endgame/encounter';
import { SpikedEntity } from '../src/endgame/entity';
import { EntityView } from '../src/endgame/entity-view';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';
import { SKY_PARTS_EN, SKY_PARTS_ES } from '../src/i18n/locales/sky';
import { DEITIES } from '../src/sky/creatures/deities';
import { Deity, stageOf } from '../src/sky/creatures/deity';
import * as gaits from '../src/sky/creatures/gaits';
import { TowerKnock } from '../src/sky/creatures/knock';
import { Minion } from '../src/sky/creatures/minion';
import { MINIONS } from '../src/sky/creatures/minions';
import { Puff } from '../src/sky/creatures/puff';
import { SkyCreatures } from '../src/sky/creatures/system';
import { SKY_FLOORS } from '../src/sky/floors';
import { linksOf, nearest, placeById, route } from '../src/sky/floors/graph';
import { buildSkyTree, openGate } from '../src/sky/floors/tree';
import { RealmGate } from '../src/sky/gate';
import { HINDRANCES } from '../src/sky/hindrances';
import { SkyEffects } from '../src/sky/hindrances/effects';
import { HindranceRunner } from '../src/sky/hindrances/runner';
import { installNoHarm } from '../src/sky/laws/no-harm';
import { Nests } from '../src/sky/laws/nests';
import { OutsideWatch } from '../src/sky/laws/outside';
import { Ownership } from '../src/sky/laws/ownership';
import { Regrowth } from '../src/sky/laws/regrowth';
import { towerUnder } from '../src/sky/laws/tower';
import { Updraft } from '../src/sky/laws/updraft';
import { buildSkyLayout } from '../src/sky/layout';
import { atmosphereAt } from '../src/sky/atmosphere';
import { swapRealm } from '../src/sky/realm';
import { CreatureView } from '../src/sky/render/creature-view';
import { EarthView } from '../src/sky/render/earth';
import { HitMarks } from '../src/sky/render/hit-marks';
import { SunView } from '../src/sky/render/sun';
import { SkyRealm } from '../src/sky/sky-realm';
import { buildTotality } from '../src/sky/totality/chain';
import { reach, reach2 } from '../src/sky/totality/reach';
import { STRATA, stratumAt } from '../src/sky/totality/strata';
import { Threshold } from '../src/sky/totality/threshold';
import {
  ANIMALS, HINDRANCE_IDS, TELEGRAPH, MIN_TELEGRAPH,
  type CreatureDeps, type CreatureViewCtor, type DeityCtor, type EncounterCtor, type EncounterHost, type EntityViewCtor,
  type HindranceCtx, type HindranceRunnerCtor, type HitMarksCtor, type InstallNoHarm, type MinionCtor, type NestsCtor,
  type OutsideWatchCtor, type OwnershipCtor, type PuffCtor, type RealmGateCtor, type RealmHost, type RealmSet,
  type RegrowthCtor, type SkyCreaturesCtor, type SkyEffectsCtor, type SkyHost, type SkyRealmCtor, type SkyRealmSet,
  type SkyActor, type SkyViewCtor, type SkyWorldApi, type SpikedEntityCtor, type SwapRealm, type ThresholdCtor, type TowerKnockCtor,
  type TowerUnder, type UpdraftCtor,
} from '../src/sky/types';
import type { GameBus } from '../src/game/events';
import type { Body } from '../src/physics/voxel-collide';
import type { VoxelSpace } from '../src/world/space';
import { VoxelWorld } from '../src/world/world';
import { voxelSpaceContract } from './helpers/voxel-space-contract';

// Every stub has its contract's signature (checked by the compiler).
const contracts: [
  RegrowthCtor, OwnershipCtor, InstallNoHarm, NestsCtor, TowerUnder, UpdraftCtor, OutsideWatchCtor,
  HindranceRunnerCtor, SkyEffectsCtor, SkyCreaturesCtor, DeityCtor, MinionCtor, PuffCtor, TowerKnockCtor,
  HitMarksCtor, CreatureViewCtor, SkyViewCtor, SkyViewCtor, ThresholdCtor, RealmGateCtor, SwapRealm, SkyRealmCtor,
  SpikedEntityCtor, EntityViewCtor, EncounterCtor,
] = [
  Regrowth, Ownership, installNoHarm, Nests, towerUnder, Updraft, OutsideWatch,
  HindranceRunner, SkyEffects, SkyCreatures, Deity, Minion, Puff, TowerKnock,
  HitMarks, CreatureView, EarthView, SunView, Threshold, RealmGate, swapRealm, SkyRealm,
  SpikedEntity, EntityView, Encounter,
];

const ROOT = join(__dirname, '..');
const PARTS = ['core', 'panda', 'koala', 'elephant', 'lion', 'horse', 'totality', 'endgame'] as const;
const SECTIONS = ['blocks', 'panda', 'koala', 'elephant', 'lion', 'horse', 'totality', 'entity',
  'hindrances-core', 'hindrances-ground', 'hindrances-hold', 'hindrances-flow'] as const;

/** Keys that appear in more than one of the objects. */
function shared(objects: readonly object[]): string[] {
  const seen = new Map<string, number>();
  for (const o of objects) for (const k of Object.keys(o)) seen.set(k, (seen.get(k) ?? 0) + 1);
  return [...seen].filter(([, n]) => n > 1).map(([k]) => k);
}

describe('sky registries', () => {
  it('lists the five guardian floors in order, with their B6 sizes (SKY.md §7.1)', () => {
    expect(SKY_FLOORS.map(f => [f.index, f.animal, f.radius, f.height])).toEqual([
      [1, 'panda', 20, 28], [2, 'koala', 22, 32], [3, 'elephant', 24, 34], [4, 'lion', 26, 36], [5, 'horse', 30, 12],
    ]);
    for (const f of SKY_FLOORS) {
      const plan = f.generate(new Rng(1), { x: 128, y: 36, z: 128 });
      expect([plan.index, plan.animal]).toEqual([f.index, f.animal]);
    }
  });

  it('has a deity and a minion for every animal, each on its own floor', () => {
    expect(Object.keys(DEITIES)).toEqual([...ANIMALS]);
    expect(Object.keys(MINIONS)).toEqual([...ANIMALS]);
    ANIMALS.forEach((a, n) => {
      const d = DEITIES[a];
      expect([d.animal, d.floor, MINIONS[a].animal]).toEqual([a, n + 1, a]);
      expect(d.telegraph).toBe(TELEGRAPH[n]);
      expect(d.telegraph).toBeGreaterThanOrEqual(MIN_TELEGRAPH);
    });
    expect(ANIMALS.map(a => DEITIES[a].hits)).toEqual([24, 30, 36, 42, 48]);
    expect(ANIMALS.map(a => DEITIES[a].teleport)).toEqual([false, true, false, false, true]);
    expect(DEITIES.horse.hover).toBeNull();
    expect(ANIMALS.map(a => MINIONS[a].hitsToTurn)).toEqual([3, 3, 5, 4, 4]);
    expect(ANIMALS.map(a => [MINIONS[a].max, MINIONS[a].wildMax])).toEqual([[4, 3], [6, 6], [5, 3], [6, 4], [5, 3]]);
  });

  it('has every hindrance once, under its own id', () => {
    expect(Object.keys(HINDRANCES)).toEqual([...HINDRANCE_IDS]);
    for (const id of HINDRANCE_IDS) expect(HINDRANCES[id].id).toBe(id);
  });

  it('maps every sound cue to its part', () => {
    expect(Object.keys(SKY_SOUND_PARTS).sort()).toEqual(['core', ...ANIMALS, 'totality', 'entity'].sort());
    expect(cuePart('core.puff')).toEqual(['core', 'puff']);
    expect(cuePart('panda.grumble')).toEqual(['panda', 'grumble']);
    expect(cuePart('entity.tink')).toEqual(['entity', 'tink']);
    expect(() => { playSkyCue('totality.hum', 0, 0, 0); skyAmbience('deck', 0.016); }).not.toThrow();
  });
});

describe('sky parts', () => {
  it('catalog parts are disjoint, the same in both languages, and spread into the catalogs', () => {
    expect(Object.keys(SKY_PARTS_EN)).toEqual([...PARTS]);
    expect(Object.keys(SKY_PARTS_ES)).toEqual([...PARTS]);
    expect(shared(Object.values(SKY_PARTS_EN))).toEqual([]);
    for (const p of PARTS) {
      expect(Object.keys(SKY_PARTS_ES[p]).sort(), p).toEqual(Object.keys(SKY_PARTS_EN[p]).sort());
      for (const k of Object.keys(SKY_PARTS_EN[p])) {
        expect(EN.messages, k).toHaveProperty([k]);
        expect(ES.messages, k).toHaveProperty([k]);
      }
    }
  });

  it('palette parts are disjoint and spread into PALETTE', () => {
    const parts = [SKY_BLOCKS_PALETTE, SKY_TOTALITY_PALETTE, SKY_ENTITY_PALETTE, SKY_PANDA_PALETTE,
      SKY_KOALA_PALETTE, SKY_ELEPHANT_PALETTE, SKY_LION_PALETTE, SKY_HORSE_PALETTE];
    expect(shared(parts)).toEqual([]);
    for (const part of parts) for (const [k, v] of Object.entries(part)) expect((PALETTE as Record<string, string>)[k], k).toBe(v);
  });

  it('every gallery section is called from gallery.ts and has its ledger page', () => {
    const gallery = readFileSync(join(ROOT, 'src/debug/gallery.ts'), 'utf8');
    const ledger = readFileSync(join(ROOT, 'docs/art/sky/README.md'), 'utf8');
    for (const s of SECTIONS) {
      expect(gallery, s).toContain(`['sky-${s}', `);
      expect(existsSync(join(ROOT, `src/debug/gallery/sky-${s}.ts`)), s).toBe(true);
      const page = readFileSync(join(ROOT, `docs/art/sky/${s}.md`), 'utf8');
      expect(page, s).toContain('Up: [Sky art rulings](README.md)');
      expect(ledger, s).toContain(`(${s}.md)`);
    }
    expect(readFileSync(join(ROOT, 'docs/art/DECISIONS.md'), 'utf8')).toContain('(sky/README.md)');
  });
});

describe('sky stubs', () => {
  const host = { fork: () => new Rng(7) } as unknown as SkyHost;
  const world = {} as SkyWorldApi;
  const root = new THREE.Group();
  const body: Body = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
  const bus = {} as GameBus;
  const at = { x: 1, y: 2, z: 3 };

  it('every stub constructs and does nothing', () => {
    expect(contracts.length).toBe(25);
    const runner = new HindranceRunner({} as HindranceCtx);
    const effects = new SkyEffects(host);
    const puff = new Puff(host);
    const knock = new TowerKnock(host, effects);
    const deps = { actors: null, runner, effects, puff, knock } as unknown as CreatureDeps;
    const tree = buildSkyTree(new Rng(1));
    const plan = SKY_FLOORS[0].generate(new Rng(1), { x: 128, y: 36, z: 128 });
    const actor = { id: 9, kind: 'sky', role: 'deity', animal: 'panda' } as SkyActor;

    new Regrowth(world, host, () => false).update(1);
    const own = new Ownership(world, host);
    own.install(bus);
    expect(own.positiveHit({ x: 0, y: 0, z: 0, cell: -1, actor: -1, weapon: 'intent', warm: true })).toBe(false);
    installNoHarm(bus);
    new Nests(host, [], 0).update(1);
    expect(towerUnder(world, body)).toBeNull();
    new Updraft(host, []).update(1);
    new OutsideWatch(host, tree, () => {}).update(1);
    runner.update(1);
    expect(runner.start(HINDRANCES.wind, { from: at, to: at, radius: 1, strength: 1, seconds: 1 }, 1, 0)).toBe(-1);
    effects.update(1);
    const creatures = new SkyCreatures(root, host, deps);
    expect([creatures.at(0, 0, 0, 1), creatures.targets().length, creatures.owns(1)]).toEqual([-1, 0, false]);
    new Deity(actor, DEITIES.panda, plan, deps, host, new Rng(1)).update(1);
    new Minion(actor, MINIONS.panda, plan, deps, host, new Rng(1)).update(1, null, []);
    puff.at(at);
    knock.update(1);
    expect(stageOf(8, 24)).toBe(1);
    expect(stageOf(48, 24)).toBe(2);
    for (const make of Object.values(gaits)) expect(typeof make).toBe('function');
    new HitMarks(root, 24).add(at);
    new CreatureView(root).update(1, []);
    new EarthView(root).update(at, 1);
    new SunView(root).update(at, 1);
    expect(placeById(plan.graph, 0)).toBeNull();
    expect([linksOf(plan.graph, 0), nearest(plan.graph, 0, 0, 0), route(plan.graph, 0, 0, ['walk'])]).toEqual([[], null, null]);
    openGate(world, tree, 1);
    expect(STRATA.map(s => [s.y0, s.y1])).toEqual([[221, 420], [420, 700], [700, 980]]);
    expect([stratumAt(300), reach(5), reach2(1)]).toEqual([null, undefined, undefined]);
    const plans = buildSkyLayout(() => new Rng(3));
    expect(plans.layout.shapes.length).toBeGreaterThan(0);
    new Threshold(host, buildTotality(() => new Rng(2), at)).update(1);
    expect(atmosphereAt('deck', 40).stars).toBe(0);
    const stash = {} as RealmSet;
    expect(swapRealm({} as RealmHost, stash, root, root)).toBe(stash);
    expect(RealmGate.check('sky', at, null, { top: 426, floorOut: 4, deck: [128, 33, 128], crown: [0, 0, 0] })).toBeNull();
    const gate = new RealmGate({ fade: () => {}, pass: () => {}, ready: () => true });
    gate.update(1);
    expect(gate.busy).toBe(false);
    const set = {} as SkyRealmSet;
    const realm = SkyRealm.create(host, root, () => set);
    expect(realm.set).toBe(set);
    realm.update(1);
    const entity = new SpikedEntity(1, at, { bounce: () => {} });
    expect(entity.body.y).toBe(2);
    new EntityView(root).sync(entity, 1);
    const encounter = new Encounter({} as EncounterHost);
    encounter.update(1, { x: 100, y: 2, z: 3 }, at); // out of range: built by EN, tests/endgame.test.ts covers the rest
    expect(encounter.holdsStill).toBe(false);
  });
});

/** The dungeon's world under the reference contract until V0 makes it implement VoxelSpace itself. */
function adapt(w: VoxelWorld): VoxelSpace {
  return Object.assign(w, {
    getAt: (i: number) => w.data[i],
    elemAtIndex: (i: number) => w.elem[i],
    coords: (i: number): [number, number, number] => [i % w.sx, Math.floor(i / w.sx) % w.sy, Math.floor(i / (w.sx * w.sy))],
  });
}
voxelSpaceContract('VoxelWorld', () => adapt(new VoxelWorld(48, 48, 48)));
