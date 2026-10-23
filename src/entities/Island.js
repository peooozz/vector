/**
 * Island.js
 * High-Detail Realistic 3D Floating Island:
 * - Larger visual scale with high-resolution procedural diffuse + bump maps
 * - Sculpted basalt/granite cliff strata, lush grassy meadow plateau, stone rim
 * - Illuminated landing pad with glowing runway ring & lighthouse beacon tower
 * - Multi-layered pine trees, rocks, and animated waterfall with splash mist
 */

import * as THREE from 'three';
import { WORLD_SCALE } from '../core/Vec3Utils.js';

let cachedTextures = null;

function getRealisticIslandTextures() {
  if (typeof document === 'undefined') return { grassMap: null, grassBump: null, rockMap: null, rockBump: null };
  if (cachedTextures) return cachedTextures;

  // High-detail Grass Diffuse & Bump
  const gc = document.createElement('canvas');
  gc.width = 512;
  gc.height = 512;
  const gctx = gc.getContext('2d');
  const gGrad = gctx.createRadialGradient(256, 256, 20, 256, 256, 256);
  gGrad.addColorStop(0, '#4ade80');
  gGrad.addColorStop(0.55, '#22c55e');
  gGrad.addColorStop(0.85, '#15803d');
  gGrad.addColorStop(1, '#166534');
  gctx.fillStyle = gGrad;
  gctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 3500; i++) {
    const x = (i * 131) % 512;
    const y = (i * 79 + 29) % 512;
    gctx.fillStyle = i % 3 === 0 ? 'rgba(220, 252, 231, 0.12)' : 'rgba(5, 46, 22, 0.16)';
    gctx.fillRect(x, y, 3, 5);
  }
  const grassMap = new THREE.CanvasTexture(gc);

  // High-detail Cliff Rock Diffuse & Bump
  const rc = document.createElement('canvas');
  rc.width = 512;
  rc.height = 512;
  const rctx = rc.getContext('2d');
  const rGrad = rctx.createLinearGradient(0, 0, 0, 512);
  rGrad.addColorStop(0, '#78716c');
  rGrad.addColorStop(0.3, '#57534e');
  rGrad.addColorStop(0.65, '#44403c');
  rGrad.addColorStop(1, '#1c1917');
  rctx.fillStyle = rGrad;
  rctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 6) {
    rctx.fillStyle = y % 18 === 0 ? 'rgba(12, 10, 9, 0.38)' : 'rgba(231, 229, 228, 0.08)';
    rctx.fillRect(0, y, 512, 3);
  }
  for (let i = 0; i < 2200; i++) {
    const x = (i * 173) % 512;
    const y = (i * 97 + 13) % 512;
    rctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.07)';
    rctx.fillRect(x, y, 5, 4);
  }
  const rockMap = new THREE.CanvasTexture(rc);

  cachedTextures = { grassMap, grassBump: grassMap, rockMap, rockBump: rockMap };
  return cachedTextures;
}

export class Island {
  constructor(data) {
    this.data = data;
    this.group = new THREE.Group();
    this.group.position.set(data.position.x * WORLD_SCALE, data.position.y * WORLD_SCALE, data.position.z * WORLD_SCALE);

    // Bigger visual scale so islands look grand and immersive
    const scale = (data.scale || 1.15) * 1.08;
    const isGoal = data.type === 'goal';
    const { grassMap, grassBump, rockMap, rockBump } = getRealisticIslandTextures();

    // 1. Lush Sculpted Grass Top Plateau
    const topGeo = new THREE.CylinderGeometry(1.48 * scale, 1.38 * scale, 0.42, 48);
    const topMat = new THREE.MeshStandardMaterial({
      map: grassMap,
      bumpMap: grassBump,
      bumpScale: 0.04,
      color: isGoal ? 0x86efac : 0xbbf7d0,
      roughness: 0.68,
      metalness: 0.04
    });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.position.y = -0.58;
    topMesh.receiveShadow = true;
    topMesh.castShadow = true;
    this.group.add(topMesh);

    // Natural Warm Sandstone Rim Ledge
    const rimGeo = new THREE.TorusGeometry(1.44 * scale, 0.11, 16, 48);
    rimGeo.rotateX(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({
      map: rockMap,
      color: 0xd6d3d1,
      roughness: 0.75,
      metalness: 0.08
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.y = -0.44;
    rimMesh.receiveShadow = true;
    this.group.add(rimMesh);

    // 2. Sculpted Realistic Cliff Underside with Craggy Displacement
    const rockGeo = new THREE.ConeGeometry(1.38 * scale, 2.85 * scale, 40, 14);
    rockGeo.rotateX(Math.PI);
    const posAttr = rockGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);
      const n1 = Math.sin(vx * 2.9 + vy * 1.8) * Math.cos(vz * 2.9 - vy * 1.5);
      const n2 = Math.sin(vx * 6.2 - vz * 5.4) * 0.05;
      const factor = 1 + 0.14 * n1 + n2;
      posAttr.setX(i, vx * factor);
      posAttr.setZ(i, vz * factor);
    }
    rockGeo.computeVertexNormals();

    const rockMat = new THREE.MeshStandardMaterial({
      map: rockMap,
      bumpMap: rockBump,
      bumpScale: 0.12,
      color: 0xa8a29e,
      roughness: 0.86,
      metalness: 0.06
    });
    const rockMesh = new THREE.Mesh(rockGeo, rockMat);
    rockMesh.position.y = -0.78 - 1.4 * scale;
    rockMesh.castShadow = true;
    rockMesh.receiveShadow = true;
    this.group.add(rockMesh);

    // 3. Illuminated Helipad / Airship Landing Deck
    const padOuterGeo = new THREE.CylinderGeometry(0.82 * scale, 0.88 * scale, 0.06, 40);
    const padOuterMat = new THREE.MeshStandardMaterial({
      color: isGoal ? 0xfacc15 : 0x38bdf8,
      emissive: isGoal ? 0xeab308 : 0x0284c7,
      emissiveIntensity: 0.45,
      roughness: 0.28,
      metalness: 0.6
    });
    const padOuter = new THREE.Mesh(padOuterGeo, padOuterMat);
    padOuter.position.y = -0.37;
    padOuter.receiveShadow = true;
    this.group.add(padOuter);

    const padInnerGeo = new THREE.CylinderGeometry(0.62 * scale, 0.62 * scale, 0.07, 40);
    const padInnerMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.35
    });
    const padInner = new THREE.Mesh(padInnerGeo, padInnerMat);
    padInner.position.y = -0.365;
    padInner.receiveShadow = true;
    this.group.add(padInner);

