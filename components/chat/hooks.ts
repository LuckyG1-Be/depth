"use client";

import { useEffect, useState } from "react";

// Hydration-safe "now": first render returns 0 both server+client, then updates on client.
export function useNow(tickMs: number = 60_000) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(id);
  }, [tickMs]);

  return now;
}

export function useIsCoarsePointer() {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    try {
      const mq = window.matchMedia("(pointer: coarse)");
      const on = () => setCoarse(Boolean(mq.matches));
      on();
      mq.addEventListener?.("change", on);
      return () => mq.removeEventListener?.("change", on);
    } catch {
      return;
    }
  }, []);
  return coarse;
}
