class SoundManager {
  constructor() {
    this.audioElements = {};
    this.currentMusic = null;
    this.isMuted = false;
  }

  loadAudio(name, src) {
    if (!this.audioElements[name]) {
      const audio = new Audio(src);
      audio.preload = 'auto';
      this.audioElements[name] = audio;
    }
    return this.audioElements[name];
  }

  playMusic(name, src, loop = true) {
    if (this.isMuted) return;
    this.stopMusic();

    const audio = this.loadAudio(name, src);
    audio.loop = loop;
    audio.currentTime = 0;
    audio.volume = 0.6;
    audio.play().catch(err => console.warn(`Autoplay audio [${name}] blocked:`, err));
    this.currentMusic = audio;
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
    }
  }

  playSfx(name, src) {
    if (this.isMuted) return;
    const audio = this.loadAudio(name, src);
    audio.currentTime = 0;
    audio.volume = 0.8;
    audio.play().catch(err => console.warn(`SFX [${name}] error:`, err));
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.currentMusic) this.currentMusic.pause();
    } else {
      if (this.currentMusic) this.currentMusic.play().catch(() => {});
    }
    return this.isMuted;
  }
}

export const soundManager = new SoundManager();
