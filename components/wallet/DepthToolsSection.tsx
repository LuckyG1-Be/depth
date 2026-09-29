import Link from "next/link";
import DepthTokenIcon, { renderToolIcon } from "./DepthTokenIcon";
import ToolTile from "./ToolTile";
import type { Limits, Snapshot, ToolCostItem } from "./types";
import { CHAT_TOOL_KEYS, cls, fmtDateTimeNL, toolNote, TOOL_DESCRIPTIONS, TOOL_LABELS, WALLET_FEATURE_KEYS } from "./utils";

type Props = {
  toolItems: ToolCostItem[];
  limits: Limits | null;
  snapshot: Snapshot | null;
  availableTotal: number;
  matchExtCount: number;
  matchExtMax: number;
  canActivateMoreMatchSlots: boolean;
  extBusy: boolean;
  lifestyleBusy: boolean;
  extendMatchSlot: () => void;
  unlockLifestyle: () => void;
};

function findTool(items: ToolCostItem[], key: string) {
  return items.find((item) => String(item.toolKey || "").toUpperCase() === key) ?? null;
}

function InsufficientHint({ show }: { show: boolean }) {
  if (!show) return null;
  return <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] leading-5 text-white/55">Te weinig saldo.</div>;
}

export default function DepthToolsSection({
  toolItems,
  limits,
  snapshot,
  availableTotal,
  matchExtCount,
  matchExtMax,
  canActivateMoreMatchSlots,
  extBusy,
  lifestyleBusy,
  extendMatchSlot,
  unlockLifestyle,
}: Props) {
  const chatTools = CHAT_TOOL_KEYS.map((key) => findTool(toolItems, key)).filter(Boolean) as ToolCostItem[];
  const walletFeatures = WALLET_FEATURE_KEYS.map((key) => findTool(toolItems, key)).filter(Boolean) as ToolCostItem[];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-white/85">Tools & voordelen</div>
          <div className="mt-1 text-sm leading-6 text-white/55">Chattools open je in een match. Voordelen activeer je hier.</div>
        </div>

        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10">
          <DepthTokenIcon className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-5">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">In de chat</div>
            <Link href="/chat" className="text-xs font-semibold text-emerald-100/85 hover:text-emerald-50">
              Chats ›
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {chatTools.map((it) => {
              const key = String(it.toolKey || "").toUpperCase();
              const affordable = availableTotal >= Number(it.cost || 0);

              return (
                <ToolTile
                  key={key}
                  title={TOOL_LABELS[key] ?? key}
                  cost={it.cost}
                  description={TOOL_DESCRIPTIONS[key] ?? null}
                  note={null}
                  icon={renderToolIcon(key)}
                  badge={affordable ? null : "Te weinig saldo"}
                  footerText="Beschikbaar vanuit een matchchat."
                />
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/42">Activeer nu</div>

          <div className="grid gap-3 md:grid-cols-2">
            {walletFeatures.map((it) => {
              const key = String(it.toolKey || "").toUpperCase();
              const cost = Number(it.cost || 0);
              const affordable = availableTotal >= cost;

              if (key === "MATCH_SLOT_EXTENSION") {
                const nextEnding = snapshot?.matchExtEndsAtList?.length ? snapshot.matchExtEndsAtList[0] : snapshot?.matchExtEndsAt ?? null;
                const disabled = extBusy || !canActivateMoreMatchSlots || !affordable;

                return (
                  <ToolTile
                    key={key}
                    title={TOOL_LABELS[key] ?? key}
                    cost={it.cost}
                    description={TOOL_DESCRIPTIONS[key] ?? null}
                    note={toolNote(key, limits?.matchSlotHours ?? 24, limits?.lifestyleFiltersDurationDays ?? 28)}
                    icon={renderToolIcon(key)}
                    badge={matchExtCount > 0 ? `${matchExtCount}/${matchExtMax} actief` : affordable ? null : "Te weinig saldo"}
                    activeText={nextEnding ? `Eerstvolgende extra slot loopt af op ${fmtDateTimeNL(nextEnding)}.` : null}
                  >
                    <button
                      type="button"
                      onClick={() => void extendMatchSlot()}
                      disabled={disabled}
                      className={cls(
                        "w-full rounded-2xl border px-4 py-2.5 text-sm font-semibold transition",
                        !disabled ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/20" : "border-white/10 bg-white/5 text-white/40",
                        extBusy ? "opacity-70" : ""
                      )}
                    >
                      {!canActivateMoreMatchSlots ? "Maximum bereikt" : !affordable ? "Te weinig tokens" : extBusy ? "Even…" : "Activeer"}
                    </button>
                    <InsufficientHint show={!affordable && canActivateMoreMatchSlots} />
                  </ToolTile>
                );
              }

              if (key === "LIFESTYLE_FILTERS") {
                const active = Boolean(snapshot?.lifestyleActive);
                const disabled = lifestyleBusy || active || !affordable;

                return (
                  <ToolTile
                    key={key}
                    title={TOOL_LABELS[key] ?? key}
                    cost={it.cost}
                    description={TOOL_DESCRIPTIONS[key] ?? null}
                    note={toolNote(key, limits?.matchSlotHours ?? 24, limits?.lifestyleFiltersDurationDays ?? 28)}
                    icon={renderToolIcon(key)}
                    badge={active ? "Actief" : affordable ? null : "Te weinig saldo"}
                    activeText={snapshot?.lifestyleUntil ? `Actief tot ${fmtDateTimeNL(snapshot.lifestyleUntil)}.` : null}
                  >
                    <button
                      type="button"
                      onClick={() => void unlockLifestyle()}
                      disabled={disabled}
                      className={cls(
                        "w-full rounded-2xl border px-4 py-2.5 text-sm font-semibold transition",
                        !disabled ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/20" : "border-white/10 bg-white/5 text-white/40",
                        lifestyleBusy ? "opacity-70" : ""
                      )}
                    >
                      {active ? "Actief" : !affordable ? "Te weinig tokens" : lifestyleBusy ? "Even…" : "Activeer"}
                    </button>
                    <InsufficientHint show={!affordable && !active} />
                  </ToolTile>
                );
              }

              return null;
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
