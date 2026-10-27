// Ambient Halloween Web Audio API Synthesizer
// 100% lightweight, zero external asset downloads, non-intrusive ambient background sound

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private masterGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private chimeTimer: any = null;

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      this.ctx = new AudioCtx();
    }
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public start() {
    if (!this.ctx) {
      this.init();
    }
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.masterGain.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 3);
      this.masterGain.connect(this.ctx.destination);

      // 1. Mysterious eerie wind generator using pink-filtered buffer
      const bufferSize = this.ctx.sampleRate * 4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.1;
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = buffer;
      this.noiseNode.loop = true;

      // Bandpass filter for haunting wind resonant sweep
      const windFilter = this.ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
      windFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

      // Low frequency oscillator for wind gusts
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(180, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(windFilter.frequency);
      lfo.start();

      this.noiseNode.connect(windFilter);
      windFilter.connect(this.masterGain);
      this.noiseNode.start();

      // 2. Subtle periodic spooky music box bell
      const playSpookyNote = () => {
        if (!this.isPlaying || !this.ctx || !this.masterGain) return;
        const notes = [293.66, 329.63, 349.23, 440.00, 493.88, 523.25, 587.33]; // D minor / mysterious pentatonic
        const freq = notes[Math.floor(Math.random() * notes.length)];

        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        noteGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        noteGain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3.2);

        osc.connect(noteGain);
        noteGain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 3.5);

        const nextTime = 4000 + Math.random() * 5000;
        this.chimeTimer = setTimeout(playSpookyNote, nextTime);
      };

      this.isPlaying = true;
      this.chimeTimer = setTimeout(playSpookyNote, 1800);
    } catch (e) {
      console.warn('Audio could not be initialized:', e);
    }
  }

  public stop() {
    if (!this.ctx || !this.isPlaying) return;
    try {
      if (this.masterGain) {
        this.masterGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);
        setTimeout(() => {
          if (this.noiseNode) {
            try { this.noiseNode.stop(); } catch (_) {}
            this.noiseNode = null;
          }
          if (this.chimeTimer) {
            clearTimeout(this.chimeTimer);
            this.chimeTimer = null;
          }
        }, 1300);
      }
      this.isPlaying = false;
    } catch (_) {
      this.isPlaying = false;
    }
  }

  public getStatus(): boolean {
    return this.isPlaying;
  }
}

export const soundEngine = new AmbientSoundEngine();
