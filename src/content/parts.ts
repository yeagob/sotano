// What a projection leaves behind when it is released (BESTIARY §5.7): flesh, heart, mind or
// essence, named after the pattern it came from. Parts are collectible and sit in the inventory,
// but they have no effect: they are not items and never enter the Inventory.

import type { Rng } from '../core/rng';
import type { ItemIcon } from '../items/types';
import { pal } from './palette';
import { PART_ICONS } from './part-icons';

export const PART_KINDS = ['flesh', 'heart', 'mind', 'essence'] as const;
export type PartKind = (typeof PART_KINDS)[number];

/** Chance per release, per kind (BESTIARY §5.7). Rolled in this order, so the order is part of the seed's meaning. */
export const PART_CHANCE: Record<PartKind, number> = { flesh: 0.3, mind: 0.12, heart: 0.05, essence: 0.02 };

export interface PartDef {
  id: string;
  source: string;
  kind: PartKind;
  name: string;
  description: string;
  color: number;
  icon: ItemIcon;
}

const part = (source: string, kind: PartKind, name: string, description: string): PartDef => {
  const id = `${source}.${kind}`;
  return { id, source, kind, name, description, color: pal('bone.dim'), icon: PART_ICONS[id] };
};

export const PARTS: readonly PartDef[] = [
  part('doubt', 'flesh', "Doubt's sack-stone", 'Heavy from carrying every maybe.'),
  part('doubt', 'heart', "Doubt's pause", 'The breath before a yes or a no, kept.'),
  part('doubt', 'mind', "Doubt's question", 'A question with no question mark.'),
  part('doubt', 'essence', "Doubt's upright light", 'A light that stands up when nothing else does.'),
  part('critic', 'flesh', "The Lectern's ruled page", 'Lined, and marked in advance.'),
  part('critic', 'heart', "The Lectern's ink tick", 'A small mark that counts what was wrong.'),
  part('critic', 'mind', "The Lectern's margin note", 'A note in the margin, about you.'),
  part('critic', 'essence', "The Lectern's blank page", 'Nothing written yet. Nothing judged yet.'),
  part('panic', 'flesh', "Panic's cracked husk", 'The shell that broke and kept its shape.'),
  part('panic', 'heart', "Panic's captive ember", 'A warm spark held shut, not burning out.'),
  part('panic', 'mind', "Panic's alarm", 'A bell that rang once and never stopped.'),
  part('panic', 'essence', "Panic's shut eyes", 'Eyes closed, so nothing else can come in.'),
];

export const PART_BY_ID: ReadonlyMap<string, PartDef> = new Map(PARTS.map(p => [p.id, p]));

/** The parts a release of `source` leaves, one roll per kind. A source with no parts yields none. */
export function rollParts(rng: Rng, source: string): PartDef[] {
  const out: PartDef[] = [];
  for (const kind of ['flesh', 'mind', 'heart', 'essence'] as const) {
    if (!rng.chance(PART_CHANCE[kind])) continue;
    const def = PARTS.find(p => p.source === source && p.kind === kind);
    if (def) out.push(def);
  }
  return out;
}
