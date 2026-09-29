"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, Share, Smartphone } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function isIosLike() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  return /iPad|iPhone|iPod/.test(ua) || (platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
}

export default function PwaInstallCard({ compact = false }: { compact?: boolean }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [busy, setBusy] = useState(false);
  const ios = useMemo(() => isIosLike(), []);

  useEffect(() => {
    setInstalled(isStandalone());

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      setInstalled(true);
      setInstallPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (installed) return;
    if (!installPrompt) {
      setShowSteps(true);
      return;
    }

    setBusy(true);
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setInstallPrompt(null);
      }
    } finally {
      setBusy(false);
    }
  }

  if (installed) {
    return (
      <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/[0.08] p-3.5 text-sm text-emerald-50 sm:rounded-3xl sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-300/15 text-emerald-100">
            <Smartphone size={20} />
          </span>
          <div>
            <div className="font-semibold">Depth staat als app klaar</div>
            <p className="mt-0.5 text-xs leading-5 text-emerald-50/68">Open Depth vanaf je beginscherm voor de meest app-achtige ervaring.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cls("rounded-2xl border border-emerald-300/18 bg-emerald-400/[0.07] p-3.5 sm:rounded-3xl sm:p-5", compact && "sm:p-4")}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-300/14 text-emerald-100 ring-1 ring-emerald-200/20">
          <Smartphone size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-white">Depth als app gebruiken</h2>
          <p className="mt-1 text-[13px] leading-5 text-white/62">
            Zet Depth op je beginscherm. Dan opent de app zonder browserbalk en voelt hij veel meer als een native app.
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
        <button
          type="button"
          onClick={install}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-extrabold text-[#101513] shadow-[0_18px_60px_rgba(95,200,120,0.22)] transition hover:bg-emerald-200 disabled:opacity-60"
        >
          <Download size={18} />
          {busy ? "Openen…" : installPrompt ? "Installeer Depth" : ios ? "Zet op beginscherm" : "Installatie-instructies"}
        </button>
        <button
          type="button"
          onClick={() => setShowSteps((v) => !v)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white/78 hover:bg-white/[0.08]"
        >
          <ExternalLink size={17} />
          Stappen
        </button>
      </div>

      {showSteps || ios ? (
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/18 p-3 text-[13px] leading-5 text-white/68">
          {ios ? (
            <ol className="space-y-2">
              <li className="flex gap-2"><span className="font-semibold text-white">1.</span><span>Open Depth in Safari.</span></li>
              <li className="flex gap-2"><span className="font-semibold text-white">2.</span><span>Tik op de deelknop <Share className="inline-block align-[-3px]" size={15} /> onderaan.</span></li>
              <li className="flex gap-2"><span className="font-semibold text-white">3.</span><span>Kies <span className="font-semibold text-white">Zet op beginscherm</span>.</span></li>
              <li className="flex gap-2"><span className="font-semibold text-white">4.</span><span>Tik op <span className="font-semibold text-white">Voeg toe</span>. Daarna opent Depth als app.</span></li>
            </ol>
          ) : (
            <ol className="space-y-2">
              <li className="flex gap-2"><span className="font-semibold text-white">1.</span><span>Open Depth in Chrome of Edge.</span></li>
              <li className="flex gap-2"><span className="font-semibold text-white">2.</span><span>Tik op <span className="font-semibold text-white">Installeer</span> of gebruik het browsermenu.</span></li>
              <li className="flex gap-2"><span className="font-semibold text-white">3.</span><span>Kies <span className="font-semibold text-white">Toevoegen aan startscherm</span>.</span></li>
            </ol>
          )}
        </div>
      ) : null}
    </div>
  );
}
