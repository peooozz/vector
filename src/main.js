/**
 * main.js
 * Bootstrap & Game State Machine (MENU, PLAN, RUN, RESULT) for "Vector Skies".
 * Wires together Three.js 3D scene, custom deterministic Physics,
 * Head-to-Tail ghost vector visualization, TrajectoryPreview, Trail,
 * ArrowHandle 3D interaction, Orbit Camera Controller, and HTML/CSS HUD.
 */

import * as THREE from 'three';
import {
  FIXED_DT,
  createSimState,
  stepPhysics,
  getResultantAt,
  calculateStars
} from './core/Physics.js';
import { add, magnitude, formatVec, WORLD_SCALE } from './core/Vec3Utils.js';
import { getLevelById, createDefaultSandboxLevel } from './levels/index.js';
import { VectorArrow, ARROW_COLORS } from './entities/VectorArrow.js';
import { Airship } from './entities/Airship.js';
import { Island, createObstacleSpire } from './entities/Island.js';
import { WindZone } from './entities/WindZone.js';
import { Gate } from './entities/Gate.js';
import { Turbine } from './entities/Turbine.js';
import { TrajectoryPreview } from './systems/TrajectoryPreview.js';
import { Trail } from './systems/Trail.js';
import { AudioSystem } from './systems/Audio.js';
import { ArrowHandle } from './ui/ArrowHandle.js';
import { LevelSelect } from './ui/LevelSelect.js';
import { Hud } from './ui/Hud.js';

/**
 * Built-in Spherical Orbit + Smooth Follow Camera Controller.
 * Works identically across desktop mouse and mobile touch without external addon imports,
 * and yields priority cleanly when the player drags the 3D ArrowHandle.
 */
class OrbitFollowCamera {
  constructor(camera, domElement, shouldBlockOrbit) {
    this.camera = camera;
    this.domElement = domElement;
    this.shouldBlockOrbit = shouldBlockOrbit;

    this.target = new THREE.Vector3(2.5, 0.5, -1);
    this.desiredTarget = new THREE.Vector3(2.5, 0.5, -1);
    this.radius = 16.5;
    this.theta = 0.62; // horizontal angle
    this.phi = 1.08;   // vertical polar angle

    this.isOrbiting = false;
    this.isPanning = false;
    this.lastX = 0;
    this.lastY = 0;
    this.pinchDist = 0;

    this._bindEvents();
    this.updateCameraTransform();
  }

  focusOnLevel(level) {
    const g = level.goal.position;
    this.desiredTarget.set(g.x * WORLD_SCALE * 0.5, g.y * WORLD_SCALE * 0.45, g.z * WORLD_SCALE * 0.5);
    this.target.copy(this.desiredTarget);

    const pathAngle = Math.atan2(g.z, g.x);
    this.theta = -pathAngle + 0.14;
    this.phi = 1.14;
    this.radius = Math.max(18.5, Math.min(29.0, magnitude(g) * WORLD_SCALE * 1.18 + 6.5));
    this.updateCameraTransform();
  }

  followPosition(pos, dt) {
    this.desiredTarget.set(pos.x * WORLD_SCALE, pos.y * WORLD_SCALE, pos.z * WORLD_SCALE);
    this.target.lerp(this.desiredTarget, Math.min(1, dt * 6));
    this.updateCameraTransform();
  }

  updatePlanCamera(dt) {
    this.target.lerp(this.desiredTarget, Math.min(1, dt * 8));
    this.updateCameraTransform();
  }

  updateCameraTransform() {
    this.phi = Math.max(0.2, Math.min(Math.PI * 0.47, this.phi));
    this.radius = Math.max(8, Math.min(48, this.radius));

    const sinPhi = Math.sin(this.phi);
    const x = this.target.x + this.radius * sinPhi * Math.sin(this.theta);
    const y = this.target.y + this.radius * Math.cos(this.phi);
    const z = this.target.z + this.radius * sinPhi * Math.cos(this.theta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.target);
  }

