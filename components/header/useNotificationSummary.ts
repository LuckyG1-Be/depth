"use client";

import { useEffect, useRef, useState } from "react";
import { emptySummary, type NotificationSummary } from "@/components/header/HeaderTypes";

const DEFAULT_NOTIFICATION_POLL_MS = 45_000;
const ACTIVE_NOTIFICATION_POLL_MS = 25_000;
const QUIET_NOTIFICATION_POLL_MS = 90_000;

function normalizedPollDelay(summary: NotificationSummary | null) {
  const raw = summary?.nextPollMs;
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.min(120_000, Math.max(15_000, raw));
  return summary?.badgeCount ? ACTIVE_NOTIFICATION_POLL_MS : QUIET_NOTIFICATION_POLL_MS;
}

async function fetchNotificationSummary(signal?: AbortSignal): Promise<NotificationSummary | null> {
  const res = await fetch("/api/notifications/summary", { cache: "no-store", signal }).catch(() => null);
  if (!res || !res.ok) return null;
  const data = (await res.json().catch(() => null)) as NotificationSummary | null;
  if (!data?.ok) return null;
  return data;
}

export function useNotificationSummary(enabled: boolean) {
  const [summary, setSummary] = useState<NotificationSummary>(() => emptySummary());
  const [summaryLoading, setSummaryLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const summaryTimerRef = useRef<number | null>(null);
  const summaryInFlightRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    function clearSummaryTimer() {
      if (summaryTimerRef.current) window.clearTimeout(summaryTimerRef.current);
      summaryTimerRef.current = null;
    }

    async function loadSummary() {
      if (summaryInFlightRef.current) return;
      if (typeof document !== "undefined" && document.hidden) return;

      const ac = new AbortController();
      abortRef.current = ac;
      summaryInFlightRef.current = true;
      setSummaryLoading(true);

      const data = await fetchNotificationSummary(ac.signal).catch(() => null);
      if (!cancelled && data) setSummary(data);
      if (!cancelled) setSummaryLoading(false);
      summaryInFlightRef.current = false;
      if (abortRef.current === ac) abortRef.current = null;
      if (!cancelled && typeof document !== "undefined" && !document.hidden) requestSummary(normalizedPollDelay(data));
    }

    function requestSummary(delayMs = 0) {
      clearSummaryTimer();
      summaryTimerRef.current = window.setTimeout(() => {
        summaryTimerRef.current = null;
        void loadSummary();
      }, delayMs);
    }

    requestSummary(0);

    const onChange = () => requestSummary(350);
    const onFocus = () => requestSummary(0);
    const onVisibility = () => {
      if (!document.hidden) requestSummary(0);
    };

    window.addEventListener("depth:threads-changed", onChange);
    window.addEventListener("depth:wallet-changed", onChange);
    window.addEventListener("depth:notifications-changed", onChange);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    const t = window.setInterval(() => {
      if (!document.hidden) requestSummary(0);
    }, DEFAULT_NOTIFICATION_POLL_MS * 4);

    return () => {
      cancelled = true;
      clearSummaryTimer();
      abortRef.current?.abort();
      abortRef.current = null;
      summaryInFlightRef.current = false;
      window.clearInterval(t);
      window.removeEventListener("depth:threads-changed", onChange);
      window.removeEventListener("depth:wallet-changed", onChange);
      window.removeEventListener("depth:notifications-changed", onChange);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled]);

  return { summary, summaryLoading };
}
