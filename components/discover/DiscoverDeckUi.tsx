import SafetyMenu from "@/components/SafetyMenu";
import type { CSSProperties, MutableRefObject, ReactNode } from "react";
import type { DiscoverAction, DiscoverCandidate } from "@/components/discover/DiscoverDeckTypes";

const GREEN = "#66b96c";
const SOFT_RED = "#e46b6b";
const SUPER_BLUE = "#4f7dff";

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function ValueChip({ children, hit }: { children: ReactNode; hit?: boolean }) {
  return (
    <span
      className="max-w-full truncate rounded-full border px-2.5 py-1 text-[11px] sm:px-3 sm:text-sm"
      style={{
        borderColor: hit ? "rgba(102,185,108,0.75)" : "rgba(102,185,108,0.35)",
        background: hit ? "rgba(102,185,108,0.22)" : "rgba(102,185,108,0.10)",
        color: "rgba(255,255,255,0.92)",
        boxShadow: hit ? "0 0 0 1px rgba(102,185,108,0.18) inset" : undefined,
      }}
    >
      {children}
    </span>
  );
}

function PassionChip({ children, hit }: { children: ReactNode; hit?: boolean }) {
  return (
    <span
      className="max-w-full truncate rounded-full border px-2.5 py-1 text-[11px] text-white/80 sm:px-3 sm:text-sm"
      style={{
        borderColor: hit ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.10)",
        background: hit ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
        color: hit ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.80)",
      }}
    >
      {children}
    </span>
  );
}

function MetaChip({ children }: { children: ReactNode }) {
  return <span className="max-w-full truncate rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] text-white/80 backdrop-blur sm:px-3 sm:text-xs">{children}</span>;
}

function LifestyleChip({ children }: { children: ReactNode }) {
  return <span className="max-w-[12.5rem] truncate rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/82 sm:max-w-none sm:px-2.5 sm:py-1 sm:text-xs">{children}</span>;
}

function GradientDivider() {
  return <div className="my-3 h-px w-full bg-white/10 sm:my-5" />;
}

function ScoreRing({ score }: { score: number }) {
  const size = 30;
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} fill="transparent" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={GREEN}
          strokeWidth={stroke}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-white/90">{pct}</div>
    </div>
  );
}

function MatchBadge({ score, onWhy, disabled }: { score: number; onWhy: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onWhy}
      disabled={disabled}
      className="group rounded-2xl border border-white/10 bg-black/34 px-2 py-1.5 backdrop-blur transition hover:bg-black/45 disabled:opacity-60 sm:px-3 sm:py-2"
      title="Waarom matchen?"
      aria-label="Waarom matchen?"
    >
      <div className="flex items-center gap-1.5">
        <ScoreRing score={score} />
        <div className="text-left leading-none">
          <div className="text-[9px] uppercase tracking-wide text-white/56">Match</div>
          <div className="mt-0.5 text-xs font-semibold text-white sm:text-sm">{score}%</div>
          <div className="mt-0.5 text-[9px] font-semibold text-white/56 underline decoration-white/20 group-hover:decoration-white/50">Waarom?</div>
        </div>
      </div>
    </button>
  );
}

function MatchReasonStrip({ reasons, onWhy }: { reasons: string[]; onWhy: () => void }) {
  if (!reasons.length) return null;

  return (
    <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-3 sm:rounded-3xl sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-50/70 sm:text-xs">Waarom interessant</div>
        <button type="button" onClick={onWhy} className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-semibold text-white/75 hover:bg-black/30">
          Details
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
        {reasons.map((reason) => (
          <span key={reason} className="max-w-full truncate rounded-full border border-emerald-200/15 bg-black/20 px-2.5 py-1 text-[11px] text-emerald-50/90 sm:px-3 sm:py-1.5 sm:text-xs">
            {reason}
          </span>
        ))}
      </div>
    </div>
  );
}


