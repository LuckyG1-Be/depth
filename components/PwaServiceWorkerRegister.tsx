"use client";

import { useEffect } from "react";

export default function PwaServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    window.addEventListener("load", () => {
      if (cancelled) return;
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
        console.warn("[pwa] service worker registration failed", error);
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
