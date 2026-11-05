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
import { ActorRegistry } from '../src/entities/actors';
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
import { FAR_DRAW, placeFar } from '../src/sky/render/far';
import { CORONA_FULL_AT, CORONA_SHELLS, SunView, coronaFade } from '../src/sky/render/sun';
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
  type SkyActor, type SkyViewCtor, type SkyWorldApi, type SpikedEntityCtor, type SunViewCtor, type SwapRealm, type ThresholdCtor,
  type TowerKnockCtor, type TowerUnder, type UpdraftCtor, type Vec3,
} from '../src/sky/types';
import { createBus, type GameBus } from '../src/game/events';
import type { Body } from '../src/physics/voxel-collide';
import type { VoxelSpace } from '../src/world/space';
import { VoxelWorld } from '../src/world/world';
import { voxelSpaceContract } from './helpers/voxel-space-contract';

// Every stub has its contract's signature (checked by the compiler).
const contracts: [
  RegrowthCtor, OwnershipCtor, InstallNoHarm, NestsCtor, TowerUnder, UpdraftCtor, OutsideWatchCtor,
  HindranceRunnerCtor, SkyEffectsCtor, SkyCreaturesCtor, DeityCtor, MinionCtor, PuffCtor, TowerKnockCtor,
  HitMarksCtor, CreatureViewCtor, SkyViewCtor, SunViewCtor, ThresholdCtor, RealmGateCtor, SwapRealm, SkyRealmCtor,
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
  const bus: GameBus = createBus();
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
    // Updraft and OutsideWatch are built (L2): tests/sky-updraft.test.ts and tests/sky-outside.test.ts drive them.
    expect(new Updraft(host, []).carrying).toBe(false);
    new OutsideWatch(host, tree, () => {});
    runner.update(1);
    expect(runner.active()).toEqual([]);
    effects.update(1);
    const creatures = new SkyCreatures(root, host, deps);
    expect([creatures.at(0, 0, 0, 1), creatures.targets().length, creatures.owns(1)]).toEqual([-1, 0, false]);
    // Deity and puff are built (C0): tests/sky-creatures.test.ts drives them with a full host and actor.
    new Minion(actor, MINIONS.panda, plan, deps, host, new Rng(1)).update(1, null, []);
    knock.update(1);
    expect(stageOf(8, 24)).toBe(1);
    expect(stageOf(48, 24)).toBe(2);
    for (const make of Object.values(gaits)) expect(typeof make).toBe('function');
    new HitMarks(root, 24).add(at);
    new CreatureView(root).update(1, []);
    new EarthView(root).update(at, 1);
    new SunView(root, buildTotality(() => new Rng(2), at).sun).update(at, 1);
    // The graph helpers are built (C0): the floor stub's one seat is found, with no links (tests/sky-creatures.test.ts covers routes).
    expect(placeById(plan.graph, 0)).toBe(plan.graph.places[0]);
    expect(nearest(plan.graph, 128, 60, 128)).toBe(plan.graph.places[0]);
    expect(route(plan.graph, 0, 0, ['walk'])?.[0]).toBe(0);
    expect(Array.isArray(linksOf(plan.graph, 0))).toBe(true);
    openGate(world, tree, 1);
    expect(STRATA.map(s => [s.y0, s.y1])).toEqual([[221, 420], [420, 700], [700, 980]]);
    expect([stratumAt(300)?.name, reach(5) !== undefined, reach2(1) !== undefined]).toEqual(['lower', true, true]);
    const plans = buildSkyLayout(() => new Rng(3));
    expect(plans.layout.shapes.length).toBeGreaterThan(0);
    const farPlayer = { ...host, player: () => ({ body: { x: 0, y: 0, z: 0, hw: 0.3, h: 1.8 } }) } as unknown as SkyHost;
    new Threshold(farPlayer, buildTotality(() => new Rng(2), at)).update(1);
    expect(atmosphereAt('deck', 40).stars).toBe(0);
    const stash = { kind: "dungeon" } as RealmSet;
    const inert = { install() {}, current: () => stash, clearTransient() {}, hooks() {} } as RealmHost;
    expect(swapRealm(inert, stash, root, root)).toBe(stash); // the real swap is tested in realm-swap.test.ts
    expect(RealmGate.check('sky', { x: 128, y: 33, z: 128 }, null, { top: 426, floorOut: 4, deck: [128, 33, 128], crown: [0, 0, 0] })).toBeNull(); // the passages: realm-gate.test.ts
    const gate = new RealmGate({ fade: () => {}, pass: () => {}, ready: () => true });
    gate.update(1);
    expect(gate.busy).toBe(false);
    const set = { world: {} } as unknown as SkyRealmSet; // a world object is enough to build the laws
    const actors = new ActorRegistry();
    actors.setRealm('sky');
    const realm = SkyRealm.create({ ...host, actors: () => actors, debris: () => ({ spawn: () => 0 }) } as unknown as SkyHost, root, () => set);
    expect(realm.set).toBe(set);
    expect(realm.creatures.all()).toHaveLength(5); // the five deities exist from the start (SKY.md §5.3)
    // realm.update needs a player: the passage and the frame are tested in realm-gate and sky-acceptance
    const entity = new SpikedEntity(1, at, { bounce: () => {} });
    expect(entity.body.y).toBe(2);
    new EntityView(root).sync(entity, 1);
    const encounter = new Encounter({} as EncounterHost);
    encounter.update(1, { x: 100, y: 2, z: 3 }, at); // out of range: built by EN, tests/endgame.test.ts covers the rest
    expect(encounter.holdsStill).toBe(false);
  });
});

