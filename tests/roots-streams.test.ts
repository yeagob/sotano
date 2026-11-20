// The Roots' draws never reach the floors below (REWARDS §4-§6, RNG.md): floors 1 to 3 draw the same at every mastery
// level, whether or not the Roots' chests were opened first. Each Roots draw reads the item pool without marking an item
// taken, takes its own fork of the seed under `floor/0/roots/…`, and never moves the loot, drops or hearts stream.

import { describe, expect, it } from 'vitest';
import { ITEM_BY_ID } from '../src/content/items';
import { CRATE_DROP, floorCrateChance, rollCrate } from '../src/content/tables/crates';
import { floorHeartChances, heartChancesOnBand, rollHeart } from '../src/content/tables/hearts';
import { rootsCrateChance } from '../src/content/tables/roots-mastery';
import { offerPedestal, rollChestContents } from '../src/game/chest-draws';
import { drawRootsItems, drawRootsPractice, redrawRootsSite, rootsFork, rootsSites } from '../src/game/roots-draws';
import { bandOf, floorY } from '../src/world/floor';
import { buildRun } from './helpers';

const SEED = 0x5eed;
const LEVELS = [0, 25, 100] as const;
/** Cells of floor 0 whose crates the script breaks (block coordinates; the game keys a crate's fork by its cell). */
const CRATES: [number, number, number][] = [[3, 5, 7], [9, 5, 2], [14, 5, 11], [20, 5, 4]];

/**
 * A scripted run of floor 0 and then floors 1 to 3: the Roots draw what the level lays (and the Roots' chests are opened
 * first when `openRoots`), then floors 1 to 3 open their chests, offer their pedestals (one held item each, so a redraw
 * happens), break crates and roll hearts. Returns what floors 1 to 3 produced, step by step.
 */
function play(level: number, openRoots: boolean): string[] {
  const run = buildRun(SEED, 4, undefined, { mastery: level });
  const { rr, pools } = run;
  const f0 = run.floors[0];
  const drawn = new Set<string>();
  drawRootsItems(pools, rr, f0, level, drawn);

  if (openRoots) {
    // every Roots chest of floor 0 opens: the free chests (their draws and practices), the Sanctuary (its practice)
    for (const c of f0.chests) {
      if (c.draws) {
        rollChestContents(rootsFork(rr, 'open', c.x, c.y, c.z), {
          floor: 0, luck: 0, draws: c.draws,
          practice: (r, band) => ITEM_BY_ID.get(drawRootsPractice(pools, r, band, drawn)) ?? null,
        });
      } else if (c.meditation) {
        drawRootsPractice(pools, rootsFork(rr, 'gift', c.x, c.y, c.z), [1, 2], drawn);
      }
    }
    // floor 0's crates and loose hearts (the Roots' chance and its own forks)
    for (const [x, y, z] of CRATES) rollCrate(rootsFork(rr, 'crate', x, y, z), rootsCrateChance(CRATE_DROP, level), { floor: 0 });
    for (let n = 0; n < 4; n++) rollHeart(rootsFork(rr, 'heart', n), heartChancesOnBand(0, floorHeartChances(rr, 0)), 0);
  }

  const log: string[] = [];
  const loot = rr.stream('loot'), drops = rr.stream('drops'), hearts = rr.stream('hearts');
  // a practice of floor 2 is held before its pedestal is offered: the offer redraws from the loot stream
  const held = run.floors[2].pedestals.find(p => p.item)?.item;
  if (held) pools.remove(held);
  for (let k = 1; k <= 3; k++) {
    const f = run.floors[k];
    for (const c of f.chests) {
      const piece = rollChestContents(loot, {
        floor: k, luck: 0, practice: (r, band) => ITEM_BY_ID.get(pools.drawRuntime('treasure', r, band)) ?? null,
      });
      log.push(`chest ${k} ${c.x},${c.z}: ${JSON.stringify(piece.map(p => [p.type, p.def?.id ?? null]))}`);
    }
    for (const p of f.pedestals) {
      const id = offerPedestal(p.item, i => pools.isTaken(i), () => pools.drawRuntime('treasure', loot));
      log.push(`pedestal ${k} ${p.room}: ${id}`);
    }
    for (let i = 0; i < 3; i++) {
      const chance = floorCrateChance(rr, k);
      log.push(`crate ${k}: ${rollCrate(drops, chance, { floor: k }) ?? 'none'}`);
    }
    const y = floorY(k) + 1;
    for (let i = 0; i < 3; i++) {
      log.push(`heart ${k}: ${rollHeart(hearts, heartChancesOnBand(bandOf(y), floorHeartChances(rr, k)), k)}`);
    }
  }
  return log;
}

describe('the Roots never move the floors below (RNG.md, REWARDS §6)', () => {
  it('floors 1 to 3 draw the same at mastery 0, 25 and 100, with and without the Roots chests opened', () => {
    const base = play(0, false);
    expect(base.length).toBeGreaterThan(0);
    for (const level of LEVELS) for (const openRoots of [false, true]) {
      expect({ level, openRoots, log: play(level, openRoots) }).toEqual({ level, openRoots, log: base });
    }
  });

  it('a Roots draw never marks an item taken, so the pool a later floor draws from is unchanged', () => {
    const run = buildRun(SEED, 1, undefined, { mastery: 100 });
    const { rr, pools } = run;
    const before = pools.size('treasure');
    const drawn = new Set<string>();
    const items = drawRootsItems(pools, rr, run.floors[0], 100, drawn);
    expect(items.size).toBeGreaterThan(0);
    for (const id of items.values()) expect(pools.isTaken(id)).toBe(false);
    expect(pools.size('treasure')).toBe(before);
  });

  it('the Roots never take a reserved practice of a deeper floor, nor offer one of their own twice', () => {
    const run = buildRun(SEED, 4, undefined, { mastery: 100 });
    const reserved = new Set(run.floors.flatMap(f => f.pedestals.map(p => p.item)).filter((x): x is string => !!x));
    const drawn = new Set<string>();
    const items = drawRootsItems(run.pools, run.rr, run.floors[0], 100, drawn);
    for (const id of items.values()) expect(reserved.has(id)).toBe(false);
    expect(new Set(items.values()).size).toBe(items.size);
    // a few more draws, well inside the pool (the pool's last-resort fallback is for an exhausted pool only)
    for (let i = 0; i < 6; i++) {
      const id = drawRootsPractice(run.pools, run.rr.fork('probe', i), [1, 3], drawn);
      expect(reserved.has(id)).toBe(false);
      expect([...items.values()]).not.toContain(id);
    }
  });

  it('a Roots practice the player already holds is never drawn for a Roots pedestal again', () => {
    const run = buildRun(SEED, 1, undefined, { mastery: 100 });
    const drawn = new Set<string>();
    const sites = rootsSites(run.floors[0], 100);
    expect(sites.length).toBeGreaterThan(0);
    const first = drawRootsItems(run.pools, run.rr, run.floors[0], 100, drawn).get(sites[0].key)!;
    run.pools.remove(first);
    const again = redrawRootsSite(run.pools, run.rr, sites[0], 1, drawn);
    expect(again).not.toBe(first);
  });

  it('a pedestal whose reserved item is held redraws, and an unheld one shows its reserved item', () => {
    const reserved = [...ITEM_BY_ID.keys()][0];
    expect(offerPedestal(reserved, () => false, () => 'other')).toBe(reserved);
    expect(offerPedestal(reserved, id => id === reserved, () => 'other')).toBe('other');
    expect(offerPedestal(null, () => true, () => 'other')).toBeNull();
  });
});
