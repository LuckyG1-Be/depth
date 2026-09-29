"use client";

import { useMemo, useState } from "react";
import FeedbackButton from "@/components/FeedbackButton";

const DELETE_CONFIRMATION = "VERWIJDER MIJN ACCOUNT";

type Counts = {
  likesGiven: number;
  likesReceived: number;
  blocksGiven: number;
  reportsGiven: number;
  reportsReceived: number;
  walletPurchases: number;
  walletLedger: number;
  securityEvents: number;
  devices: number;
  activeMatches: number;
  queuedMatches: number;
};

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 py-2 last:border-b-0">
      <span className="text-white/55">{label}</span>
      <span className="font-semibold text-white/85">{value}</span>
    </div>
  );
}

export default function AccountPrivacyCenter({
  email,
  name,
  createdAt,
  counts,
}: {
  email: string;
  name: string;
  createdAt: string;
  counts: Counts;
}) {
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canDelete = confirmation.trim() === DELETE_CONFIRMATION && !deleteBusy;

  const createdLabel = useMemo(() => {
    const d = new Date(createdAt);
    if (!Number.isFinite(d.getTime())) return "—";
    return new Intl.DateTimeFormat("nl-BE", { day: "2-digit", month: "short", year: "numeric" }).format(d);
  }, [createdAt]);

  async function logoutAll() {
    setError(null);
    setSuccess(null);
    setLogoutBusy(true);
    try {
      const res = await fetch("/api/auth/logout-all", { method: "POST", credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Uitloggen mislukt.");
      window.location.href = "/login";
    } catch (e: any) {
      setError(e?.message || "Uitloggen mislukt.");
      setLogoutBusy(false);
    }
  }

  async function deleteAccount() {
    setError(null);
    setSuccess(null);
    if (!canDelete) return;
    setDeleteBusy(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Account verwijderen mislukt.");
      window.location.href = "/register?deleted=1";
    } catch (e: any) {
      setError(e?.message || "Account verwijderen mislukt.");
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="rounded-2xl border border-white/10 bg-[#151320] p-3.5 sm:rounded-3xl sm:p-6">
        <h2 className="text-base font-semibold text-white sm:text-lg">Feedback & hulp</h2>
        <p className="mt-1 text-[13px] leading-5 text-white/58 sm:mt-2 sm:text-sm sm:leading-6">Meld kort wat er beter kan of wat fout loopt.</p>
        <div className="mt-3 sm:mt-4">
          <FeedbackButton variant="card" label="Feedback of bug melden" />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#151320] p-3.5 sm:rounded-3xl sm:p-6">
        <h2 className="text-base font-semibold text-white sm:text-lg">Privacy & data</h2>
        <p className="mt-1 text-[13px] leading-5 text-white/58 sm:mt-2 sm:text-sm sm:leading-6">Download je gegevens of beheer actieve sessies.</p>

        <div className="mt-4 grid gap-2 sm:mt-5 sm:grid-cols-2 sm:gap-3">
          <a href="/api/account/export" className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-3 py-2.5 text-center text-sm font-semibold text-emerald-50 hover:bg-emerald-400/15">
            Download data
          </a>
          <button type="button" onClick={logoutAll} disabled={logoutBusy} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 disabled:opacity-50">
            {logoutBusy ? "Bezig…" : "Alle sessies uitloggen"}
          </button>
        </div>

        <details className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/65 sm:mt-5 sm:p-4">
          <summary className="cursor-pointer select-none font-semibold text-white/85">Wat zit in mijn export?</summary>
          <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
            <Row label="Likes gegeven" value={counts.likesGiven} />
            <Row label="Likes ontvangen" value={counts.likesReceived} />
            <Row label="Actieve matches" value={counts.activeMatches} />
            <Row label="Queued matches" value={counts.queuedMatches} />
            <Row label="Blocks" value={counts.blocksGiven} />
            <Row label="Reports door jou" value={counts.reportsGiven} />
            <Row label="Reports over jou" value={counts.reportsReceived} />
            <Row label="Wallettransacties" value={counts.walletLedger} />
            <Row label="Aankopen" value={counts.walletPurchases} />
            <Row label="Security events" value={counts.securityEvents} />
            <Row label="Apparaten" value={counts.devices} />
            <Row label="Lid sinds" value={createdLabel} />
          </div>
        </details>
      </div>

      <div className="rounded-2xl border border-red-400/20 bg-red-500/[0.06] p-3.5 sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-red-50 sm:text-lg">Account verwijderen</h2>
            <p className="mt-1 text-[13px] leading-5 text-red-50/70 sm:mt-2 sm:text-sm sm:leading-6">Verwijdert je profiel, foto’s, matches, chats en walletgeschiedenis. Dit kan niet ongedaan gemaakt worden.</p>
          </div>
          <button type="button" onClick={() => setDeleteOpen((v) => !v)} className="shrink-0 rounded-2xl border border-red-300/30 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-50 hover:bg-red-400/15">
            {deleteOpen ? "Annuleer" : "Verwijderen"}
          </button>
        </div>

        {deleteOpen ? (
          <div className="mt-5 rounded-2xl border border-red-300/20 bg-black/20 p-4">
            <div className="text-sm text-red-50/75">
              Typ exact <span className="font-semibold text-red-50">{DELETE_CONFIRMATION}</span> voor <span className="font-semibold text-red-50">{name || email}</span>.
            </div>
            <input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-red-300/20 bg-black/30 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/25 focus:border-red-200/50"
              placeholder={DELETE_CONFIRMATION}
            />
            <button
              type="button"
              onClick={deleteAccount}
              disabled={!canDelete}
              className={cls("mt-3 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition", canDelete ? "bg-red-100 text-red-950 hover:bg-white" : "border border-red-300/15 bg-red-400/10 text-red-50/40")}
            >
              {deleteBusy ? "Verwijderen…" : "Definitief verwijderen"}
            </button>
          </div>
        ) : null}

        {error ? <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-950/50 px-4 py-3 text-sm text-red-100">{error}</div> : null}
        {success ? <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">{success}</div> : null}
      </div>
    </div>
  );
}
