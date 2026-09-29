import Link from "next/link";
import type { ReactNode } from "react";
import DiscoverPreferencesOverlay from "@/components/DiscoverPreferencesOverlay";

type ChecklistItem = { title: string; hint: string };

function DiscoverShell({ title, subtitle, children }: { title?: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-3 py-3 sm:px-6 sm:py-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.35rem] font-semibold leading-tight sm:text-2xl">{title || "Discover"}</h1>
          {subtitle ? <p className="mt-0.5 text-[13px] leading-5 text-white/62 sm:text-sm">{subtitle}</p> : null}
        </div>
        <DiscoverPreferencesOverlay />
      </div>
      {children}
    </div>
  );
}


export function AccountPausedState({ title = "Account gepauzeerd", description = "Je bent niet zichtbaar in Discover. Je chats blijven bewaard." }: { title?: string; description?: string } = {}) {
  return (
    <DiscoverShell subtitle="Je account is gepauzeerd.">
      <div className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-400/10 p-6">
        <div className="text-lg font-semibold text-amber-50">{title}</div>
        <p className="mt-2 text-sm text-amber-50/80">
          {description}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/account" className="rounded-2xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300">
            Account opnieuw activeren
          </Link>
          <Link href="/chat" className="rounded-2xl border border-amber-200/20 bg-white/5 px-4 py-2 text-sm text-amber-50 hover:bg-white/10">
            Naar chats
          </Link>
        </div>
      </div>
    </DiscoverShell>
  );
}

export function MissingProfileState() {
  return (
    <DiscoverShell subtitle="Maak je profiel compleet.">
      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-lg font-semibold">Nog niet klaar</div>
        <p className="mt-2 text-sm opacity-75">Vul je profiel en voorkeuren aan.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/onboarding" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
            Naar startflow
          </Link>
          <Link href="/profile/preferences" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
            Naar datingvoorkeuren
          </Link>
        </div>
      </div>
    </DiscoverShell>
  );
}

