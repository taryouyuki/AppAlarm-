// Audio synthesis & speech synthesis for alarms and notifications

export interface SoundOption {
  id: string;
  name: string;
  type: 'alarm' | 'notification' | 'both';
}

export const AVAILABLE_SOUNDS: SoundOption[] = [
  { id: 'classic_alarm', name: '標準のアラーム音 (Classic Alarm)', type: 'both' },
  { id: 'gentle_chime', name: '穏やかなチャイム (Gentle Chime)', type: 'both' },
  { id: 'digital_beep', name: 'デジタルアラーム (Digital Beep)', type: 'both' },
  { id: 'marimba_melody', name: 'マリンバメロディ (Marimba Melody)', type: 'both' },
  { id: 'zen_bell', name: '静寂のベル (Zen Bell)', type: 'both' },
  { id: 'energetic_pulse', name: 'エネルギッシュパルス (Pulse)', type: 'alarm' },
  { id: 'short_pop', name: 'ショートポップ (Short Pop)', type: 'notification' },
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private currentGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private fadeInterval: number | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playSound(soundId: string, loop: boolean = false, fadeSeconds: number = 0, onEnded?: () => void) {
    this.stopSound();
    const ctx = this.initCtx();
    this.isPlaying = true;

    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    this.currentGain = masterGain;

    if (fadeSeconds > 0) {
      masterGain.gain.setValueAtTime(0.05, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + fadeSeconds);
    } else {
      masterGain.gain.setValueAtTime(0.9, ctx.currentTime);
    }

    const playSequence = () => {
      if (!this.isPlaying) return;

      const now = ctx.currentTime;
      if (soundId === 'digital_beep') {
        for (let i = 0; i < 4; i++) {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(880, now + i * 0.15);
          noteGain.gain.setValueAtTime(0.2, now + i * 0.15);
          noteGain.gain.setValueAtTime(0.001, now + i * 0.15 + 0.08);
          osc.connect(noteGain);
          noteGain.connect(masterGain);
          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.08);
        }
        if (loop) {
          window.setTimeout(playSequence, 1000);
        } else if (onEnded) {
          window.setTimeout(onEnded, 700);
        }
      } else if (soundId === 'gentle_chime') {
        const freqs = [523.25, 659.25, 783.99, 1046.5];
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + idx * 0.2);
          noteGain.gain.setValueAtTime(0.3, now + idx * 0.2);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.2 + 0.8);
          osc.connect(noteGain);
          noteGain.connect(masterGain);
          osc.start(now + idx * 0.2);
          osc.stop(now + idx * 0.2 + 0.8);
        });
        if (loop) {
          window.setTimeout(playSequence, 1800);
        } else if (onEnded) {
          window.setTimeout(onEnded, 1500);
        }
      } else if (soundId === 'marimba_melody') {
        const melody = [659.25, 587.33, 523.25, 587.33, 659.25, 659.25];
        melody.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + idx * 0.16);
          noteGain.gain.setValueAtTime(0.4, now + idx * 0.16);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.3);
          osc.connect(noteGain);
          noteGain.connect(masterGain);
          osc.start(now + idx * 0.16);
          osc.stop(now + idx * 0.16 + 0.3);
        });
        if (loop) {
          window.setTimeout(playSequence, 1600);
        } else if (onEnded) {
          window.setTimeout(onEnded, 1300);
        }
      } else if (soundId === 'zen_bell') {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        noteGain.gain.setValueAtTime(0.5, now);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 2.5);
        if (loop) {
          window.setTimeout(playSequence, 3000);
        } else if (onEnded) {
          window.setTimeout(onEnded, 2500);
        }
      } else if (soundId === 'short_pop') {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        noteGain.gain.setValueAtTime(0.4, now);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.2);
        if (onEnded) window.setTimeout(onEnded, 250);
      } else {
        const tones = [750, 950];
        tones.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.2);
          noteGain.gain.setValueAtTime(0.4, now + idx * 0.2);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.2 + 0.18);
          osc.connect(noteGain);
          noteGain.connect(masterGain);
          osc.start(now + idx * 0.2);
          osc.stop(now + idx * 0.2 + 0.18);
        });
        if (loop) {
          window.setTimeout(playSequence, 800);
        } else if (onEnded) {
          window.setTimeout(onEnded, 600);
        }
      }
    };

    playSequence();
  }

  public stopSound() {
    this.isPlaying = false;
    if (this.fadeInterval) {
      window.clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
    if (this.currentGain && this.ctx) {
      try {
        this.currentGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.currentGain.disconnect();
      } catch {
        // ignore
      }
      this.currentGain = null;
    }
  }

  public speak(text: string, onEnded?: () => void) {
    if (!('speechSynthesis' in window)) {
      if (onEnded) onEnded();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text || 'アプリを開く時間です');
    utterance.lang = 'ja-JP';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find((v) => v.lang.startsWith('ja') || v.lang.includes('JP'));
    if (jaVoice) {
      utterance.voice = jaVoice;
    }

    if (onEnded) {
      utterance.onend = () => onEnded();
      utterance.onerror = () => onEnded();
    }
    window.speechSynthesis.speak(utterance);
  }

  public stopVoice() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public vibrate(pattern: number[] = [300, 200, 300]) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore
      }
    }
  }
}

export const soundEngine = new SoundEngine();
