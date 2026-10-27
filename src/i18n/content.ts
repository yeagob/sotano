// Content texts in the current language. Items, synergies, enemies and materials keep their
// English in their own definitions; catalogs translate them by id. Every accessor returns a new
// object and falls back field by field to the definition, so a missing translation shows English
// and nothing here ever writes to a definition (localized text must never reach the simulation).

import { ENEMY_BY_ID } from '../content/enemies';
import { ITEM_BY_ID } from '../content/items';
import { mat } from '../content/materials';
import type { EnemyDef } from '../enemies/types';
import type { ItemDef, SynergyDef } from '../items/types';
import { catalog, fill, t, type MessageKey, type Params } from '.';

export const PATHS = ['body', 'mind', 'emotion', 'will'] as const;
export type PathTag = (typeof PATHS)[number];

export function itemText(d: ItemDef) {
  const tr = catalog().content.items[d.id] ?? {};
  return {
    name: tr.name ?? d.name,
    description: tr.description ?? d.description,
    effect: tr.effect ?? d.effect,
    inspiredBy: tr.inspiredBy ?? d.inspiredBy,
  };
}

/** A message an item or synergy shows (`messages`, raised with `api.toast(id)`), in the current
 *  language, falling back to the definition's English; null if the effect has no such message. */
export function effectMessage(owner: ItemDef | SynergyDef, id: string, params?: Params): string | null {
  const tr = 'effect' in owner ? catalog().content.items[owner.id] : catalog().content.synergies[owner.id];
  const text = tr?.messages?.[id] ?? owner.messages?.[id];
  return text === undefined ? null : fill(text, params);
}

export function synergyText(s: SynergyDef) {
  const tr = catalog().content.synergies[s.id] ?? {};
  return { name: tr.name ?? s.name, description: tr.description ?? s.description };
}

export function enemyText(e: EnemyDef) {
  const tr = catalog().content.enemies[e.id] ?? {};
  return { name: tr.name ?? e.name, pattern: tr.pattern ?? e.pattern };
}

export function materialName(id: number) {
  const m = mat(id);
  return catalog().content.materials[m.key] ?? m.name;
}

export const isPath = (tag: string): tag is PathTag => (PATHS as readonly string[]).includes(tag);
export const pathName = (tag: PathTag) => t(`path.${tag}`);

/** Causes with their own message (`cause.<id>`). */
type CauseId<K = MessageKey> = K extends `cause.${infer C}` ? C : never;
const CAUSES = ['judgement', 'bomb', 'contact', 'item', 'console', 'lava', 'fire', 'drown'] as const satisfies readonly CauseId[];

/**
 * What a damage `source` id means to the player, for the death screen. Sources come from the
 * damage pipeline: an enemy id ('doubt'), 'enemy:<id>' (its explosion), 'explosion:<source>',
 * an item id, an item's own source label (`ItemDef.causes`), or a fixed cause ('bomb', 'judgement'…).
 */
export function causeName(source: string): string {
  let s = source;
  for (;;) {
    const m = /^(?:explosion|enemy|item):(.+)$/.exec(s);
    if (!m) break;
    s = m[1];
  }
  const enemy = ENEMY_BY_ID.get(s);
  if (enemy) return enemyText(enemy).name;
  const item = ITEM_BY_ID.get(s) ?? ownerOfCause(s);
  if (item) return itemText(item).name;
  if ((CAUSES as readonly string[]).includes(s)) return t(`cause.${s as (typeof CAUSES)[number]}`);
  return t(source.startsWith('explosion') || source.startsWith('enemy:') ? 'cause.explosion' : 'cause.unknown');
}

let causeOwners: Map<string, ItemDef> | null = null;
function ownerOfCause(source: string) {
  if (!causeOwners) {
    causeOwners = new Map();
    for (const d of ITEM_BY_ID.values()) for (const c of d.causes ?? []) causeOwners.set(c, d);
  }
  return causeOwners.get(source);
}
