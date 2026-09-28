import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isPlusStatus } from "@/lib/stripe";
import PlusActions from "@/components/PlusActions";

const benefits = [
  "Onbeperkt teruggaan na een pass",
  "Geavanceerde compatibiliteitsfilters",
  "Incognito ontdekken",
  "Meer inzicht in je profiel en matches",
];

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PlusPage({ searchParams }: { searchParams?: { checkout?: string } }) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const subscription = await prisma.subscription.findUnique({ where: { userId: session.user.id }, select: { status: true, currentPeriodEnd: true, cancelAtPeriodEnd: true } });
  const active = isPlusStatus(subscription?.status);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">Depth Plus</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Meer controle over wie je ontmoet.</h1>
        <p className="mt-4 text-base leading-7 text-white/65">
          De kern van Depth blijft gratis. Plus geeft je extra controle en filters wanneer je de app vaker gebruikt.
        </p>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-emerald-300/25 bg-emerald-400/10 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Plus</h2>
              <p className="mt-1 text-sm text-white/60">Voor mensen die bewuster willen daten.</p>
            </div>
            <span className="rounded-full border border-emerald-200/25 bg-emerald-200/10 px-3 py-1 text-xs font-semibold text-emerald-100">Binnenkort</span>
          </div>
          <ul className="mt-7 grid gap-4">
            {benefits.map((benefit) => <li key={benefit} className="flex gap-3 text-sm text-white/85"><span className="text-emerald-300">✓</span>{benefit}</li>)}
          </ul>
          {searchParams?.checkout === "success" ? <p className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100">Betaling ontvangen. Je Plus-status wordt automatisch geactiveerd.</p> : null}
          {searchParams?.checkout === "cancelled" ? <p className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">Geen probleem — er is niets aangerekend.</p> : null}
          {active ? <p className="mt-5 text-sm text-emerald-200">Je hebt Plus{subscription?.cancelAtPeriodEnd ? " en het loopt af aan het einde van je huidige periode" : " actief"}.</p> : null}
          <PlusActions hasSubscription={active} />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-white">Wat gratis blijft</h2>
          <ul className="mt-5 grid gap-3 text-sm text-white/70">
            <li>✓ Profiel aanmaken en verfijnen</li>
            <li>✓ Ontdekken en matchen</li>
            <li>✓ Gewone gesprekken</li>
            <li>✓ Veiligheid, rapportage en accountcontrole</li>
          </ul>
          <Link href="/discover" className="mt-8 inline-flex rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/85 hover:bg-white/10">Terug naar Discover</Link>
        </section>
      </div>
    </main>
  );
}
