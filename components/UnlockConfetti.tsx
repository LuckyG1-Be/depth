"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function UnlockConfetti({ fire }: { fire: boolean }) {
  useEffect(() => {
    if (!fire) return;

    const end = Date.now() + 800;
    const tick = () => {
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.25 },
      });
      if (Date.now() < end) requestAnimationFrame(tick);
    };
    tick();
  }, [fire]);

  return null;
}
