import confetti from 'canvas-confetti';

/**
 * Fires a celebratory confetti burst from the center
 */
export function fireConfetti(enabled: boolean = true): void {
  if (!enabled) return;

  try {
    confetti({
      particleCount: 65,
      spread: 60,
      origin: { y: 0.75 },
      colors: ['#10b981', '#34d399', '#6ee7b7', '#fcd34d', '#38bdf8'],
      ticks: 200,
      gravity: 1.1,
      decay: 0.94,
      scalar: 1,
    });
  } catch {
    // Graceful fallback
  }
}

/**
 * Super celebratory fireworks for completing 100% of the challenge target
 */
export function fireGrandCelebration(enabled: boolean = true): void {
  if (!enabled) return;

  try {
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#fbbf24', '#60a5fa'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#34d399', '#f43f5e', '#a855f7'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  } catch {
    // Graceful fallback
  }
}
