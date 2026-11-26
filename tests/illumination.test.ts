// The ending of illumination and the ascent companions (issue #351; docs/design/built/levels/totality/ILLUMINATION.md):
// the rise begins only with the five guardians won and the feet on the last checkpoint; the light steps up in time,
// never by the seed; the card is due once; the achievement is granted once, never in the sandbox, and nothing here
// writes the save; the words exist in both languages; the run's friends are counted from the conversion events and
// rise round the player, the deities first.

import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '../src/content/achievements';
import { Rng, hashPath } from '../src/core/rng';
import { ActorRegistry } from '../src/entities/actors';
import { AchievementKeeper } from '../src/game/achievement-keeper';
import { AllyTally, allyKindOf } from '../src/game/ally-tally';
import { AscentCompanions, COMPANIONS, roster, shownCount } from '../src/game/ascent-companions';
import { loadMeta, type MetaStore } from '../src/game/meta';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';
import { SkyRealm } from '../src/sky/sky-realm';
import { ASCENSION, Ascension, CARD_AT, bellTimes, lightAt, onLast, ridePath } from '../src/sky/totality/ascension';
import { buildTotality, footprint } from '../src/sky/totality/chain';
import { CompanionView } from '../src/render/companion-view';
import { pal } from '../src/content/palette';
import type { SkyHost, SkyRealmSet } from '../src/sky/types';

const forkFor = (seed: number) => (...path: (string | number)[]) => new Rng(hashPath(seed, path));
const planFor = (seed: number) => buildTotality(forkFor(seed), { x: 128, y: 221, z: 128 });
const lastOf = (seed: number) => { const p = planFor(seed); return { plan: p, last: p.platforms[p.platforms.length - 1] }; };

describe('the trigger: five guardians won and the whole ascent made', () => {
  it('begins only when both hold, and only once', () => {
    const { plan, last } = lastOf(1);
    const a = new Ascension(last, plan.sun);
    expect(a.tryBegin(false, true)).toBe(false);
    expect(a.tryBegin(true, false)).toBe(false);
    expect(a.phase).toBe('waiting');
    expect(a.tryBegin(true, true)).toBe(true);
    expect(a.tryBegin(true, true)).toBe(false);
    expect(a.phase).toBe('rising');
  });

  it('the feet stand on the last checkpoint only on its top, on the ground', () => {
    const { last } = lastOf(2);
    const f = footprint(last);
    const x = (f.x0 + f.x1) / 2, z = (f.z0 + f.z1) / 2;
    expect(onLast(last, { x, y: last.y, z, onGround: true })).toBe(true);
    expect(onLast(last, { x, y: last.y, z, onGround: false })).toBe(false);
    expect(onLast(last, { x, y: last.y - 6, z, onGround: true })).toBe(false);
    expect(onLast(last, { x: f.x1 + 3, y: last.y, z, onGround: true })).toBe(false);
  });

  it('the realm counts the five as the deities of the five floors, won (side ally)', () => {
    const actors = new ActorRegistry();
    actors.setRealm('sky');
    const host = { fork: forkFor(3), actors: () => actors, debris: () => ({ spawn: () => 0 }) } as unknown as SkyHost;
    const realm = SkyRealm.create(host, new THREE.Group(), () => ({ world: {} }) as unknown as SkyRealmSet);
    const deities = realm.creatures.all().filter(a => a.role === 'deity');
    expect(deities.map(d => d.animal).sort()).toEqual(['elephant', 'horse', 'koala', 'lion', 'panda']);
    expect(realm.fiveWon).toBe(false);
    for (const d of deities.slice(0, 4)) d.side = 'ally';
    expect(realm.fiveWon).toBe(false);
    deities[4].side = 'ally';
    expect(realm.fiveWon).toBe(true);
    expect(realm.ascension.phase).toBe('waiting');
  });
});

