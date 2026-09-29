"use client";

import Image from "next/image";

const BG = "#1e1b27";
const GREEN = "#66b96c";

export default function BootOverlays() {
  return (
    <>
      <style>{`
        /* Timeline:
          0.00s: show + fade in quickly
          0.15s: content animates
          0.85s: start fade out
          1.20s: hard hide (visibility + pointer-events)
        */

        @keyframes depthSplashFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes depthLogoIn {
          0% { opacity: 0; transform: translateY(10px) scale(0.94); filter: blur(10px); }
          60% { opacity: 1; transform: translateY(0) scale(1.02); filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes depthGlowDriftA {
          0% { transform: translate(-8%, -6%) scale(1.05); opacity: .22; }
          50% { transform: translate(6%, 4%) scale(1.12); opacity: .30; }
          100% { transform: translate(-8%, -6%) scale(1.05); opacity: .22; }
        }
        @keyframes depthGlowDriftB {
          0% { transform: translate(10%, 8%) scale(1.08); opacity: .18; }
          50% { transform: translate(-6%, -4%) scale(1.16); opacity: .26; }
          100% { transform: translate(10%, 8%) scale(1.08); opacity: .18; }
        }

        @keyframes depthLoadBar {
          0% { transform: translateX(-70%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(70%); }
        }

        @keyframes depthDots {
          0% { opacity: .25; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-1px); }
          100% { opacity: .25; transform: translateY(0); }
        }

        @keyframes depthVignettePulse {
          0%,100% { opacity: .62; }
          50% { opacity: .74; }
        }

        @keyframes depthFadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }

        /* Hard hide (non-animatable props are applied at keyframe boundaries) */
        @keyframes depthHardHide {
          to { visibility: hidden; pointer-events: none; }
        }

        .depth-splash {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${BG};
          /* Initial visible */
          visibility: visible;
          pointer-events: auto;

          /* Fade in, then fade out, then hard-hide */
          animation:
            depthSplashFadeIn 120ms ease-out 0ms both,
            depthFadeOut 320ms ease-in 850ms both,
            depthHardHide 0s linear 1200ms forwards;
        }

        .depth-glowA {
          position: absolute;
          inset: -20%;
          background:
            radial-gradient(900px 700px at 30% 35%, rgba(102,185,108,0.22), transparent 60%),
            radial-gradient(1000px 760px at 70% 60%, rgba(102,185,108,0.16), transparent 62%);
          filter: blur(10px);
          animation: depthGlowDriftA 1600ms ease-in-out infinite;
        }

        .depth-glowB {
          position: absolute;
          inset: -20%;
          background:
            radial-gradient(920px 720px at 65% 30%, rgba(255,255,255,0.08), transparent 58%),
            radial-gradient(1100px 820px at 40% 75%, rgba(102,185,108,0.12), transparent 64%);
          filter: blur(14px);
          mix-blend-mode: screen;
          animation: depthGlowDriftB 1900ms ease-in-out infinite;
        }

        .depth-vignette {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(1200px 900px at 50% 45%, transparent 40%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.75) 100%);
          animation: depthVignettePulse 1600ms ease-in-out infinite;
        }

        .depth-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          padding: 0 24px;
        }

        .depth-logo {
          animation: depthLogoIn 520ms ease-out 80ms both;
        }

        .depth-barWrap {
          width: 280px;
          max-width: 78vw;
        }

        .depth-barOuter {
          position: relative;
          height: 10px;
          overflow: hidden;
          border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.25);
        }

        .depth-barInner {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 55%;
          border-radius: 9999px;
          background: linear-gradient(90deg, rgba(102,185,108,0.0), rgba(102,185,108,0.95), rgba(102,185,108,0.0));
          animation: depthLoadBar 520ms ease-in-out infinite;
        }

        .depth-dots {
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 11px;
          letter-spacing: 0.06em;
          color: rgba(255,255,255,0.45);
        }
      `}</style>

      <div className="depth-splash" aria-hidden="true">
        <div className="depth-glowA" />
        <div className="depth-glowB" />
        <div className="depth-vignette" />

        <div className="depth-content">
          <div className="depth-logo">
            <Image src="/depth-logo.svg" alt="Depth" width={260} height={260} priority />
          </div>

          <div className="depth-barWrap">
            <div className="depth-barOuter">
              <div className="depth-barInner" />
            </div>

            <div className="depth-dots">
              <span style={{ animation: "depthDots 650ms ease-in-out infinite" }}>•</span>
              <span style={{ animation: "depthDots 650ms ease-in-out infinite 120ms" }}>•</span>
              <span style={{ animation: "depthDots 650ms ease-in-out infinite 240ms" }}>•</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
