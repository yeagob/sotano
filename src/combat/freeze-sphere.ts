export const SPHERE_EVERY = 3;
export const SPHERE_RADIUS = 4;
export const SPHERE_GROW = 1.5;
export const SPHERE_FREEZE = 3;

export interface SpherePoint { x: number; y: number; z: number }
export interface SphereTarget extends SpherePoint { id: number }

export interface Sphere extends SpherePoint {
  age: number;
  readonly reached: Set<number>;
}

export const sphereRadius = (age: number): number => SPHERE_RADIUS * Math.min(1, Math.max(0, age / SPHERE_GROW));

export class FreezeSpheres {
  private clock = 0;
  readonly live: Sphere[] = [];

  update(dt: number, on: boolean, from: SpherePoint, targets: readonly SphereTarget[], freeze: (id: number) => void): Sphere | null {
    if (!on) {
      this.clock = 0;
      this.live.length = 0;
      return null;
    }
    let born: Sphere | null = null;
    this.clock += dt;
    if (this.clock >= SPHERE_EVERY) {
      this.clock -= SPHERE_EVERY;
      born = { x: from.x, y: from.y, z: from.z, age: 0, reached: new Set() };
      this.live.push(born);
    }
    for (let i = this.live.length - 1; i >= 0; i--) {
      const s = this.live[i];
      if (s !== born) s.age = Math.min(SPHERE_GROW, s.age + dt);
      const r = sphereRadius(s.age);
      for (const t of targets) {
        if (s.reached.has(t.id)) continue;
        if (Math.hypot(t.x - s.x, t.y - s.y, t.z - s.z) > r) continue;
        s.reached.add(t.id);
        freeze(t.id);
      }
      if (s.age >= SPHERE_GROW) this.live.splice(i, 1);
    }
    return born;
  }

  reset(): void {
    this.clock = 0;
    this.live.length = 0;
  }
}
