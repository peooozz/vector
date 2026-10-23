/**
 * WindZone.js
 * Realistic 3D Air-Stream & Wind Current Animation:
 * Renders undulating, multi-segment aerodynamic wind ribbons + glowing air-dust motes
 * flowing smoothly along the wind vector across the sky canyon.
 */

import * as THREE from 'three';
import { magnitude, WORLD_SCALE } from '../core/Vec3Utils.js';

export class WindZone {
  constructor(data) {
    this.data = data;
    this.group = new THREE.Group();
    this.group.position.set(
      data.position.x * WORLD_SCALE,
      data.position.y * WORLD_SCALE,
      data.position.z * WORLD_SCALE
    );

    const sx = data.size.x * WORLD_SCALE;
    const sy = data.size.y * WORLD_SCALE;
    const sz = data.size.z * WORLD_SCALE;
    this.bounds = { hx: sx * 0.44, hy: sy * 0.36, hz: sz * 0.44 };

    const windLen = magnitude(data.vector);
    const dir = windLen > 1e-5
      ? new THREE.Vector3(data.vector.x / windLen, data.vector.y / windLen, data.vector.z / windLen)
      : new THREE.Vector3(1, 0, 0);

    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion();
    if (dir.y < -0.999) {
      quat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
    } else {
      quat.setFromUnitVectors(up, dir);
    }

    // Create 34 undulating air-current ribbons + sleek wind arrows
    this.ribbons = [];
    const segCount = 12;

    const arrowMat = new THREE.MeshBasicMaterial({
      color: 0xfb923c,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const headGeo = new THREE.ConeGeometry(0.11, 0.36, 10);

    for (let i = 0; i < 34; i++) {
      const rGroup = new THREE.Group();
      rGroup.quaternion.copy(quat);

      // Ribbon line geometry with 12 vertices along local Y (from -2.2 to 0)
      const pts = [];
      for (let s = 0; s < segCount; s++) {
        pts.push(new THREE.Vector3(0, -s * 0.22, 0));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? 0xfdba74 : 0xe0f2fe,
        transparent: true,
        opacity: i % 2 === 0 ? 0.68 : 0.48,
        blending: THREE.AdditiveBlending
      });
      const line = new THREE.Line(lineGeo, lineMat);
      rGroup.add(line);

      // Sleek arrow tip at front of every 2nd air ribbon
      if (i % 2 === 0) {
        const tip = new THREE.Mesh(headGeo, arrowMat);
        rGroup.add(tip);
      }

      const rx = (((i * 73) % 100) / 100 - 0.5) * (sx * 0.85);
      const ry = (((i * 41 + 19) % 100) / 100 - 0.5) * (sy * 0.7);
      const rz = (((i * 59 + 37) % 100) / 100 - 0.5) * (sz * 0.85);
      rGroup.position.set(rx, ry, rz);

      this.group.add(rGroup);
      this.ribbons.push({
        group: rGroup,
        lineGeo,
        phase: i * 0.75,
        speedMult: 0.85 + (i % 5) * 0.1
      });
    }
    this.elapsed = 0;
  }

  update(dt) {
    this.elapsed += dt;
    const v = this.data.vector;
    const { hx, hy, hz } = this.bounds;

    for (let i = 0; i < this.ribbons.length; i++) {
      const r = this.ribbons[i];
      const p = r.group.position;
      const spd = WORLD_SCALE * 1.15 * r.speedMult;

      p.x += v.x * dt * spd;
      p.y += v.y * dt * spd;
      p.z += v.z * dt * spd;

      if (p.x > hx) p.x = -hx;
      if (p.x < -hx) p.x = hx;
      if (p.y > hy) p.y = -hy;
      if (p.y < -hy) p.y = hy;
      if (p.z > hz) p.z = -hz;
      if (p.z < -hz) p.z = hz;

      // Animate sinusoidal air wave along each ribbon's tail
      const posAttr = r.lineGeo.attributes.position;
      for (let s = 0; s < posAttr.count; s++) {
        const wave = Math.sin(this.elapsed * 9.0 - s * 0.55 + r.phase) * 0.09 * (s / posAttr.count);
        const waveZ = Math.cos(this.elapsed * 7.5 - s * 0.45 + r.phase) * 0.06 * (s / posAttr.count);
        posAttr.setXYZ(s, wave, -s * 0.24, waveZ);
      }
      posAttr.needsUpdate = true;
    }
  }
}
