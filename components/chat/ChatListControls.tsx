import type { LockFilter, UnreadFilter } from "./ChatListTypes";
import { ChatListUnlockHint } from "./ChatListSlots";

export function ChatListControls({
  q,
  unreadFilter,
  lockFilter,
  headerCount,
  onQueryChange,
  onUnreadFilterChange,
  onLockFilterChange,
  onRefresh,
}: {
  q: string;
  unreadFilter: UnreadFilter;
  lockFilter: LockFilter;
  headerCount: number;
  onQueryChange: (value: string) => void;
  onUnreadFilterChange: (value: UnreadFilter) => void;
  onLockFilterChange: (value: LockFilter) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="border-t border-white/10 bg-black/10 px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-xs">
            <input
              value={q}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Zoek naam, stad, bericht…"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/85 placeholder:text-white/35 outline-none focus:border-emerald-300/40"
            />
          </div>

          <select
            value={unreadFilter}
            onChange={(e) => onUnreadFilterChange(e.target.value as UnreadFilter)}
            className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80 outline-none hover:bg-black/25"
          >
            <option value="all">Alle</option>
            <option value="unread">Ongelezen</option>
          </select>

          <select
            value={lockFilter}
            onChange={(e) => onLockFilterChange(e.target.value as LockFilter)}
            className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80 outline-none hover:bg-black/25"
          >
            <option value="all">Alles</option>
            <option value="locked">Locked</option>
            <option value="unlocked">Unlocked</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-black/30"
            title="Vernieuwen"
          >
            Vernieuwen
          </button>
          <div className="ml-1 text-sm text-white/60">{headerCount} gesprekken</div>
        </div>
      </div>

      <ChatListUnlockHint />
    </div>
  );
}
