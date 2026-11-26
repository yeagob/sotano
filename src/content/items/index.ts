// The item catalogue: practices the player picks up (see docs/design/STORY.md §5 for names and
// meaning, docs/architecture/ITEMS.md for how they work). To add one: create a file next to this
// one and list it here (and follow the sotano-items skill).
// Ids must be unique (checked by tests/items.test.ts).

import type { ItemDef } from '../../items/types';
import acceptance from './acceptance';
import apprenticeship from './apprenticeship';
import arttherapy from './arttherapy';
import boxbreathing from './boxbreathing';
import catharsis from './catharsis';
import constellation from './constellation';
import deepfocus from './deepfocus';
import furoshiki from './furoshiki';
import exposure from './exposure';
import flow from './flow';
import forgiveness from './forgiveness';
import gratitude from './gratitude';
import kinship from './kinship';
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
import drlauncher from './drlauncher';
import dualprocess from './dualprocess';
import kindling from './kindling';
import rapport from './rapport';
import resonance from './resonance';
import selfcompassion from './selfcompassion';
import selfefficacy from './selfefficacy';
import sleephygiene from './sleephygiene';
import thoughtstopping from './thoughtstopping';
import triangulation from './triangulation';
import tripleJump from './triple-jump';
import doubleJump from './double-jump';
import wallJump from './wall-jump';
import irimi from './irimi';
import fartlek from './fartlek';
import balasana from './balasana';
import bookofsecrets from './bookofsecrets';
import mendersThread from './menders-thread';
import selfDistancing from './self-distancing';
import guardingTheCentre from './guarding-the-centre';
import likeWater from './like-water';
import shield from './shield';
import dowsing from './dowsing';
import eyecontact from './eyecontact';
import dialectic from './dialectic';
import reframing from './reframing';
import waymark from './waymark';
import luciddream from './luciddream';
import pressurevalve from './pressurevalve';
import controlledburn from './controlledburn';
import kairos from './kairos';
import boltfromtheblue from './boltfromtheblue';
import serendipity from './serendipity';
import stretch from './stretch';
import tummo from './tummo';
import firewalking from './firewalking';
import prometheus from './prometheus';
import teaceremony from './teaceremony';
import herbalism from './herbalism';
import distillation from './distillation';
import spagyric from './spagyric';
import mindfuleating from './mindfuleating';
import breakingbread from './breakingbread';
import harahachibu from './harahachibu';
import grace from './grace';
import nourishment from './nourishment';
import solvecoagula from './solvecoagula';
import posttraumatic from './posttraumatic';
import bilateral from './bilateral';
import ruleofthree from './ruleofthree';
import spiralgrowth from './spiralgrowth';
import walkslow from './walkslow';

export const ITEMS: readonly ItemDef[] = [
  stoic, deepfocus, kaizen, habitstack, secondbrain, exposure,
  catharsis, mindset, flow, visualization, grounding, meditations,
  selfreliance, taoteching, manthinketh, senecaletters, satori,
  gratitude, boxbreathing, acceptance, socratic,
  forgiveness, nothingpersonal, constellation, arttherapy, thinkwaitfast, omens,
  lionsmane, occamsrazor, kiai,
  ahamoment, affirmation, bounceback, chunking, discharge, dualprocess, kindling, rapport, resonance, selfcompassion, selfefficacy, sleephygiene, thoughtstopping, triangulation,
  drlauncher, tripleJump, doubleJump, wallJump, mendersThread, selfDistancing, guardingTheCentre, likeWater, shield,
  dowsing, eyecontact,
  dialectic, reframing,
  waymark,
  pressurevalve, controlledburn, boltfromtheblue, serendipity, stretch,
  tummo, firewalking, prometheus,
  teaceremony, herbalism, distillation, spagyric, mindfuleating, breakingbread, harahachibu, grace, nourishment,
  irimi, fartlek, balasana, bookofsecrets,
  furoshiki, kinship, apprenticeship,
  kairos,
  luciddream,
  solvecoagula, posttraumatic,
  bilateral, ruleofthree, spiralgrowth,
  walkslow,
];

export const ITEM_BY_ID: ReadonlyMap<string, ItemDef> = new Map(ITEMS.map(i => [i.id, i]));
