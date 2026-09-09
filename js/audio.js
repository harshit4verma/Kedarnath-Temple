/**
 * Kedarnath 360 AR/VR - Audio Engine (Web Audio API)
 * Zero external audio files required! Synthesizes realistic Himalayan mountain wind,
 * bronze temple bells (ghanti), and sacred meditative tanpura drone.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.windGain = null;
    this.droneGain = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.initWindAmbience();
      this.initMeditativeDrone();
      this.isInitialized = true;
    } catch (e) {
      console.warn("Web Audio not supported or blocked", e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Synthesizes natural Himalayan mountain wind
  initWindAmbience() {
    if (!this.ctx) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to sound like cold mountain wind
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 240;
    filter.Q.value = 1.2;

    // Gentle LFO modulating wind frequency
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.15;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 120;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.12;

    whiteNoise.connect(filter);
    filter.connect(this.windGain);
    this.windGain.connect(this.ctx.destination);
    whiteNoise.start();
  }

  // Synthesizes sacred Vedic meditative harmonic drone
  initMeditativeDrone() {
    if (!this.ctx) return;
    const rootFreq = 136.1; // Sacred Om frequency (C#)

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0.08;

    const harmonics = [1, 1.5, 2, 2.99, 4];
    harmonics.forEach((h, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = (idx % 2 === 0) ? 'sine' : 'triangle';
      osc.frequency.value = rootFreq * h;

      const oscGain = this.ctx.createGain();
      oscGain.gain.value = 1.0 / (idx + 1.5);

      osc.connect(oscGain);
      oscGain.connect(this.droneGain);
      osc.start();
    });

    this.droneGain.connect(this.ctx.destination);
  }

  // Plays authentic bronze temple bell (ghanti) chime with physical harmonics
  playTempleBell(intensity = 1.0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Bell fundamental (tuned to bright mountain brass bell ~880 Hz / A5)
    const baseFreq = 880;
    // Classical bell harmonic ratios: Hum (0.5), Prime (1.0), Tierce (1.2), Quint (1.5), Nominal (2.0)
    const bellModes = [
      { ratio: 0.5, decay: 3.5, gain: 0.4 },
      { ratio: 1.0, decay: 2.8, gain: 1.0 },
      { ratio: 1.19, decay: 2.2, gain: 0.6 },
      { ratio: 1.51, decay: 1.8, gain: 0.5 },
      { ratio: 2.0, decay: 1.4, gain: 0.4 },
      { ratio: 3.1, decay: 0.8, gain: 0.2 },
      { ratio: 4.2, decay: 0.5, gain: 0.15 }
    ];

    bellModes.forEach(mode => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * mode.ratio, now);

      // Strike attack and long reverberant ring
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(mode.gain * 0.18 * intensity, now + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + mode.decay);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + mode.decay);
    });
  }

  // Play footstep sound on stone
  playFootstep() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120 + Math.random() * 40, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    filter.type = 'lowpass';
    filter.frequency.value = 350;

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  toggleMute() {
    this.ensureContext();
    this.isMuted = !this.isMuted;
    if (this.windGain) {
      this.windGain.gain.value = this.isMuted ? 0 : 0.12;
    }
    if (this.droneGain) {
      this.droneGain.gain.value = this.isMuted ? 0 : 0.08;
    }
    return this.isMuted;
  }
}

window.soundEngine = new SoundEngine();