describe('the sequence: rise, light in steps, card (ASCENSION)', () => {
  it('the timings live in ASCENSION: the card follows the rise and the hold; eight bells, evenly spaced', () => {
    expect(CARD_AT).toBe(ASCENSION.RISE_S + ASCENSION.HOLD_S);
    expect(bellTimes()).toHaveLength(8);
    expect(bellTimes().map((t, i, a) => i ? t - a[i - 1] : 0).slice(1).every(d => Math.abs(d - ASCENSION.BELL_EVERY_S) < 1e-9)).toBe(true);
    const game = readFileSync('src/game/game.ts', 'utf8');
    expect(game).toMatch(/celestialBells\(bellTimes\(\)\)/);
    expect(game).toMatch(/lightLevel\(asc\.light, ASCENSION\.STEP_EASE_S\)/);
  });

  it('the light rises in LIGHT_STEPS steps over the rise, never down, and is full from the end of the rise', () => {
    expect(lightAt(-1)).toBe(0);
    const seen = new Set<number>();
    let prev = 0;
    for (let t = 0; t <= CARD_AT + 2; t += 0.05) {
      const l = lightAt(t);
      expect(l).toBeGreaterThanOrEqual(prev);
      prev = l;
      seen.add(l);
    }
    expect(seen.size).toBe(ASCENSION.LIGHT_STEPS);
    expect(lightAt(ASCENSION.RISE_S)).toBe(1);
    // a step lasts RISE_S / LIGHT_STEPS seconds: slower than the 3 Hz rule allows
    expect(ASCENSION.RISE_S / ASCENSION.LIGHT_STEPS).toBeGreaterThan(1 / 3);
  });

  it('the same seconds give the same light and phase on any seed: time alone drives it', () => {
    const a = new Ascension(lastOf(1).last, lastOf(1).plan.sun), b = new Ascension(lastOf(9).last, lastOf(9).plan.sun);
    a.tryBegin(true, true); b.tryBegin(true, true);
    for (let i = 0; i < 300; i++) {
      a.update(1 / 30); b.update(1 / 30);
      expect([a.light, a.phase]).toEqual([b.light, b.phase]);
    }
  });

  it('the ride ends inside the Sun, above its centre, on every seed', () => {
    for (const seed of [1, 4, 7, 11]) {
      const { plan, last } = lastOf(seed);
      const { to } = ridePath(last, plan.sun);
      expect(Math.hypot(to.x - plan.sun.x, to.y - plan.sun.y, to.z - plan.sun.z)).toBeLessThan(plan.sun.r);
      expect(to.y).toBeGreaterThan(last.y);
    }
  });

  it('the card is due once, at CARD_AT, and the platform is held in the Sun after the rise', () => {
    const { plan, last } = lastOf(5);
    const a = new Ascension(last, plan.sun);
    a.tryBegin(true, true);
    let cards = 0, at = -1;
    for (let i = 0; i < 400; i++) { a.update(1 / 40); if (a.takeCard()) { cards++; at = a.time; } }
    expect(cards).toBe(1);
    expect(at).toBeGreaterThanOrEqual(CARD_AT);
    expect(at).toBeLessThan(CARD_AT + 0.05);
    expect(a.platformAt()).toEqual(a.to);
  });
});

/** An in-memory store that counts its writes. */
function memory(): MetaStore & { writes: number } {
  const s = { value: null as string | null, writes: 0, read: () => s.value, write: (v: string) => { s.value = v; s.writes++; } };
  return s;
}

describe('the achievement: Turned to Light (sun.illumination)', () => {
  it('is one catalogue entry on the illumination event, named in both languages', () => {
    expect(ACHIEVEMENTS.filter(d => d.id === 'sun.illumination')).toEqual([{ id: 'sun.illumination', on: 'illumination' }]);
    expect(EN.messages['achievement.sun.illumination.name']).toBe('Turned to Light');
    expect(ES.messages['achievement.sun.illumination.name']).toBe('Convertido en luz');
    expect(ES.messages['achievement.sun.illumination.desc']).toBeTruthy();
  });

  it('is granted once: a second ending gives nothing', () => {
    const store = memory(), record = loadMeta(store), k = new AchievementKeeper(record, store);
    expect(k.track('illumination', { friends: 7 }, 1).map(n => n.id)).toEqual(['sun.illumination']);
    expect(k.track('illumination', { friends: 9 }, 2)).toEqual([]);
    expect(k.unlocked('sun.illumination')).toBe(true);
    expect(store.writes).toBe(1);
  });

  it('is never granted in the sandbox, and nothing is written', () => {
    const store = memory(), record = loadMeta(store), k = new AchievementKeeper(record, store);
    k.live = false;
    expect(k.track('illumination', { friends: 7 }, 1)).toEqual([]);
    expect(k.unlocked('sun.illumination')).toBe(false);
    expect(store.writes).toBe(0);
  });

  it('the ending, the friends and the companions never read or write the save', () => {
    for (const f of ['src/sky/totality/ascension.ts', 'src/game/ally-tally.ts', 'src/game/ascent-companions.ts', 'src/render/companion-view.ts', 'src/sky/render/rising-platform.ts']) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/meta|saveMeta|localStorage|keeper/);
    }
  });
});

describe('the card: the owner\'s three lines, in both languages', () => {
  it('the Spanish is the owner\'s, word for word; the English exists', () => {
    expect([ES.messages['sun.ending.1'], ES.messages['sun.ending.2'], ES.messages['sun.ending.3']]).toEqual([
      'Felicidades, has alcanzado la iluminación.',
      'Nadie se ilumina solo. Alcanzamos juntas la iluminación, juntas con @.',
      'Finalmente os habéis convertido en luz.',
    ]);
    for (const k of ['sun.ending.1', 'sun.ending.2', 'sun.ending.3'] as const) expect(EN.messages[k]).toBeTruthy();
  });
});

