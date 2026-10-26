// The item catalogue: practices the player picks up (see docs/design/STORY.md §5 for names and
// meaning, docs/architecture/ITEMS.md for how they work). To add one: create a file next to this
// one and list it here (and follow the sotano-items skill).
// Ids must be unique (checked by tests/items.test.ts).

import type { ItemDef } from '../../items/types';
import acceptance from './acceptance';
import boxbreathing from './boxbreathing';
import catharsis from './catharsis';
import deepfocus from './deepfocus';
import exposure from './exposure';
import flow from './flow';
import gratitude from './gratitude';
import grounding from './grounding';
import habitstack from './habitstack';
import kaizen from './kaizen';
import manthinketh from './manthinketh';
import meditations from './meditations';
import mindset from './mindset';
import satori from './satori';
import secondbrain from './secondbrain';
import selfreliance from './selfreliance';
import senecaletters from './senecaletters';
import socratic from './socratic';
import stoic from './stoic';
import taoteching from './taoteching';
import visualization from './visualization';

export const ITEMS: readonly ItemDef[] = [
  stoic, deepfocus, kaizen, habitstack, secondbrain, exposure,
  catharsis, mindset, flow, visualization, grounding, meditations,
  selfreliance, taoteching, manthinketh, senecaletters, satori,
  gratitude, boxbreathing, acceptance, socratic,
];

export const ITEM_BY_ID: ReadonlyMap<string, ItemDef> = new Map(ITEMS.map(i => [i.id, i]));
