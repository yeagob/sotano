import { describe, expect, it } from 'vitest';
import type { Carried } from '../src/entities/player';
import { ITEMS } from '../src/content/items';
import { MAT } from '../src/content/materials';
import { PARTS, PART_KINDS } from '../src/content/parts';
import { pathOf } from '../src/content/patterns';
import { POTIONS, POTION_IDS } from '../src/content/potions';
import { flaskEffect, flaskName } from '../src/content/potion-text';
import { ECHO_EXCLUDED_STATS, ECHO_ITEMS, echoPool, echoable } from '../src/content/echo';
import { ECHO, FALLBACK, FAMILIES, FLESH_TONICS, ICE, brewOf, echoOf, familyOf, resolve, type DeepKind, type FamilyPath } from '../src/content/recipes';
import { itemText } from '../src/i18n/content';
import { EN } from '../src/i18n/locales/en';
import { LOCALES } from '../src/i18n/locales';

const PATHS = Object.keys(FAMILIES) as FamilyPath[];
const DEEP = PART_KINDS.filter(k => k !== 'flesh') as DeepKind[];

const partOf = (path: string, kind: string) => {
  const p = PARTS.find(x => x.kind === kind && pathOf(x.source) === path);
  if (!p) throw new Error(`no ${kind} of a ${path} pattern`);
  return p;
};

describe('potion types and their variants', () => {
  it('every type has a variant for each deep kind, each its own potion, and every variant is reachable from one part', () => {
    const all = PATHS.flatMap(path => DEEP.map(kind => FAMILIES[path][kind]));
    expect(new Set(all).size).toBe(all.length);
    for (const path of PATHS) for (const kind of DEEP) {
      expect(brewOf([MAT.stone, partOf(path, kind)]), `${path} ${kind}`).toBe(FAMILIES[path][kind]);
      expect(POTIONS[FAMILIES[path][kind]].path, `${path} ${kind}`).toBe(path);
    }
  });

  it('a variant lasts longer the deeper its kind: a mind two rooms, a heart three, an essence the floor', () => {
    for (const path of PATHS) {
      expect(POTIONS[FAMILIES[path].mind].duration).toEqual({ kind: 'rooms', rooms: 2 });
      expect(POTIONS[FAMILIES[path].heart].duration).toEqual({ kind: 'rooms', rooms: 3 });
      expect(POTIONS[FAMILIES[path].essence].duration).toEqual({ kind: 'floor' });
    }
  });

  it('the deepest kind in the bulb chooses the variant', () => {
    const body = (k: string) => partOf('body', k);
    expect(familyOf([body('flesh'), body('mind')])).toBe(FAMILIES.body.mind);
    expect(familyOf([body('mind'), body('heart')])).toBe(FAMILIES.body.heart);
    expect(familyOf([body('heart'), body('essence'), body('mind')])).toBe(FAMILIES.body.essence);
  });

  it('flesh alone is the tonic type: its variant is the number of flesh', () => {
    const flesh = PARTS.filter(p => p.kind === 'flesh');
    expect(familyOf([flesh[0]])).toBe(FLESH_TONICS[0]);
    expect(familyOf([flesh[0], flesh[5]])).toBe(FLESH_TONICS[1]);
    expect(familyOf([flesh[0], flesh[5], flesh[9]])).toBe(FLESH_TONICS[2]);
  });

  it('every potion is named and described in every language', () => {
    for (const l of LOCALES) for (const id of POTION_IDS) {
      expect(typeof l.messages[POTIONS[id].name], `${l.code} ${id}`).toBe('string');
      expect(typeof l.messages[POTIONS[id].effect], `${l.code} ${id}`).toBe('string');
    }
  });
});

describe('the echo: a mixed bulb carries the effect of a practice for a time', () => {
  const doubtHeart = partOf('mind', 'heart');
  const panicHeart = partOf('will', 'heart');

  it('parts of two or more paths, with one deeper than flesh, brew an echo of a practice of one of those paths', () => {
    const flask = resolve([doubtHeart, panicHeart]);
    expect(flask.potion).toBe(ECHO);
    const item = ECHO_ITEMS.find(d => d.id === flask.echo)!;
    expect(item).toBeDefined();
    expect(item.tags?.some(t => t === 'mind' || t === 'will')).toBe(true);
  });

  it('is learnable: the same bulb echoes the same practice in every order, with ice or without', () => {
    const a = resolve([doubtHeart, panicHeart, MAT.stone]).echo;
    expect(resolve([MAT.stone, panicHeart, doubtHeart]).echo).toBe(a);
    expect(resolve([panicHeart, ICE, doubtHeart]).echo).toBe(resolve([panicHeart, doubtHeart]).echo);
  });

  it('flesh of several paths is still the tonic type, never an echo', () => {
    expect(echoOf([partOf('mind', 'flesh'), partOf('will', 'flesh')])).toBeNull();
    expect(brewOf([partOf('mind', 'flesh'), partOf('will', 'flesh')])).toBe('restoring-draught');
  });

  it('copies only practices made of stats alone: no hooks, no stacks, no one-shot gifts, no weapon, no heart containers, no carry', () => {
    expect(ECHO_ITEMS.length).toBeGreaterThan(10);
    for (const d of ECHO_ITEMS) {
      expect(d.hooks ?? [], d.id).toEqual([]);
      expect(d.stack, d.id).toBeUndefined();
      expect(d.onGain, d.id).toBeUndefined();
      expect(d.weapon, d.id).toBeUndefined();
      expect(d.suppress ?? [], d.id).toEqual([]);
      expect(d.stats?.length, d.id).toBeGreaterThan(0);
      for (const m of d.stats ?? []) expect(ECHO_EXCLUDED_STATS, d.id).not.toContain(m.stat);
    }
    for (const d of ITEMS) if (!ECHO_ITEMS.includes(d)) expect(echoable(d), d.id).toBe(false);
  });

  it('every path has practices to echo', () => {
    for (const path of PATHS) {
      const pool = echoPool([path]);
      expect(pool.length, path).toBeGreaterThan(0);
      expect(pool.every(d => d.tags?.includes(path)), path).toBe(true);
    }
  });

  it('names the practice and its effect in the flask\'s name and effect line', () => {
    const flask = resolve([doubtHeart, panicHeart]);
    const item = ECHO_ITEMS.find(d => d.id === flask.echo)!;
    expect(flaskName(flask)).toContain(itemText(item).name);
    expect(flaskEffect(flask)).toContain(itemText(item).effect);
    expect(EN.messages[POTIONS[ECHO].effect]).toContain('{itemEffect}');
  });
});

const label = (c: Carried) => (typeof c === 'number' ? `block ${c}` : 'potion' in c ? c.potion : c.id);

describe('the Plain Tonic is the rare fallback', () => {
  it('a bulb with any part never brews the Plain Tonic; a bulb of blocks or ice does', () => {
    const cubes: Carried[] = [...PARTS, MAT.stone, MAT.deepstone, ICE];
    for (const a of cubes) for (const b of cubes) {
      const hasPart = typeof a === 'object' || typeof b === 'object';
      expect(brewOf([a, b]) === FALLBACK, `${label(a)} ${label(b)}`).toBe(!hasPart);
    }
  });
});
