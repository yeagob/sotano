// The item catalogue: practices the player picks up (see docs/design/STORY.md §5 for names and
// meaning, docs/architecture/ITEMS.md for how they work). To add one: create a file next to this
// one and list it here (and follow the sotano-items skill).
// Ids must be unique (checked by tests/items.test.ts).

import type { ItemDef } from '../../items/types';
import acceptance from './acceptance';
import arttherapy from './arttherapy';
import boxbreathing from './boxbreathing';
import catharsis from './catharsis';
import constellation from './constellation';
import deepfocus from './deepfocus';
import exposure from './exposure';
import flow from './flow';
import forgiveness from './forgiveness';
import gratitude from './gratitude';
import grounding from './grounding';
import habitstack from './habitstack';
import kaizen from './kaizen';
import kiai from './kiai';
import lionsmane from './lionsmane';
import manthinketh from './manthinketh';
import meditations from './meditations';
import mindset from './mindset';
import nothingpersonal from './nothingpersonal';
import occamsrazor from './occamsrazor';
import omens from './omens';
import satori from './satori';
import secondbrain from './secondbrain';
import selfreliance from './selfreliance';
import senecaletters from './senecaletters';
import socratic from './socratic';
import stoic from './stoic';
import taoteching from './taoteching';
import thinkwaitfast from './thinkwaitfast';
import visualization from './visualization';
import affirmation from './affirmation';
import ahamoment from './ahamoment';
import bounceback from './bounceback';
import chunking from './chunking';
import discharge from './discharge';
import dualprocess from './dualprocess';
import kindling from './kindling';
import rapport from './rapport';
import resonance from './resonance';
import selfcompassion from './selfcompassion';
import selfefficacy from './selfefficacy';
import sleephygiene from './sleephygiene';
import thoughtstopping from './thoughtstopping';
import triangulation from './triangulation';

export const ITEMS: readonly ItemDef[] = [
  stoic, deepfocus, kaizen, habitstack, secondbrain, exposure,
  catharsis, mindset, flow, visualization, grounding, meditations,
  selfreliance, taoteching, manthinketh, senecaletters, satori,
  gratitude, boxbreathing, acceptance, socratic,
  forgiveness, nothingpersonal, constellation, arttherapy, thinkwaitfast, omens,
  lionsmane, occamsrazor, kiai,
  ahamoment, affirmation, bounceback, chunking, discharge, dualprocess, kindling, rapport, resonance, selfcompassion, selfefficacy, sleephygiene, thoughtstopping, triangulation,
];

export const ITEM_BY_ID: ReadonlyMap<string, ItemDef> = new Map(ITEMS.map(i => [i.id, i]));
