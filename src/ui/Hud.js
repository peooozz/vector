/**
 * Hud.js
 * Manages all HTML/CSS UI overlays:
 * - Left panel: X, Y, Z sliders + numeric inputs, live Pythagorean magnitude |v|,
 *   fuel bar, resultant breakdown (Thrust + Wind + Gravity), World 4 Dot Product
 *   readout, World 5 Cross Product readout, and Sandbox Builder controls.
 * - Top bar: Level name, attempts, stars earned, view/audio toggles.
 * - Bottom bar: Preview toggle, Launch, Reset, Hint, and "Show Me Why" buttons.
 * - Result overlay: Win/Retry modal with friendly math feedback and "Show Me Why" visualizer.
 */

import {
  magnitude,
  dot,
  alignmentCos,
  angleDegrees,
  cross,
  formatVec
} from '../core/Vec3Utils.js';
import { getResultantAt } from '../core/Physics.js';
import { getNextLevel } from '../levels/index.js';

export class Hud {
  constructor({
    onThrustInput,
    onLaunch,
    onReset,
    onTogglePreview,
    onToggleGrid,
    onToggleHeadToTail,
    onToggleBloom,
    onToggleMute,
    onChangeDragAxis,
    onOpenLevelSelect,
    onShowMathVisualizer,
    onSelectNextLevel,
    onSandboxUpdate,
    audio
  }) {
    this.onThrustInput = onThrustInput;
    this.onLaunch = onLaunch;
    this.onReset = onReset;
    this.onTogglePreview = onTogglePreview;
    this.onToggleGrid = onToggleGrid;
    this.onToggleHeadToTail = onToggleHeadToTail;
    this.onToggleBloom = onToggleBloom;
    this.onToggleMute = onToggleMute;
    this.onChangeDragAxis = onChangeDragAxis;
    this.onOpenLevelSelect = onOpenLevelSelect;
    this.onShowMathVisualizer = onShowMathVisualizer;
    this.onSelectNextLevel = onSelectNextLevel;
    this.onSandboxUpdate = onSandboxUpdate;
    this.audio = audio;

    this.currentLevel = null;
    this.thrust = { x: 4, y: 0, z: 0 };
    this.previewEnabled = true;
    this.gridEnabled = true;
    this.headToTailEnabled = true;
    this.bloomEnabled = true;
    this.hintVisible = false;
    this.dragAxis = 'xz';

    this._bindStaticElements();
  }

