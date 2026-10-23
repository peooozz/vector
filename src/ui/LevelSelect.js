/**
 * LevelSelect.js
 * Manages progress persistence in localStorage (stars & unlocked/completed levels)
 * and renders the 5-World, 15-Level selection modal + Sandbox mode launcher.
 */

import { WORLDS, ALL_LEVELS } from '../levels/index.js';

const STORAGE_KEY = 'vector_skies_progress_v1';

export class LevelSelect {
  constructor(onSelectLevel, onSelectSandbox, audio) {
    this.onSelectLevel = onSelectLevel;
    this.onSelectSandbox = onSelectSandbox;
    this.audio = audio;
    this.progress = this.loadProgress();
  }

  loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (_) {}
    return { starsByLevel: {} };
  }

  saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch (_) {}
  }

  recordWin(levelId, stars) {
    if (!levelId || levelId === 'sandbox') return;
    const prev = this.progress.starsByLevel[levelId] || 0;
    if (stars > prev) {
      this.progress.starsByLevel[levelId] = stars;
      this.saveProgress();
    }
  }

  getStars(levelId) {
    return this.progress.starsByLevel[levelId] || 0;
  }

  getTotalStars() {
    return Object.values(this.progress.starsByLevel).reduce((sum, s) => sum + s, 0);
  }

  resetProgress() {
    this.progress = { starsByLevel: {} };
    this.saveProgress();
  }

  renderModal(container, currentLevelId, onClose) {
    if (!container) return;
    const totalStars = this.getTotalStars();
    const maxStars = ALL_LEVELS.length * 3;

    let worldsHtml = '';
    WORLDS.forEach((world) => {
      let cardsHtml = '';
      world.levels.forEach((lvl) => {
        const stars = this.getStars(lvl.id);
        const isCurrent = lvl.id === currentLevelId;
        const starIcons = [1, 2, 3]
          .map((i) => `<span class="${i <= stars ? 'star-earned' : 'star-empty'}">★</span>`)
          .join('');

        cardsHtml += `
          <button type="button" class="level-card ${isCurrent ? 'level-card-active' : ''}" data-level-id="${lvl.id}">
            <div class="level-card-top">
              <span class="level-badge">Level ${lvl.world}-${lvl.level}</span>
              <span class="level-stars">${starIcons}</span>
            </div>
            <div class="level-card-title">${lvl.name.split(': ')[1] || lvl.name}</div>
            <div class="level-card-concept">${lvl.concept}</div>
          </button>
        `;
      });

      worldsHtml += `
        <div class="world-section">
          <div class="world-header">
            <div>
              <h3 class="world-title" style="color:${world.themeColor}">${world.name}</h3>
              <p class="world-subtitle">${world.subtitle}</p>
            </div>
          </div>
          <div class="level-grid">
            ${cardsHtml}
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <div class="modal-backdrop" id="level-select-backdrop">
        <div class="modal-panel level-select-panel">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Vector Skies — Flight Chart</h2>
              <p class="modal-subtitle">5 Worlds · 15 Progressive Math Levels · Total Stars: <strong>${totalStars} / ${maxStars} ★</strong></p>
            </div>
            <div class="modal-header-actions">
              <button type="button" class="btn btn-sandbox" id="btn-open-sandbox">🧪 Sandbox Lab</button>
              <button type="button" class="btn btn-ghost" id="btn-close-levels">Resume Flight ✕</button>
            </div>
          </div>
          <div class="worlds-scroll">
            ${worldsHtml}
          </div>
          <div class="modal-footer">
            <span class="footer-note">Tip: Drag the cyan arrow in 3D or use the sliders to set your burn vector!</span>
            <button type="button" class="btn btn-subtle" id="btn-reset-progress">Reset Saved Stars</button>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('[data-level-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.audio?.playClick();
        const id = btn.getAttribute('data-level-id');
        container.innerHTML = '';
        this.onSelectLevel(id);
      });
    });

    const sandboxBtn = container.querySelector('#btn-open-sandbox');
    if (sandboxBtn) {
      sandboxBtn.addEventListener('click', () => {
        this.audio?.playClick();
        container.innerHTML = '';
        this.onSelectSandbox();
      });
    }

    const closeBtn = container.querySelector('#btn-close-levels');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.audio?.playClick();
        container.innerHTML = '';
        if (onClose) onClose();
      });
    }

    const resetBtn = container.querySelector('#btn-reset-progress');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.audio?.playClick();
        this.resetProgress();
        this.renderModal(container, currentLevelId, onClose);
      });
    }
  }
}
