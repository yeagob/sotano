import * as THREE from 'three';
import { buildKitchenModel } from '../render/kitchen-model';

export class Kitchens {
  private group = new THREE.Group();

  constructor(private scene: THREE.Scene) { scene.add(this.group); }

  add(x: number, y: number, z: number): THREE.Group {
    const model = buildKitchenModel();
    model.position.set(x, y, z);
    this.group.add(model);
    return model;
  }

  dispose() {
    this.group.traverse(o => {
      if (o instanceof THREE.Mesh) { o.geometry.dispose(); (o.material as THREE.Material).dispose(); }
    });
    this.scene.remove(this.group);
  }
}
