import type { PerspectiveCamera } from 'three';
import { localStore, type MetaStore } from './meta';

export const FOV_MIN = 70;
export const FOV_MAX = 100;
export const FOV_STEP = 5;
export const FOV_DEFAULT = 75;

export interface Settings { v: 1; fov: number }

export const settingsStore: MetaStore = localStore('the-roots.settings');

export function clampFov(v: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return FOV_DEFAULT;
  const snapped = FOV_MIN + Math.round((v - FOV_MIN) / FOV_STEP) * FOV_STEP;
  return Math.min(FOV_MAX, Math.max(FOV_MIN, snapped));
}

export function stepFov(fov: number, dir: number): number {
  return clampFov(clampFov(fov) + Math.sign(dir) * FOV_STEP);
}

export function applyFov(camera: PerspectiveCamera, v: number): number {
  const fov = clampFov(v);
  camera.fov = fov;
  camera.updateProjectionMatrix();
  return fov;
}

export function loadSettings(store: MetaStore = settingsStore): Settings {
  try {
    const raw = store.read();
    if (raw === null) return { v: 1, fov: FOV_DEFAULT };
    const o = JSON.parse(raw);
    if (!o || typeof o !== 'object' || o.v !== 1) return { v: 1, fov: FOV_DEFAULT };
    return { v: 1, fov: clampFov(o.fov) };
  } catch {
    return { v: 1, fov: FOV_DEFAULT };
  }
}

export function saveSettings(s: Settings, store: MetaStore = settingsStore): void {
  try { store.write(JSON.stringify({ v: 1, fov: clampFov(s.fov) })); } catch { return; }
}
