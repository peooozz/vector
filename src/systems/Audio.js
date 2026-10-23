/**
 * Audio.js
 * Lightweight procedural WebAudio sound synthesizer (burn, win, fail, click)
 * with mute toggle. Starts cleanly on first user interaction.
 */

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playTone(freq, duration = 0.15, type = 'sine', gainVal = 0.12, slideTo = null) {
    if (this.muted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
      }

      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch (_) {}
  }

  playClick() {
    this.playTone(520, 0.05, 'triangle', 0.06, 660);
  }

  playBurn() {
    this.playTone(140, 0.55, 'sawtooth', 0.09, 280);
    setTimeout(() => this.playTone(220, 0.45, 'triangle', 0.08, 340), 90);
  }

  playWin() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      setTimeout(() => this.playTone(n, 0.24, 'triangle', 0.12), idx * 95);
    });
  }

  playFail() {
    this.playTone(300, 0.22, 'sawtooth', 0.1, 190);
    setTimeout(() => this.playTone(185, 0.32, 'sawtooth', 0.1, 110), 160);
  }
}
