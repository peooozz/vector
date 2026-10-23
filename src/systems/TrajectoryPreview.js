/**
 * TrajectoryPreview.js
 * Renders a smooth, high-visibility 3D trajectory curve + animated energy pulses
 * using the exact same deterministic simulateFullTrajectory() physics as the real run.
 */

import * as THREE from 'three';
import { simulateFullTrajectory, BURN_STEPS } from '../core/Physics.js';
import { WORLD_SCALE } from '../core/Vec3Utils.js';

export class TrajectoryPreview {
  constructor(scene) {
    this.scene = scene;
    this.enabled = true;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Smooth trajectory line
    const maxPts = BURN_STEPS + 1;
    const positions = new Float32Array(maxPts * 3);
    this.lineGeo = new THREE.BufferGeometry();
    this.lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.lineMat = new THREE.LineBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.65
    });
    this.pathLine = new THREE.Line(this.lineGeo, this.lineMat);
    this.group.add(this.pathLine);

    // Glowing bead markers along path
    this.beads = [];
    const beadGeo = new THREE.SphereGeometry(0.11, 14, 14);
    this.beadMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.92
    });

    const numBeads = 18;
    for (let i = 0; i < numBeads; i++) {
      const mesh = new THREE.Mesh(beadGeo, this.beadMat);
      this.group.add(mesh);
      this.beads.push(mesh);
    }

    // Apex endpoint target bullseye ring
    const ringGeo = new THREE.RingGeometry(0.32, 0.5, 32);
    ringGeo.rotateX(-Math.PI / 2);
    this.apexMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    this.apexRing = new THREE.Mesh(ringGeo, this.apexMat);
    this.group.add(this.apexRing);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.group.visible = enabled;
  }

  update(level, thrust) {
    if (!this.enabled) {
      this.group.visible = false;
      return null;
    }
    this.group.visible = true;

    const sim = simulateFullTrajectory(level, thrust);
    const pts = sim.points;
    const burnLimit = Math.min(pts.length - 1, BURN_STEPS);

    const colorHex = sim.outcome === 'win' ? 0x34d399 : 0xfacc15;
    this.beadMat.color.setHex(colorHex);
    this.apexMat.color.setHex(colorHex);
    this.lineMat.color.setHex(colorHex);

    // Update smooth line geometry
    const posAttr = this.lineGeo.attributes.position;
    for (let i = 0; i <= burnLimit; i++) {
      const p = pts[i] || pts[0];
      posAttr.setXYZ(i, p.x * WORLD_SCALE, p.y * WORLD_SCALE, p.z * WORLD_SCALE);
    }
    posAttr.needsUpdate = true;
    this.lineGeo.setDrawRange(0, burnLimit + 1);

    for (let i = 0; i < this.beads.length; i++) {
      const t = (i + 1) / this.beads.length;
      const idx = Math.min(burnLimit, Math.floor(t * burnLimit));
      const p = pts[idx] || pts[0];
      this.beads[i].position.set(p.x * WORLD_SCALE, p.y * WORLD_SCALE, p.z * WORLD_SCALE);
      const scale = 0.7 + 0.45 * (1 - t * 0.35);
      this.beads[i].scale.setScalar(scale);
    }

    const apex = sim.burnApexPosition || pts[burnLimit];
    this.apexRing.position.set(apex.x * WORLD_SCALE, apex.y * WORLD_SCALE - 0.3, apex.z * WORLD_SCALE);
    return sim;
  }
}
