import type { ChatSlotsUi, SlotPillState } from "./ChatListTypes";
import { cls, UNLOCK_ALTERNATIONS_TOTAL } from "./ChatListUtils";
import { LockIcon, OpenLockIcon } from "./ChatListIcons";

function SlotPill({ label, state }: { label: string; state: SlotPillState }) {
  const base = "flex h-11 w-28 items-center justify-center rounded-2xl border text-sm font-semibold";
  if (state === "filled") {
    return <div className={cls(base, "border-emerald-300/30 bg-emerald-400/15 text-emerald-50")}>{label}</div>;
  }
  if (state === "free") {
    return <div className={cls(base, "border-white/12 bg-white/5 text-white/70")}>{label}</div>;
  }
  if (state === "extra") {
    return <div className={cls(base, "border-emerald-200/20 bg-emerald-400/10 text-emerald-50/90")}>{label}</div>;
  }
  return (
    <div className={cls(base, "border-white/10 bg-black/20 text-white/45")}>
      <LockIcon className="mr-2 h-4 w-4 text-white/40" />
      <span>{label}</span>
    </div>
  );
}

export function ChatListSlotsPanel({ slotsUi }: { slotsUi: ChatSlotsUi }) {
  return (
    <div className="px-5 py-4">
      <div className="text-sm font-semibold text-white/85">Match-slots</div>

      <div className="mt-3 flex flex-wrap gap-2">
        {slotsUi.pills.map((p) => (
          <SlotPill key={p.key} label={p.label} state={p.state} />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="text-sm text-white/70">
          <span className="font-semibold text-white/85">{slotsUi.activeUsed}</span>/{slotsUi.free} actief
          {slotsUi.unlockedExtra > 0 ? (
            <span className="text-white/50">
              {" "}
              • +{slotsUi.unlockedExtra} extra slot{slotsUi.unlockedExtra === 1 ? "" : "s"} actief
            </span>
          ) : (
            <span className="text-white/50"> • extra slots via wallet</span>
          )}
        </div>

        <div className="ml-auto text-xs text-white/45">
          <span className="inline-flex items-center gap-1">
            <OpenLockIcon className="h-4 w-4 text-emerald-300/70" />
            <span>vrij/bezet</span>
          </span>
          <span className="mx-2">·</span>
          <span className="inline-flex items-center gap-1">
            <LockIcon className="h-4 w-4 text-white/40" />
            <span>extra via tokens</span>
          </span>
        </div>
      </div>

      {slotsUi.waitingText ? <div className="mt-2 text-sm text-amber-200/90">{slotsUi.waitingText}</div> : null}
    </div>
  );
}

export function ChatListUnlockHint() {
  return (
    <div className="mt-2 text-sm text-white/60">
      Foto’s worden zichtbaar na <b className="text-white/80">{UNLOCK_ALTERNATIONS_TOTAL} veilige wissels</b>.
    </div>
  );
}
