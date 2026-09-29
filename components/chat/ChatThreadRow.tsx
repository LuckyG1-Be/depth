import Link from "next/link";
import type { Thread } from "./ChatListTypes";
import { cls, formatThreadStamp, UNLOCK_ALTERNATIONS_TOTAL } from "./ChatListUtils";

export function ThreadRow({ t, now }: { t: Thread; now: Date }) {
  const lastAt = t.lastMessageAt ? new Date(t.lastMessageAt) : null;
  const stamp = lastAt ? formatThreadStamp(lastAt, now) : "";
  const isNewMatch = !t.hasMessages;

  return (
    <Link
      href={`/chat/${t.matchId}`}
      className={cls(
        "group relative flex items-center gap-4 rounded-3xl border p-4 transition",
        t.unreadCount > 0 ? "border-emerald-300/30 bg-emerald-400/10" : "border-white/10 bg-white/5",
        "hover:bg-white/7"
      )}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/25">
        {t.otherFirstPhotoId ? (
          <img
            src={
              t.isUnlocked
                ? `/api/photo/${t.otherFirstPhotoId}?w=160&thumb=1`
                : `/api/photo/preview/${t.otherFirstPhotoId}?w=160&blur=18`
            }
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-400" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate text-lg font-semibold text-white">{t.otherName}</div>
          {isNewMatch ? (
            <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-emerald-100">
              Nieuw
            </span>
          ) : null}

          {t.superlike ? (
            <span className="rounded-full border border-sky-200/20 bg-sky-400/10 px-2 py-0.5 text-xs font-semibold text-sky-100">
              ★ Dieptesignaal
            </span>
          ) : null}

          {t.unreadCount > 0 ? (
            <span className="ml-1 rounded-full bg-emerald-400 px-2 py-0.5 text-xs font-semibold text-black">
              {t.unreadCount}
            </span>
          ) : null}

          <div className="ml-auto text-xs text-white/45">{stamp}</div>
        </div>

        <div className="mt-1 truncate text-sm text-white/65">
          {t.lastMessageText ? t.lastMessageText : isNewMatch ? "Nieuwe match · zeg hallo" : ""}
        </div>

        {t.streakDays && t.streakDays > 0 ? <div className="mt-1 text-xs text-white/45">{t.streakDays} dagen streak</div> : null}
      </div>

      <div className="shrink-0">
        <div
          className={cls(
            "inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs font-semibold",
            t.isUnlocked ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-black/20 text-white/65"
          )}
        >
          <span className={cls("h-1.5 w-1.5 rounded-full", t.isUnlocked ? "bg-emerald-300" : "bg-white/30")} />
          {t.isUnlocked ? "Zichtbaar" : "Verborgen"}
        </div>

        {!t.isUnlocked && typeof t.unlockRemaining === "number" ? (
          <div className="mt-2 flex justify-end gap-1">
            {Array.from({ length: t.unlockTotal || UNLOCK_ALTERNATIONS_TOTAL }).map((_, i) => {
              const total = t.unlockTotal || UNLOCK_ALTERNATIONS_TOTAL;
              const filled = i < total - (t.unlockRemaining || 0);
              return <span key={i} className={cls("h-1.5 w-1.5 rounded-full", filled ? "bg-emerald-300" : "bg-white/15")} />;
            })}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export function ArchivedThreadRow({ t }: { t: Thread }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="truncate text-base font-semibold text-white">{t.otherName}</div>
      <div className="mt-1 truncate text-sm text-white/60">{t.lastMessageText ? t.lastMessageText : "Geen berichten"}</div>
      <div className="mt-2 text-xs text-white/45">Wordt na 1 dag in archief verwijderd.</div>
    </div>
  );
}
