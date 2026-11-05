// SkyRealm: the sky's set, its plans and every sky system in their update order (docs/architecture/SKY.md §2.5).
// It is the sky's only object the game holds; everything the sky does to the game goes through SkyHost.

import type * as THREE from 'three';
import type { GameBus } from '../game/events';
import type { MessageKey } from '../i18n/locales/en';
import type { Body } from '../physics/voxel-collide';
import { CHUNK } from '../world/world';
import { atmosphereAt } from './atmosphere';
import { SKY_AXIS, openGate } from './floors/tree';
import { buildSkyLayout } from './layout';
import { DEITIES } from './creatures/deities';
import { TowerKnock } from './creatures/knock';
import { Puff } from './creatures/puff';
import { SkyCreatures } from './creatures/system';
import { EarthView } from './render/earth';
import { SunView } from './render/sun';
import { SkyEffects } from './hindrances/effects';
import { HindranceRunner } from './hindrances/runner';
import { Nests } from './laws/nests';
import { OutsideWatch } from './laws/outside';
import { installNoHarm } from './laws/no-harm';
import { Ownership } from './laws/ownership';
import { Regrowth } from './laws/regrowth';
import { SpiritLaw } from './laws/spirit';
import { towerUnder } from './laws/tower';
import { Updraft } from './laws/updraft';
import { Threshold } from './totality/threshold';
import type {
  Cell, CellTest, CreatureDeps, FloorIndex, HindranceCtx, PositiveHit, SkyCreaturesApi, SkyHost, SkyPlace, SkyPlans, SkyRealmApi,
  SkyRealmSet, SkySetFactory, SkyWorldApi, Tower, Vec3,
} from './types';

/** Blocks of chunks kept materialised below and above the eye (provisional). */
const LOAD_BELOW = 64;
const LOAD_ABOVE = 96;
/** A cell to stand in is searched in rings up to PLACE_RING away, and PLACE_DROP up and down. */
const PLACE_RING = 6;
const PLACE_DROP = 8;
/** Provisional: the floors' nests hold this material until the floor generators choose theirs (F1–F5). */
const NEST_MATERIAL = 31;

/** The place label the HUD shows: `level.skyDeck` on the deck, `level.sky` above it. */
const placeLabel = (floor: number): MessageKey => (floor === 0 ? 'level.skyDeck' : 'level.sky');

export class SkyRealm implements SkyRealmApi {
  /** Builds the layout from fork('sky', …), then the set through `makeSet`. Nothing is simulated until the game installs it. */
  static create(host: SkyHost, root: THREE.Group, makeSet: SkySetFactory): SkyRealm {
    const plans = buildSkyLayout((...path) => host.fork(...path));
    return new SkyRealm(host, root, makeSet(plans.layout), plans);
  }

  readonly creatures: SkyCreaturesApi;
  private readonly world: SkyWorldApi;
  private readonly regrowth: Regrowth;
  private readonly ownership: Ownership;
  /** Built on the first update, when the sky is the active world: its cubes spawn in the sky's own set (null until then). */
  private nests: Nests[] | null = null;
  private readonly updraft: Updraft;
  private readonly outside: OutsideWatch;
  private readonly runner: HindranceRunner;
  private readonly effects: SkyEffects;
  private readonly knock: TowerKnock;
  private readonly spirit: SpiritLaw;
  private readonly threshold: Threshold;
  private readonly earth: EarthView;
  private readonly sun: SunView;
  private tower: Tower | null = null;
  private unityEntered = false;

  private constructor(private readonly host: SkyHost, root: THREE.Group, readonly set: SkyRealmSet, readonly plans: SkyPlans) {
    this.world = set.world;
    const occupied: CellTest = (x, y, z) => this.occupied(x, y, z);
    this.regrowth = new Regrowth(set.world, host, occupied);
    this.ownership = new Ownership(set.world, host);
    this.effects = new SkyEffects(host);
    this.runner = new HindranceRunner(this.hindranceCtx());
    this.knock = new TowerKnock(host, this.effects);
    this.spirit = new SpiritLaw(host);
    const deps: CreatureDeps = {
      actors: host.actors(), runner: this.runner, effects: this.effects, puff: new Puff(host), knock: this.knock, spirit: this.spirit,
    };
    this.creatures = new SkyCreatures(root, host, deps);
    // All five deities exist from the sky's birth, once: deterministic ids, never respawned or reset, so a won deity
    // stays won for the run. Each starts parked, and update() unparks only the player's floor's deity.
    for (const f of plans.floors) this.creatures.spawnDeity(DEITIES[f.animal], f).parked = true;
    // A won deity refills spirit (provisional, SKY.md §19), then opens its floor's way up (owner, 2026-11-05);
    // openGate is idempotent, so a repeat changes nothing.
    this.creatures.onWon = (_d, floor) => { host.refillSpirit(); openGate(this.world, plans.tree, floor); };
    this.earth = new EarthView(root);
    this.sun = new SunView(root, plans.totality.sun);
    const checkpoints = plans.totality.platforms.filter(p => plans.totality.checkpoints.includes(p.id));
    this.updraft = new Updraft(host, checkpoints);
    this.outside = new OutsideWatch(host, plans.tree, (tower, floor) => this.knockByGuardian(tower, floor));
    this.threshold = new Threshold(host, plans.totality);
  }

  /** The placed tower the player stands on this frame, if any (law 3.9): the creatures read it. */
  get standingTower(): Tower | null { return this.tower; }

  /** The player's last jump entered the Sun (Threshold). Unity is pending (issue #95): this records the entrance and nothing else. */
  enterUnity(): void {
    this.unityEntered = true;
  }

  get enteredUnity(): boolean { return this.unityEntered; }

