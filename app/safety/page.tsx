import Link from "next/link";

export default function SafetyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">Veiligheid</p>
      <h1 className="mt-3 text-4xl font-semibold">Jij houdt de controle.</h1>
      <p className="mt-4 leading-7 text-white/65">Depth is ontworpen om rustig contact op te bouwen. Deel alleen wat goed voelt en neem de tijd om iemand te leren kennen.</p>
      <div className="mt-8 grid gap-4">
        {[["Rapporteer of blokkeer", "Gebruik het veiligheidsmenu in een match bij ongewenst gedrag, spam of twijfel."], ["Deel geen gevoelige gegevens", "Geef nooit je wachtwoord, financiële gegevens of exacte thuisadres door."], ["Foto’s zijn afgeschermd", "Foto’s worden pas zichtbaar wanneer jullie allebei voldoende betekenisvol hebben geantwoord."], ["Verificatie is geen garantie", "Een badge helpt tegen nepaccounts, maar vervangt je eigen oordeel niet."]].map(([title, body]) => <section key={title} className="rounded-3xl border border-white/10 bg-white/5 p-5"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-white/65">{body}</p></section>)}
      </div>
      <div className="mt-8 flex flex-wrap gap-3"><Link href="/profile/me" className="rounded-2xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-black">Naar mijn profiel</Link><Link href="/privacy" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold">Privacy-informatie</Link></div>
    </main>
  );
}
