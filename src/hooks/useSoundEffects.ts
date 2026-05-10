import { useCallback, useRef, useState, useEffect } from "react";

// Global sound enabled state (persisted in localStorage)
let globalSoundEnabled = typeof localStorage !== 'undefined' 
  ? localStorage.getItem('soundEnabled') !== 'false' 
  : true;

// Listeners for state changes
const listeners = new Set<(enabled: boolean) => void>();

export const getSoundEnabled = () => globalSoundEnabled;

export const setSoundEnabled = (enabled: boolean) => {
  globalSoundEnabled = enabled;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('soundEnabled', String(enabled));
  }
  listeners.forEach(listener => listener(enabled));
};

export const useSoundEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
    if (!globalSoundEnabled) return;
    
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.log("Audio not supported");
    }
  }, [getAudioContext]);

  const playWin = useCallback(() => {
    // Ascending triumphant sound
    playTone(523, 0.1, 'sine', 0.3); // C5
    setTimeout(() => playTone(659, 0.1, 'sine', 0.3), 100); // E5
    setTimeout(() => playTone(784, 0.15, 'sine', 0.3), 200); // G5
    setTimeout(() => playTone(1047, 0.3, 'sine', 0.4), 300); // C6
  }, [playTone]);

  const playLoss = useCallback(() => {
    // Descending sad sound
    playTone(392, 0.15, 'sine', 0.25); // G4
    setTimeout(() => playTone(330, 0.15, 'sine', 0.25), 150); // E4
    setTimeout(() => playTone(262, 0.3, 'sine', 0.2), 300); // C4
  }, [playTone]);

  const playClick = useCallback(() => {
    playTone(800, 0.05, 'sine', 0.15);
  }, [playTone]);

  const playBet = useCallback(() => {
    playTone(440, 0.08, 'square', 0.2);
    setTimeout(() => playTone(554, 0.1, 'square', 0.2), 80);
  }, [playTone]);

  const playNotification = useCallback(() => {
    playTone(880, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(1109, 0.15, 'sine', 0.25), 100);
  }, [playTone]);

  return {
    playWin,
    playLoss,
    playClick,
    playBet,
    playNotification,
  };
};

// Hook to subscribe to sound enabled state
export const useSoundEnabled = () => {
  const [enabled, setEnabled] = useState(globalSoundEnabled);

  useEffect(() => {
    const listener = (newEnabled: boolean) => setEnabled(newEnabled);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  return [enabled, setSoundEnabled] as const;
};

export default useSoundEffects;