  _bindEvents() {
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    this.domElement.addEventListener('pointerdown', (e) => {
      if (this.shouldBlockOrbit && this.shouldBlockOrbit()) return;
      if (e.button === 2 || e.shiftKey) {
        this.isPanning = true;
      } else {
        this.isOrbiting = true;
      }
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    });

    window.addEventListener('pointermove', (e) => {
      if (this.shouldBlockOrbit && this.shouldBlockOrbit()) {
        this.isOrbiting = false;
        this.isPanning = false;
        return;
      }
      if (!this.isOrbiting && !this.isPanning) return;

      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;

      if (this.isOrbiting) {
        this.theta -= dx * 0.0075;
        this.phi -= dy * 0.0065;
        this.updateCameraTransform();
      } else if (this.isPanning) {
        const panScale = this.radius * 0.0015;
        const right = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);
        this.camera.getWorldDirection(right);
        right.cross(up).normalize();
        this.desiredTarget.addScaledVector(right, -dx * panScale);
        this.desiredTarget.y += dy * panScale;
      }
    });

    window.addEventListener('pointerup', () => {
      this.isOrbiting = false;
      this.isPanning = false;
    });

    this.domElement.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.radius += e.deltaY * 0.012;
        this.updateCameraTransform();
      },
      { passive: false }
    );
  }
}

/**
 * Helper to create a crisp 3D text billboard sprite for coordinate & vector labels.
 */
function createTextSprite(text, bgColor = 'rgba(15, 23, 42, 0.82)', textColor = '#f8fafc', borderColor = '#38bdf8') {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 4;
  const r = 16;
  ctx.beginPath();
  ctx.moveTo(r, 6);
  ctx.lineTo(314 - r, 6);
  ctx.quadraticCurveTo(314, 6, 314, 6 + r);
  ctx.lineTo(314, 74 - r);
  ctx.quadraticCurveTo(314, 74, 314 - r, 74);
  ctx.lineTo(r, 74);
  ctx.quadraticCurveTo(6, 74, 6, 74 - r);
  ctx.lineTo(6, 6 + r);
  ctx.quadraticCurveTo(6, 6, r, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 26px Inter, system-ui, sans-serif';
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 160, 41);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.65, 0.42, 1);
  return sprite;
}

