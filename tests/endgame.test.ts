// The Spiked Entity and the revelation, headless (docs/architecture/SKY.md §10.1): every touch bounces and
// changes nothing; the card shows once per run; stillness is held until the stairs open, then released; the
// unlock is saved once. Plus the model's cap in the 4-high chamber and the gentleness of its shimmer.

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { Polarity } from '../src/combat/polarity';
import type { DamageKind } from '../src/core/damage';
import { CARD_WAIT, ENCOUNTER_RANGE, Encounter } from '../src/endgame/encounter';
import { ENTITY_H, ENTITY_HW, ENTITY_MAX_H, SpikedEntity, facingToward } from '../src/endgame/entity';
import { EntityView, entityBoxes, modelHeight } from '../src/endgame/entity-view';
import { defaultMeta, loadMeta, saveMeta, type MetaStore } from '../src/game/meta';
import { SKY_ENDGAME_EN } from '../src/i18n/locales/sky/endgame.en';
import { SKY_ENDGAME_ES } from '../src/i18n/locales/sky/endgame.es';
import type { EncounterHost, Pos } from '../src/sky/types';

/** Every damage kind, checked against the type: a new kind fails to compile here until it is listed. */
const KINDS_ALL: Record<DamageKind, true> = {
  intent: true, explosion: true, fire: true, crush: true, kick: true, melee: true, contact: true,
  projectile: true, item: true, cut: true, beam: true, drown: true, toll: true,
};
const KINDS = Object.keys(KINDS_ALL) as DamageKind[];
const POLARITIES: Polarity[] = ['positive', 'negative'];

const AT = { x: 40.5, y: 1, z: 60.5 };

function entity() {
  const bounces: [number, number, number][] = [];
  const e = new SpikedEntity(77, { ...AT }, { bounce: (x, y, z) => bounces.push([x, y, z]) });
  return { e, bounces };
}

const snapshot = (e: SpikedEntity) => JSON.stringify({ body: e.body, facing: e.facing, targets: e.targets(), id: e.id });

describe('the Spiked Entity', () => {
  it('stands low and wide inside the chamber: a body box no taller than the cap', () => {
    const { e } = entity();
    expect(e.body.h).toBeLessThanOrEqual(ENTITY_MAX_H);
    expect(e.body.hw).toBeGreaterThan(e.body.h / 2);
    expect([e.body.x, e.body.y, e.body.z]).toEqual([AT.x, AT.y, AT.z]);
    expect(e.targets()).toEqual([{ id: 77, x: AT.x, y: AT.y, z: AT.z, hw: ENTITY_HW, h: ENTITY_H }]);
  });

  it('a bounce of every polarity, warmth and kind changes nothing, and always bounces', () => {
    const { e, bounces } = entity();
    const before = snapshot(e);
    let n = 0;
    for (const polarity of POLARITIES) for (const warm of [false, true]) for (const kind of KINDS) {
      const p = { x: AT.x + 0.5, y: AT.y + 1 + n * 0.01, z: AT.z - 1 };
      e.touch(77, polarity, warm, p, kind);
      n++;
      expect(bounces.length).toBe(n);
      expect(bounces[n - 1]).toEqual([p.x, p.y, p.z]);
      expect(snapshot(e), `${polarity} ${warm} ${kind}`).toBe(before);
    }
    expect(n).toBe(POLARITIES.length * 2 * KINDS.length);
  });

  it('only answers for its own id', () => {
    const { e, bounces } = entity();
    expect(e.owns(77)).toBe(true);
    expect(e.owns(78)).toBe(false);
    e.touch(78, 'negative', false, { ...AT }, 'explosion');
    expect(bounces).toEqual([]);
  });

  it('is found by a touch that reaches its box and by nothing that does not', () => {
    const { e } = entity();
    expect(e.at(AT.x, AT.y + 1, AT.z, 0.1)).toBe(77);
    expect(e.at(AT.x + ENTITY_HW + 0.2, AT.y + 1, AT.z, 0.3)).toBe(77);
    expect(e.at(AT.x + ENTITY_HW + 0.5, AT.y + 1, AT.z, 0.3)).toBe(-1);
    expect(e.at(AT.x, AT.y + ENTITY_H + 0.2, AT.z, 0.3)).toBe(77);
    expect(e.at(AT.x, AT.y + ENTITY_H + 1, AT.z, 0.3)).toBe(-1);
  });

  it('turns its front toward the player', () => {
    const { e } = entity();
    const player = { x: AT.x + 3, y: AT.y, z: AT.z };
    e.turnToward(player);
    expect(e.facing).toBeCloseTo(Math.PI / 2);
    expect(facingToward(AT, { x: AT.x, y: 0, z: AT.z + 2 })).toBeCloseTo(0);
  });
});

