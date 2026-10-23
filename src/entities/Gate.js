/**
 * Gate.js
 * World 4 ("Alignment" - Dot Product): Solar Sail Gate.
 */

import * as THREE from 'three';
import { VectorArrow, ARROW_COLORS } from './VectorArrow.js';
import { normalize, alignmentCos, WORLD_SCALE } from '../core/Vec3Utils.js';

export class Gate {
  constructor(data, bloomEnabled = true) {
    this.data = data;
    this.group = new THREE.Group();
    this.group.position.set(data.position.x * WORLD_SCALE, data.position.y * WORLD_SCALE, data.position.z * WORLD_SCALE);

    const radius = data.radius || 1.9;

    const normDir = normalize(data.direction);
    const targetVec = new THREE.Vector3(normDir.x, normDir.y, normDir.z);
    const ringContainer = new THREE.Group();
    const lookQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), targetVec);
    ringContainer.quaternion.copy(lookQuat);
    this.group.add(ringContainer);

    const torusGeo = new THREE.TorusGeometry(radius, 0.11, 12, 32);
    this.ringMat = new THREE.MeshStandardMaterial({
      color: 0xa78bfa,
      emissive: 0x6d28d9,
      emissiveIntensity: 0.5,
      roughness: 0.25
    });
    this.ringMesh = new THREE.Mesh(torusGeo, this.ringMat);
    ringContainer.add(this.ringMesh);

    this.sailMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
      roughness: 0.2
    });
    const sailGeo = new THREE.BoxGeometry(0.65, 0.24, 0.08);
    [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((ang) => {
      const sail = new THREE.Mesh(sailGeo, this.sailMat);
      sail.position.set(Math.cos(ang) * (radius + 0.35), Math.sin(ang) * (radius + 0.35), 0);
      sail.rotation.z = ang;
      ringContainer.add(sail);
    });

    this.dirArrow = new VectorArrow({
      color: ARROW_COLORS.gate,
      shaftRadius: 0.075,
      headRadius: 0.22,
      headLength: 0.5,
      bloomEnabled
    });
    this.dirArrow.setFromOriginAndVector(
      { x: 0, y: 0, z: 0 },
      { x: normDir.x * 2.2, y: normDir.y * 2.2, z: normDir.z * 2.2 }
    );
    this.group.add(this.dirArrow.group);
  }

  setBloom(enabled) {
    this.dirArrow.setBloom(enabled);
  }

  updateAlignment(resultantVec, time) {
    const cosTheta = alignmentCos(resultantVec, this.data.direction);
    const aligned = cosTheta >= (this.data.minAlignment || 0.92);

    if (aligned) {
      this.ringMat.color.setHex(0x34d399);
      this.ringMat.emissive.setHex(0x10b981);
      this.ringMat.emissiveIntensity = 0.75 + 0.25 * Math.sin(time * 6);
      this.sailMat.color.setHex(0xfacc15);
      this.sailMat.emissive.setHex(0xeab308);
    } else {
      this.ringMat.color.setHex(0xa78bfa);
      this.ringMat.emissive.setHex(0x6d28d9);
      this.ringMat.emissiveIntensity = 0.4;
      this.sailMat.color.setHex(0xf43f5e);
      this.sailMat.emissive.setHex(0x9f1239);
    }
  }
}
