"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

const GREEN = "#66b96c";
const SUPER_BLUE = "#4f7dff";
const SOFT_PINK = "#ff7aa2";
const CHAMPAGNE = "#f4e7c7";

function safeShapeFromText(txt: string) {
  // canvas-confetti >= 1.6.0 has shapeFromText
  const anyConfetti = confetti as any;
  if (typeof anyConfetti.shapeFromText === "function") {
    return anyConfetti.shapeFromText({ text: txt, scalar: 1.35 });
  }
  return undefined;
}

/**
 * Branding-heavy, dating-ish confetti when a match is created in Discover.
 * - Bigger + longer + heart shapes + your green/blue palette
 */
export function DiscoverMatchConfetti({ fire }: { fire: boolean }) {
  useEffect(() => {
    if (!fire) return;

    const heartShape = safeShapeFromText("♥");

    const colors = [GREEN, SUPER_BLUE, SOFT_PINK, CHAMPAGNE];

    const start = Date.now();
    const durationMs = 1800; // ✅ longer

    // Bigger base burst (center-top)
    const bigBurst = () => {
      confetti({
        particleCount: 120,
        spread: 95,
        startVelocity: 44,
        gravity: 0.95,
        ticks: 260,
        scalar: 1.15,
        origin: { x: 0.5, y: 0.32 },
        colors,
      });

      confetti({
        particleCount: 70,
        spread: 120,
        startVelocity: 38,
        gravity: 1.05,
        ticks: 280,
        scalar: 0.95,
        origin: { x: 0.5, y: 0.32 },
        colors,
      });
    };

    // Heart layer (dating vibe)
    const hearts = () => {
      const shape = heartShape ? [heartShape] : ["circle"];
      confetti({
        particleCount: 55,
        spread: 80,
        startVelocity: 36,
        gravity: 0.85,
        ticks: 320,
        scalar: 1.25,
        origin: { x: 0.5, y: 0.35 },
        colors: [SOFT_PINK, CHAMPAGNE, GREEN],
        shapes: shape,
      });
    };

    // Side pops (adds “wow” without being the heavy unlock animation)
    const sidePops = () => {
      confetti({
        particleCount: 55,
        angle: 60,
        spread: 70,
        startVelocity: 34,
        gravity: 1.0,
        ticks: 260,
        scalar: 1.0,
        origin: { x: 0.15, y: 0.45 },
        colors,
      });

      confetti({
        particleCount: 55,
        angle: 120,
        spread: 70,
        startVelocity: 34,
        gravity: 1.0,
        ticks: 260,
        scalar: 1.0,
        origin: { x: 0.85, y: 0.45 },
        colors,
      });
    };

    // Execute sequence
    bigBurst();
    hearts();
    sidePops();

    // Sustained sparkle stream (longer linger)
    const interval = window.setInterval(() => {
      const t = Date.now() - start;
      if (t > durationMs) return;

      // gentle stream from top-center with hearts sprinkled in
      const shape = heartShape ? [heartShape, "circle"] : ["circle"];
      confetti({
        particleCount: 18,
        spread: 60,
        startVelocity: 22,
        gravity: 0.9,
        ticks: 220,
        scalar: 0.9,
        origin: { x: 0.5 + (Math.random() * 0.12 - 0.06), y: 0.28 },
        colors,
        shapes: shape,
      });
    }, 180);

    // One last “finale” near the end
    const finale = window.setTimeout(() => {
      confetti({
        particleCount: 90,
        spread: 110,
        startVelocity: 40,
        gravity: 1.0,
        ticks: 320,
        scalar: 1.1,
        origin: { x: 0.5, y: 0.30 },
        colors,
        shapes: heartShape ? [heartShape, "circle"] : ["circle"],
      });
    }, 900);

    const stop = window.setTimeout(() => {
      window.clearInterval(interval);
    }, durationMs + 50);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(finale);
      window.clearTimeout(stop);
    };
  }, [fire]);

  return null;
}