describe('its model', () => {
  const boxes = entityBoxes();

  it('stays under the cap with its spikes, breath included, so the roof never clips them', () => {
    expect(modelHeight(boxes) * 1.012).toBeLessThanOrEqual(ENTITY_MAX_H);
    expect(modelHeight(boxes)).toBeGreaterThan(ENTITY_H * 0.9);
  });

  it('is built of whole texels, with countless stepped spikes', () => {
    for (const b of boxes) for (const s of b.size) expect(Math.abs(s * 16 - Math.round(s * 16)), b.part).toBeLessThan(1e-9);
    expect(boxes.filter(b => b.part === 'tip').length).toBeGreaterThanOrEqual(60);
  });

  it('is the same every time (it draws nothing)', () => {
    const again = entityBoxes();
    expect(again.length).toBe(boxes.length);
    again.forEach((b, i) => expect(b.matrix.equals(boxes[i].matrix)).toBe(true));
  });

  it('keeps the touch box over the body of the spikes', () => {
    let reach = 0;
    const v = new THREE.Vector3();
    for (const b of boxes) {
      v.setFromMatrixPosition(b.matrix);
      reach = Math.max(reach, Math.abs(v.x), Math.abs(v.z));
    }
    // only the outer part of the longest spikes reaches past the box a touch bounces off
    expect(reach).toBeLessThan(ENTITY_HW + 0.6);
  });
});

describe('its view', () => {
  it('builds, follows the entity and disposes cleanly', () => {
    const root = new THREE.Group();
    const { e } = entity();
    const view = new EntityView(root);
    expect(root.children.length).toBe(1);
    view.sync(e, 0.1);
    expect(view.group.position.toArray()).toEqual([AT.x, AT.y, AT.z]);
    view.dispose();
    expect(root.children.length).toBe(0);
  });

  it('the shimmer rises under a stream of touches and falls after them, never blinking', () => {
    const view = new EntityView(new THREE.Group());
    const { e } = entity();
    const dt = 1 / 60;
    const levels: number[] = [];
    for (let f = 0; f < 240; f++) {
      if (f < 120 && f % 6 === 0) view.shimmer(); // a beam: ten touches a second for two seconds
      view.sync(e, dt);
      levels.push(view.level);
    }
    // the level only ever goes one way at a time: up while touched, down after, no alternation
    let turns = 0;
    for (let i = 2; i < levels.length; i++) {
      const a = Math.sign(levels[i - 1] - levels[i - 2]), b = Math.sign(levels[i] - levels[i - 1]);
      if (a !== 0 && b !== 0 && a !== b) turns++;
    }
    expect(turns).toBe(0);
    expect(Math.max(...levels)).toBe(1);
    expect(levels[levels.length - 1]).toBeLessThan(1);
  });
});

/** A fake host that records every call in order, with the encounter's stillness at each one. */
function encounterHost() {
  const calls: string[] = [];
  const store: MetaStore & { writes: number; value: string | null } = {
    writes: 0, value: null,
    read() { return store.value; },
    write(s) { store.writes++; store.value = s; },
  };
  let enc: Encounter | null = null;
  const host: EncounterHost = {
    card: (name, lines) => calls.push(`card ${name} ${lines.join(' ')}`),
    rumble: s => calls.push(`rumble ${s > 0}`),
    toast: key => calls.push(`toast ${key}`),
    openStairs: () => calls.push(`openStairs held=${enc!.holdsStill}`),
    saveMeta: () => { calls.push('saveMeta'); saveMeta({ ...defaultMeta(), staircase: true }, store); },
    holdStill: on => calls.push(`holdStill ${on}`),
  };
  enc = new Encounter(host);
  return { enc, calls, store };
}

