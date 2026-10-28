// What a projection leaves behind when it is released (BESTIARY §5.7): flesh, heart, mind or
// essence, named after the pattern it came from. Parts are collectible and sit in the inventory,
// but they have no effect: they are not items and never enter the Inventory.

import type { Rng } from '../core/rng';
import type { ItemIcon } from '../items/types';
import { pal } from './palette';
import { bestiaryPartIcon, PART_ICONS } from './part-icons';

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
  return { id, source, kind, name, description, color: pal('bone.dim'), icon: PART_ICONS[id] ?? bestiaryPartIcon(source, kind) };
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
  part("autopilot", "flesh", "Autopilot's worn track", "Worn smooth by the same road, every day."),
  part("autopilot", "heart", "Autopilot's habit loop", "A small circle that never stops turning."),
  part("autopilot", "mind", "Autopilot's routine card", "Written once, followed without reading."),
  part("autopilot", "essence", "Autopilot's first look up", "The moment it looked up and saw the room."),
  part("craving", "flesh", "Craving's open cup", "A cup that is never full."),
  part("craving", "heart", "Craving's last swallow", "The one more that was never enough."),
  part("craving", "mind", "Craving's wanting", "A wish that keeps asking for the next."),
  part("craving", "essence", "Craving's stillness", "What it felt when it finally stopped pulling."),
  part("impulse", "flesh", "Impulse's crouch", "Drawn tight before the leap."),
  part("impulse", "heart", "Impulse's spring", "A coil that wants the air."),
  part("impulse", "mind", "Impulse's hurry", "The thought that came first."),
  part("impulse", "essence", "Impulse's landing", "Soft, once, and then still."),
  part("avoidance", "flesh", "Avoidance's shell", "A block that hides what it holds."),
  part("avoidance", "heart", "Avoidance's shut eye", "Closed so nothing can be seen."),
  part("avoidance", "mind", "Avoidance's glance away", "A look that never lands."),
  part("avoidance", "essence", "Avoidance's open shell", "The shell opened, and the eyes sat outside it."),
  part("procrastination", "flesh", "Procrastination's crate", "A crate with the lid still shut."),
  part("procrastination", "heart", "Procrastination's rest", "A sleep taken for a reason."),
  part("procrastination", "mind", "Procrastination's later", "The word that puts things off."),
  part("procrastination", "essence", "Procrastination's box", "A box given back, opened at last."),
  part("distraction", "flesh", "Distraction's folded wings", "Wings folded to look at something new."),
  part("distraction", "heart", "Distraction's flutter", "A quick pulse for every new thing."),
  part("distraction", "mind", "Distraction's ooh", "The first thought of every thought."),
  part("distraction", "essence", "Distraction's landing", "It lands and looks at you for once."),
  part("undertow", "flesh", "Undertow's foam", "Foam that pulls the feet down."),
  part("undertow", "heart", "Undertow's breath", "The breath held under the surface."),
  part("undertow", "mind", "Undertow's too much", "A thought that fills every room of you."),
  part("undertow", "essence", "Undertow's still water", "The wave lying flat at last."),
  part("rumination", "flesh", "Rumination's worm skin", "Six segments of the same loop."),
  part("rumination", "heart", "Rumination's lap", "One more lap, and then another."),
  part("rumination", "mind", "Rumination's question", "The same question, turned again."),
  part("rumination", "essence", "Rumination's ring", "A closed ring that opens at last."),
  part("scarcity", "flesh", "Scarcity's pouch", "A pouch turned out at last."),
  part("scarcity", "heart", "Scarcity's hoard", "What was kept against the day it was needed."),
  part("scarcity", "mind", "Scarcity's count", "A tally that never adds up to enough."),
  part("scarcity", "essence", "Scarcity's plenty", "Everything there was, all along."),
  part("resentment", "flesh", "Resentment's thread", "A held thread, let go."),
  part("resentment", "heart", "Resentment's cold pool", "A bitter pool that dries behind it."),
  part("resentment", "mind", "Resentment's record", "Every hurt, kept in order."),
  part("resentment", "essence", "Resentment's open hand", "The hook let go."),
  part("gloom", "flesh", "Gloom's grey cloud", "Water carried more than a cloud should."),
  part("gloom", "heart", "Gloom's cold drop", "One drop, cold, on the back of the hand."),
  part("gloom", "mind", "Gloom's mood", "The grey that comes before the grey."),
  part("gloom", "essence", "Gloom's dry patch", "The floor, dry again."),
  part("second-guessing", "flesh", "Second-Guessing's sack-stone", "Heavier than the first doubt."),
  part("second-guessing", "heart", "Second-Guessing's pause", "The breath before the second yes."),
  part("second-guessing", "mind", "Second-Guessing's hook", "A question with two hooks."),
  part("second-guessing", "essence", "Second-Guessing's standing light", "Upright, when it stops checking."),
  part("alarm", "flesh", "Alarm's cracked shell", "The shell that broke and kept its shape."),
  part("alarm", "heart", "Alarm's rays", "Rays folded in one by one."),
  part("alarm", "mind", "Alarm's bell", "A bell that rang for everyone."),
  part("alarm", "essence", "Alarm's shut eyes", "Eyes closed on the warning."),
  part("backlog", "flesh", "Backlog's crate stack", "Crates piled and leaning."),
  part("backlog", "heart", "Backlog's top crate", "The one that was going to fall."),
  part("backlog", "mind", "Backlog's list", "Everything I will get to."),
  part("backlog", "essence", "Backlog's neat pile", "The stack sitting down, crate by crate."),
  part("noise", "flesh", "Noise's wing plates", "Small plates that catch everything."),
  part("noise", "heart", "Noise's flicker", "A flicker for every wish."),
  part("noise", "mind", "Noise's wish", "Each one a small wish to feel something."),
  part("noise", "essence", "Noise's closed eyes", "A row of cold eyes, closing."),
  part("perfectionism", "flesh", "Perfectionism's plate", "A plate of the shell, mended in gold."),
  part("perfectionism", "heart", "Perfectionism's core", "A small rough figure under the shell."),
  part("perfectionism", "mind", "Perfectionism's standard", "The line that moves each time you reach it."),
  part("perfectionism", "essence", "Perfectionism's seam", "Gold where it broke, and whole."),
  part("not-yet", "flesh", "Not Yet's mended plate", "A plate mended and mended again."),
  part("not-yet", "heart", "Not Yet's repair", "One repair every four seconds."),
  part("not-yet", "mind", "Not Yet's waiting", "A wait with no end in sight."),
  part("not-yet", "essence", "Not Yet's kneel", "Whole, and kneeling at last."),
  part("comparison", "flesh", "Comparison's obsidian slab", "A dark slab taller than you."),
  part("comparison", "heart", "Comparison's mirror", "Your own shot, returned cold."),
  part("comparison", "mind", "Comparison's height", "A measure taken against someone else."),
  part("comparison", "essence", "Comparison's shoulder", "Standing beside you, not ahead."),
  part("hall-of-mirrors", "flesh", "Hall of Mirrors' glass", "A slab of glass that bends the light."),
  part("hall-of-mirrors", "heart", "Hall of Mirrors' angle", "The angle that changes when one breaks."),
  part("hall-of-mirrors", "mind", "Hall of Mirrors' echo", "Your shot, coming back from elsewhere."),
  part("hall-of-mirrors", "essence", "Hall of Mirrors' room", "The room showing only itself, for a moment."),
  part("paralysis", "flesh", "Paralysis' hook", "A hook driven into the ground."),
  part("paralysis", "heart", "Paralysis' thread", "A slow cold thread, fastened."),
  part("paralysis", "mind", "Paralysis' stop", "The moment you were told not to move."),
  part("paralysis", "essence", "Paralysis' ground", "The ground, which never moved."),
  part("margin", "flesh", "The Margin's page", "A page with a note in the margin."),
  part("margin", "heart", "The Margin's ink mark", "A mark that stays on the floor."),
  part("margin", "mind", "The Margin's note", "Something else to say, about you."),
  part("margin", "essence", "The Margin's blank page", "A page left blank, drifting down."),
  part("tribunal", "flesh", "The Tribunal's bar", "A bar of three posts under one roof."),
  part("tribunal", "heart", "The Tribunal's sentence", "Three voices agreed in order."),
  part("tribunal", "mind", "The Tribunal's agreement", "One voice repeated until it sounds like everyone."),
  part("tribunal", "essence", "The Tribunal's blank pages", "Three pages falling together, blank."),
  part("dread", "flesh", "Dread's hard ring", "A ring of the same shell, turned outward."),
  part("dread", "heart", "Dread's waiting", "Waiting for the bad thing, always."),
  part("dread", "mind", "Dread's shockwave", "The ring that is coming."),
  part("dread", "essence", "Dread's still circle", "A circle on the floor that fades."),
  part("reactivity", "flesh", "Reactivity's lowered head", "A head lowered, a block from you."),
  part("reactivity", "heart", "Reactivity's scrape", "The floor scraped before the run."),
  part("reactivity", "mind", "Reactivity's protection", "It was guarding something."),
  part("reactivity", "essence", "Reactivity's stop", "The moment it stopped, and saw."),
  part("sulk", "flesh", "Sulk's mud", "Mud, running off a back."),
  part("sulk", "heart", "Sulk's two eyes", "Two eyes above the marsh."),
  part("sulk", "mind", "Sulk's hurt", "A hurt that did not need saying."),
  part("sulk", "essence", "Sulk's surfacing", "Up, and staying up."),
  part("shoulds", "flesh", "The Shoulds' bracket", "A bracket set in a wall."),
  part("shoulds", "heart", "The Shoulds' rule", "A rule holding up the wall."),
  part("shoulds", "mind", "The Shoulds' wall", "A wall that was only a rule."),
  part("shoulds", "essence", "The Shoulds' fall", "Out of the frame, lying down."),
  part("dogma", "flesh", "Dogma's tablet", "A tablet of stone, one rule carved."),
  part("dogma", "heart", "Dogma's crack", "The tablet split down the middle."),
  part("dogma", "mind", "Dogma's glyph", "The one rule, simpler than a world."),
  part("dogma", "essence", "Dogma's blank stone", "Under the rule, the stone is blank."),
  part("burnout", "flesh", "Burnout's obsidian", "Dark stone that has burned for too long."),
  part("burnout", "heart", "Burnout's ember", "The last ember of the run."),
  part("burnout", "mind", "Burnout's running", "Faster, faster, and still not enough."),
  part("burnout", "essence", "Burnout's cold hearth", "A hearth gone cold, sitting down."),
  part("spark", "flesh", "Spark's cinder", "A cinder of a conductor."),
  part("spark", "heart", "Spark's crackle", "One last crackle, grounded."),
  part("spark", "mind", "Spark's alert", "Always on edge, so nothing surprises it."),
  part("spark", "essence", "Spark's rest", "It grounded, and went still."),
  part("pretence", "flesh", "Pretence's mask", "A mask that lies face up."),
  part("pretence", "heart", "Pretence's honest face", "A small face, briefly honest."),
  part("pretence", "mind", "Pretence's smile", "Worn so no one would ask."),
  part("pretence", "essence", "Pretence's hollow back", "Hollow, where the mask was held."),
  part("shortcut", "flesh", "Shortcut's crack", "A crack opened in a wall."),
  part("shortcut", "heart", "Shortcut's pointing", "Pointing, honestly, at the real door."),
  part("shortcut", "mind", "Shortcut's long way", "The way that was the way."),
  part("shortcut", "essence", "Shortcut's real door", "The door that was there all along."),
  part("numbness", "flesh", "Numbness' rime", "Rime melting off drop by drop."),
  part("numbness", "heart", "Numbness' warm frame", "Warm for one frame, then gone."),
  part("numbness", "mind", "Numbness' freeze", "Everything frozen so nothing could hurt."),
  part("numbness", "essence", "Numbness' thaw", "The first thing it has felt."),
  part("cynicism", "flesh", "Cynicism's ring", "A ring that drains the light."),
  part("cynicism", "heart", "Cynicism's dot", "A ring shrunk to a dot."),
  part("cynicism", "mind", "Cynicism's point", "Nothing matters, decided first."),
  part("cynicism", "essence", "Cynicism's one thing", "Released, one thing did matter."),
  part("isolation", "flesh", "Isolation's ice wall", "A wall of ice, the first one."),
  part("isolation", "heart", "Isolation's cell", "A cell alone with you in it."),
  part("isolation", "mind", "Isolation's safety", "Walls built to be safe."),
  part("isolation", "essence", "Isolation's open ground", "The last wall melted, the ground open."),
  part("what-if", "flesh", "What If's shard", "A shard of the last release."),
  part("what-if", "heart", "What If's replay", "The last move, played again."),
  part("what-if", "mind", "What If's regret", "What could have been done differently."),
  part("what-if", "essence", "What If's last shard", "The last shard rising, and released."),
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
