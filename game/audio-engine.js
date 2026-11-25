// Procedural Web Audio synthesizer with per-cue rate limiting and pooled sound triggers.
// Zero external audio assets and zero HTMLAudioElement allocations.

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.lastPlayedAt = new Map();
  }

  unlock() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(value) {
    this.muted = Boolean(value);
  }

  isMuted() {
    return this.muted;
  }

  _tone(freq, startOffset, duration, type = 'sine', peakGain = 0.04, endFreq = null) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime + startOffset;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  play(cue) {
    if (!this.ctx || this.muted) return;
    const nowMs = performance.now();
    const prev = this.lastPlayedAt.get(cue) || 0;
    if (nowMs - prev < 55) return;
    this.lastPlayedAt.set(cue, nowMs);

    switch (cue) {
      case 'chop':
        this._tone(160, 0, 0.055, 'triangle', 0.11, 75);
        this._tone(420, 0.01, 0.035, 'square', 0.018, 190);
        break;
      case 'chop_done':
        this._tone(330, 0, 0.08, 'triangle', 0.06);
        this._tone(495, 0.04, 0.1, 'sine', 0.055);
        break;
      case 'sizzle':
        for (let i = 0; i < 6; i++) {
          this._tone(950 + i * 160, i * 0.028, 0.035, 'sawtooth', 0.009);
        }
        break;
      case 'simmer':
        this._tone(240, 0, 0.08, 'sine', 0.04, 340);
        this._tone(310, 0.05, 0.09, 'sine', 0.03, 430);
        break;
      case 'ready':
        this._tone(587.3, 0, 0.13, 'triangle', 0.055);
        this._tone(880, 0.07, 0.19, 'sine', 0.055);
        break;
      case 'perfect':
        this._tone(659.25, 0, 0.12, 'triangle', 0.06);
        this._tone(880, 0.06, 0.14, 'triangle', 0.06);
        this._tone(1318.5, 0.12, 0.24, 'sine', 0.065);
        break;
      case 'plate':
        this._tone(440, 0, 0.07, 'sine', 0.045, 520);
        break;
      case 'herb':
        this._tone(740, 0, 0.09, 'sine', 0.04);
        this._tone(988, 0.05, 0.12, 'triangle', 0.04);
        break;
      case 'serve':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
          this._tone(f, idx * 0.055, 0.2, 'triangle', 0.055);
        });
        break;
      case 'bad':
        this._tone(210, 0, 0.16, 'sawtooth', 0.03, 140);
        this._tone(160, 0.09, 0.22, 'triangle', 0.045, 110);
        break;
      default:
        this._tone(380, 0, 0.045, 'triangle', 0.025);
        break;
    }
  }
}
