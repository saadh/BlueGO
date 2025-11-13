// Fun notification sounds for new dismissals
// Using Web Audio API compatible sound URLs
export const NOTIFICATION_SOUNDS = [
  {
    id: "sound-1",
    name: "Happy Bell",
    url: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi78OScTgwN", // Bright bell sound
  },
  {
    id: "sound-2",
    name: "Cheerful Ding",
    url: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi78OScTgwNUKfj8LZjHAY4kdfy", // Ding sound
  },
  {
    id: "sound-3",
    name: "Friendly Chime",
    url: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi78OScTgwN", // Chime sound
  },
  {
    id: "sound-4",
    name: "Pop Notification",
    url: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi78OScTgwN", // Pop sound
  },
  {
    id: "sound-5",
    name: "Playful Beep",
    url: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi78OScTgwN", // Beep sound
  },
] as const;

// Sound preferences storage key
const SOUND_ENABLED_KEY = "bluego_sound_enabled";
const SOUND_VOLUME_KEY = "bluego_sound_volume";

// Sound notification manager class
class SoundManager {
  private audioContext: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    // Load preferences from localStorage
    const savedEnabled = localStorage.getItem(SOUND_ENABLED_KEY);
    const savedVolume = localStorage.getItem(SOUND_VOLUME_KEY);

    if (savedEnabled !== null) {
      this.soundEnabled = savedEnabled === "true";
    }

    if (savedVolume !== null) {
      this.volume = parseFloat(savedVolume);
    }
  }

  // Initialize audio context (must be called after user interaction)
  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Play a specific sound by ID
  playSound(soundId: string) {
    if (!this.soundEnabled) return;

    try {
      this.initAudioContext();
      const sound = NOTIFICATION_SOUNDS.find((s) => s.id === soundId);

      if (sound) {
        this.playAudioFromUrl(sound.url);
      }
    } catch (error) {
      console.error("Failed to play sound:", error);
    }
  }

  // Play a random notification sound
  playRandomSound() {
    if (!this.soundEnabled) return;

    try {
      this.initAudioContext();
      const randomIndex = Math.floor(Math.random() * NOTIFICATION_SOUNDS.length);
      const sound = NOTIFICATION_SOUNDS[randomIndex];

      this.playAudioFromUrl(sound.url);
    } catch (error) {
      console.error("Failed to play random sound:", error);
    }
  }

  // Play audio from URL (data URI or HTTP URL)
  private async playAudioFromUrl(url: string) {
    try {
      // For data URIs, we need to decode and play
      if (url.startsWith("data:")) {
        // Create simple beep sound using Web Audio API oscillator
        this.playBeep();
      } else {
        // For HTTP URLs, use Audio element
        const audio = new Audio(url);
        audio.volume = this.volume;
        audio.play().catch((error) => {
          console.error("Audio play failed:", error);
        });
      }
    } catch (error) {
      console.error("Failed to play audio:", error);
    }
  }

  // Generate and play a beep sound using Web Audio API
  private playBeep(frequency: number = 800, duration: number = 200) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration / 1000
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  }

  // Play fun multi-tone notification
  playMultiToneNotification() {
    if (!this.soundEnabled) return;

    this.initAudioContext();

    // Play ascending tones for a fun notification
    const tones = [523.25, 659.25, 783.99]; // C, E, G major chord
    tones.forEach((freq, index) => {
      setTimeout(() => {
        this.playBeep(freq, 150);
      }, index * 100);
    });
  }

  // Enable/disable sounds
  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    localStorage.setItem(SOUND_ENABLED_KEY, enabled.toString());
  }

  // Get sound enabled status
  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  // Set volume (0.0 to 1.0)
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem(SOUND_VOLUME_KEY, this.volume.toString());
  }

  // Get current volume
  getVolume(): number {
    return this.volume;
  }

  // Toggle sound on/off
  toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem(SOUND_ENABLED_KEY, this.soundEnabled.toString());
    return this.soundEnabled;
  }
}

// Export singleton instance
export const soundManager = new SoundManager();

// Convenience functions
export function playNotificationSound() {
  soundManager.playMultiToneNotification();
}

export function playRandomSound() {
  soundManager.playRandomSound();
}

export function toggleSoundNotifications(): boolean {
  return soundManager.toggleSound();
}

export function isSoundEnabled(): boolean {
  return soundManager.isSoundEnabled();
}

export function setSoundVolume(volume: number) {
  soundManager.setVolume(volume);
}

export function getSoundVolume(): number {
  return soundManager.getVolume();
}
