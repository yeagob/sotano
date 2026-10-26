// The item catalogue. To add an item: create a file next to this one and list it here.
// Ids must be unique (checked by tests/items.test.ts).

import type { ItemDef } from '../../items/types';
import builder from './builder';
import bulldozer from './bulldozer';
import chain from './chain';
import drill from './drill';
import farsight from './farsight';
import heavy from './heavy';
import leadboots from './leadboots';
import miner from './miner';
import springs from './springs';
import swift from './swift';
import volatile from './volatile';

export const ITEMS: readonly ItemDef[] = [
  heavy, miner, drill, chain, builder, bulldozer, volatile, springs, swift, farsight, leadboots,
];

export const ITEM_BY_ID: ReadonlyMap<string, ItemDef> = new Map(ITEMS.map(i => [i.id, i]));
