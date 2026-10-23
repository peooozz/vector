/**
 * Trail.js
 * Renders a glowing path ribbon/bead trail behind the airship during the LAUNCH (RUN) phase.
 */

import * as THREE from 'three';
import { WORLD_SCALE } from '../core/Vec3Utils.js';

export class Trail {
  constructor(scene) {
    this.scene = scene;
    this.maxPoints = 130;
    this.points = [];

    const positions = new Float32Array(this.maxPoints * 3);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setDrawRange(0, 0);

    this.material = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9
    });

    this.line = new THREE.Line(this.geometry, this.material);
    this.scene.add(this.line);
  }

  reset() {
    this.points = [];
    this.geometry.setDrawRange(0, 0);
  }

  addPoint(pos) {
    if (this.points.length >= this.maxPoints) {
      this.points.shift();
    }
    this.points.push({ x: pos.x * WORLD_SCALE, y: pos.y * WORLD_SCALE, z: pos.z * WORLD_SCALE });

    const posAttr = this.geometry.attributes.position;
    for (let i = 0; i < this.points.length; i++) {
      posAttr.setXYZ(i, this.points[i].x, this.points[i].y, this.points[i].z);
    }
    posAttr.needsUpdate = true;
    this.geometry.setDrawRange(0, this.points.length);
  }
}
