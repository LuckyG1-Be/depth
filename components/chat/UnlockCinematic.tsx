"use client";

import { useEffect } from "react";
import { cls, tinyChime, vib } from "./utils";

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 22 }).map((_, i) => (
        <div
          key={i}
          className="absolute top-[-12px] h-2 w-3 rounded-sm opacity-80"
          style={{
            left: `${(i * 100) / 22}%`,
            background:
              i % 3 === 0 ? "rgba(52,211,153,0.85)" : i % 3 === 1 ? "rgba(96,165,250,0.85)" : "rgba(255,255,255,0.65)",
            transform: `rotate(${(i * 37) % 180}deg)`,
            animation: `confettiFall ${1600 + (i % 6) * 120}ms ease-in ${i * 18}ms forwards`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(110vh) rotate(240deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default function UnlockCinematic({
  open,
  name,
  previewSrcs,
  onDone,
  playHaptics,
  playSound,
  showConfetti,
  setPlayHaptics,
  setPlaySound,
}: {
  open: boolean;
  name: string;
  previewSrcs: string[];
  onDone: () => void;
  playHaptics: boolean;
  playSound: boolean;
  showConfetti: boolean;
  setPlayHaptics: (v: boolean) => void;
  setPlaySound: (v: boolean) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (playHaptics) vib(20);
    if (playSound) tinyChime();

    const t = window.setTimeout(() => onDone(), 2400);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open, onDone, playHaptics, playSound]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-6">
      <div className="relative w-[min(760px,92vw)] overflow-hidden rounded-3xl border border-white/10 bg-[#1e1b27] p-6 shadow-2xl">
        {showConfetti ? <Confetti /> : null}

        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />
        <div className="absolute -right-48 -bottom-48 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-white">Unlocked ✨</div>
            <div className="mt-1 text-sm text-white/75">
              Je kan nu de foto’s van <b>{name}</b> zien.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPlaySound(!playSound)}
              className={cls(
                "rounded-2xl border px-3 py-2 text-xs font-semibold",
                playSound ? "border-blue-400/30 bg-blue-400/10 text-blue-100" : "border-white/10 bg-white/5 text-white/70"
              )}
              title="Sound"
              type="button"
            >
              🔊
            </button>
            <button
              onClick={() => setPlayHaptics(!playHaptics)}
              className={cls(
                "rounded-2xl border px-3 py-2 text-xs font-semibold",
                playHaptics ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/5 text-white/70"
              )}
              title="Trillen"
              type="button"
            >
              📳
            </button>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-3">
          {previewSrcs.map((s, i) => (
            <div
              key={i}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-black/20"
              style={{ animation: `revealPop 520ms ease ${i * 110}ms both` }}
            >
              <img src={s} alt="" className="h-36 w-full object-cover" />
              <style jsx>{`
                @keyframes revealPop {
                  0% {
                    transform: translateY(10px) scale(0.98);
                    opacity: 0;
                  }
                  100% {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                  }
                }
              `}</style>
            </div>
          ))}
        </div>

        <button
          onClick={onDone}
          className="relative mt-6 w-full rounded-2xl border border-emerald-400/30 bg-emerald-400/15 px-4 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-400/20"
          type="button"
        >
          Oké
        </button>
      </div>
    </div>
  );
}
