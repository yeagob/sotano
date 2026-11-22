import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Hazards, type HazardHost, type Strike } from '../src/enemies/attacks';
import type { Actor } from '../src/entities/actors';

const ring = (x: number): Strike => ({ lead: 0, live: 1, damage: 4, shape: { kind: 'ring', x, y: 0, z: 0, r: 0, grow: 0, width: 1, height: 2 } });

function field(onHurt: (hazards: Hazards, target: Actor) => void) {
  const actors = [1, 2, 3].map(id => ({ id, alive: true, spawning: 0, faction: id === 3 ? 'self' : 'projection', body: { x: 0, y: 0, z: 0, hw: 0.4, h: 1.8 } }) as unknown as Actor);
  const hurts: number[] = [];
  let hazards!: Hazards;
  const host: HazardHost = {
    actors: () => actors,
    hurt: target => { hurts.push(target.id); onHurt(hazards, target); },
    affect: () => {},
    push: () => {},
    live: () => {},
    particles: () => {},
  };
  hazards = new Hazards(new THREE.Object3D(), host);
  return { hazards, hurts };
}

describe('Hazards.update while a blow clears hazards', () => {
  it('does not throw when a blow makes owners drop their hazards mid-update', () => {
    const { hazards, hurts } = field(h => { h.clear(1); h.clear(2); });
    hazards.add(1, 'projection', 'enemy:a', ring(0));
    hazards.add(2, 'projection', 'enemy:b', ring(0));
    hazards.add(2, 'projection', 'enemy:b', ring(0));
    hazards.add(1, 'projection', 'enemy:a', ring(0));
    expect(() => hazards.update(0.1)).not.toThrow();
    expect(hurts).toEqual([3]);
    expect(hazards.size).toBe(0);
  });

  it('keeps the hazards of other owners', () => {
    const { hazards, hurts } = field(h => h.clear(2));
    hazards.add(1, 'projection', 'enemy:a', ring(0));
    hazards.add(2, 'projection', 'enemy:b', ring(0));
    hazards.update(0.1);
    expect(hurts).toEqual([3, 3]);
    expect(hazards.size).toBe(1);
    expect(hazards.countOf(1)).toBe(1);
  });

  it('still removes a hazard whose live time is over', () => {
    const { hazards } = field(() => {});
    hazards.add(1, 'projection', 'enemy:a', ring(0));
    hazards.update(0.5);
    hazards.update(0.6);
    expect(hazards.size).toBe(0);
  });
});