export function ChecklistState({ checklist }: { checklist: ChecklistItem[] }) {
  return (
    <DiscoverShell subtitle="Nog enkele stappen nodig.">
      <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-400/10 p-6">
        <div className="text-lg font-semibold text-amber-50">Checklist</div>
        <div className="mt-4 grid gap-2">
          {checklist.map((it, i) => (
            <div key={i} className="rounded-2xl border border-amber-200/10 bg-black/10 px-4 py-3">
              <div className="text-sm font-semibold text-amber-50">{it.title}</div>
              <div className="mt-1 text-sm text-amber-50/80">{it.hint}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/onboarding" className="rounded-2xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300">
            Startflow openen
          </Link>
          <Link href="/profile/preferences" className="rounded-2xl border border-amber-200/20 bg-white/5 px-4 py-2 text-sm text-amber-50 hover:bg-white/10">
            Datingvoorkeuren
          </Link>
        </div>
      </section>
    </DiscoverShell>
  );
}

export function VerificationRequiredState({ hasPending }: { hasPending: boolean }) {
  return (
    <DiscoverShell subtitle="Verificatie is nodig voor Discover.">
      <div className="mt-8 rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-6">
        <div className="text-lg font-semibold text-emerald-50">Verificatie vereist</div>
        <p className="mt-2 text-sm text-emerald-50/80">
          {hasPending
            ? "Je verificatie wordt nagekeken."
            : "Start je selfie-verificatie."}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/profile/me" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
            Naar mijn profiel
          </Link>
          {!hasPending ? (
            <Link href="/verify/selfie" className="rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-300">
              Verifieer nu
            </Link>
          ) : (
            <Link href="/profile/me" className="rounded-2xl border border-emerald-200/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-50 hover:bg-emerald-400/15">
              Status bekijken
            </Link>
          )}
        </div>
      </div>
    </DiscoverShell>
  );
}

export function DailyLimitState({ seenUsed, dailyLimit }: { seenUsed: number; dailyLimit: number }) {
  return (
    <DiscoverShell subtitle="Daglimiet bereikt.">
      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-lg font-semibold">Geen profielen meer vandaag</div>
        <p className="mt-2 text-sm leading-6 opacity-75">
          Je zit aan <b>{seenUsed}</b>/{dailyLimit}. Ga verder met je bestaande matches of kom morgen terug.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/chat" className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90">
            Naar chats
          </Link>
          <Link href="/wallet" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
            Depth-tools bekijken
          </Link>
        </div>
      </div>
    </DiscoverShell>
  );
}

export function SlotsFullEmptyState({ activeMatchesCount, slotLimit, queuedCount }: { activeMatchesCount: number; slotLimit: number; queuedCount: number }) {
  return (
    <DiscoverShell subtitle="Je match-slots zijn vol.">
      <div className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-400/10 p-6">
        <div className="text-lg font-semibold text-amber-50">Geen nieuwe matches zichtbaar</div>
        <p className="mt-2 text-sm text-amber-50/80">
          Je hebt <b>{activeMatchesCount}</b>/<b>{slotLimit}</b> actieve matches. Nieuwe matches wachten tot er ruimte is.
        </p>

        <QueuedMatchesText queuedCount={queuedCount} className="mt-4 rounded-2xl border border-amber-200/10 bg-black/10 px-4 py-3 text-sm text-amber-50/85" />

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/chat" className="rounded-2xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300">
            Naar chats
          </Link>
          <Link href="/wallet" className="rounded-2xl border border-amber-200/20 bg-white/5 px-4 py-2 text-sm text-amber-50 hover:bg-white/10">
            Extra slot ontgrendelen
          </Link>
        </div>
      </div>
    </DiscoverShell>
  );
}

function QueuedMatchesText({ queuedCount, className }: { queuedCount: number; className?: string }) {
  if (queuedCount <= 0) return null;
  return (
    <div className={className}>
      Er {queuedCount === 1 ? "wacht" : "wachten"} al <b>{queuedCount}</b> {queuedCount === 1 ? "match" : "matches"}.
    </div>
  );
}

export function SlotsFullNotice({ activeMatchesCount, slotLimit, queuedCount }: { activeMatchesCount: number; slotLimit: number; queuedCount: number }) {
  return (
    <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4">
      <div className="text-sm font-semibold text-amber-50">Match-slots vol</div>
      <div className="mt-1 text-sm text-amber-50/80">
        Je zit aan <b>{activeMatchesCount}</b>/<b>{slotLimit}</b>. Nieuwe matches wachten tot er ruimte is.
      </div>
      <QueuedMatchesText queuedCount={queuedCount} className="mt-2 text-sm text-amber-50/85" />
    </div>
  );
}

function ActiveFilterChip({ label }: { label: string }) {
  return (
    <div className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-50">
      {label}
    </div>
  );
}

export function ActiveFiltersNotice({ labels }: { labels: string[] }) {
  if (!labels.length) return null;
  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 text-xs font-semibold opacity-70">Filters actief</div>
      <div className="flex flex-wrap gap-2">
        {labels.map((label) => (
          <ActiveFilterChip key={label} label={label} />
        ))}
      </div>
    </div>
  );
}

export function StrictFiltersNotice() {
  return (
    <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4">
      <div className="text-sm font-semibold text-amber-50">Geen profielen gevonden</div>
      <div className="mt-1 text-sm leading-6 text-amber-50/80">
        Je filters zijn waarschijnlijk vrij streng. Verruim tijdelijk je afstand, leeftijdsrange of lifestylefilters om te testen of er meer profielen verschijnen.
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/profile/preferences" className="rounded-2xl bg-amber-400 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-300">
          Filters aanpassen
        </Link>
        <Link href="/admin/discover-debug" className="rounded-2xl border border-amber-200/20 bg-white/5 px-4 py-2 text-xs font-semibold text-amber-50 hover:bg-white/10">
          Admin debug
        </Link>
      </div>
    </div>
  );
}

export { DiscoverShell };
