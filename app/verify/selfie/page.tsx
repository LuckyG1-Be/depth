"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Status = "boot" | "capturing" | "preview" | "submitting" | "done" | "error";

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const POSES = [
  "Kijk recht in de camera",
  "Kijk duidelijk naar links",
  "Toon 2 vingers",
] as const;

type PoseItem = {
  pose: string;
  dataUrl: string | null;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type FaceDetectorLike = {
  detectForVideo: (videoFrame: any, timestamp: number) => any;
};

type FaceCenter = { cx: number; cy: number };
type FaceInfo = FaceCenter & { bw: number; bh: number };

type Quality = {
  ok: boolean;
  level: "good" | "warn";
  label: string;
  detail?: string;
};

const COUNTDOWN_SECONDS = 10;

export default function VerifySelfiePage() {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const detectorRef = useRef<FaceDetectorLike | null>(null);
  const [detectorReady, setDetectorReady] = useState(false);

  const [status, setStatus] = useState<Status>("boot");
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<PoseItem[]>(() =>
    POSES.map((p) => ({ pose: p, dataUrl: null }))
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const [camReady, setCamReady] = useState(false);
  const [camW, setCamW] = useState(0);
  const [camH, setCamH] = useState(0);

  // UI centering for video preview
  const [ox, setOx] = useState(50);
  const [oy, setOy] = useState(38);
  const oxRef = useRef(50);
  const oyRef = useRef(38);
  useEffect(() => {
    oxRef.current = ox;
  }, [ox]);
  useEffect(() => {
    oyRef.current = oy;
  }, [oy]);

  const objectPos = `${ox}% ${oy}%`;

  const [autoSnap, setAutoSnap] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  const lastFaceCenterRef = useRef<FaceCenter | null>(null);
  const lastFaceInfoRef = useRef<FaceInfo | null>(null);

  const rafRef = useRef<number | null>(null);

  // ✅ lock to avoid concurrent MediaPipe calls
  const detectBusyRef = useRef(false);

  // MediaPipe requires strictly increasing timestamps
  const mpTsRef = useRef<number>(0);
  function mpTimestamp(inputTs: number) {
    const t = Math.floor(inputTs);
    const next = Math.max(mpTsRef.current + 1, t);
    mpTsRef.current = next;
    return next;
  }

  // Countdown control
  const countdownTimerRef = useRef<number | null>(null);
  const countdownDeadlineRef = useRef<number | null>(null);
  const countdownActiveRef = useRef(false);

  // guard against double-snap (manual + auto at the same time)
  const snapInFlightRef = useRef(false);

  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [quality, setQuality] = useState<Quality>({
    ok: false,
    level: "warn",
    label: "Camera starten…",
  });

  // modal after submit
  const [showSubmittedModal, setShowSubmittedModal] = useState(false);

  const tips = useMemo(
    () => [
      "Goed licht (geen tegenlicht).",
      "Geen zonnebril/kap.",
      "Zorg dat je gezicht volledig in beeld is.",
      `Auto-snap: we nemen sowieso na ${COUNTDOWN_SECONDS}s een foto (je kan altijd eerder zelf nemen).`,
    ],
    []
  );

  const active = items[activeIndex];
  const completed = items.filter((x) => !!x.dataUrl).length;
  const allDone = completed === items.length;
  const isLast = activeIndex === items.length - 1;

  function stopCountdown() {
    countdownActiveRef.current = false;
    countdownDeadlineRef.current = null;
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);
  }

  function startCountdown() {
    if (!autoSnap) return;
    if (status !== "capturing") return;
    if (!camReady || !detectorReady) return;

    if (countdownActiveRef.current) return;

    countdownActiveRef.current = true;

    const end = Date.now() + COUNTDOWN_SECONDS * 1000;
    countdownDeadlineRef.current = end;
    setCountdown(COUNTDOWN_SECONDS);

    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);

    countdownTimerRef.current = window.setInterval(() => {
      const deadline = countdownDeadlineRef.current;
      if (!deadline) {
        stopCountdown();
        return;
      }

      const remainingMs = deadline - Date.now();
      const remainingSec = Math.ceil(remainingMs / 1000);

      if (remainingSec <= 0) {
        // ✅ at 0: ALWAYS snap (no restart)
        stopCountdown();
        if (status === "capturing") void snap();
        return;
      }

      setCountdown(remainingSec);
    }, 200);
  }

  async function loadFaceDetector() {
    try {
      const vision = await import("@mediapipe/tasks-vision");
      const { FaceDetector, FilesetResolver } = vision as any;

      const wasmFileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      const modelAssetPath =
        "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite";

      const detector = await FaceDetector.createFromOptions(wasmFileset, {
        baseOptions: { modelAssetPath },
        runningMode: "VIDEO",
        minDetectionConfidence: 0.55,
      });

      detectorRef.current = detector;
      setDetectorReady(true);
    } catch {
      setDetectorReady(false);
      setError("Face-centering kon niet laden. Controleer internet en herlaad.");
    }
  }

  async function startCamera() {
    setError(null);
    setStatus("capturing");
    setCamReady(false);
    setCamW(0);
    setCamH(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;

      const v = videoRef.current;
      if (!v) return;

      v.srcObject = stream;

      await new Promise<void>((resolve) => {
        const onMeta = () => {
          v.removeEventListener("loadedmetadata", onMeta);
          resolve();
        };
        v.addEventListener("loadedmetadata", onMeta);
      });

      await v.play().catch(() => {});
      await new Promise((r) => setTimeout(r, 80));

      const vw = v.videoWidth;
      const vh = v.videoHeight;

      if (!vw || !vh) {
        setCamReady(false);
        setStatus("error");
        setError("Camera is nog aan het opstarten. Herlaad en probeer opnieuw.");
        return;
      }

      setCamW(vw);
      setCamH(vh);
      setCamReady(true);
    } catch {
      setStatus("error");
      setError("Kon camera niet openen. Geef toestemming of probeer een andere browser.");
    }
  }

  function stopCamera() {
    stopCountdown();
    const s = streamRef.current;
    if (s) for (const t of s.getTracks()) t.stop();
    streamRef.current = null;
  }

  function pickBestFaceInfo(detections: any, vw: number, vh: number): FaceInfo | null {
    const list = detections?.detections;
    if (!Array.isArray(list) || list.length === 0) return null;

    let best = list[0];
    let bestArea = 0;

    for (const d of list) {
      const bb = d?.boundingBox;
      if (!bb) continue;
      const w = Number(bb.width || 0);
      const h = Number(bb.height || 0);
      const area = w * h;
      if (area > bestArea) {
        bestArea = area;
        best = d;
      }
    }

    const bb = best?.boundingBox;
    if (!bb) return null;

    const x = Number(bb.originX || 0);
    const y = Number(bb.originY || 0);
    const w = Number(bb.width || 0);
    const h = Number(bb.height || 0);

    const cx = x + w / 2;
    const cy = y + h / 2;

    if (!isFinite(cx) || !isFinite(cy)) return null;
    if (cx < 0 || cy < 0 || cx > vw || cy > vh) return null;

    return { cx, cy, bw: w, bh: h };
  }

  function computeBrightness(v: HTMLVideoElement) {
    let c = analysisCanvasRef.current;
    if (!c) {
      c = document.createElement("canvas");
      analysisCanvasRef.current = c;
    }
    const w = 32;
    const h = 32;
    c.width = w;
    c.height = h;

    const ctx = c.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | null;
    if (!ctx) return 0.5;

    ctx.drawImage(v, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h).data;

    let sum = 0;
    for (let i = 0; i < img.length; i += 4) {
      sum += 0.2126 * img[i] + 0.7152 * img[i + 1] + 0.0722 * img[i + 2];
    }
    const avg = sum / (w * h) / 255;
    return clamp(avg, 0, 1);
  }

  function faceIsInsideSafeFrame(face: { cx: number; cy: number }, vw: number, vh: number): boolean {
    const pad = 0.11;
    const left = vw * pad;
    const right = vw * (1 - pad);
    const top = vh * pad;
    const bottom = vh * (1 - pad);
    return face.cx >= left && face.cx <= right && face.cy >= top && face.cy <= bottom;
  }

  function evaluateQuality(face: FaceInfo | null, vw: number, vh: number, brightness01: number): Quality {
    if (!camReady) return { ok: false, level: "warn", label: "Camera starten…" };
    if (!detectorReady) return { ok: false, level: "warn", label: "Face-centering laden…" };

    if (!face) {
      return { ok: false, level: "warn", label: "Geen gezicht", detail: "Kijk naar de camera en zorg voor meer licht." };
    }

    if (brightness01 < 0.18) return { ok: false, level: "warn", label: "Te donker", detail: "Draai naar het licht." };

    const faceRatio = face.bh / vh;
    if (faceRatio < 0.18) return { ok: false, level: "warn", label: "Te ver", detail: "Kom dichter bij de camera." };
    if (faceRatio > 0.62) return { ok: false, level: "warn", label: "Te dichtbij", detail: "Ga iets verder." };

    if (!faceIsInsideSafeFrame(face, vw, vh)) {
      return { ok: false, level: "warn", label: "Centreer", detail: "Zorg dat je gezicht binnen het kader staat." };
    }

    return { ok: true, level: "good", label: "Goed", detail: "Je kan nu wachten of zelf meteen nemen." };
  }

  function resetForPose() {
    lastFaceCenterRef.current = null;
    lastFaceInfoRef.current = null;
    stopCountdown();
    setQuality({ ok: false, level: "warn", label: "Zoeken…" });
  }

  async function updateLoop(rafTs: number) {
    const v = videoRef.current;
    if (!v) return;
    if (!camReady || !detectorReady || status !== "capturing") return;
    if (detectBusyRef.current) return;

    const detector = detectorRef.current;
    if (!detector) return;

    const vw = camW;
    const vh = camH;
    if (!vw || !vh) return;

    detectBusyRef.current = true;
    try {
      const ts = mpTimestamp(rafTs);
      const res = detector.detectForVideo(v, ts);
      const face = pickBestFaceInfo(res, vw, vh);

      const brightness01 = computeBrightness(v);
      const q = evaluateQuality(face, vw, vh, brightness01);
      setQuality(q);

      if (face) {
        lastFaceCenterRef.current = { cx: face.cx, cy: face.cy };
        lastFaceInfoRef.current = face;

        // update preview centering
        const nextOx = clamp(Math.round((face.cx / vw) * 100), 0, 100);
        const nextOy = clamp(Math.round((face.cy / vh) * 100) - 6, 0, 100);
        setOx(nextOx);
        setOy(nextOy);
      } else {
        lastFaceCenterRef.current = null;
        lastFaceInfoRef.current = null;
      }

      // ✅ countdown should start immediately per pose
      if (autoSnap) startCountdown();
      else stopCountdown();
    } catch {
      setAutoSnap(false);
      setQuality({ ok: false, level: "warn", label: "Detector error", detail: "Herlaad de pagina." });
      setError("Er ging iets mis met face-detectie. Herlaad en probeer opnieuw.");
      stopCountdown();
    } finally {
      detectBusyRef.current = false;
    }
  }

  function tick(ts: number) {
    void updateLoop(ts);
    rafRef.current = requestAnimationFrame(tick);
  }

  function getCropCenterFromFaceOrFallback() {
    const face = lastFaceInfoRef.current;
    if (face && camW > 0 && camH > 0) {
      const useOx = clamp(Math.round((face.cx / camW) * 100), 0, 100);
      const useOy = clamp(Math.round((face.cy / camH) * 100) - 6, 0, 100);
      return { useOx, useOy };
    }
    // fallback: last known object-position (or default)
    return { useOx: oxRef.current, useOy: oyRef.current };
  }

  async function snap() {
    setError(null);

    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;

    if (!camReady || camW <= 0 || camH <= 0) {
      setError("Camera is nog niet klaar. Wacht even en probeer opnieuw.");
      return;
    }
    if (!detectorReady) {
      setError("Face-centering is nog aan het laden. Wacht even.");
      return;
    }
    if (status !== "capturing") return;

    // prevent collisions: auto + manual spam
    if (snapInFlightRef.current) return;
    snapInFlightRef.current = true;

    // prevent snap while detector is mid-call
    if (detectBusyRef.current) {
      snapInFlightRef.current = false;
      return;
    }
    detectBusyRef.current = true;

    try {
      const { useOx, useOy } = getCropCenterFromFaceOrFallback();
      setOx(useOx);
      setOy(useOy);

      const vw = camW;
      const vh = camH;

      const outW = 900;
      const outH = 1125; // 4:5
      c.width = outW;
      c.height = outH;

      const ctx = c.getContext("2d") as CanvasRenderingContext2D | null;
      if (!ctx) return;

      const targetAR = outW / outH;

      let cropW = vw;
      let cropH = Math.round(cropW / targetAR);
      if (cropH > vh) {
        cropH = vh;
        cropW = Math.round(cropH * targetAR);
      }

      cropW = Math.round(cropW * 0.9);
      cropH = Math.round(cropH * 0.9);

      cropW = clamp(cropW, 1, vw);
      cropH = clamp(cropH, 1, vh);

      const centerX = Math.round((vw * useOx) / 100);
      const centerY = Math.round((vh * useOy) / 100);

      const sx = clamp(centerX - Math.round(cropW / 2), 0, vw - cropW);
      const sy = clamp(centerY - Math.round(cropH / 2), 0, vh - cropH);

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, outW, outH);
      ctx.drawImage(v, sx, sy, cropW, cropH, 0, 0, outW, outH);

      const dataUrl = c.toDataURL("image/jpeg", 0.9);

      setItems((prev) => {
        const next = [...prev];
        next[activeIndex] = { ...next[activeIndex], dataUrl };
        return next;
      });

      setStatus("preview");
      stopCountdown();
    } finally {
      detectBusyRef.current = false;
      snapInFlightRef.current = false;
    }
  }

  function goToIndex(i: number) {
    setError(null);
    setActiveIndex(clamp(i, 0, items.length - 1));
    resetForPose();
    setStatus("capturing");
  }

  function redoCurrent() {
    setError(null);
    setItems((prev) => {
      const next = [...prev];
      next[activeIndex] = { ...next[activeIndex], dataUrl: null };
      return next;
    });
    resetForPose();
    setStatus("capturing");
  }

  function continueAfterPreview() {
    setError(null);
    if (isLast) void submit();
    else goToIndex(activeIndex + 1);
  }

  async function submit() {
    setError(null);
    if (!allDone) {
      setError("Neem eerst alle selfies (alle poses).");
      return;
    }

    setStatus("submitting");
    stopCountdown();

    const payload = {
      selfies: items.map((x) => ({ pose: x.pose, dataUrl: x.dataUrl })),
    };

    const res = await fetch("/api/verify/id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      const err = String(data?.error || "VERIFY_FAILED");
      setStatus("error");
      if (err === "NO_PROFILE_PHOTO") setError("Upload eerst minstens 1 profielfoto, en probeer opnieuw.");
      else if (err === "TRY_LATER") setError("Te veel pogingen. Probeer later opnieuw.");
      else if (err === "NEED_MORE_SELFIES") setError("Je moet meerdere selfies in verschillende poses nemen.");
      else setError("Verificatie-aanvraag mislukt. Probeer opnieuw.");
      return;
    }

    setStatus("done");
    stopCamera();
    setShowSubmittedModal(true);
  }

  useEffect(() => {
    loadFaceDetector();
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    if (camReady && detectorReady && status === "capturing") {
      resetForPose();
      if (autoSnap) startCountdown();
      rafRef.current = requestAnimationFrame(tick);
    } else {
      stopCountdown();
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      stopCountdown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camReady, detectorReady, status, autoSnap, activeIndex]);

  const canSnap = camReady && detectorReady && status !== "submitting";
  const poseLabel = `pose ${activeIndex + 1}/${items.length}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-7 flex items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold text-white">Selfie verificatie</div>
          <div className="mt-1 text-sm text-white/70">
            2 opties: neem zelf een foto wanneer jij wil, of laat ons na {COUNTDOWN_SECONDS}s automatisch een foto nemen.
          </div>
        </div>
        <Link
          href="/profile/me"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
        >
          Terug
        </Link>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-white/90">Huidige pose</div>
            <div className="mt-1 inline-flex rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-50">
              {active.pose}
            </div>
            <div className="mt-2 text-sm text-white/70">
              Progress: <span className="font-semibold text-white/85">{completed}</span> / {items.length}
            </div>

            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/70">
              {tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>

            <div className="mt-3 flex items-center gap-3 text-xs text-white/60">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoSnap}
                  onChange={(e) => setAutoSnap(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-black/30"
                />
                Auto-snap
              </label>
              <span>
                Face-centering:{" "}
                {detectorReady ? <span className="text-emerald-200">actief</span> : <span className="text-white/40">laden…</span>}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => goToIndex(activeIndex - 1)}
              disabled={activeIndex === 0 || status === "submitting"}
              className={cls(
                "rounded-2xl border px-4 py-2 text-sm font-semibold transition",
                activeIndex === 0 || status === "submitting"
                  ? "cursor-not-allowed border-white/5 bg-white/5 text-white/40"
                  : "border-white/10 bg-black/20 text-white/85 hover:bg-white/10"
              )}
            >
              Vorige
            </button>
            <button
              type="button"
              onClick={() => goToIndex(activeIndex + 1)}
              disabled={activeIndex === items.length - 1 || status === "submitting"}
              className={cls(
                "rounded-2xl border px-4 py-2 text-sm font-semibold transition",
                activeIndex === items.length - 1 || status === "submitting"
                  ? "cursor-not-allowed border-white/5 bg-white/5 text-white/40"
                  : "border-white/10 bg-black/20 text-white/85 hover:bg-white/10"
              )}
            >
              Volgende
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {/* CAMERA */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="mb-2 text-xs font-semibold text-white/60">Live camera</div>

            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30">
              <div className="aspect-[4/5] w-full">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                  style={{ objectPosition: objectPos }}
                />
              </div>

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-[78%] w-[78%] rounded-[2rem] border border-white/20" />
              </div>

              {countdown !== null && autoSnap && status === "capturing" && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="rounded-3xl border border-white/15 bg-black/40 px-8 py-5 text-5xl font-extrabold text-white">
                    {countdown}
                  </div>
                </div>
              )}

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={() => void snap()}
                disabled={!canSnap}
                className={cls(
                  "w-full rounded-2xl border px-4 py-2 text-sm font-semibold transition",
                  !canSnap
                    ? "cursor-not-allowed border-white/5 bg-white/5 text-white/40"
                    : "border-emerald-300/35 bg-emerald-400/10 text-emerald-50 hover:bg-emerald-400/15"
                )}
              >
                {!camReady
                  ? "Camera opstarten…"
                  : !detectorReady
                    ? "Face-centering laden…"
                    : `Selfie nemen (${poseLabel})`}
              </button>

              <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div
                      className={cls(
                        "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                        quality.level === "good"
                          ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-50"
                          : "border-amber-300/30 bg-amber-400/10 text-amber-50"
                      )}
                    >
                      {quality.label}
                    </div>
                    {quality.detail && <div className="mt-1 text-xs text-white/60">{quality.detail}</div>}
                  </div>

                  <div className="text-[11px] text-white/45">{autoSnap ? "Auto (10s)" : "Manual"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* PREVIEW */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="mb-2 text-xs font-semibold text-white/60">Preview</div>

            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30">
              <div className="aspect-[4/5] w-full">
                {active.dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={active.dataUrl} alt="Selfie preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-white/40">
                    Neem een selfie voor deze pose.
                  </div>
                )}
              </div>

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-[78%] w-[78%] rounded-[2rem] border border-white/15" />
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={redoCurrent}
                disabled={!active.dataUrl || status === "submitting"}
                className={cls(
                  "flex-1 rounded-2xl border px-4 py-2 text-sm font-semibold transition",
                  !active.dataUrl || status === "submitting"
                    ? "cursor-not-allowed border-white/5 bg-white/5 text-white/40"
                    : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                )}
              >
                Opnieuw
              </button>

              <button
                type="button"
                onClick={continueAfterPreview}
                disabled={!active.dataUrl || status === "submitting"}
                className={cls(
                  "flex-1 rounded-2xl border px-4 py-2 text-sm font-semibold transition",
                  !active.dataUrl || status === "submitting"
                    ? "cursor-not-allowed border-white/5 bg-white/5 text-white/40"
                    : isLast
                      ? "border-sky-300/35 bg-sky-400/10 text-sky-50 hover:bg-sky-400/15"
                      : "border-emerald-300/35 bg-emerald-400/10 text-emerald-50 hover:bg-emerald-400/15"
                )}
              >
                {status === "submitting" ? "Indienen…" : isLast ? "Indienen" : "Doorgaan"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-semibold text-white/90">Overzicht</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {items.map((x, i) => (
              <button
                key={x.pose}
                type="button"
                onClick={() => goToIndex(i)}
                className={cls(
                  "rounded-2xl border p-3 text-left transition",
                  i === activeIndex ? "border-emerald-300/35 bg-emerald-400/10" : "border-white/10 bg-black/20 hover:bg-white/10"
                )}
              >
                <div className="text-xs font-semibold text-white/70">{x.pose}</div>
                <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                  {x.dataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={x.dataUrl} alt="thumb" className="h-24 w-full object-cover" />
                  ) : (
                    <div className="flex h-24 items-center justify-center text-xs text-white/40">Nog niet</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {status === "error" && error && (
          <div className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 p-4">
            <div className="text-sm font-semibold text-red-100">{error}</div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* ✅ Submitted Modal */}
      {showSubmittedModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#151320] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-white">Verificatie ingediend ✅</div>
                <div className="mt-1 text-sm text-white/70">
                  Je aanvraag is succesvol verstuurd. Een admin bekijkt je selfies en vergelijkt ze met je profielfoto’s.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSubmittedModal(false);
                  router.push("/profile/me");
                }}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowSubmittedModal(false);
                  router.push("/profile/me");
                }}
                className="flex-1 rounded-2xl border border-emerald-300/35 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-50 hover:bg-emerald-400/15"
              >
                Terug naar Mijn profiel
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSubmittedModal(false);
                  router.push("/discover");
                }}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
              >
                Naar Discover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