  /** The sky's laws and the no-harm rule, on the bus with owner 'sky' (removed by `bus.off(null, 'sky')`). */
  install(bus: GameBus) {
    this.ownership.install(bus);
    installNoHarm(bus);
  }

  /** The order of §2.5. The gate check is the game's: the crown the sky falls to lies in the dungeon. */
  update(dt: number) {
    const body = this.host.player().body;
    // the nests spawn their cubes now, while the sky is the active world (built earlier they would fill the dungeon's)
    if (!this.nests) this.nests = this.plans.floors.map(f => new Nests(this.host, f.nests, NEST_MATERIAL));
    this.regrowth.update(dt);
    for (const n of this.nests) n.update(dt);
    this.tower = towerUnder(this.world, body);
    this.outside.update(dt);
    this.runner.update(dt);
    this.effects.update(dt);
    this.spirit.update();
    this.creatures.update(dt, this.floorAt(body.y));
    this.updraft.update(dt);
    this.threshold.update(dt);
    this.host.place(placeLabel(this.floorAt(body.y)));
  }

  /** The chunks around the eye stay materialised; the ones far below or above are evicted. */
  stream(eye: Vec3) {
    this.set.chunks.setLoadedRange(eye.y - LOAD_BELOW, eye.y + LOAD_ABOVE);
    const w = this.set.world as SkyWorldApi & { prefetch?(cx: number, cy: number, cz: number): boolean };
    if (!w.prefetch) return;
    const cx = Math.floor(eye.x / CHUNK), cy = Math.floor(eye.y / CHUNK), cz = Math.floor(eye.z / CHUNK);
    for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) w.prefetch(cx + dx, cy + dy, cz + dz);
  }

  /** Clear colour, fog colour, the fog's reach and the stars, by place and height (docs/art/sky/blocks.md); and the Earth and the Sun, placed from the eye. */
  atmosphere(eye: Vec3, fogColor: THREE.Color, fog: THREE.Fog, stars: THREE.Object3D) {
    const s = atmosphereAt(this.placeOf(eye), eye.y);
    fogColor.setHex(s.clear);
    fog.color.setHex(s.fog);
    fog.near = s.near;
    fog.far = s.far;
    stars.visible = s.stars > 0.05;
    ((stars as THREE.Points).material as THREE.PointsMaterial).opacity = s.stars;
    this.earth.update(eye, 0);
    this.sun.update(eye, 0);
  }

  /** The nearest standable cell to `at`: the highest air over solid ground, searched in rings. */
  placeAt(at: Cell): Cell {
    const [x0, y0, z0] = at;
    for (let r = 0; r <= PLACE_RING; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
      const x = x0 + dx, z = z0 + dz;
      for (let y = y0 + PLACE_DROP; y >= y0 - PLACE_DROP; y--) {
        if (this.world.solid(x, y - 1, z) && !this.world.solid(x, y, z) && !this.world.solid(x, y + 1, z)) return [x, y, z];
      }
    }
    return at;
  }

  /** Seam 13: a positive intention that hits a placed block removes it for good (law 3.2). */
  positiveHitsBlock(hit: PositiveHit): boolean {
    return this.ownership.positiveHit(hit);
  }

  /** 0 the deck, 1–5 a guardian floor, 6 Totality. */
  floorAt(y: number): number {
    if (y >= this.plans.totality.strata[0].y0) return 6;
    let floor = 0;
    for (const h of this.plans.tree.halls) if (y >= h.y0) floor = h.floor;
    return floor;
  }

  /** The sky's world is set aside: its in-flight hindrances end now, while the sky's hazards are still installed. */
  leave() {
    this.runner.clear();
  }

  dispose() {
    this.regrowth.dispose();
    for (const n of this.nests ?? []) n.dispose();
    this.creatures.dispose();
    this.earth.dispose();
    this.sun.dispose();
  }

  private placeOf(eye: Vec3): SkyPlace {
    const f = this.floorAt(eye.y);
    if (f === 6) return 'totality';
    if (f === 0) return 'deck';
    const r = this.plans.tree.trunkRadius(eye.y);
    return Math.hypot(eye.x - SKY_AXIS.x, eye.z - SKY_AXIS.z) < r ? 'hall' : 'void';
  }

  /** Read through the host on every use: the hazards belong to whichever world is active. */
  private hindranceCtx(): HindranceCtx {
    const host = this.host, effects = this.effects;
    return {
      get host() { return host; },
      get effects() { return effects; },
      get hazards() { return host.hazards(); },
      time: () => host.time(),
    };
  }

  /** Regrowth waits while the player, a sky creature or a loose cube stands in the cell (law 3.1). */
  private occupied(x: number, y: number, z: number): boolean {
    const b: Body = this.host.player().body;
    if (b.x + b.hw > x && b.x - b.hw < x + 1 && b.z + b.hw > z && b.z - b.hw < z + 1 && b.y + b.h > y && b.y < y + 1) return true;
    if (this.creatures.at(x + 0.5, y + 0.5, z + 0.5, 0.75) >= 0) return true;
    const d = this.host.debris();
    for (let i = 0; i < d.max; i++) {
      if (d.isAlive(i) && Math.floor(d.pos[i * 3]) === x && Math.floor(d.pos[i * 3 + 1]) === y && Math.floor(d.pos[i * 3 + 2]) === z) return true;
    }
    return false;
  }

  /** Law 3.8: the outside watch asks the guardian of that height to knock the tower down. */
  private knockByGuardian(tower: Tower, floor: FloorIndex) {
    const animal = this.plans.floors[floor - 1]?.animal;
    const guardian = this.creatures.all().find(a => a.role === 'deity' && a.animal === animal);
    if (guardian) this.knock.start(guardian, tower);
  }
}
