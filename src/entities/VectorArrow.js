/**
 * VectorArrow.js
 * High-graphics 3D PBR Vector Arrow with metallic collar rings, glowing energy core,
 * smooth high-segment geometry, and toggleable additive bloom aura.
 */

import * as THREE from 'three';
import { magnitude, WORLD_SCALE } from '../core/Vec3Utils.js';

export const ARROW_COLORS = {
  thrust: 0x22d3ee,
  wind: 0xfb923c,
  gravity: 0xc084fc,
  resultant: 0xfacc15,
  gate: 0x34d399,
  vecA: 0xf43f5e,
  vecB: 0x38bdf8,
  cross: 0xfacc15
};

export class VectorArrow {
  constructor({
    color = ARROW_COLORS.thrust,
    ghost = false,
    shaftRadius = 0.08,
    headRadius = 0.24,
    headLength = 0.56,
    bloomEnabled = true
  } = {}) {
    this.group = new THREE.Group();
    this.color = color;
    this.ghost = ghost;
    this.shaftRadius = shaftRadius;
    this.headRadius = headRadius;
    this.headLength = headLength;
    this.bloomEnabled = bloomEnabled;

    const baseOpacity = ghost ? 0.62 : 0.98;

    this.shaftMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: ghost ? 0.45 : 0.75,
      roughness: 0.15,
      metalness: 0.45,
      transparent: true,
      opacity: baseOpacity
    });

    this.headMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: ghost ? 0.55 : 0.9,
      roughness: 0.12,
      metalness: 0.55,
      transparent: true,
      opacity: ghost ? 0.75 : 1.0
    });

    this.bloomMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: ghost ? 0.2 : 0.36,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const shaftGeo = new THREE.CylinderGeometry(shaftRadius * 0.88, shaftRadius, 1, 24);
    shaftGeo.translate(0, 0.5, 0);
    this.shaftMesh = new THREE.Mesh(shaftGeo, this.shaftMat);

    const headGeo = new THREE.ConeGeometry(headRadius, headLength, 28);
    headGeo.translate(0, headLength * 0.5, 0);
    this.headMesh = new THREE.Mesh(headGeo, this.headMat);

    // Metallic base collar ring at arrow tail
    const collarGeo = new THREE.TorusGeometry(shaftRadius * 1.35, shaftRadius * 0.28, 12, 24);
    collarGeo.rotateX(Math.PI / 2);
    this.collarMesh = new THREE.Mesh(collarGeo, this.headMat);

    const bloomShaftGeo = new THREE.CylinderGeometry(shaftRadius * 2.3, shaftRadius * 2.3, 1, 16);
    bloomShaftGeo.translate(0, 0.5, 0);
    this.bloomShaftMesh = new THREE.Mesh(bloomShaftGeo, this.bloomMat);

    const bloomHeadGeo = new THREE.ConeGeometry(headRadius * 1.65, headLength * 1.25, 20);
    bloomHeadGeo.translate(0, headLength * 0.5, 0);
    this.bloomHeadMesh = new THREE.Mesh(bloomHeadGeo, this.bloomMat);

    this.group.add(
      this.shaftMesh,
      this.headMesh,
      this.collarMesh,
      this.bloomShaftMesh,
      this.bloomHeadMesh
    );

    this.setBloom(bloomEnabled);
    this.tipWorldPosition = new THREE.Vector3();
  }

  setBloom(enabled) {
    this.bloomEnabled = enabled;
    this.bloomShaftMesh.visible = enabled;
    this.bloomHeadMesh.visible = enabled;
  }

  setFromOriginAndVector(origin, vec) {
    const scaledVec = { x: vec.x * WORLD_SCALE, y: vec.y * WORLD_SCALE, z: vec.z * WORLD_SCALE };
    const scaledOrigin = { x: origin.x * WORLD_SCALE, y: origin.y * WORLD_SCALE, z: origin.z * WORLD_SCALE };
    origin = scaledOrigin;
    vec = scaledVec;
    const len = magnitude(vec);
    if (len < 0.05) {
      this.group.visible = false;
      this.tipWorldPosition.set(origin.x, origin.y, origin.z);
      return;
    }
    this.group.visible = true;
    this.group.position.set(origin.x, origin.y, origin.z);

    const dir = new THREE.Vector3(vec.x / len, vec.y / len, vec.z / len);
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion();
    if (dir.y < -0.9999) {
      quat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
    } else {
      quat.setFromUnitVectors(up, dir);
    }
    this.group.quaternion.copy(quat);

    const actualHeadLen = Math.min(this.headLength, len * 0.45);
    const shaftLen = Math.max(0.01, len - actualHeadLen);

    this.shaftMesh.scale.set(1, shaftLen, 1);
    this.headMesh.position.set(0, shaftLen, 0);
    this.headMesh.scale.set(1, actualHeadLen / this.headLength, 1);

    this.bloomShaftMesh.scale.set(1, shaftLen, 1);
    this.bloomHeadMesh.position.set(0, shaftLen, 0);
    this.bloomHeadMesh.scale.set(1, actualHeadLen / this.headLength, 1);

    this.tipWorldPosition.set(
      origin.x + vec.x,
      origin.y + vec.y,
      origin.z + vec.z
    );
  }

  getTipPosition() {
    return this.tipWorldPosition;
  }
}
