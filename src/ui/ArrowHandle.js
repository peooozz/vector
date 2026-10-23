/**
 * ArrowHandle.js
 * Interactive 3D draggable handle attached to the tip of the player's Thrust vector.
 * Supports desktop mouse and mobile touch dragging in 3D space:
 * - Default drag moves in the horizontal (X-Z) plane or camera-facing plane depending on drag mode
 * - Holding Shift or toggling the Y-Axis Drag mode on mobile adjusts vertical Y component
 * Keeps 3D arrow and HTML sliders/numeric inputs 100% synchronized.
 */

import * as THREE from 'three';
import { magnitude, scale, WORLD_SCALE } from '../core/Vec3Utils.js';

export class ArrowHandle {
  constructor(scene, camera, domElement, onThrustChange) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.onThrustChange = onThrustChange;

    this.enabled = true;
    this.isDragging = false;
    this.dragAxisMode = 'xz'; // 'xz' | 'y' | 'free'
    this.maxMagnitude = 10;
    this.origin = new THREE.Vector3(0, 0, 0);
    this.currentThrust = { x: 4, y: 0, z: 0 };

    // 3D Handle Mesh at tip of Thrust arrow (touch-friendly hit target + visual gizmo)
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Core glowing orb
    const coreGeo = new THREE.SphereGeometry(0.32, 16, 16);
    this.coreMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.92
    });
    this.coreMesh = new THREE.Mesh(coreGeo, this.coreMat);
    this.group.add(this.coreMesh);

    // Outer gimbal rings (X red, Y green, Z blue) to signify 3D draggable handle
    const ringGeo = new THREE.TorusGeometry(0.46, 0.035, 8, 24);
    const ringX = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xf87171, transparent: true, opacity: 0.75 }));
    ringX.rotation.y = Math.PI / 2;
    const ringY = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.75 }));
    ringY.rotation.x = Math.PI / 2;
    const ringZ = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.75 }));
    this.group.add(ringX, ringY, ringZ);

    // Invisible larger sphere for comfortable mobile touch hit-testing
    const hitGeo = new THREE.SphereGeometry(0.95, 12, 12);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    this.hitMesh = new THREE.Mesh(hitGeo, hitMat);
    this.group.add(this.hitMesh);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.dragPlane = new THREE.Plane();
    this.intersectPoint = new THREE.Vector3();
    this.dragStartPoint = new THREE.Vector3();
    this.dragStartThrust = { x: 0, y: 0, z: 0 };

    this._bindEvents();
  }

  setDragAxisMode(mode) {
    this.dragAxisMode = mode;
  }

  setOriginAndThrust(origin, thrust, maxFuel = 10) {
    this.origin.set(origin.x * WORLD_SCALE, origin.y * WORLD_SCALE, origin.z * WORLD_SCALE);
    this.currentThrust = { ...thrust };
    this.maxMagnitude = maxFuel;
    this.group.position.set(
      (origin.x + thrust.x) * WORLD_SCALE,
      (origin.y + thrust.y) * WORLD_SCALE,
      (origin.z + thrust.z) * WORLD_SCALE
    );
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.group.visible = enabled;
    if (!enabled) this.isDragging = false;
  }

  update(time) {
    if (!this.enabled) return;
    const pulse = this.isDragging ? 1.28 : 1.0 + 0.08 * Math.sin(time * 4.5);
    this.coreMesh.scale.setScalar(pulse);
    this.coreMat.color.setHex(this.isDragging ? 0xfacc15 : 0x22d3ee);
  }

  _updatePointer(e) {
    const rect = this.domElement.getBoundingClientRect();
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  _bindEvents() {
    const onPointerDown = (e) => {
      if (!this.enabled) return;
      this._updatePointer(e);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObject(this.hitMesh, false);
      if (hits.length > 0) {
        this.isDragging = true;
        this.dragStartThrust = { ...this.currentThrust };

        const wantVertical = e.shiftKey || this.dragAxisMode === 'y';
        if (wantVertical) {
          // Vertical plane facing camera horizontally
          const camDir = new THREE.Vector3();
          this.camera.getWorldDirection(camDir);
          camDir.y = 0;
          if (camDir.lengthSq() < 0.001) camDir.set(0, 0, 1);
          camDir.normalize();
          this.dragPlane.setFromNormalAndCoplanarPoint(camDir, this.group.position);
        } else if (this.dragAxisMode === 'xz') {
          // Horizontal plane through current handle Y
          this.dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), this.group.position);
        } else {
          // Camera-facing plane
          const camDir = new THREE.Vector3();
          this.camera.getWorldDirection(camDir);
          this.dragPlane.setFromNormalAndCoplanarPoint(camDir, this.group.position);
        }

        this.raycaster.ray.intersectPlane(this.dragPlane, this.dragStartPoint);
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
      }
    };

    const onPointerMove = (e) => {
      if (!this.enabled || !this.isDragging) return;
      this._updatePointer(e);
      this.raycaster.setFromCamera(this.pointer, this.camera);

      if (this.raycaster.ray.intersectPlane(this.dragPlane, this.intersectPoint)) {
        const delta = new THREE.Vector3().subVectors(this.intersectPoint, this.dragStartPoint).divideScalar(WORLD_SCALE);
        const wantVertical = e.shiftKey || this.dragAxisMode === 'y';

        let nx = this.dragStartThrust.x;
        let ny = this.dragStartThrust.y;
        let nz = this.dragStartThrust.z;

        if (wantVertical) {
          ny = Math.round((this.dragStartThrust.y + delta.y) * 2) / 2;
        } else if (this.dragAxisMode === 'xz') {
          nx = Math.round((this.dragStartThrust.x + delta.x) * 2) / 2;
          nz = Math.round((this.dragStartThrust.z + delta.z) * 2) / 2;
        } else {
          nx = Math.round((this.dragStartThrust.x + delta.x) * 2) / 2;
          ny = Math.round((this.dragStartThrust.y + delta.y) * 2) / 2;
          nz = Math.round((this.dragStartThrust.z + delta.z) * 2) / 2;
        }

        nx = Math.max(-10, Math.min(10, nx));
        ny = Math.max(-10, Math.min(10, ny));
        nz = Math.max(-10, Math.min(10, nz));

        let candidate = { x: nx, y: ny, z: nz };
        const mag = magnitude(candidate);
        if (mag > this.maxMagnitude && mag > 1e-5) {
          candidate = scale(candidate, this.maxMagnitude / mag);
          candidate.x = Math.round(candidate.x * 10) / 10;
          candidate.y = Math.round(candidate.y * 10) / 10;
          candidate.z = Math.round(candidate.z * 10) / 10;
        }

        this.currentThrust = candidate;
        this.group.position.set(
          this.origin.x + candidate.x * WORLD_SCALE,
          this.origin.y + candidate.y * WORLD_SCALE,
          this.origin.z + candidate.z * WORLD_SCALE
        );

        if (this.onThrustChange) {
          this.onThrustChange(candidate);
        }
      }
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    this.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }
}