/** A sky realm whose root is `root`: its creatures' holders come first, then the Earth and the Sun (added last). */
function viewRealm(root: THREE.Group): SkyRealm {
  const actors = new ActorRegistry();
  actors.setRealm('sky');
  const host = { fork: () => new Rng(7), actors: () => actors, debris: () => ({ spawn: () => 0 }) } as unknown as SkyHost;
  return SkyRealm.create(host, root, () => ({ world: {} }) as unknown as SkyRealmSet);
}

describe('far views: the Earth and the Sun in view (SKY.md §11)', () => {
  const eye = { x: 5, y: 600, z: -3 };
  const dir = { x: 0.6, y: 0.8, z: 0 }; // a unit vector: the line from the eye

  it('placeFar keeps the angular size, keeps the line, and keeps the centre inside 200 at any distance', () => {
    for (const d of [20, FAR_DRAW, FAR_DRAW + 1, 300, 900]) {
      const g = new THREE.Group();
      const centre = { x: eye.x + dir.x * d, y: eye.y + dir.y * d, z: eye.z + dir.z * d };
      const drawn = placeFar(g, eye, centre, 30);
      const p = g.position;
      const along = Math.hypot(p.x - eye.x, p.y - eye.y, p.z - eye.z);
      // the centre only: a view's radius may reach past 200 (the corona's 90 adds to it), and its visible front is fine
      expect(along, `distance ${d}`).toBeLessThanOrEqual(Math.min(d, FAR_DRAW) + 1e-9);
      expect(along).toBeLessThan(200);
      expect((p.x - eye.x) / along).toBeCloseTo(dir.x);
      expect((p.y - eye.y) / along).toBeCloseTo(dir.y);
      expect(drawn / along, `angular size at ${d}`).toBeCloseTo(30 / d);
      expect(g.scale.x).toBeCloseTo(Math.min(1, FAR_DRAW / d));
    }
  });

  it('the Sun stands at its volume when near, and is drawn on its line from far away', () => {
    const plan = buildTotality(() => new Rng(2), { x: 128, y: 221, z: 128 });
    const sun = plan.sun;
    const root = new THREE.Group();
    const view = new SunView(root, sun);
    const group = root.children[0];
    view.update({ x: sun.x - 40, y: sun.y, z: sun.z }, 0);
    expect(group.visible).toBe(true);
    expect([group.position.x, group.position.y, group.position.z]).toEqual([sun.x, sun.y, sun.z]);
    expect(group.scale.x).toBe(1);
    view.update({ x: sun.x - 400, y: sun.y, z: sun.z }, 0);
    expect(group.position.x).toBeCloseTo(sun.x - 400 + FAR_DRAW);
    expect(group.scale.x).toBeCloseTo(FAR_DRAW / 400);
    view.update({ x: sun.x - 40, y: 300, z: sun.z }, 0);
    expect(group.visible).toBe(false);
    view.dispose();
  });

  it('the Earth is hidden below 380 and above 720, and drawn as a backdrop between', () => {
    const root = new THREE.Group();
    const earth = new EarthView(root);
    const group = root.children[0];
    for (const y of [379, 721]) {
      earth.update({ x: 0, y, z: 0 }, 0);
      expect(group.visible, `eye at ${y}`).toBe(false);
    }
    for (const y of [380, 550, 720]) {
      earth.update({ x: 0, y, z: 0 }, 0);
      expect(group.visible, `eye at ${y}`).toBe(true);
    }
    // the body is opaque in colour and drawn after the rim, so it covers the rim's centre
    const [body, limb] = group.children as THREE.Mesh[];
    expect(body.renderOrder).toBe(-1);
    expect(limb.renderOrder).toBe(-2);
    group.traverse(o => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mat = m.material as THREE.MeshBasicMaterial;
      expect(mat.depthWrite).toBe(false);
      expect(mat.transparent).toBe(true);
    });
    expect((body.material as THREE.MeshBasicMaterial).opacity).toBe(1);
    earth.dispose();
  });

  it('the Sun draws its corona under its disc, and the corona fades in with distance from the Sun', () => {
    const root = new THREE.Group();
    const view = new SunView(root, { x: 0, y: 700, z: 0, r: 30 });
    const group = root.children[0] as THREE.Group;
    const [disc, ...shells] = group.children as THREE.Mesh[];
    expect(disc.renderOrder).toBe(-1);
    expect(shells.map(s => s.renderOrder)).toEqual([-2, -2, -2]);
    expect((disc.material as THREE.MeshBasicMaterial).opacity).toBe(1);
    const opacities = () => shells.map(s => (s.material as THREE.MeshBasicMaterial).opacity);
    view.update({ x: 0, y: 700, z: 60 }, 0); // 60 from the Sun's centre: inside the corona's outer shell, partly faded
    expect(opacities().every((o, i) => o > 0 && o < CORONA_SHELLS[i].opacity)).toBe(true);
    view.update({ x: 0, y: 700, z: 25 }, 0); // inside the disc's edge: no corona at all
    expect(opacities()).toEqual([0, 0, 0]);
    view.update({ x: 0, y: 700, z: CORONA_FULL_AT }, 0);
    expect(opacities()).toEqual(CORONA_SHELLS.map(s => s.opacity));
    expect(coronaFade(30, 30)).toBe(0);
    expect(coronaFade(CORONA_FULL_AT + 50, 30)).toBe(1);
    view.dispose();
  });

  it('the Earth whose centre hangs 300 below the eye is drawn 150 below it, at half scale', () => {
    const root = new THREE.Group();
    const earth = new EarthView(root);
    const group = root.children[0];
    earth.update({ x: 5, y: 550, z: -3 }, 0);
    expect(group.position.x).toBeCloseTo(5);
    expect(group.position.y).toBeCloseTo(400);
    expect(group.position.z).toBeCloseTo(-3);
    expect(group.scale.x).toBeCloseTo(0.5);
    earth.dispose();
  });

  it('atmosphere() shows the Earth from 380 to 720 and the Sun from 640 up, each placed from the eye', () => {
    const root = new THREE.Group();
    const realm = viewRealm(root);
    const [earth, sun] = root.children.slice(-2);
    const { x, y, z } = realm.plans.totality.sun;
    expect(y).toBeGreaterThanOrEqual(640);
    const color = new THREE.Color();
    const fog = new THREE.Fog('black', 1, 100);
    const stars = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial());
    const air = (e: Vec3) => realm.atmosphere(e, color, fog, stars);

    air({ x: x - 40, y: 300, z });
    expect([earth.visible, sun.visible]).toEqual([false, false]);
    air({ x: 5, y: 550, z: -3 });
    expect([earth.visible, sun.visible]).toEqual([true, false]);
    air({ x: x - 40, y, z });
    expect(sun.visible).toBe(true);
    expect([sun.position.x, sun.position.y, sun.position.z]).toEqual([x, y, z]);
    expect(sun.scale.x).toBe(1);
    realm.dispose();
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
