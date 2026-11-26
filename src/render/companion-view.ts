// The ascent companions as the player sees them (ILLUMINATION.md §3): each friend's own model, with no tier, lit from
// inside in white. They float round the player, face them, and sway slowly. Seen, never touched.

import * as THREE from 'three';
import { pal, type PalToken } from '../content/palette';
import { ENEMY_BY_ID } from '../content/enemies';
import { CREATURE_BY_ID } from '../content/creatures';
import { buildModel } from '../entities/enemies';
import type { EnemyDef, ModelPart } from '../enemies/types';
import { DEITIES } from '../sky/creatures/deities';
import type { Animal } from '../sky/types';
import type { AllyKind } from '../game/ally-tally';
import type { Companion } from '../game/ascent-companions';

/**
 * The ending's friends are white (owner, 2026-11-26): every friend, whatever its kind, drawn in the light's core white
 * (`light.core`), lit from inside by the same white, with no tier and no ally yellow (that colour is for the allies in
 * play, not for the ending). They are becoming the light the screen turns into.
 */
export const FRIEND_WHITE: PalToken = 'light.core';
/** The share of the white each friend gives off from inside, so it reads bright against the dusk of the strata. */
const FRIEND_GLOW_SHARE = 0.55;
/** Sizes round the player: a boss and a deity are made smaller so the ring holds them. */
const SCALE: Readonly<Record<AllyKind, number>> = { deity: 0.6, projection: 1, mended: 1, creature: 1, boss: 0.5 };
/** The slow sway: radians a second (well under 3 Hz) and blocks of rise and fall. */
const SWAY_RATE = 0.9, SWAY = 0.3;

interface Item { group: THREE.Group; mats: THREE.Material[] }

export class CompanionView {
  private readonly items = new Map<number, Item>();
  private clock = 0;

  constructor(private readonly root: THREE.Object3D) {}

  /** Draws every companion at its place, adding the newcomers' models, facing `eye`. */
  update(dt: number, companions: readonly Companion[], eye: { x: number; z: number }) {
    this.clock += dt;
    for (const c of companions) {
      let it = this.items.get(c.slot);
      if (!it) { it = this.build(c); this.items.set(c.slot, it); }
      it.group.position.set(c.x, c.y + Math.sin(this.clock * SWAY_RATE + c.slot) * SWAY, c.z);
      it.group.rotation.y = Math.atan2(eye.x - c.x, eye.z - c.z);
    }
  }

  set visible(on: boolean) { for (const it of this.items.values()) it.group.visible = on; }

  private build(c: Companion): Item {
    const parts = c.kind === 'deity' ? deityParts(c.def as Animal) : (ENEMY_BY_ID.get(c.def) ?? CREATURE_BY_ID.get(c.def))?.model;
    const view = buildModel({ model: [...(parts ?? [])] } as unknown as EnemyDef);
    const white = new THREE.Color(pal(FRIEND_WHITE));
    const emissive = white.clone().multiplyScalar(FRIEND_GLOW_SHARE);
    for (const m of view.mats) m.emissive.copy(emissive);
    // every part, the glowing ones too: the whole friend is white
    view.group.traverse(o => { const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined; m?.color?.copy(white); });
    const group = new THREE.Group();
    group.add(view.group);
    group.scale.setScalar(SCALE[c.kind]);
    this.root.add(group);
    const mats: THREE.Material[] = [];
    group.traverse(o => { const m = (o as THREE.Mesh).material; if (m) mats.push(...(Array.isArray(m) ? m : [m])); });
    return { group, mats };
  }

  dispose() {
    for (const it of this.items.values()) {
      this.root.remove(it.group);
      it.group.traverse(o => (o as THREE.Mesh).geometry?.dispose());
      for (const m of it.mats) m.dispose();
    }
    this.items.clear();
  }
}

function deityParts(animal: Animal): readonly ModelPart[] {
  const model = DEITIES[animal]?.model;
  return model ? [...model.body, ...model.head] : [];
}
