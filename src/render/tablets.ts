// Lesson tablets: the tutorial's text carved into stone on the walls of the roots (owner: the
// tutorial lives in the world, never in an overlay). Each lesson room gets two tablets, on its north
// and south walls beside the doors, so you read it whichever way you come in. The text is drawn in
// the player's language and redrawn when it changes.

import * as THREE from 'three';
import { palCss } from '../content/palette';
import { t, type MessageKey } from '../i18n';
import { activeDevice } from '../input/input';
import { controlParams, sentenceCase } from '../input/labels';

/** Every lesson the roots can teach (rooms carry theirs: `RoomTemplate.lesson`). */
export const LESSONS = ['move', 'intent', 'step', 'kick', 'pit', 'bridge', 'bomb', 'water', 'practice', 'down', 'carry'] as const;
export type LessonKey = typeof LESSONS[number];
export const isLesson = (k: string): k is LessonKey => (LESSONS as readonly string[]).includes(k);

const W = 3.7, H = 2.1;          // blocks (clear of the door frames at columns 4–8)
const PX = 448, PY = 256;        // canvas

interface Tablet { lesson: LessonKey; canvas: HTMLCanvasElement; texture: THREE.CanvasTexture; mesh: THREE.Mesh }

export class Tablets {
  private list: Tablet[] = [];
  private group = new THREE.Group();

  constructor(private scene: THREE.Scene) { scene.add(this.group); }

  /** Mounts a lesson in a room: interior corner (x0, y0, z0), 13 × 7. */
  add(lesson: LessonKey, x0: number, y0: number, z0: number) {
    // north wall, west of the door (facing south); south wall, east of the door (facing north)
    this.mount(lesson, x0 + 2.0, y0 + 2.0, z0 + 0.02, 0);
    this.mount(lesson, x0 + 13 - 2.0, y0 + 2.0, z0 + 7 - 0.02, Math.PI);
  }

  private mount(lesson: LessonKey, x: number, y: number, z: number, rotY: number) {
    const canvas = document.createElement('canvas');
    canvas.width = PX; canvas.height = PY;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: texture }));
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY;
    this.group.add(mesh);
    const tab = { lesson, canvas, texture, mesh };
    this.draw(tab);
    this.list.push(tab);
  }

  /** The language changed: carve every tablet again. */
  redraw() { for (const tab of this.list) this.draw(tab); }

  dispose() {
    for (const tab of this.list) { tab.texture.dispose(); tab.mesh.geometry.dispose(); (tab.mesh.material as THREE.Material).dispose(); }
    this.list = [];
    this.scene.remove(this.group);
  }

  /** A slab of limestone with a bevel, the title cut deep, the lesson below it. */
  private draw(tab: Tablet) {
    const g = tab.canvas.getContext('2d')!;
    g.fillStyle = palCss('limestone.dark'); g.fillRect(0, 0, PX, PY);
    g.fillStyle = palCss('limestone.base'); g.fillRect(8, 8, PX - 16, PY - 16);
    g.fillStyle = palCss('limestone.hi'); g.fillRect(8, 8, PX - 16, 4); g.fillRect(8, 8, 4, PY - 16);
    g.fillStyle = palCss('ink.line');
    g.textBaseline = 'top';
    g.font = 'bold 30px system-ui, "Segoe UI", sans-serif';
    g.fillText(t(`lesson.${tab.lesson}.title` as MessageKey), 28, 22);
    g.fillStyle = palCss('ink.bevel');
    g.fillRect(28, 62, PX - 56, 3);
    g.fillStyle = palCss('ink.line');
    g.font = '18px system-ui, "Segoe UI", sans-serif';
    let y = 78;
    for (const line of wrap(g, sentenceCase(t(`lesson.${tab.lesson}.text` as MessageKey, controlParams(activeDevice()))), PX - 56)) { g.fillText(line, 28, y); y += 23; }
    tab.texture.needsUpdate = true;
  }
}

function wrap(g: CanvasRenderingContext2D, text: string, width: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (g.measureText(next).width > width && line) { out.push(line); line = word; } else line = next;
  }
  if (line) out.push(line);
  return out;
}
