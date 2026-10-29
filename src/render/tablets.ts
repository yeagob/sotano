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
export const LESSONS = ['move', 'intent', 'polarity', 'step', 'kick', 'pit', 'bridge', 'bomb', 'water', 'practice', 'down', 'carry'] as const;
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
  add(lesson: LessonKey, x0: number, y0: number, z0: number, second: LessonKey = lesson) {
    // north wall, west of the door (facing south); south wall, east of the door (facing north)
    this.mount(lesson, x0 + 2.0, y0 + 2.0, z0 + 0.02, 0);
    this.mount(second, x0 + 13 - 2.0, y0 + 2.0, z0 + 7 - 0.02, Math.PI);
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
    g.fillStyle = palCss('ink.bevel'); g.fillRect(8, PY - 12, PX - 16, 4); g.fillRect(PX - 12, 8, 4, PY - 16);
    g.fillStyle = palCss('light.gold');
    g.beginPath(); g.moveTo(40, 26); g.lineTo(50, 36); g.lineTo(40, 46); g.lineTo(30, 36); g.closePath(); g.fill();
    g.fillStyle = palCss('ink.line');
    g.textBaseline = 'top';
    g.font = 'bold 32px system-ui, "Segoe UI", sans-serif';
    g.fillText(t(`lesson.${tab.lesson}.title` as MessageKey), 64, 22);
    // on a phone the polarity is a half turn: draw it, so the words are not the only way to learn it
    if (tab.lesson === 'polarity' && activeDevice() === 'touch') halfTurn(g, PX - 58, 46);
    g.fillStyle = palCss('ink.bevel');
    g.fillRect(36, 72, PX - 72, 2);
    g.fillStyle = palCss('ink.line');
    g.font = '24px system-ui, "Segoe UI", sans-serif';
    let y = 92;
    const onPhone = tab.lesson === 'polarity' && activeDevice() === 'touch';
    const key = onPhone ? 'lesson.polarity.touch.text' : `lesson.${tab.lesson}.text`;
    for (const line of wrap(g, sentenceCase(t(key as MessageKey, controlParams(activeDevice()))), PX - 72)) { g.fillText(line, 36, y); y += 32; }
    tab.texture.needsUpdate = true;
  }
}

/**
 * A half turn of the phone, the touch control for the polarity: a landscape phone under a gold arrow
 * that sweeps over it, clockwise, from one side to the other (90° to 270°), with the angle beside it.
 */
export function halfTurn(g: CanvasRenderingContext2D, cx: number, cy: number) {
  const r = 22, start = Math.PI * 1.15, end = Math.PI * 1.85;
  g.save();
  g.strokeStyle = palCss('light.gold'); g.fillStyle = palCss('light.gold');
  g.lineWidth = 4; g.lineCap = 'round';
  g.beginPath(); g.arc(cx, cy, r, start, end); g.stroke();
  // the arrowhead at the end of the sweep, pointing along the curve
  const tx = -Math.sin(end), ty = Math.cos(end), nx = Math.cos(end), ny = Math.sin(end);
  const hx = cx + r * nx, hy = cy + r * ny;
  g.beginPath();
  g.moveTo(hx + tx * 8, hy + ty * 8);
  g.lineTo(hx - tx * 4 + nx * 7, hy - ty * 4 + ny * 7);
  g.lineTo(hx - tx * 4 - nx * 7, hy - ty * 4 - ny * 7);
  g.closePath(); g.fill();
  // the phone, in landscape, the way it is held to play
  g.lineWidth = 2.5;
  g.strokeRect(cx - 9, cy - 6, 18, 12);
  g.font = 'bold 16px system-ui, "Segoe UI", sans-serif';
  g.textAlign = 'right'; g.textBaseline = 'middle';
  g.fillText('180°', cx - r - 8, cy);
  g.restore();
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