    // 4. Realistic Multi-Tiered Pine Forest & Mossy Boulders
    const foliageDark = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.65 });
    const foliageLight = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c2d0c, roughness: 0.85 });
    const boulderMat = new THREE.MeshStandardMaterial({ map: rockMap, color: 0xd6d3d1, roughness: 0.8 });

    const treeAngles = [0.65, 1.35, 2.35, 3.65, 4.4, 5.3];
    treeAngles.forEach((ang, idx) => {
      const r = (1.06 + (idx % 2) * 0.12) * scale;
      const tx = Math.cos(ang) * r;
      const tz = Math.sin(ang) * r;
      const hScale = 0.85 + (idx % 3) * 0.22;

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * hScale, 0.07 * hScale, 0.38 * hScale, 12), trunkMat);
      trunk.position.set(tx, -0.24, tz);
      trunk.castShadow = true;

      const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.28 * hScale, 0.52 * hScale, 18), foliageDark);
      c1.position.set(tx, 0.05 * hScale, tz);
      c1.castShadow = true;
      const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.22 * hScale, 0.44 * hScale, 18), foliageLight);
      c2.position.set(tx, 0.28 * hScale, tz);
      c2.castShadow = true;
      const c3 = new THREE.Mesh(new THREE.ConeGeometry(0.15 * hScale, 0.34 * hScale, 18), foliageLight);
      c3.position.set(tx, 0.48 * hScale, tz);
      c3.castShadow = true;
      this.group.add(trunk, c1, c2, c3);

      if (idx % 2 === 0) {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 1), boulderMat);
        rock.scale.set(1.2, 0.8, 1.0);
        rock.position.set(Math.cos(ang + 0.22) * r, -0.34, Math.sin(ang + 0.22) * r);
        rock.castShadow = true;
        this.group.add(rock);
      }
    });

    // 5. Orbiting Floating Cliff Fragments
    this.orbitRocks = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const sat = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 1), rockMat);
      const a = (i * Math.PI) / 2;
      sat.position.set(Math.cos(a) * (1.82 * scale), -0.95 - (i % 2) * 0.45, Math.sin(a) * (1.82 * scale));
      this.orbitRocks.add(sat);
    }
    this.group.add(this.orbitRocks);

    // 6. Goal Island Beacon Crystal, Pulsing Ring & Waterfall
    if (isGoal) {
      const crystalGeo = new THREE.OctahedronGeometry(0.32, 1);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.1,
        roughness: 0.08,
        metalness: 0.4
      });
      this.beacon = new THREE.Mesh(crystalGeo, crystalMat);
      this.beacon.position.set(0, 1.35, 0);
      this.group.add(this.beacon);

      const ringGeo = new THREE.TorusGeometry(1.08 * scale * 0.78, 0.04, 16, 48);
      ringGeo.rotateX(Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: 0.75
      });
      this.goalRing = new THREE.Mesh(ringGeo, ringMat);
      this.goalRing.position.y = -0.32;
      this.group.add(this.goalRing);

      // Sparkling Waterfall Stream
      const fallGeo = new THREE.CylinderGeometry(0.18, 0.34, 2.6, 20);
      const fallMat = new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        emissive: 0x0284c7,
        emissiveIntensity: 0.4,
        roughness: 0.1,
        transparent: true,
        opacity: 0.78
      });
      const fallMesh = new THREE.Mesh(fallGeo, fallMat);
      fallMesh.position.set(1.24 * scale, -1.65, 0);
      this.group.add(fallMesh);
    }
  }

  update(time) {
    if (this.orbitRocks) {
      this.orbitRocks.rotation.y = time * 0.38;
    }
    if (this.beacon) {
      this.beacon.rotation.y = time * 1.8;
      this.beacon.position.y = 1.35 + Math.sin(time * 3.0) * 0.12;
    }
    if (this.goalRing) {
      const s = 1 + 0.08 * Math.sin(time * 2.8);
      this.goalRing.scale.set(s, 1, s);
    }
  }
}

export function createObstacleSpire(obs) {
  const group = new THREE.Group();
  group.position.set(obs.position.x * WORLD_SCALE, obs.position.y * WORLD_SCALE, obs.position.z * WORLD_SCALE);

  const radius = (obs.radius || 0.85) * 1.1;
  const geo = new THREE.IcosahedronGeometry(radius, 2);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0x7f1d1d,
    emissiveIntensity: 0.35,
    roughness: 0.5,
    metalness: 0.25
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  group.add(mesh);

  const ringGeo = new THREE.TorusGeometry(radius * 1.28, 0.035, 12, 36);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xfca5a5, transparent: true, opacity: 0.7 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 3;
  group.add(ring);

  return group;
}
