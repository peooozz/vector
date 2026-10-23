/**
 * Turbine.js
 * World 5 ("Spin" - Cross Product): Rotating Turbine / Door + 3D Hand-Free Right-Hand-Rule Indicator.
 */

import * as THREE from 'three';
import { VectorArrow, ARROW_COLORS } from './VectorArrow.js';
import { cross, normalize, alignmentCos, WORLD_SCALE } from '../core/Vec3Utils.js';

export class Turbine {
  constructor(data, bloomEnabled = true) {
    this.data = data;
    this.group = new THREE.Group();
    this.group.position.set(data.position.x * WORLD_SCALE, data.position.y * WORLD_SCALE, data.position.z * WORLD_SCALE);

    const radius = data.radius || 1.9;
    this.crossVec = cross(data.vecA, data.vecB);
    const normCross = normalize(this.crossVec);

    this.rotorContainer = new THREE.Group();
    const lookQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(normCross.x, normCross.y, normCross.z)
    );
    this.rotorContainer.quaternion.copy(lookQuat);
    this.group.add(this.rotorContainer);

    const ringGeo = new THREE.TorusGeometry(radius, 0.13, 12, 32);
    this.ringMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xbe123c,
      emissiveIntensity: 0.45,
      roughness: 0.3
    });
    this.rotorContainer.add(new THREE.Mesh(ringGeo, this.ringMat));

    this.bladesGroup = new THREE.Group();
    this.bladeMat = new THREE.MeshStandardMaterial({
      color: 0xfda4af,
      roughness: 0.35,
      metalness: 0.2
    });
    const bladeGeo = new THREE.BoxGeometry(radius * 0.85, 0.22, 0.06);
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Mesh(bladeGeo, this.bladeMat);
      const ang = (i * Math.PI) / 2;
      b.rotation.z = ang;
      this.bladesGroup.add(b);
    }
    this.rotorContainer.add(this.bladesGroup);

    const normA = normalize(data.vecA);
    this.arrowA = new VectorArrow({
      color: ARROW_COLORS.vecA,
      shaftRadius: 0.07,
      headRadius: 0.2,
      headLength: 0.45,
      bloomEnabled
    });
    this.arrowA.setFromOriginAndVector(
      { x: 0, y: 0, z: 0 },
      { x: normA.x * 2.1, y: normA.y * 2.1, z: normA.z * 2.1 }
    );
    this.group.add(this.arrowA.group);

    const normB = normalize(data.vecB);
    this.arrowB = new VectorArrow({
      color: ARROW_COLORS.vecB,
      shaftRadius: 0.07,
      headRadius: 0.2,
      headLength: 0.45,
      bloomEnabled
    });
    this.arrowB.setFromOriginAndVector(
      { x: 0, y: 0, z: 0 },
      { x: normB.x * 2.1, y: normB.y * 2.1, z: normB.z * 2.1 }
    );
    this.group.add(this.arrowB.group);

    this.arrowCross = new VectorArrow({
      color: ARROW_COLORS.cross,
      ghost: true,
      shaftRadius: 0.06,
      headRadius: 0.18,
      headLength: 0.42,
      bloomEnabled
    });
    this.arrowCross.setFromOriginAndVector(
      { x: 0, y: 0, z: 0 },
      { x: normCross.x * 2.3, y: normCross.y * 2.3, z: normCross.z * 2.3 }
    );
    this.group.add(this.arrowCross.group);

    const arcPoints = [];
    const va = new THREE.Vector3(normA.x, normA.y, normA.z);
    const vb = new THREE.Vector3(normB.x, normB.y, normB.z);
    const arcRadius = 1.25;
    for (let s = 0; s <= 20; s++) {
      const t = s / 20;
      const interp = new THREE.Vector3().lerpVectors(va, vb, t).normalize().multiplyScalar(arcRadius);
      arcPoints.push(interp);
    }
    const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
    const arcMat = new THREE.LineBasicMaterial({ color: 0xfacc15 });
    this.group.add(new THREE.Line(arcGeo, arcMat));
  }

  setBloom(enabled) {
    this.arrowA.setBloom(enabled);
    this.arrowB.setBloom(enabled);
    this.arrowCross.setBloom(enabled);
  }

  update(resultantVec, dt) {
    const cosTheta = alignmentCos(resultantVec, this.crossVec);
    const unlocked = cosTheta >= (this.data.minAlignment || 0.92);

    if (unlocked) {
      this.ringMat.color.setHex(0x34d399);
      this.ringMat.emissive.setHex(0x10b981);
      this.bladesGroup.rotation.z += dt * 5.5;
      this.bladesGroup.scale.setScalar(0.28);
    } else {
      this.ringMat.color.setHex(0xf43f5e);
      this.ringMat.emissive.setHex(0xbe123c);
      this.bladesGroup.rotation.z += dt * (cosTheta < -0.5 ? -1.5 : 0.4);
      this.bladesGroup.scale.setScalar(0.95);
    }
  }
}
