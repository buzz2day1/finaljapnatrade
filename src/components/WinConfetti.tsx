import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface WinConfettiProps {
  trigger: boolean;
  amount: number;
}

const WinConfetti = ({ trigger, amount }: WinConfettiProps) => {
  useEffect(() => {
    if (!trigger) return;

    // Fire confetti from both sides
    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const defaults = { 
      startVelocity: 30, 
      spread: 360, 
      ticks: 60, 
      zIndex: 9999,
      colors: ['#10b981', '#34d399', '#fbbf24', '#f59e0b', '#ffffff']
    };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Left side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });

      // Right side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, [trigger, amount]);

  return null;
};

export default WinConfetti;