  _bindStaticElements() {
    // Sliders & Number Inputs for X, Y, Z
    ['x', 'y', 'z'].forEach((axis) => {
      const slider = document.getElementById(`slider-${axis}`);
      const num = document.getElementById(`num-${axis}`);

      const handleVal = (rawVal) => {
        let val = parseFloat(rawVal);
        if (Number.isNaN(val)) val = 0;
        val = Math.max(-10, Math.min(10, val));
        const next = { ...this.thrust, [axis]: val };

        // Clamp to level fuel budget
        const maxFuel = this.currentLevel ? this.currentLevel.fuel : 12;
        const mag = magnitude(next);
        if (mag > maxFuel && mag > 1e-5) {
          const factor = maxFuel / mag;
          next.x = Math.round(next.x * factor * 10) / 10;
          next.y = Math.round(next.y * factor * 10) / 10;
          next.z = Math.round(next.z * factor * 10) / 10;
        }
        this.setThrust(next, true);
      };

      if (slider) {
        slider.addEventListener('input', (e) => handleVal(e.target.value));
      }
      if (num) {
        num.addEventListener('change', (e) => handleVal(e.target.value));
        num.addEventListener('input', (e) => handleVal(e.target.value));
      }
    });

    // Bottom Action Bar Buttons
    document.getElementById('btn-launch')?.addEventListener('click', () => {
      this.audio?.playBurn();
      this.onLaunch();
    });

    document.getElementById('btn-reset')?.addEventListener('click', () => {
      this.audio?.playClick();
      this.onReset();
    });

    document.getElementById('btn-preview')?.addEventListener('click', () => {
      this.audio?.playClick();
      this.previewEnabled = !this.previewEnabled;
      this.updateToggleButtons();
      this.onTogglePreview(this.previewEnabled);
    });

    document.getElementById('btn-hint')?.addEventListener('click', () => {
      this.audio?.playClick();
      this.hintVisible = !this.hintVisible;
      const hintBox = document.getElementById('hint-banner');
      if (hintBox) {
        hintBox.classList.toggle('hidden', !this.hintVisible);
      }
      this.updateToggleButtons();
    });

    document.getElementById('btn-show-why')?.addEventListener('click', () => {
      this.audio?.playClick();
      this.openMathModal();
      if (this.onShowMathVisualizer) this.onShowMathVisualizer(true);
    });

    // Top Bar Buttons
    document.getElementById('btn-levels')?.addEventListener('click', () => {
      this.audio?.playClick();
      this.onOpenLevelSelect();
    });

    document.getElementById('btn-grid')?.addEventListener('click', () => {
      this.audio?.playClick();
      this.gridEnabled = !this.gridEnabled;
      this.updateToggleButtons();
      this.onToggleGrid(this.gridEnabled);
    });

    document.getElementById('btn-htt')?.addEventListener('click', () => {
      this.audio?.playClick();
      this.headToTailEnabled = !this.headToTailEnabled;
      this.updateToggleButtons();
      this.onToggleHeadToTail(this.headToTailEnabled);
    });

    document.getElementById('btn-bloom')?.addEventListener('click', () => {
      this.audio?.playClick();
      this.bloomEnabled = !this.bloomEnabled;
      this.updateToggleButtons();
      this.onToggleBloom(this.bloomEnabled);
    });

    document.getElementById('btn-mute')?.addEventListener('click', () => {
      const muted = this.onToggleMute();
      const btn = document.getElementById('btn-mute');
      if (btn) btn.textContent = muted ? '🔇 Muted' : '🔊 Audio';
    });

    // Mobile/Desktop 3D Handle Drag Plane Switcher (XZ Plane vs Y Altitude)
    document.getElementById('btn-drag-xz')?.addEventListener('click', () => {
      this.audio?.playClick();
      this.dragAxis = 'xz';
      this.updateToggleButtons();
      this.onChangeDragAxis('xz');
    });

    document.getElementById('btn-drag-y')?.addEventListener('click', () => {
      this.audio?.playClick();
      this.dragAxis = 'y';
      this.updateToggleButtons();
      this.onChangeDragAxis('y');
    });

    // Quick Zero & Match Recommended Vector helper in Sandbox
    document.getElementById('btn-zero-vector')?.addEventListener('click', () => {
      this.audio?.playClick();
      this.setThrust({ x: 0, y: 0, z: 0 }, true);
    });

    document.getElementById('btn-toggle-more-top')?.addEventListener('click', () => {
      this.audio?.playClick();
      document.getElementById('top-extra-drawer')?.classList.toggle('hidden');
    });

    document.getElementById('btn-toggle-telemetry')?.addEventListener('click', () => {
      this.audio?.playClick();
      document.getElementById('telemetry-drawer')?.classList.toggle('hidden');
    });

    document.getElementById('btn-fullscreen')?.addEventListener('click', () => {
      this.audio?.playClick();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    });

    document.getElementById('btn-next-level-top')?.addEventListener('click', () => {
      this.audio?.playClick();
      if (!this.currentLevel) return;
      const nextLvl = getNextLevel(this.currentLevel.id);
      if (nextLvl && this.onSelectNextLevel) {
        this.onSelectNextLevel(nextLvl.id);
      } else if (this.onOpenLevelSelect) {
        this.onOpenLevelSelect();
      }
    });
  }

  updateToggleButtons() {
    const setBtnState = (id, active, onText = null, offText = null) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.toggle('btn-toggle-on', active);
      if (onText && offText) el.textContent = active ? onText : offText;
    };

