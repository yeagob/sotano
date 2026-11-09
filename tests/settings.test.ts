import { afterEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import {
  applyFov, clampFov, FOV_DEFAULT, FOV_MAX, FOV_MIN, FOV_STEP, loadSettings, saveSettings, settingsStore, stepFov,
} from '../src/game/settings';
import type { MetaStore } from '../src/game/meta';
import { BINDING, DEVICES, contextsFor } from '../src/input/bindings';
import { EYE, Player } from '../src/entities/player';

function memory(initial: string | null = null): MetaStore & { value: string | null } {
  const m = {
    value: initial,
    read() { return m.value; },
    write(s: string) { m.value = s; },
  };
  return m;
}

describe('field of view range', () => {
  it('stays within the ledger range of 70 to 100 degrees, with the old camera angle as the default', () => {
    expect(FOV_MIN).toBe(70);
    expect(FOV_MAX).toBe(100);
    expect(FOV_DEFAULT).toBe(75);
    expect(FOV_DEFAULT).toBeGreaterThanOrEqual(FOV_MIN);
    expect(FOV_DEFAULT).toBeLessThanOrEqual(FOV_MAX);
  });

  it('clamps to the ends and snaps to the step', () => {
    expect(clampFov(10)).toBe(FOV_MIN);
    expect(clampFov(500)).toBe(FOV_MAX);
    expect(clampFov(81)).toBe(80);
    expect(clampFov(83)).toBe(85);
    for (let v = FOV_MIN; v <= FOV_MAX; v += FOV_STEP) expect(clampFov(v)).toBe(v);
  });

  it('reads anything that is not a finite number as the default', () => {
    for (const v of [NaN, Infinity, -Infinity, '90', null, undefined]) expect(clampFov(v as number)).toBe(FOV_DEFAULT);
  });

  it('steps one notch at a time and stops at the ends', () => {
    expect(stepFov(75, 1)).toBe(80);
    expect(stepFov(75, -1)).toBe(70);
    expect(stepFov(75, 3)).toBe(80);
    expect(stepFov(FOV_MAX, 1)).toBe(FOV_MAX);
    expect(stepFov(FOV_MIN, -1)).toBe(FOV_MIN);
    expect(stepFov(80, 0)).toBe(80);
  });
});

describe('field of view persistence', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads the default when nothing was saved', () => {
    expect(loadSettings(memory())).toEqual({ v: 1, fov: FOV_DEFAULT });
  });

  it('round-trips the chosen field of view', () => {
    const store = memory();
    saveSettings({ v: 1, fov: 95 }, store);
    expect(loadSettings(store)).toEqual({ v: 1, fov: 95 });
  });

  it('clamps a stored value out of range and never saves one', () => {
    expect(loadSettings(memory(JSON.stringify({ v: 1, fov: 170 }))).fov).toBe(FOV_MAX);
    expect(loadSettings(memory(JSON.stringify({ v: 1, fov: 'wide' }))).fov).toBe(FOV_DEFAULT);
    const store = memory();
    saveSettings({ v: 1, fov: 20 }, store);
    expect(JSON.parse(store.value!)).toEqual({ v: 1, fov: FOV_MIN });
  });

  it('reads broken, foreign or newer records as the default', () => {
    for (const raw of ['{not json', '', 'null', '42', '[]', JSON.stringify({ v: 2, fov: 90 }), JSON.stringify({ fov: 90 })]) {
      expect(loadSettings(memory(raw))).toEqual({ v: 1, fov: FOV_DEFAULT });
    }
  });

  it('never throws when the store refuses', () => {
    const throwing: MetaStore = { read() { throw new Error('blocked'); }, write() { throw new Error('quota'); } };
    expect(loadSettings(throwing)).toEqual({ v: 1, fov: FOV_DEFAULT });
    expect(() => saveSettings({ v: 1, fov: 90 }, throwing)).not.toThrow();
  });

  it('keeps the record under the-roots.settings in localStorage, apart from the meta record', () => {
    const items = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => items.get(k) ?? null,
      setItem: (k: string, v: string) => { items.set(k, v); },
    });
    saveSettings({ v: 1, fov: 90 });
    expect(JSON.parse(items.get('the-roots.settings') ?? 'null')).toEqual({ v: 1, fov: 90 });
    expect(items.has('the-roots.meta')).toBe(false);
    expect(loadSettings()).toEqual({ v: 1, fov: 90 });
    expect(loadSettings(settingsStore)).toEqual({ v: 1, fov: 90 });
  });

  it('reads the default when there is no localStorage at all', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(loadSettings()).toEqual({ v: 1, fov: FOV_DEFAULT });
    expect(() => saveSettings({ v: 1, fov: 90 })).not.toThrow();
  });
});

describe('the camera applies the field of view', () => {
  it('sets the vertical angle and rebuilds the projection', () => {
    const camera = new THREE.PerspectiveCamera(FOV_DEFAULT, 16 / 9, 0.05, 200);
    const before = camera.projectionMatrix.clone();
    expect(applyFov(camera, 90)).toBe(90);
    expect(camera.fov).toBe(90);
    expect(camera.projectionMatrix.equals(before)).toBe(false);
    const fresh = new THREE.PerspectiveCamera(90, 16 / 9, 0.05, 200);
    expect(camera.projectionMatrix.elements).toEqual(fresh.projectionMatrix.elements);
  });

  it('clamps what it is given and keeps the aspect and clip planes', () => {
    const camera = new THREE.PerspectiveCamera(FOV_DEFAULT, 2, 0.05, 200);
    expect(applyFov(camera, 400)).toBe(FOV_MAX);
    expect(camera.fov).toBe(FOV_MAX);
    expect(camera.aspect).toBe(2);
    expect(camera.near).toBe(0.05);
    expect(camera.far).toBe(200);
  });

  it('keeps the near plane inside the player at the widest angle, so walls and ceilings never open', () => {
    const body = new Player().body;
    const clearance = Math.min(body.hw, body.h - EYE);
    const camera = new THREE.PerspectiveCamera(FOV_DEFAULT, 21 / 9, 0.05, 200);
    applyFov(camera, FOV_MAX);
    const halfH = camera.near * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const halfW = halfH * camera.aspect;
    expect(Math.hypot(camera.near, halfH, halfW)).toBeLessThan(clearance);
  });
});

describe('field of view controls', () => {
  it('left and right adjust it on the pause card on every device', () => {
    for (const d of DEVICES) expect(contextsFor(BINDING.navigate, d), d).toContain('paused');
  });
});
