import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">Privacy</p>
      <h1 className="mt-3 text-4xl font-semibold">Duidelijk over je gegevens.</h1>
      <div className="mt-8 grid gap-4 text-sm leading-6 text-white/70">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5"><h2 className="font-semibold text-white">Waarom we gegevens gebruiken</h2><p className="mt-2">Voor accountbeveiliging, matching, gesprekken, verificatie en het voorkomen van misbruik.</p></section>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5"><h2 className="font-semibold text-white">Jouw keuzes</h2><p className="mt-2">Je kunt je profiel pauzeren, gegevens downloaden en je account verwijderen via je profielpagina.</p></section>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5"><h2 className="font-semibold text-white">Foto’s en verificatie</h2><p className="mt-2">Foto’s worden privé opgeslagen en alleen via beveiligde routes aangeboden. Verificatiegegevens worden alleen gebruikt voor veiligheid en moderatie.</p></section>
      </div>
      <Link href="/profile/me" className="mt-8 inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold">Mijn gegevens beheren</Link>
    </main>
  );
}