export class VectorSkiesGame {
  constructor() {
    this.state = 'PLAN'; // 'MENU' | 'PLAN' | 'RUN' | 'RESULT'
    this.audio = new AudioSystem();

    // 1. Initialize Three.js Renderer, Scene & Camera
    this.container = document.getElementById('canvas-container');
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    if ('outputColorSpace' in this.renderer) {
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);

    this._setupLightsAndSky();
    this._setupGridAndAxes();

    // 2. Core Entities & Visual Arrows
    this.levelGroup = new THREE.Group();
    this.scene.add(this.levelGroup);

    this.airship = new Airship();
    this.scene.add(this.airship.group);

    this.trajectoryPreview = new TrajectoryPreview(this.scene);
    this.trail = new Trail(this.scene);

    // Primary Arrows from Ship: Thrust (Cyan), Resultant (Gold/White)
    this.thrustArrow = new VectorArrow({ color: ARROW_COLORS.thrust, ghost: false });
    this.resultantArrow = new VectorArrow({
      color: ARROW_COLORS.resultant,
      ghost: false,
      shaftRadius: 0.065,
      headRadius: 0.2,
      headLength: 0.48
    });
    this.scene.add(this.thrustArrow.group, this.resultantArrow.group);

    // Head-to-Tail Ghost Construction Arrows (Wind starting at tip of Thrust, Gravity at tip of Wind)
    this.headToTailGroup = new THREE.Group();
    this.ghostWindArrow = new VectorArrow({ color: ARROW_COLORS.wind, ghost: true });
    this.ghostGravityArrow = new VectorArrow({ color: ARROW_COLORS.gravity, ghost: true });
    this.headToTailGroup.add(this.ghostWindArrow.group, this.ghostGravityArrow.group);
    this.scene.add(this.headToTailGroup);

    // "Show Me Why" Component Projection Box Lines (X red, Y green, Z blue dashed legs)
    this.componentVizGroup = new THREE.Group();
    this.scene.add(this.componentVizGroup);

    // 3. Interactive 3D Arrow Handle & Camera Controller
    this.arrowHandle = new ArrowHandle(
      this.scene,
      this.camera,
      this.renderer.domElement,
      (newThrust) => {
        this.thrust = newThrust;
        this.hud.setThrust(newThrust, false);
        this.updateVectorsAndPreview();
      }
    );

    this.cameraCtrl = new OrbitFollowCamera(
      this.camera,
      this.renderer.domElement,
      () => this.arrowHandle.isDragging
    );

    // 4. UI Managers (LevelSelect + HUD)
    this.levelSelect = new LevelSelect(
      (levelId) => this.loadLevel(getLevelById(levelId)),
      () => this.loadLevel(createDefaultSandboxLevel()),
      this.audio
    );

    this.hud = new Hud({
      onThrustInput: (newThrust) => {
        this.thrust = newThrust;
        this.updateVectorsAndPreview();
      },
      onLaunch: () => this.startLaunch(),
      onReset: () => this.resetToPlan(),
      onTogglePreview: (enabled) => {
        this.trajectoryPreview.setEnabled(enabled);
        this.updateVectorsAndPreview();
      },
      onToggleGrid: (enabled) => {
        this.gridGroup.visible = enabled;
      },
      onToggleHeadToTail: (enabled) => {
        this.showHeadToTail = enabled;
        this.updateVectorsAndPreview();
      },
      onToggleBloom: (enabled) => {
        this.bloomEnabled = enabled;
        this.thrustArrow.setBloom(enabled);
        this.resultantArrow.setBloom(enabled);
        this.ghostWindArrow.setBloom(enabled);
        this.ghostGravityArrow.setBloom(enabled);
        this.gates.forEach((g) => g.setBloom(enabled));
        this.turbines.forEach((t) => t.setBloom(enabled));
      },
      onToggleMute: () => this.audio.toggleMute(),
      onChangeDragAxis: (mode) => this.arrowHandle.setDragAxisMode(mode),
      onOpenLevelSelect: () => {
        this.state = 'MENU';
        this.levelSelect.renderModal(
          document.getElementById('modal-root'),
          this.currentLevel?.id,
          () => {
            this.state = 'PLAN';
          }
        );
      },
      onShowMathVisualizer: () => {
        this.showHeadToTail = true;
        this.hud.headToTailEnabled = true;
        this.hud.updateToggleButtons();
        this.updateVectorsAndPreview();
      },
      onSelectNextLevel: (nextId) => this.loadLevel(getLevelById(nextId)),
      onSandboxUpdate: (cfg) => this.applySandboxConfig(cfg),
      audio: this.audio
    });

    this.islands = [];
    this.windZones = [];
    this.gates = [];
    this.turbines = [];
    this.thrust = { x: 4, y: 0, z: 0 };
    this.attempts = 0;
    this.simState = null;
    this.accumulator = 0;
    this.clock = new THREE.Clock();

    window.addEventListener('resize', () => this._onResize());

    // Start in World 1, Level 1
    this.loadLevel(getLevelById('w1-l1'));
    this._animate();
  }