export function DiscoverCandidateCard({
  current,
  title,
  cityLine,
  photoSrc,
  imgLoaded,
  onImageLoad,
  cardOut,
  burst,
  busy,
  myValuesSet,
  myPassionsSet,
  expandedQ,
  setExpandedQ,
  qRefs,
  onWhy,
  canSuperlike,
  onAction,
}: {
  current: DiscoverCandidate;
  title: string;
  cityLine: string;
  photoSrc: string | null;
  imgLoaded: boolean;
  onImageLoad: () => void;
  cardOut: string;
  burst: DiscoverAction | null;
  busy: boolean;
  myValuesSet: Set<string>;
  myPassionsSet: Set<string>;
  expandedQ: number | null;
  setExpandedQ: (value: number | null) => void;
  qRefs: MutableRefObject<Array<HTMLButtonElement | null>>;
  onWhy: () => void;
  canSuperlike: boolean;
  onAction: (action: DiscoverAction) => void;
}) {
  const lifestyleItems = [
    current.education ? `🎓 ${current.education}` : null,
    current.smoking === "Ik rook niet" ? "🚭 rookt niet" : current.smoking ? `🚬 ${current.smoking}` : null,
    current.exercise ? `🏃 ${current.exercise}` : null,
    current.drinking ? `🍷 ${current.drinking}` : null,
  ].filter(Boolean) as string[];

  return (
    <div
      className={cls(
        "relative overflow-hidden rounded-[22px] border border-emerald-300/36 sm:rounded-[26px]",
        "bg-white/[0.045] shadow-[0_12px_36px_rgba(0,0,0,0.30),0_0_0_1px_rgba(102,185,108,0.18),0_0_34px_rgba(102,185,108,0.08)] ring-1 ring-emerald-300/16",
        "transition-all duration-300 will-change-transform",
        cardOut
      )}
    >
      {burst ? <ActionBurst kind={burst} /> : null}

      <div className="relative h-[218px] w-full select-none bg-black/20 sm:h-[320px]">
        <div className="absolute right-2.5 top-2.5 z-30 sm:right-4 sm:top-4">
          <SafetyMenu otherUserId={current.id} context="discover" />
        </div>

        {photoSrc ? (
          <>
            <img src={photoSrc} alt="" onLoad={onImageLoad} className="absolute inset-0 h-full w-full scale-[1.06] object-cover blur-[22px] brightness-[0.85]" />
            {!imgLoaded ? <div className="absolute inset-0 animate-pulse bg-white/5" style={{ opacity: 0.06 }} /> : null}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0">
            <div className="h-full w-full bg-gradient-to-b from-white/5 via-black/20 to-black/45" />
            <div className="absolute inset-0 animate-pulse bg-white/5" style={{ opacity: 0.06 }} />
          </div>
        )}

        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 sm:left-4 sm:top-4 sm:gap-2">
          <div className="rounded-2xl border border-white/10 bg-black/34 px-2 py-0.5 text-[9.5px] font-semibold text-white/80 backdrop-blur sm:px-3 sm:py-1.5 sm:text-[11px]">Foto’s verborgen</div>
          {current.isNew ? <div className="rounded-2xl border border-emerald-300/22 bg-emerald-400/12 px-2 py-0.5 text-[9.5px] font-semibold text-emerald-50 backdrop-blur sm:px-3 sm:py-1.5 sm:text-[11px]">Nieuw</div> : null}
        </div>

        <div className="absolute bottom-2.5 right-2.5 z-20 sm:bottom-4 sm:right-4">
          <MatchBadge score={current.score} onWhy={onWhy} disabled={busy} />
        </div>

        <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-4 sm:left-4 sm:right-4">
          <div className="relative inline-block max-w-[74%] rounded-2xl border border-white/10 bg-black/34 px-2.5 py-2 backdrop-blur sm:max-w-full sm:rounded-3xl sm:px-4 sm:py-3">
            <div className="text-[19px] font-semibold leading-tight text-white sm:text-[26px]">{title}</div>
            <div className="mt-0.5 truncate text-[11px] text-white/72 sm:mt-1 sm:text-sm">{cityLine}</div>

            {lifestyleItems.length > 0 ? (
              <div className="mt-1.5 flex max-w-full flex-wrap gap-1 sm:mt-3 sm:gap-1.5">
                {lifestyleItems.map((item) => (
                  <LifestyleChip key={item}>{item}</LifestyleChip>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="hidden border-t border-white/10 bg-[#171421]/78 px-4 py-3 backdrop-blur md:block">
        <div className="flex gap-3">
          <IconPill tone="pass" label="Overslaan" onClick={() => onAction("PASS")} disabled={busy} icon={<XIcon />} />
          <IconPill tone="super" label="Depth" onClick={() => onAction("SUPERLIKE")} disabled={busy || !canSuperlike} icon={<StarIcon />} />
          <IconPill tone="like" label="Like" onClick={() => onAction("LIKE")} disabled={busy} icon={<HeartIcon />} />
        </div>
      </div>

      <div className="border-t border-white/10 bg-[rgba(30,27,39,0.66)] px-3 pb-3 pt-3 backdrop-blur sm:px-7 sm:pb-7 sm:pt-6">
        {current.intent || current.religion ? (
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {current.intent ? <MetaChip>{current.intent}</MetaChip> : null}
            {current.religion ? <MetaChip>{current.religion}</MetaChip> : null}
          </div>
        ) : null}

        <div className="mt-3 sm:mt-4">
          <MatchReasonStrip reasons={current.matchReasons || []} onWhy={onWhy} />
        </div>

        <GradientDivider />

        <div className="grid gap-3 sm:gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-white/55 sm:text-xs">Waarden</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5 sm:mt-2 sm:gap-2">
              {current.values.map((v) => (
                <ValueChip key={v} hit={myValuesSet.has(v)}>{v}</ValueChip>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-white/55 sm:text-xs">Passies</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5 sm:mt-2 sm:gap-2">
              {current.passions.map((p) => (
                <PassionChip key={p} hit={myPassionsSet.has(p)}>{p}</PassionChip>
              ))}
            </div>
          </div>
        </div>

        <GradientDivider />

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-white/55 sm:text-xs">Depth vragen</div>

          <div className="mt-2 grid gap-2.5 sm:mt-3 sm:gap-3">
            {current.q.map((qa, i) => {
              const open = expandedQ === i;
              return (
                <button
                  key={i}
                  ref={(el) => {
                    qRefs.current[i] = el;
                  }}
                  type="button"
                  onClick={() => {
                    setExpandedQ(open ? null : i);
                    setTimeout(() => {
                      qRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 0);
                  }}
                  className="rounded-2xl border border-white/10 bg-black/18 p-2.5 text-left transition hover:bg-black/25 sm:rounded-3xl sm:p-4"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-white/60 sm:text-[11px]">{qa.question}</div>
                  <div className={cls("mt-1.5 text-[13px] leading-relaxed text-white/92 sm:mt-2 sm:text-[15px]", !open && "line-clamp-2")}>
                    <span className="mr-1.5 text-white/60">“</span>
                    {qa.answer}
                    <span className="ml-1.5 text-white/60">”</span>
                  </div>
                  <div className="mt-2 text-[11px] text-white/60 sm:mt-3 sm:text-xs">{open ? "Minder" : "Meer"}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 sm:mt-5">
            <button type="button" onClick={onWhy} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold transition hover:bg-white/10 sm:px-4 sm:py-2 sm:text-xs">
              Waarom matchen?
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3 7 7 .6-5.3 4.6 1.7 7.8L12 18.8 5.6 22 7.3 14.2 2 9.6 9 9z" />
    </svg>
  );
}

function IconPill({ label, onClick, disabled, tone, icon }: { label: string; onClick: () => void; disabled?: boolean; tone: "like" | "super" | "pass"; icon: ReactNode }) {
  const base = "depth-action-button min-h-[46px] flex-1 rounded-[20px] px-2 text-xs font-semibold transition duration-150 active:scale-[0.97] disabled:opacity-45 sm:min-h-[56px] sm:rounded-3xl sm:px-5 sm:text-sm";

  const style: CSSProperties =
    tone === "pass"
      ? { background: "linear-gradient(180deg,#4b2430,#331720)", color: "rgba(255,255,255,0.94)", boxShadow: "0 0 0 1px rgba(228,107,107,0.32) inset, 0 0 20px rgba(228,107,107,0.16)" }
      : tone === "like"
        ? { background: "linear-gradient(180deg,#72cf79,#59b763)", color: "#07150d", boxShadow: "0 0 0 1px rgba(255,255,255,0.16) inset, 0 0 22px rgba(102,185,108,0.30)" }
        : disabled
          ? { background: "linear-gradient(180deg,#222536,#171827)", color: "rgba(255,255,255,0.48)", boxShadow: "0 0 0 1px rgba(79,125,255,0.18) inset" }
          : { background: "linear-gradient(180deg,#2a3a75,#1d2752)", color: "rgba(255,255,255,0.95)", boxShadow: "0 0 0 1px rgba(89,124,255,0.36) inset, 0 0 22px rgba(79,125,255,0.24)" };

  return (
    <button
      type="button"
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onTouchStart={(event) => {
        event.stopPropagation();
      }}
      onTouchEnd={(event) => {
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      className={base}
      style={style}
    >
      <div className="flex items-center justify-center gap-1.5 sm:gap-3">
        <span className="inline-flex">{icon}</span>
        <span>{label}</span>
      </div>
    </button>
  );
}

export function DiscoverActionDock({ busy, canSuperlike, onAction }: { busy: boolean; canSuperlike: boolean; onAction: (action: DiscoverAction) => void }) {
  return (
    <div
      className={cls("depth-action-dock fixed inset-x-3 z-[70] rounded-[26px] bg-[#181521] px-2 py-2 shadow-[0_18px_46px_rgba(0,0,0,0.84)] md:hidden", busy && "pointer-events-none opacity-80")}
      style={{ bottom: "calc(4.95rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-md gap-1.5">
        <IconPill tone="pass" label="Overslaan" onClick={() => onAction("PASS")} disabled={busy} icon={<XIcon />} />
        <IconPill tone="super" label="Depth" onClick={() => onAction("SUPERLIKE")} disabled={busy || !canSuperlike} icon={<StarIcon />} />
        <IconPill tone="like" label="Like" onClick={() => onAction("LIKE")} disabled={busy} icon={<HeartIcon />} />
      </div>
    </div>
  );
}


function ActionBurst({ kind }: { kind: DiscoverAction }) {
  const text = kind === "LIKE" ? "LIKE" : kind === "PASS" ? "OVERSLAAN" : "DEPTH";
  const color = kind === "LIKE" ? GREEN : kind === "PASS" ? SOFT_RED : SUPER_BLUE;
  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
      <div
        className="rounded-3xl px-7 py-4 text-base font-bold tracking-widest shadow-2xl"
        style={{ background: "rgba(17,16,24,0.86)", color, boxShadow: `0 0 0 1px ${color}66 inset, 0 0 36px ${color}55`, transform: "translateY(-10px)", animation: "pop 520ms ease-out forwards" }}
      >
        {text}
      </div>

      <style jsx>{`
        @keyframes pop {
          0% { opacity: 0; transform: translateY(10px) scale(0.92); }
          35% { opacity: 1; transform: translateY(-6px) scale(1.02); }
          100% { opacity: 0; transform: translateY(-28px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
