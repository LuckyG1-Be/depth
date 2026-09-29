"use client";

import Link from "next/link";

export default function WalletPageClient({ initialPurchaseId: _initialPurchaseId = null }: { initialPurchaseId?: string | null }) {
  return (
    <div className="mx-auto max-w-2xl p-4 text-white">
      <section className="rounded-[30px] border border-emerald-300/20 bg-emerald-400/[0.07] p-5">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100/80">Binnenkort beschikbaar</div>
        <h1 className="mt-4 text-3xl font-semibold">Premium komt later</h1>
        <p className="mt-3 text-sm leading-6 text-white/70">Depth is bij de lancering volledig gratis. Extra functies worden later toegevoegd.</p>
        <Link href="/discover" className="mt-5 inline-flex rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-[#102016]">Verder naar Discover</Link>
      </section>
    </div>
  );
}