  _setupLightsAndSky() {
    this.scene.background = new THREE.Color(0x0b1d3a);
    this.scene.fog = new THREE.FogExp2(0x163860, 0.0085);

    // 1. True 3D Atmospheric Sky Sphere Dome (GLSL Shader - never washes out in Three.js r128!)
    const skyGeo = new THREE.SphereGeometry(150, 48, 32);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x071329) },
        midColor: { value: new THREE.Color(0x1b4f8c) },
        horizonColor: { value: new THREE.Color(0x60a5fa) },
        sunGlowColor: { value: new THREE.Color(0xfde047) },
        bottomColor: { value: new THREE.Color(0x0a2240) },
        sunDir: { value: new THREE.Vector3(0.45, 0.32, -0.82).normalize() }
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 horizonColor;
        uniform vec3 sunGlowColor;
        uniform vec3 bottomColor;
        uniform vec3 sunDir;
        varying vec3 vWorldPos;
        void main() {
          vec3 dir = normalize(vWorldPos);
          float h = dir.y;
          vec3 col = mix(horizonColor, midColor, smoothstep(0.0, 0.38, max(h, 0.0)));
          col = mix(col, topColor, smoothstep(0.38, 0.9, max(h, 0.0)));
          if (h < 0.0) {
            col = mix(horizonColor, bottomColor, smoothstep(0.0, -0.35, h));
          }
          float sunAmt = max(dot(dir, sunDir), 0.0);
          col += sunGlowColor * pow(sunAmt, 18.0) * 0.48;
          col += vec3(1.0, 0.98, 0.9) * smoothstep(0.996, 0.9992, sunAmt);
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
    this.scene.add(new THREE.Mesh(skyGeo, skyMat));

    // 2. Animated Shimmering Ocean / Cloud Sea Below the Floating Islands
    const seaGeo = new THREE.PlaneGeometry(260, 260, 56, 56);
    seaGeo.rotateX(-Math.PI / 2);
    const seaMat = new THREE.MeshStandardMaterial({
      color: 0x0c4a6e,
      emissive: 0x082f49,
      emissiveIntensity: 0.35,
      roughness: 0.22,
      metalness: 0.65,
      transparent: true,
      opacity: 0.92
    });
    this.seaMesh = new THREE.Mesh(seaGeo, seaMat);
    this.seaMesh.position.y = -11.5;
    this.seaMesh.receiveShadow = true;
    this.scene.add(this.seaMesh);

    // 3. Key Sunlight with Soft Shadows + Warm Rim & Sky Hemisphere Light
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e3a5f, 1.05);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.55);
    dirLight.position.set(18, 28, 16);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 2;
    dirLight.shadow.camera.far = 70;
    const d = 16;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.65);
    rimLight.position.set(-16, -8, -14);
    this.scene.add(rimLight);

    // 4. Soft Volumetric-Style Cumulus Clouds
    this.cloudsGroup = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xbae6fd,
      emissiveIntensity: 0.12,
      roughness: 0.7,
      metalness: 0.02,
      transparent: true,
      opacity: 0.86
    });
    const cloudCoords = [
      [-14, 5.5, -16, 1.8],
      [16, 7.5, -18, 2.2],
      [-17, -4.5, 9, 1.6],
      [18, -3.5, 11, 1.7],
      [0, 9.5, -24, 2.5],
      [-8, -6.5, -14, 1.9]
    ];
    cloudCoords.forEach(([cx, cy, cz, sc]) => {
      const cGroup = new THREE.Group();
      const puffs = [
        [0, 0, 0, 0.95],
        [0.85, -0.12, 0.2, 0.72],
        [-0.8, -0.15, -0.12, 0.68],
        [0.35, 0.36, -0.22, 0.64],
        [-0.3, 0.28, 0.28, 0.58]
      ];
      puffs.forEach(([px, py, pz, pr]) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(pr * sc, 24, 24), cloudMat);
        m.position.set(px * sc, py * sc, pz * sc);
        cGroup.add(m);
      });
      cGroup.position.set(cx, cy, cz);
      this.cloudsGroup.add(cGroup);
    });
    this.scene.add(this.cloudsGroup);

    // 5. Ambient Sky Air-Current Ribbons (subtle, realistic flowing air streaks across the sky)
    this.ambientAirGroup = new THREE.Group();
    this.ambientAirStreaks = [];
    for (let i = 0; i < 24; i++) {
      const pts = [];
      for (let s = 0; s < 10; s++) {
        pts.push(new THREE.Vector3(-s * 0.45, 0, 0));
      }
      const lGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lMat = new THREE.LineBasicMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending
      });
      const line = new THREE.Line(lGeo, lMat);
      line.position.set(
        (((i * 67) % 100) / 100 - 0.5) * 38,
        (((i * 31 + 11) % 100) / 100 - 0.35) * 14,
        (((i * 53 + 23) % 100) / 100 - 0.5) * 32
      );
      this.ambientAirGroup.add(line);
      this.ambientAirStreaks.push({ line, lGeo, phase: i * 0.9, speed: 2.8 + (i % 4) * 0.7 });
    }
    this.scene.add(this.ambientAirGroup);
  }

  _setupGridAndAxes() {
    this.gridGroup = new THREE.Group();
    const gridHelper = new THREE.GridHelper(24, 24, 0x38bdf8, 0x1e3a5f);
    gridHelper.position.y = -2.6;
    if (gridHelper.material) {
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.28;
    }
    this.gridGroup.add(gridHelper);

    // Clean compass axis lines on the reference plane y = -2.58 (never skewering the airship at y=0!)
    const makeAxisLine = (from, to, colorHex, labelText, labelPos) => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...from),
        new THREE.Vector3(...to)
      ]);
      const mat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.65 });
      this.gridGroup.add(new THREE.Line(geo, mat));
      const lbl = createTextSprite(labelText, 'rgba(15,23,42,0.88)', '#ffffff', `#${colorHex.toString(16).padStart(6, '0')}`);
      lbl.scale.set(1.45, 0.36, 1);
      lbl.position.set(...labelPos);
      this.gridGroup.add(lbl);
    };

    makeAxisLine([-10, -2.58, 0], [10, -2.58, 0], 0xf87171, '+X (East)', [10.8, -2.2, 0]);
    makeAxisLine([-10, -2.58, -10], [-10, 6, -10], 0x4ade80, '+Y (Up)', [-10, 6.6, -10]);
    makeAxisLine([0, -2.58, -10], [0, -2.58, 10], 0x60a5fa, '+Z (South)', [0, -2.2, 10.8]);

    this.scene.add(this.gridGroup);
  }

  loadLevel(levelData) {
    this.currentLevel = JSON.parse(JSON.stringify(levelData));
    this.attempts = 0;
    this.state = 'PLAN';
    this.showHeadToTail = Boolean(this.currentLevel.showHeadToTail || this.currentLevel.world === 1);

    // Default initial thrust (non-zero but distinct from the exact answer so player interacts)
    this.thrust = { x: 2, y: 0, z: 0 };

    this._rebuildSceneEntities();
    this.cameraCtrl.focusOnLevel(this.currentLevel);

    const starsEarned = this.levelSelect.getStars(this.currentLevel.id);
    this.hud.loadLevel(this.currentLevel, starsEarned, this.attempts);
    this.hud.setThrust(this.thrust, false);
    this.resetToPlan();
  }

  _rebuildSceneEntities() {
    while (this.levelGroup.children.length > 0) {
      this.levelGroup.remove(this.levelGroup.children[0]);
    }
    this.islands = [];
    this.windZones = [];
    this.gates = [];
    this.turbines = [];

    const lvl = this.currentLevel;

    // 1. Islands + Coordinate Badges
    (lvl.islands || []).forEach((islData) => {
      const isl = new Island(islData);
      this.levelGroup.add(isl.group);
      this.islands.push(isl);

      if (islData.label) {
        const badge = createTextSprite(
          islData.label,
          islData.type === 'goal' ? 'rgba(6, 78, 59, 0.9)' : 'rgba(15, 23, 42, 0.82)',
          '#f8fafc',
          islData.type === 'goal' ? '#34d399' : '#38bdf8'
        );
        badge.position.set(islData.position.x * WORLD_SCALE, islData.position.y * WORLD_SCALE + (islData.type === 'goal' ? 2.45 : 2.05), islData.position.z * WORLD_SCALE);
        this.levelGroup.add(badge);
      }
    });

    // 2. Wind Zones + Wind Vector Badges
    (lvl.windZones || []).forEach((wzData) => {
      const wz = new WindZone(wzData);
      this.levelGroup.add(wz.group);
      this.windZones.push(wz);

      if (wzData.label) {
        const badge = createTextSprite(wzData.label, 'rgba(124, 45, 18, 0.85)', '#ffedd5', '#fb923c');
        badge.position.set(wzData.position.x * WORLD_SCALE, wzData.position.y * WORLD_SCALE + wzData.size.y * 0.6 + 1.2, wzData.position.z * WORLD_SCALE);
        this.levelGroup.add(badge);
      }
    });

    // 3. Solar Sail Gates (World 4)
    (lvl.gates || []).forEach((gData) => {
      const gate = new Gate(gData, this.hud?.bloomEnabled ?? true);
      this.levelGroup.add(gate.group);
      this.gates.push(gate);

      if (gData.label) {
        const badge = createTextSprite(gData.label, 'rgba(46, 16, 101, 0.88)', '#ede9fe', '#a78bfa');
        badge.position.set(gData.position.x * WORLD_SCALE, gData.position.y * WORLD_SCALE + (gData.radius || 1.9) + 0.85, gData.position.z * WORLD_SCALE);
        this.levelGroup.add(badge);
      }
    });

    // 4. Cross-Product Turbines (World 5)
    (lvl.turbines || []).forEach((tData) => {
      const turb = new Turbine(tData, this.hud?.bloomEnabled ?? true);
      this.levelGroup.add(turb.group);
      this.turbines.push(turb);

      if (tData.label) {
        const badge = createTextSprite(tData.label, 'rgba(136, 19, 55, 0.88)', '#ffe4e6', '#f43f5e');
        badge.position.set(tData.position.x * WORLD_SCALE, tData.position.y * WORLD_SCALE + (tData.radius || 1.9) + 0.85, tData.position.z * WORLD_SCALE);
        this.levelGroup.add(badge);
      }
    });

    // 5. Obstacle Rock Spires
    (lvl.obstacles || []).forEach((obs) => {
      const spire = createObstacleSpire(obs);
      this.levelGroup.add(spire);
      if (obs.label) {
        const badge = createTextSprite(obs.label, 'rgba(127, 29, 29, 0.88)', '#fecaca', '#ef4444');
        badge.position.set(obs.position.x * WORLD_SCALE, obs.position.y * WORLD_SCALE + (obs.radius || 0.9) + 0.85, obs.position.z * WORLD_SCALE);
        this.levelGroup.add(badge);
      }
    });
  }

  applySandboxConfig({ goalPos, windVec, gravity }) {
    if (!this.currentLevel || !this.currentLevel.isSandbox) return;
    this.currentLevel.goal.position = { ...goalPos };
    this.currentLevel.goal.label = `Custom Goal ${formatVec(goalPos)}`;
    this.currentLevel.islands[1].position = { ...goalPos };
    this.currentLevel.islands[1].label = `Custom Goal ${formatVec(goalPos)}`;
    this.currentLevel.gravity = gravity;

    if (magnitude(windVec) > 0.05) {
      this.currentLevel.windZones = [
        {
          position: { x: goalPos.x * 0.5, y: goalPos.y * 0.5, z: goalPos.z * 0.5 },
          size: { x: 16, y: 12, z: 16 },
          vector: { ...windVec },
          label: `Wind ${formatVec(windVec)}`
        }
      ];
    } else {
      this.currentLevel.windZones = [];
    }
    this.currentLevel.recommendedThrust = {
      x: goalPos.x - windVec.x,
      y: goalPos.y - windVec.y + gravity,
      z: goalPos.z - windVec.z
    };

    this._rebuildSceneEntities();
    this.resetToPlan();
  }

  updateVectorsAndPreview() {
    if (!this.currentLevel) return;
    const startPos = this.currentLevel.start || { x: 0, y: 0, z: 0 };
    const { wind, gravity, resultant } = getResultantAt(this.thrust, startPos, this.currentLevel);

    // 1. Primary Thrust Arrow & 3D Handle
    this.thrustArrow.setFromOriginAndVector(startPos, this.thrust);
    this.arrowHandle.setOriginAndThrust(startPos, this.thrust, this.currentLevel.fuel);

    // 2. Resultant Vector Arrow (Thrust + Wind + Gravity)
    this.resultantArrow.setFromOriginAndVector(startPos, resultant);

    // 3. Head-to-Tail Ghost Arrows:
    //    Wind starts at tip of Thrust (start + Thrust)
    //    Gravity starts at tip of Wind (start + Thrust + Wind)
    this.headToTailGroup.visible = this.showHeadToTail && this.state === 'PLAN';
    if (this.showHeadToTail) {
      const tipThrust = add(startPos, this.thrust);
      this.ghostWindArrow.setFromOriginAndVector(tipThrust, wind);
      const tipWind = add(tipThrust, wind);
      this.ghostGravityArrow.setFromOriginAndVector(tipWind, gravity);
    }

    // 4. Component Box Projection Lines (X, Y, Z legs of Thrust)
    this._updateComponentProjectionLines(startPos, this.thrust);

    // 5. Dotted Trajectory Preview using exact same Physics.js
    if (this.state === 'PLAN') {
      this.trajectoryPreview.update(this.currentLevel, this.thrust);
    }

    this.hud.refreshReadouts();
  }

  _updateComponentProjectionLines(origin, vec) {
    while (this.componentVizGroup.children.length > 0) {
      this.componentVizGroup.remove(this.componentVizGroup.children[0]);
    }
    if (this.state !== 'PLAN') return;

    const p0 = new THREE.Vector3(origin.x * WORLD_SCALE, origin.y * WORLD_SCALE, origin.z * WORLD_SCALE);
    const px = new THREE.Vector3((origin.x + vec.x) * WORLD_SCALE, origin.y * WORLD_SCALE, origin.z * WORLD_SCALE);
    const pxz = new THREE.Vector3((origin.x + vec.x) * WORLD_SCALE, origin.y * WORLD_SCALE, (origin.z + vec.z) * WORLD_SCALE);
    const pxyz = new THREE.Vector3((origin.x + vec.x) * WORLD_SCALE, (origin.y + vec.y) * WORLD_SCALE, (origin.z + vec.z) * WORLD_SCALE);

    const addSeg = (a, b, color) => {
      if (a.distanceTo(b) < 0.05) return;
      const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.68 });
      this.componentVizGroup.add(new THREE.Line(geo, mat));
    };

    addSeg(p0, px, 0xf87171);   // X leg (Red)
    addSeg(px, pxz, 0x60a5fa);  // Z leg (Blue)
    addSeg(pxz, pxyz, 0x4ade80); // Y leg (Green)
  }

  resetToPlan() {
    this.state = 'PLAN';
    this.hud.setPhase('PLAN');
    this.hud.closeModals();

    const startPos = this.currentLevel.start || { x: 0, y: 0, z: 0 };
    this.airship.setPosition(startPos);
    this.trail.reset();

    this.thrustArrow.group.visible = true;
    this.resultantArrow.group.visible = true;
    this.componentVizGroup.visible = true;
    this.arrowHandle.setEnabled(true);
    this.trajectoryPreview.setEnabled(this.hud.previewEnabled);

    this.cameraCtrl.focusOnLevel(this.currentLevel);
    this.updateVectorsAndPreview();
  }

  startLaunch() {
    if (this.state === 'RUN') return;
    this.state = 'RUN';
    this.attempts += 1;
    this.hud.setPhase('RUN');
    this.hud.updateAttemptsAndStars(
      this.attempts,
      this.levelSelect.getStars(this.currentLevel.id)
    );

    this.simState = createSimState(this.currentLevel, this.thrust);
    this.accumulator = 0;
    this.trail.reset();
    this.trail.addPoint(this.simState.position);

    // Hide planning gizmos during active flight for clean cinematic launch
    this.arrowHandle.setEnabled(false);
    this.componentVizGroup.visible = false;
  }

  _finishLaunch() {
    this.state = 'RESULT';
    this.hud.setPhase('RESULT');

    const fuelUsed = magnitude(this.thrust);
    let stars = 0;
    if (this.simState.outcome === 'win') {
      this.audio.playWin();
      stars = calculateStars(this.currentLevel, fuelUsed, this.attempts);
      this.levelSelect.recordWin(this.currentLevel.id, stars);
      this.hud.updateAttemptsAndStars(
        this.attempts,
        this.levelSelect.getStars(this.currentLevel.id)
      );
    } else {
      this.audio.playFail();
    }

    this.hud.showResultModal({
      outcome: this.simState.outcome,
      stars,
      reasonTitle: this.simState.reasonTitle,
      reasonMath: this.simState.reasonMath,
      fuelUsed,
      attempts: this.attempts
    });
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  _animate() {
    requestAnimationFrame(() => this._animate());

    const dt = Math.min(0.05, this.clock.getDelta());
    const elapsed = this.clock.getElapsedTime();

    // Update ambient animations (islands, wind particles, gates, turbines, handle)
    this.islands.forEach((isl) => isl.update(elapsed));
    if (this.cloudsGroup) this.cloudsGroup.rotation.y = elapsed * 0.015;
    if (this.seaMesh && this.seaMesh.geometry) {
      const pos = this.seaMesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vz = pos.getZ(i);
        pos.setY(i, Math.sin(vx * 0.18 + elapsed * 1.4) * 0.35 + Math.cos(vz * 0.18 + elapsed * 1.1) * 0.35);
      }
      pos.needsUpdate = true;
    }
    this.windZones.forEach((wz) => wz.update(dt));
    if (this.ambientAirStreaks) {
      for (let i = 0; i < this.ambientAirStreaks.length; i++) {
        const a = this.ambientAirStreaks[i];
        a.line.position.x += a.speed * dt;
        if (a.line.position.x > 20) a.line.position.x = -20;
        const pos = a.lGeo.attributes.position;
        for (let s = 0; s < pos.count; s++) {
          pos.setY(s, Math.sin(elapsed * 5.5 - s * 0.5 + a.phase) * 0.14);
        }
        pos.needsUpdate = true;
      }
    }

    const startPos = this.currentLevel?.start || { x: 0, y: 0, z: 0 };
    const { resultant } = getResultantAt(this.thrust, startPos, this.currentLevel || {});
    this.gates.forEach((g) => g.updateAlignment(resultant, elapsed));
    this.turbines.forEach((t) => t.update(resultant, dt));
    this.arrowHandle.update(elapsed);

    if (this.state === 'RUN' && this.simState) {
      // Fixed timestep (1/60s) semi-implicit Euler loop
      this.accumulator += dt;
      while (this.accumulator >= FIXED_DT && !this.simState.done) {
        stepPhysics(this.simState, this.currentLevel, FIXED_DT);
        this.trail.addPoint(this.simState.position);
        this.accumulator -= FIXED_DT;
      }

      this.airship.setPosition(this.simState.position);
      this.airship.updateVisuals(elapsed, this.simState.velocity, true);
      this.cameraCtrl.followPosition(this.simState.position, dt);

      if (this.simState.done) {
        this._finishLaunch();
      }
    } else {
      this.airship.updateVisuals(elapsed, { x: 0, y: 0, z: 0 }, false, resultant);
      this.cameraCtrl.updatePlanCamera(dt);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new VectorSkiesGame();
});