const ENTITY: Pos = { x: 10, y: 1, z: 10 };
const near: Pos = { x: 10 + ENCOUNTER_RANGE - 0.5, y: 1, z: 10 };
const far: Pos = { x: 10 + ENCOUNTER_RANGE + 2, y: 1, z: 10 };

describe('the revelation', () => {
  it('waits until the player comes within range', () => {
    const { enc, calls } = encounterHost();
    for (let i = 0; i < 100; i++) enc.update(0.1, far, ENTITY);
    expect(calls).toEqual([]);
    expect(enc.met).toBe(false);
    expect(enc.holdsStill).toBe(false);
    enc.dismiss();
    expect(calls).toEqual([]);
  });

  it('shows the card once per run, with the owner\'s two lines, and holds the stillness from the turn', () => {
    const { enc, calls } = encounterHost();
    enc.update(0.1, near, ENTITY);
    expect(enc.met).toBe(true);
    expect(enc.holdsStill).toBe(true);
    expect(calls).toEqual(['holdStill true', 'card endgame.entity.name endgame.entity.line1 endgame.entity.line2']);
    // walking away and back, or staying, never shows it again
    for (const p of [near, far, near, far, near]) enc.update(0.1, p, ENTITY);
    enc.dismiss();
    for (let i = 0; i < 200; i++) enc.update(0.1, i % 2 ? near : far, ENTITY);
    expect(calls.filter(c => c.startsWith('card')).length).toBe(1);
  });

  it('opens the stairs when the card is dismissed: stillness held until openStairs, then released, the flag saved once', () => {
    const { enc, calls, store } = encounterHost();
    enc.update(0.1, near, ENTITY);
    enc.update(1, near, ENTITY);
    expect(enc.holdsStill).toBe(true);
    enc.dismiss();
    expect(calls).toEqual([
      'holdStill true',
      'card endgame.entity.name endgame.entity.line1 endgame.entity.line2',
      'rumble true',
      'toast toast.stairOpens',
      'openStairs held=true',
      'holdStill false',
      'saveMeta',
    ]);
    expect(enc.holdsStill).toBe(false);
    enc.dismiss();
    for (let i = 0; i < 100; i++) enc.update(0.5, near, ENTITY);
    expect(calls.length).toBe(7);
    expect(store.writes).toBe(1);
    expect(loadMeta(store).staircase).toBe(true);
  });

  it('opens the stairs by itself after the card has waited, if it is not dismissed', () => {
    const { enc, calls, store } = encounterHost();
    enc.update(0.1, near, ENTITY);
    const dt = 0.25;
    for (let t = dt; t < CARD_WAIT - 1e-9; t += dt) {
      enc.update(dt, near, ENTITY);
      expect(enc.holdsStill).toBe(true);
    }
    expect(calls.some(c => c.startsWith('openStairs'))).toBe(false);
    enc.update(dt, far, ENTITY); // the card counts down wherever the player stands
    expect(calls.filter(c => c.startsWith('openStairs'))).toEqual(['openStairs held=true']);
    expect(enc.holdsStill).toBe(false);
    enc.dismiss();
    for (let i = 0; i < 40; i++) enc.update(dt, near, ENTITY);
    expect(store.writes).toBe(1);
    expect(calls.filter(c => c === 'holdStill false').length).toBe(1);
  });
});

describe('its words', () => {
  it('carry the owner\'s revelation word for word, in English and Spanish', () => {
    expect(`${SKY_ENDGAME_EN['endgame.entity.line1']} ${SKY_ENDGAME_EN['endgame.entity.line2']}`).toBe(
      'The true path was not to reach this place; the true path is to go upward. All this time you were mistaken: you were meant to climb upward.');
    expect(`${SKY_ENDGAME_ES['endgame.entity.line1']} ${SKY_ENDGAME_ES['endgame.entity.line2']}`).toBe(
      'El verdadero camino no era llegar a este lugar; el verdadero camino es ir hacia arriba. Todo este tiempo te equivocabas: tu camino era subir.');
    expect(Object.keys(SKY_ENDGAME_ES).sort()).toEqual(Object.keys(SKY_ENDGAME_EN).sort());
  });
});