    setBtnState('btn-preview', this.previewEnabled, '👁 Preview: ON', '👁 Preview: OFF');
    setBtnState('btn-grid', this.gridEnabled, '🌐 Grid: ON', '🌐 Grid: OFF');
    setBtnState('btn-htt', this.headToTailEnabled, '🔗 Head-to-Tail: ON', '🔗 Head-to-Tail: OFF');
    setBtnState('btn-bloom', this.bloomEnabled, '✨ Bloom: ON', '✨ Bloom: OFF');
    setBtnState('btn-hint', this.hintVisible, '💡 Hide Hint', '💡 Hint');
    setBtnState('btn-drag-xz', this.dragAxis === 'xz');
    setBtnState('btn-drag-y', this.dragAxis === 'y');
  }

  loadLevel(level, starsEarned, attempts) {
    this.currentLevel = level;
    this.hintVisible = false;
    this.headToTailEnabled = Boolean(level.showHeadToTail || level.world === 1);

    const titleEl = document.getElementById('hud-level-name');
    if (titleEl) titleEl.textContent = level.name;

    const conceptEl = document.getElementById('hud-level-concept');
    if (conceptEl) conceptEl.textContent = level.concept;

    const introEl = document.getElementById('hud-intro-text');
    if (introEl) introEl.textContent = level.intro;

    const hintEl = document.getElementById('hint-banner');
    if (hintEl) {
      hintEl.textContent = `💡 Hint: ${level.hint}`;
      hintEl.classList.add('hidden');
    }

    this.updateAttemptsAndStars(attempts, starsEarned);
    this.updateToggleButtons();
    this.closeModals();
    this._renderSandboxControls();
    this.refreshReadouts();
  }

  updateAttemptsAndStars(attempts, starsEarned) {
    const attEl = document.getElementById('hud-attempts');
    if (attEl) attEl.textContent = `Attempts: ${attempts}`;

    const starsEl = document.getElementById('hud-stars');
    if (starsEl) {
      starsEl.innerHTML = [1, 2, 3]
        .map((i) => `<span class="${i <= starsEarned ? 'star-earned' : 'star-empty'}">★</span>`)
        .join('');
    }
  }

  setThrust(thrust, notify = false) {
    this.thrust = {
      x: Number(thrust.x.toFixed(1)),
      y: Number(thrust.y.toFixed(1)),
      z: Number(thrust.z.toFixed(1))
    };

    ['x', 'y', 'z'].forEach((axis) => {
      const slider = document.getElementById(`slider-${axis}`);
      const num = document.getElementById(`num-${axis}`);
      if (slider) slider.value = String(this.thrust[axis]);
      if (num && document.activeElement !== num) num.value = String(this.thrust[axis]);
    });

    this.refreshReadouts();
    if (notify && this.onThrustInput) {
      this.onThrustInput(this.thrust);
    }
  }

  setPhase(phase) {
    const isRunning = phase === 'RUN';
    const launchBtn = document.getElementById('btn-launch');
    if (launchBtn) {
      launchBtn.disabled = isRunning;
      launchBtn.textContent = isRunning ? '🚀 Burning...' : '🚀 Launch Burn';
    }
    ['x', 'y', 'z'].forEach((axis) => {
      const s = document.getElementById(`slider-${axis}`);
      const n = document.getElementById(`num-${axis}`);
      if (s) s.disabled = isRunning;
      if (n) n.disabled = isRunning;
    });
  }

  refreshReadouts() {
    if (!this.currentLevel) return;
    const lvl = this.currentLevel;
    const t = this.thrust;
    const magT = magnitude(t);
    const maxFuel = lvl.fuel || 10;

    // 1. Pythagorean Magnitude & Fuel Bar
    const magReadout = document.getElementById('readout-magnitude');
    if (magReadout) {
      magReadout.textContent = `√(${t.x}² + ${t.y}² + ${t.z}²) = ${magT.toFixed(2)}`;
    }

    const fuelText = document.getElementById('readout-fuel-text');
    if (fuelText) {
      fuelText.textContent = `${magT.toFixed(2)} / ${maxFuel.toFixed(1)}`;
    }

    const fuelFill = document.getElementById('fuel-bar-fill');
    if (fuelFill) {
      const pct = Math.min(100, (magT / maxFuel) * 100);
      fuelFill.style.width = `${pct}%`;
      fuelFill.style.background = pct > 98 ? '#f43f5e' : pct > 80 ? '#facc15' : '#22d3ee';
    }

    // 2. Vector Sum Readouts (Thrust + Wind + Gravity = Resultant)
    const startPos = lvl.start || { x: 0, y: 0, z: 0 };
    const { wind, gravity, resultant } = getResultantAt(t, startPos, lvl);

    const setEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setEl('vec-thrust', formatVec(t));
    setEl('vec-wind', formatVec(wind));
    setEl('vec-gravity', formatVec(gravity));
    setEl('vec-resultant', `${formatVec(resultant)}  (|R|=${magnitude(resultant).toFixed(1)})`);
    setEl('vec-goal', formatVec(lvl.goal.position));

    // 3. World 4 Dot Product Alignment Widget
    const dotPanel = document.getElementById('math-widget-dot');
    if (dotPanel) {
      if (lvl.gates && lvl.gates.length > 0) {
        dotPanel.classList.remove('hidden');
        const gate = lvl.gates[0];
        const rawDot = dot(resultant, gate.direction);
        const cosVal = alignmentCos(resultant, gate.direction);
        const deg = angleDegrees(resultant, gate.direction);
        const minCos = gate.minAlignment || 0.92;
        const isAligned = cosVal >= minCos && magnitude(resultant) > 0.1;

        setEl('dot-gate-dir', formatVec(gate.direction));
        setEl('dot-raw-val', rawDot.toFixed(2));
        setEl('dot-cos-val', `${cosVal.toFixed(2)} (need ≥ ${minCos})`);
        setEl('dot-angle-val', `${deg.toFixed(1)}°`);
        const statusEl = document.getElementById('dot-status-badge');
        if (statusEl) {
          statusEl.textContent = isAligned ? '✓ Gate Aligned' : '✗ Misaligned';
          statusEl.className = `status-pill ${isAligned ? 'pill-ok' : 'pill-warn'}`;
        }
      } else {
        dotPanel.classList.add('hidden');
      }
    }

    // 4. World 5 Cross Product & Right-Hand Rule Widget
    const crossPanel = document.getElementById('math-widget-cross');
    if (crossPanel) {
      if (lvl.turbines && lvl.turbines.length > 0) {
        crossPanel.classList.remove('hidden');
        const turb = lvl.turbines[0];
        const cp = cross(turb.vecA, turb.vecB);
        const cosVal = alignmentCos(resultant, cp);
        const dotA = dot(resultant, turb.vecA);
        const dotB = dot(resultant, turb.vecB);
        const isUnlocked = cosVal >= (turb.minAlignment || 0.92) && magnitude(resultant) > 0.1;

        setEl('cross-vec-a', formatVec(turb.vecA));
        setEl('cross-vec-b', formatVec(turb.vecB));
        setEl('cross-vec-ab', formatVec(cp));
        setEl('cross-ortho', `R·A = ${dotA.toFixed(1)}, R·B = ${dotB.toFixed(1)}`);
        const statusEl = document.getElementById('cross-status-badge');
        if (statusEl) {
          statusEl.textContent = isUnlocked
            ? '✓ Turbine Unlocked (R ∥ A×B)'
            : cosVal <= -0.7
            ? '✗ Reversed (B×A)'
            : '✗ Locked (Not ⊥)';
          statusEl.className = `status-pill ${isUnlocked ? 'pill-ok' : 'pill-warn'}`;
        }
      } else {
        crossPanel.classList.add('hidden');
      }
    }

    this._updateStudentCoach(lvl, t, wind, gravity, resultant);
  }

  _updateStudentCoach(lvl, t, wind, gravity, resultant) {
    const coachEl = document.getElementById('student-coach-steps');
    if (!coachEl) return;

    const goal = lvl.goal.position;
    const okX = Math.abs(resultant.x - goal.x) < 0.35;
    const okY = Math.abs(resultant.y - goal.y) < 0.35;
    const okZ = Math.abs(resultant.z - goal.z) < 0.35;
    const allOk = okX && okY && okZ;

    const needX = Number((goal.x - wind.x - gravity.x).toFixed(1));
    const needY = Number((goal.y - wind.y - gravity.y).toFixed(1));
    const needZ = Number((goal.z - wind.z - gravity.z).toFixed(1));

    // Highlight whichever slider axis still needs adjustment so the student learns step-by-step
    const highlightAxis = (axis, needsChange) => {
      const ctrl = document.getElementById(`slider-${axis}`)?.closest('.axis-control');
      if (ctrl) {
        ctrl.classList.toggle('axis-needs-attention', needsChange);
      }
    };
    highlightAxis('x', !okX);
    highlightAxis('y', !okY);
    highlightAxis('z', !okZ);

    const makeRow = (axisLabel, colorClass, pushVal, envVal, envName, resVal, goalVal, needVal, isOk) => {
      if (Math.abs(pushVal) < 0.05 && Math.abs(envVal) < 0.05 && Math.abs(goalVal) < 0.05 && isOk) {
        return '';
      }
      const envStr = Math.abs(envVal) > 0.05
        ? ` ${envVal >= 0 ? '+' : '-'} ${Math.abs(envVal)} (${envName})`
        : '';
      return `
        <div class="simple-math-row ${isOk ? 'row-ok' : ''}">
          <div class="simple-math-left">
            <strong class="${colorClass}">${axisLabel}:</strong>
            <span>${pushVal}${envStr} = <strong>${Number(resVal.toFixed(1))}</strong></span>
          </div>
          <span class="coach-pill ${isOk ? 'coach-ok' : ''}">
            ${isOk ? '✓ Hits ' + goalVal : 'Slide ' + axisLabel + ' → ' + needVal}
          </span>
        </div>
      `;
    };

    const rowsHtml =
      makeRow('X', 'axis-x', t.x, wind.x, 'Wind', resultant.x, goal.x, needX, okX) +
      makeRow('Y', 'axis-y', t.y, wind.y + gravity.y, gravity.y !== 0 ? 'Gravity' : 'Wind', resultant.y, goal.y, needY, okY) +
      makeRow('Z', 'axis-z', t.z, wind.z, 'Wind', resultant.z, goal.z, needZ, okZ);

    coachEl.innerHTML = `
      ${rowsHtml}
      ${
        allOk
          ? '<div class="ready-banner">🎯 Perfect Vector! Click <strong>🚀 Launch Burn</strong>!</div>'
          : '<div class="simple-math-Rule">Match each axis to turn the path <strong style="color:#34d399">Green</strong>!</div>'
      }
    `;
  }

  _renderSandboxControls() {
    const sbPanel = document.getElementById('sandbox-builder-panel');
    if (!sbPanel) return;

    if (!this.currentLevel || !this.currentLevel.isSandbox) {
      sbPanel.classList.add('hidden');
      return;
    }

    sbPanel.classList.remove('hidden');
    const lvl = this.currentLevel;
    const gPos = lvl.goal.position;
    const wz = lvl.windZones[0] ? lvl.windZones[0].vector : { x: 0, y: 0, z: 0 };

    sbPanel.innerHTML = `
      <div class="widget-title">🧪 Sandbox Scene Builder</div>
      <div class="sandbox-row">
        <span>Goal (x,y,z):</span>
        <input type="number" id="sb-gx" value="${gPos.x}" step="1" min="-8" max="8" class="sb-input" />
        <input type="number" id="sb-gy" value="${gPos.y}" step="1" min="-4" max="6" class="sb-input" />
        <input type="number" id="sb-gz" value="${gPos.z}" step="1" min="-8" max="8" class="sb-input" />
      </div>
      <div class="sandbox-row">
        <span>Wind (x,y,z):</span>
        <input type="number" id="sb-wx" value="${wz.x}" step="1" min="-6" max="6" class="sb-input" />
        <input type="number" id="sb-wy" value="${wz.y}" step="1" min="-6" max="6" class="sb-input" />
        <input type="number" id="sb-wz" value="${wz.z}" step="1" min="-6" max="6" class="sb-input" />
      </div>
      <div class="sandbox-row">
        <span>Gravity g:</span>
        <input type="number" id="sb-grav" value="${lvl.gravity}" step="1" min="0" max="5" class="sb-input" />
        <button type="button" class="btn btn-subtle btn-xs" id="btn-sb-solve">Auto-Solve T</button>
      </div>
    `;

    const triggerUpdate = () => {
      const gx = parseFloat(document.getElementById('sb-gx')?.value) || 0;
      const gy = parseFloat(document.getElementById('sb-gy')?.value) || 0;
      const gz = parseFloat(document.getElementById('sb-gz')?.value) || 0;
      const wx = parseFloat(document.getElementById('sb-wx')?.value) || 0;
      const wy = parseFloat(document.getElementById('sb-wy')?.value) || 0;
      const wzVal = parseFloat(document.getElementById('sb-wz')?.value) || 0;
      const grav = parseFloat(document.getElementById('sb-grav')?.value) || 0;

      if (this.onSandboxUpdate) {
        this.onSandboxUpdate({
          goalPos: { x: gx, y: gy, z: gz },
          windVec: { x: wx, y: wy, z: wzVal },
          gravity: grav
        });
      }
    };

    ['sb-gx', 'sb-gy', 'sb-gz', 'sb-wx', 'sb-wy', 'sb-wz', 'sb-grav'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', triggerUpdate);
    });

    document.getElementById('btn-sb-solve')?.addEventListener('click', () => {
      this.audio?.playClick();
      const gx = parseFloat(document.getElementById('sb-gx')?.value) || 0;
      const gy = parseFloat(document.getElementById('sb-gy')?.value) || 0;
      const gz = parseFloat(document.getElementById('sb-gz')?.value) || 0;
      const wx = parseFloat(document.getElementById('sb-wx')?.value) || 0;
      const wy = parseFloat(document.getElementById('sb-wy')?.value) || 0;
      const wzVal = parseFloat(document.getElementById('sb-wz')?.value) || 0;
      const grav = parseFloat(document.getElementById('sb-grav')?.value) || 0;
      this.setThrust({ x: gx - wx, y: gy - wy + grav, z: gz - wzVal }, true);
    });
  }

  showResultModal({ outcome, stars, reasonTitle, reasonMath, fuelUsed, attempts }) {
    const container = document.getElementById('modal-root');
    if (!container || !this.currentLevel) return;

    const isWin = outcome === 'win';
    const nextLvl = getNextLevel(this.currentLevel.id);

    const starHtml = isWin
      ? `<div class="result-stars">${[1, 2, 3]
          .map((i) => `<span class="${i <= stars ? 'star-earned' : 'star-empty'}">★</span>`)
          .join('')}</div>`
      : '';

    container.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-panel result-panel ${isWin ? 'result-win' : 'result-fail'}">
          <div class="result-badge">${isWin ? '🎉 TARGET ISLAND REACHED' : '🧭 FLIGHT TELEMETRY REPORT'}</div>
          <h2 class="modal-title">${reasonTitle}</h2>
          ${starHtml}
          <p class="result-math-box">${reasonMath}</p>
          <div class="result-stats">
            <span>Fuel Magnitude |T|: <strong>${fuelUsed.toFixed(2)} / ${this.currentLevel.fuel.toFixed(1)}</strong></span>
            <span>Attempts: <strong>${attempts}</strong></span>
          </div>
          <div id="result-why-drawer" class="why-drawer hidden">
            <div class="why-drawer-title">📐 Mathematical Breakdown ("Show Me Why")</div>
            <p>${this.currentLevel.showMeWhy}</p>
            <div class="why-formula">
              Recommended Thrust: <strong>T = ${formatVec(this.currentLevel.recommendedThrust)}</strong>
              (|T| = ${magnitude(this.currentLevel.recommendedThrust).toFixed(2)})
            </div>
          </div>
          <div class="result-actions">
            <button type="button" class="btn btn-secondary" id="res-btn-why">📐 Show Me Why</button>
            <button type="button" class="btn btn-ghost" id="res-btn-retry">🔄 ${isWin ? 'Replay Level' : 'Try Again'}</button>
            ${
              isWin && nextLvl
                ? `<button type="button" class="btn btn-primary" id="res-btn-next">Next: ${nextLvl.name} ➔</button>`
                : isWin
                ? `<button type="button" class="btn btn-primary" id="res-btn-levels">All Levels Completed! 🏆</button>`
                : `<button type="button" class="btn btn-primary" id="res-btn-apply-sol">💡 Set Exact Vector</button>`
            }
          </div>
        </div>
      </div>
    `;

    container.querySelector('#res-btn-why')?.addEventListener('click', () => {
      this.audio?.playClick();
      const drawer = container.querySelector('#result-why-drawer');
      if (drawer) drawer.classList.toggle('hidden');
      if (this.onShowMathVisualizer) this.onShowMathVisualizer(true);
    });

    container.querySelector('#res-btn-retry')?.addEventListener('click', () => {
      this.audio?.playClick();
      container.innerHTML = '';
      this.onReset();
    });

    container.querySelector('#res-btn-next')?.addEventListener('click', () => {
      this.audio?.playClick();
      container.innerHTML = '';
      if (nextLvl) this.onSelectNextLevel(nextLvl.id);
    });

    container.querySelector('#res-btn-levels')?.addEventListener('click', () => {
      this.audio?.playClick();
      container.innerHTML = '';
      this.onOpenLevelSelect();
    });

    container.querySelector('#res-btn-apply-sol')?.addEventListener('click', () => {
      this.audio?.playClick();
      container.innerHTML = '';
      this.onReset();
      this.setThrust(this.currentLevel.recommendedThrust, true);
      if (this.onShowMathVisualizer) this.onShowMathVisualizer(true);
    });
  }

  openMathModal() {
    const container = document.getElementById('modal-root');
    if (!container || !this.currentLevel) return;
    const lvl = this.currentLevel;
    const { wind, gravity, resultant } = getResultantAt(this.thrust, lvl.start || { x: 0, y: 0, z: 0 }, lvl);

    container.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-panel result-panel">
          <div class="result-badge">📐 VECTOR MATH VISUALIZER</div>
          <h2 class="modal-title">${lvl.name} — ${lvl.concept}</h2>
          <p class="result-math-box">${lvl.showMeWhy}</p>
          <div class="math-table">
            <div><span class="dot-cyan">●</span> Your Thrust (T): <strong>${formatVec(this.thrust)}</strong> (|T| = ${magnitude(this.thrust).toFixed(2)})</div>
            <div><span class="dot-orange">●</span> Wind Vector (W): <strong>${formatVec(wind)}</strong></div>
            <div><span class="dot-purple">●</span> Gravity Vector (G): <strong>${formatVec(gravity)}</strong></div>
            <div><span class="dot-gold">●</span> Resultant (T + W + G): <strong>${formatVec(resultant)}</strong></div>
            <div>🎯 Target Goal Island: <strong>${formatVec(lvl.goal.position)}</strong></div>
          </div>
          <div class="result-actions">
            <button type="button" class="btn btn-secondary" id="math-btn-apply">Apply Solution Vector ${formatVec(lvl.recommendedThrust)}</button>
            <button type="button" class="btn btn-primary" id="math-btn-close">Back to Planning</button>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#math-btn-apply')?.addEventListener('click', () => {
      this.audio?.playClick();
      this.setThrust(lvl.recommendedThrust, true);
      container.innerHTML = '';
    });

    container.querySelector('#math-btn-close')?.addEventListener('click', () => {
      this.audio?.playClick();
      container.innerHTML = '';
    });
  }

  closeModals() {
    const container = document.getElementById('modal-root');
    if (container) container.innerHTML = '';
  }
}
