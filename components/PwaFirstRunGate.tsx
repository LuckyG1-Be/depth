"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
const BYPASS_KEY = "depth:pwa-browser-bypass";

function standalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

export default function PwaFirstRunGate() {
  const [ready, setReady] = useState(false);
  const [browserMode, setBrowserMode] = useState(false);
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [state, setState] = useState<"idle" | "prompted" | "installed">("idle");

  useEffect(() => {
    if (standalone()) { window.location.replace("/discover"); return; }
    setBrowserMode(window.localStorage.getItem(BYPASS_KEY) === "1");
    setReady(true);
    const onPrompt = (event: Event) => { event.preventDefault(); setPrompt(event as InstallEvent); };
    const onInstalled = () => { setState("installed"); window.localStorage.removeItem(BYPASS_KEY); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  async function install() {
    if (!prompt) { setState("prompted"); return; }
    await prompt.prompt();
    const result = await prompt.userChoice;
    setState(result.outcome === "accepted" ? "installed" : "idle");
    setPrompt(null);
  }

  if (!ready) return <main className="min-h-[100svh] bg-[#17141f]" />;
  return <main className="min-h-[100svh] overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(105,220,137,.22),transparent_34%),#17141f] px-5 py-[max(24px,env(safe-area-inset-top))] text-white"><section className="mx-auto flex min-h-[calc(100svh-48px)] w-full max-w-md flex-col justify-between gap-8"><div className="pt-4"><img src="/logo.png" alt="Depth" className="h-auto w-44 max-w-[62vw]" /><p className="mt-2 text-sm font-medium text-[#73d98f]">Matching minds before faces</p></div><div className="depth-card rounded-[2rem] p-6 shadow-[0_24px_80px_rgba(0,0,0,.35)]"><div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#68d982]/30 bg-[#68d982]/15 text-2xl text-[#73d98f]">⌂</div><p className="depth-eyebrow text-[#9bc9a8]">Installeer Depth</p><h1 className="mt-3 text-4xl font-black leading-[1.04] tracking-[-.05em]">Gebruik Depth als app.</h1><p className="mt-4 text-base leading-7 text-white/72">Depth werkt het best vanaf je beginscherm: zonder browserbalk, sneller bereikbaar en rustiger op mobiel.</p><div className="mt-6 space-y-3 text-sm text-white/76"><div className="rounded-2xl border border-white/10 bg-black/16 p-3">✓ Open Discover meteen als app-scherm.</div><div className="rounded-2xl border border-white/10 bg-black/16 p-3">✓ Betere mobiele focus tijdens profielen, chat en profielbeheer.</div></div><button type="button" onClick={install} className="mt-6 w-full rounded-2xl bg-[#67d783] px-5 py-4 text-base font-black text-[#07130c] shadow-[0_0_34px_rgba(103,215,131,.24)] transition active:scale-[.99]">{state === "installed" ? "Depth is geïnstalleerd" : "Depth installeren"}</button>{state === "prompted" && !prompt ? <p className="mt-4 rounded-2xl border border-white/10 bg-black/16 p-3 text-sm leading-6 text-white/68">Open het browsermenu en kies ‘App installeren’ of ‘Toevoegen aan startscherm’.</p> : null}</div><div className="pb-[max(10px,env(safe-area-inset-bottom))] text-center">{!browserMode ? <button type="button" onClick={() => { window.localStorage.setItem(BYPASS_KEY, "1"); setBrowserMode(true); }} className="text-sm font-semibold text-white/48 underline-offset-4 hover:text-white/72 hover:underline">Depth in de webbrowser gebruiken.</button> : <div className="space-y-3 rounded-[1.7rem] border border-white/10 bg-white/[.045] p-4"><p className="text-sm text-white/58">Je gebruikt Depth nu tijdelijk in de browser.</p><div className="grid grid-cols-2 gap-3"><Link href="/login" className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-center text-sm font-black text-white">Inloggen</Link><Link href="/register" className="rounded-2xl bg-[#67d783] px-4 py-3 text-center text-sm font-black text-[#07130c]">Registreren</Link></div></div>}</div></section></main>;
}
