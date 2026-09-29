import Link from "next/link";

export default function AccountActionsSection({
  confirmDeleteOpen,
  deleting,
  exportAccountData,
  deleteAccount,
  setConfirmDeleteOpen,
}: {
  confirmDeleteOpen: boolean;
  deleting: boolean;
  exportAccountData: () => void;
  deleteAccount: () => void;
  setConfirmDeleteOpen: (open: boolean) => void;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-lg font-semibold">Account</h2>
      <p className="mt-1 text-sm opacity-75">Beheer je account acties.</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link href="/logout" className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10">
          Uitloggen
        </Link>

        <button
          type="button"
          onClick={exportAccountData}
          className="inline-flex items-center justify-center rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-50 hover:bg-emerald-400/15"
        >
          Download mijn gegevens
        </button>

        <button
          type="button"
          onClick={() => setConfirmDeleteOpen(true)}
          className="inline-flex items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/15"
        >
          Account verwijderen
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
        Volgens de Belgische en Europese privacyregels kan je hier je gegevens exporteren en je account verwijderen. Bekijk ook het{" "}
        <Link href="/privacy" className="font-semibold text-white underline underline-offset-4">
          privacybeleid
        </Link>{" "}
        voor bewaartermijnen, rechten en contact.
      </div>

      {confirmDeleteOpen ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-sm font-semibold">Zeker?</div>
          <div className="mt-1 text-sm opacity-75">Dit verwijdert je account en data permanent.</div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" disabled={deleting} onClick={deleteAccount} className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {deleting ? "Verwijderen..." : "Ja, verwijder"}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => setConfirmDeleteOpen(false)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 disabled:opacity-60"
            >
              Annuleer
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