describe('the run\'s friends (ally-tally.ts)', () => {
  const change = (source: string, from = 'projection', to = 'self') => ({ targetKind: 'projection', def: 'doubt', from, to, source });

  it('a change to the player\'s side names the kind; any other change names none', () => {
    expect(allyKindOf(change('polarity'), 'projection')).toBe('projection');
    expect(allyKindOf(change('polarity'), 'boss')).toBe('boss');
    expect(allyKindOf(change('polarity'), 'creature')).toBe('creature');
    expect(allyKindOf(change('mender'), 'projection')).toBe('mended');
    expect(allyKindOf(change('polarity', 'self', 'projection'), 'projection')).toBeNull();
    expect(allyKindOf(change('sandbox'), 'projection')).toBeNull();
  });

  it('counts every kind, and each won guardian once', () => {
    const t = new AllyTally();
    t.record('projection', 'doubt'); t.record('projection', 'doubt'); t.record('boss', 'resistance');
    t.syncDeities(['panda', 'koala']); t.syncDeities(['panda', 'koala', 'elephant']);
    expect([t.count('projection'), t.count('boss'), t.count('deity'), t.total]).toEqual([2, 1, 3, 6]);
    expect(t.kinds).toEqual(['deity', 'projection', 'boss']);
  });
});

describe('the ascent companions', () => {
  const tally = () => {
    const t = new AllyTally();
    t.syncDeities(['panda', 'koala', 'elephant', 'lion', 'horse']);
    for (let i = 0; i < 30; i++) t.record('projection', 'doubt');
    t.record('creature', 'mossling'); t.record('boss', 'resistance'); t.record('mended', 'critic');
    return t;
  };

  it('the roster has the five deities first, then one of each other kind, and is never over the limit', () => {
    const r = roster(tally());
    expect(r.slice(0, 5).every(e => e.kind === 'deity')).toBe(true);
    expect(new Set(r.slice(5, 9).map(e => e.kind))).toEqual(new Set(['projection', 'mended', 'creature', 'boss']));
    expect(r.length).toBeLessThanOrEqual(COMPANIONS.MAX);
  });

  it('the deities appear at once, then each kind in turn, then more up the ascent until the space is full', () => {
    const r = roster(tally());
    expect(shownCount(r, 0, 0)).toBe(5);
    expect(shownCount(r, COMPANIONS.APPEAR_EVERY_S * 4, 0)).toBe(9);
    expect(shownCount(r, 60, 0.4)).toBeGreaterThan(9);
    expect(shownCount(r, 60, COMPANIONS.FULL_AT)).toBe(r.length);
  });

  it('they follow the player\'s height smoothly, not at it, and each kind\'s first is announced once', () => {
    const c = new AscentCompanions(), r = roster(tally());
    const first = c.update(1 / 60, r, 0, { x: 0, y: 300, z: 0 });
    expect(first).toEqual(['deity']);
    // the player rises 10 blocks at once: one frame later every companion lags behind its place
    c.update(1 / 60, r, 0, { x: 0, y: 310, z: 0 });
    for (const m of c.companions) expect(m.y).toBeLessThan(310 + 3);
    const ys = c.companions.map(m => m.y);
    for (let i = 0; i < 600; i++) c.update(1 / 60, r, 0.1, { x: 0, y: 310, z: 0 });
    // they have caught up, each at its own place round the player
    for (const [i, m] of c.companions.entries()) if (i < ys.length) expect(m.y).toBeGreaterThan(ys[i]);
    const kinds = new Set<string>();
    const c2 = new AscentCompanions();
    for (let i = 0; i < 1200; i++) for (const k of c2.update(1 / 60, r, i / 1200, { x: 0, y: 300, z: 0 })) { expect(kinds.has(k)).toBe(false); kinds.add(k); }
    expect(kinds).toEqual(new Set(['deity', 'projection', 'mended', 'creature', 'boss']));
  });
});

describe('the friends of the ending are white (owner, 2026-11-26)', () => {
  it('every part of every friend, of every kind, is drawn in the white of the light', () => {
    const root = new THREE.Group(), view = new CompanionView(root), white = new THREE.Color(pal('light.core'));
    const kinds = [['deity', 'panda'], ['projection', 'doubt'], ['mended', 'critic'], ['creature', 'mossling'], ['boss', 'resistance']] as const;
    view.update(0, kinds.map(([kind, def], slot) => ({ slot, kind, def, x: 0, y: 0, z: 0 })), { x: 0, z: 10 });
    let parts = 0;
    root.traverse(o => {
      const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
      if (!m) return;
      parts++;
      expect(m.color.getHex()).toBe(white.getHex());
    });
    expect(parts).toBeGreaterThan(kinds.length);
    view.dispose();
  });
});
