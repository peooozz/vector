/**
 * Airship.js
 * Sleek, slim, realistic 3D Aero-Jet Plane:
 * - Slender, tapered aerodynamic fuselage with metallic titanium/ivory finish & panel lines
 * - Tinted glass fighter/business-jet cockpit canopy
 * - High-aspect swept main wings with upturned winglets & red/green wingtip strobe lights
 * - Twin under-wing turbofan jet nacelles with spinning intake fan blades
 * - Twin canted vertical tail stabilizers + horizontal elevators
 * - Realistic animated wingtip air-stream ribbons & dual afterburner shock-plumes
 */

import * as THREE from 'three';
import { WORLD_SCALE } from '../core/Vec3Utils.js';

function createFuselageTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#f8fafc');
  grad.addColorStop(0.44, '#e2e8f0');
  grad.addColorStop(0.49, '#0284c7');
  grad.addColorStop(0.53, '#38bdf8');
  grad.addColorStop(0.57, '#0f172a');
  grad.addColorStop(1, '#334155');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = 'rgba(15, 23, 42, 0.18)';
  ctx.lineWidth = 1.5;
  for (let x = 32; x < 512; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
}

export class Airship {
  constructor() {
    this.group = new THREE.Group();
    this.visualGroup = new THREE.Group();
    this.visualGroup.scale.setScalar(1.15);
    this.group.add(this.visualGroup);

    const bodyTex = createFuselageTexture();

    const fuselageMat = new THREE.MeshStandardMaterial({
      map: bodyTex,
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.45
    });
    const darkCarbonMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.7
    });
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.22,
      metalness: 0.5
    });
    const accentTrimMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.6
    });

    // 1. Slim, Tapered Aerodynamic Fuselage (long X, very slim Y and Z!)
    const mainBodyGeo = new THREE.CylinderGeometry(0.16, 0.21, 1.95, 32);
    mainBodyGeo.rotateZ(-Math.PI / 2);
    mainBodyGeo.scale(1.0, 0.78, 0.85);
    const mainBody = new THREE.Mesh(mainBodyGeo, fuselageMat);
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    this.visualGroup.add(mainBody);

    // Sleek Pointed Supersonic Nose Cone
    const noseGeo = new THREE.ConeGeometry(0.16, 0.85, 32);
    noseGeo.rotateZ(-Math.PI / 2);
    noseGeo.scale(1.0, 0.78, 0.85);
    const noseMesh = new THREE.Mesh(noseGeo, fuselageMat);
    noseMesh.position.set(1.4, 0, 0);
    noseMesh.castShadow = true;
    this.visualGroup.add(noseMesh);

    // Nose Radome Tip
    const tipGeo = new THREE.ConeGeometry(0.055, 0.28, 24);
    tipGeo.rotateZ(-Math.PI / 2);
    const tipMesh = new THREE.Mesh(tipGeo, darkCarbonMat);
    tipMesh.position.set(1.76, 0, 0);
    this.visualGroup.add(tipMesh);

    // Tapered Rear Tail Cone
    const tailConeGeo = new THREE.CylinderGeometry(0.12, 0.21, 0.75, 28);
    tailConeGeo.rotateZ(Math.PI / 2);
    tailConeGeo.scale(1.0, 0.78, 0.85);
    const tailCone = new THREE.Mesh(tailConeGeo, darkCarbonMat);
    tailCone.position.set(-1.32, 0.01, 0);
    this.visualGroup.add(tailCone);

    // 2. Teardrop Fighter-Jet Tinted Glass Canopy
    const canopyGeo = new THREE.SphereGeometry(0.175, 32, 20);
    canopyGeo.scale(2.85, 0.72, 0.76);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0369a1,
      emissiveIntensity: 0.4,
      roughness: 0.05,
      metalness: 0.92,
      transparent: true,
      opacity: 0.88
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0.32, 0.12, 0);
    this.visualGroup.add(canopy);

    // 3. Sleek Swept Main Wings (Left & Right) + Upturned Winglets
    const createSweptWing = (side) => {
      const wingGroup = new THREE.Group();
      // Main wing plank swept back
      const span = 1.65;
      const wGeo = new THREE.BoxGeometry(0.52, 0.028, span);
      // Taper & sweep vertices
      const pos = wGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vz = pos.getZ(i);
        // Outer tip is at side * span/2
        const t = Math.max(0, (vz * side + span * 0.5) / span);
        // Taper chord and sweep backward (-X) toward wingtip
        pos.setX(i, vx * (1 - 0.58 * t) - t * 0.48);
        pos.setY(i, pos.getY(i) * (1 - 0.45 * t) + t * 0.04);
      }
      wGeo.computeVertexNormals();
      const wMesh = new THREE.Mesh(wGeo, wingMat);
      wMesh.position.set(-0.08, -0.02, side * (span * 0.5 + 0.12));
      wMesh.castShadow = true;
      wMesh.receiveShadow = true;
      wingGroup.add(wMesh);

      // Leading-edge cyan accent strip
      const stripGeo = new THREE.BoxGeometry(0.06, 0.032, span * 0.96);
      const stripMesh = new THREE.Mesh(stripGeo, accentTrimMat);
      stripMesh.position.set(0.06, -0.018, side * (span * 0.5 + 0.12));
      stripMesh.rotation.y = side * 0.27;
      wingGroup.add(stripMesh);

      // Upturned Sharklet Winglet at Wingtip
      const wingletGeo = new THREE.BoxGeometry(0.24, 0.28, 0.025);
      const winglet = new THREE.Mesh(wingletGeo, accentTrimMat);
      winglet.position.set(-0.56, 0.14, side * (span + 0.11));
      winglet.rotation.z = -0.35;
      winglet.rotation.x = -side * 0.22;
      wingGroup.add(winglet);

      // Wingtip Strobe Nav Light (Red port / Green starboard)
      const navLightGeo = new THREE.SphereGeometry(0.035, 10, 10);
      const navLightMat = new THREE.MeshBasicMaterial({
        color: side > 0 ? 0xf43f5e : 0x22c55e
      });
      const navLight = new THREE.Mesh(navLightGeo, navLightMat);
      navLight.position.set(-0.48, 0.03, side * (span + 0.13));
      wingGroup.add(navLight);

      return wingGroup;
    };

    this.visualGroup.add(createSweptWing(1), createSweptWing(-1));

    // 4. Twin Under-Wing Turbofan Jet Engines with Spinning Fan Blades
    this.fans = [];
    [-0.56, 0.56].forEach((zOff) => {
      const engGroup = new THREE.Group();
      engGroup.position.set(-0.12, -0.14, zOff);

      const cowlGeo = new THREE.CylinderGeometry(0.095, 0.082, 0.52, 24);
      cowlGeo.rotateZ(Math.PI / 2);
      const cowl = new THREE.Mesh(cowlGeo, wingMat);
      cowl.castShadow = true;
      engGroup.add(cowl);

      const intakeRingGeo = new THREE.TorusGeometry(0.092, 0.014, 12, 24);
      intakeRingGeo.rotateY(Math.PI / 2);
      const intakeRing = new THREE.Mesh(intakeRingGeo, darkCarbonMat);
      intakeRing.position.set(0.26, 0, 0);
      engGroup.add(intakeRing);

      // Spinning Fan Rotor
      const fanGroup = new THREE.Group();
      fanGroup.position.set(0.22, 0, 0);
      const bladeGeo = new THREE.BoxGeometry(0.015, 0.16, 0.032);
      for (let b = 0; b < 6; b++) {
        const blade = new THREE.Mesh(bladeGeo, darkCarbonMat);
        blade.rotation.x = (b * Math.PI) / 6;
        fanGroup.add(blade);
      }
      engGroup.add(fanGroup);
      this.fans.push(fanGroup);

      this.visualGroup.add(engGroup);
    });

    // 5. Twin Canted Vertical Tail Fins (V-Tail) + Horizontal Stabilizers
    [-0.18, 0.18].forEach((zOff) => {
      const side = Math.sign(zOff);
      const vTailGeo = new THREE.BoxGeometry(0.48, 0.45, 0.026);
      const pos = vTailGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        if (pos.getY(i) > 0) {
          pos.setX(i, pos.getX(i) * 0.52 - 0.18);
        }
      }
      vTailGeo.computeVertexNormals();
      const vTail = new THREE.Mesh(vTailGeo, wingMat);
      vTail.position.set(-1.32, 0.24, zOff);
      vTail.rotation.x = -side * 0.28;
      vTail.castShadow = true;
      this.visualGroup.add(vTail);
    });

    const hTailGeo = new THREE.BoxGeometry(0.36, 0.024, 1.05);
    const hTail = new THREE.Mesh(hTailGeo, darkCarbonMat);
    hTail.position.set(-1.38, 0.03, 0);
    this.visualGroup.add(hTail);

    // 6. Dual Afterburner Shock-Cone Exhaust + Wingtip Air-Slipstream Ribbons
    this.flameGroup = new THREE.Group();
    this.flameGroup.position.set(-1.72, 0.01, 0);

    const outerFlameGeo = new THREE.ConeGeometry(0.14, 0.95, 20);
    outerFlameGeo.rotateZ(Math.PI / 2);
    const outerFlameMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const innerFlameGeo = new THREE.ConeGeometry(0.08, 0.58, 16);
    innerFlameGeo.rotateZ(Math.PI / 2);
    const innerFlameMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.96,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.flameGroup.add(new THREE.Mesh(outerFlameGeo, outerFlameMat), new THREE.Mesh(innerFlameGeo, innerFlameMat));

    // Wingtip Air-Vortex Condensation Streamers (visible during flight & wind!)
    this.airStreaks = [];
    const streakGeo = new THREE.CylinderGeometry(0.008, 0.024, 1.35, 8);
    streakGeo.rotateZ(Math.PI / 2);
    this.streakMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    [-1.76, 1.76].forEach((zTip) => {
      const st = new THREE.Mesh(streakGeo, this.streakMat);
      st.position.set(-1.25, 0.04, zTip);
      this.visualGroup.add(st);
      this.airStreaks.push(st);
    });

    this.flameLight = new THREE.PointLight(0x38bdf8, 1.6, 7);
    this.flameGroup.add(this.flameLight);
    this.flameGroup.visible = false;
    this.visualGroup.add(this.flameGroup);
  }

  setPosition(v) {
    this.group.position.set(
      v.x * WORLD_SCALE,
      v.y * WORLD_SCALE,
      v.z * WORLD_SCALE
    );
  }

  updateVisuals(time, velocity, isRunning, aimVector = null) {
    this.fans.forEach((f) => {
      f.rotation.x += isRunning ? 0.65 : 0.14;
    });
    this.flameGroup.visible = isRunning;

    // Animate wingtip air-vortex ribbons
    this.airStreaks.forEach((st, idx) => {
      st.visible = true;
      const scaleLen = isRunning ? 1.35 + 0.25 * Math.sin(time * 28 + idx) : 0.55 + 0.15 * Math.sin(time * 8 + idx);
      st.scale.set(scaleLen, 1, 1);
    });

    if (isRunning) {
      const pulse = 0.9 + 0.35 * Math.sin(time * 50);
      this.flameGroup.scale.set(pulse, 1, 1);
      this.visualGroup.position.y = 0;

      const speedSq = velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z;
      if (speedSq > 0.01) {
        const targetYaw = Math.atan2(-velocity.z, velocity.x);
        const horiz = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        const targetPitch = Math.max(-0.6, Math.min(0.6, Math.atan2(velocity.y, Math.max(0.1, horiz))));
        this.visualGroup.rotation.y = targetYaw;
        this.visualGroup.rotation.z = targetPitch * 0.72;
      }
    } else {
      this.visualGroup.position.y = Math.sin(time * 2.5) * 0.06;
      if (aimVector && (Math.abs(aimVector.x) > 0.05 || Math.abs(aimVector.z) > 0.05)) {
        const targetYaw = Math.atan2(-aimVector.z, aimVector.x);
        this.visualGroup.rotation.y = targetYaw;
        this.visualGroup.rotation.z = 0;
      }
    }
  }
}
