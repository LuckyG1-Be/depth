import Link from "next/link";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

export default function Home() {
  return (
    <div className="grid gap-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-300/15 via-white/5 to-transparent p-7 sm:p-12">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200">Dating met meer betekenis</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-6xl">Ontmoet iemand die je echt begrijpt.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
            Depth koppelt je op waarden, passies en de antwoorden die normaal pas na weken boven komen. Eerst het gesprek, daarna de foto’s.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/register"><Button>Start gratis</Button></Link>
            <Link href="/login"><Button variant="ghost">Ik heb al een account</Button></Link>
          </div>
          <p className="mt-4 text-xs text-white/45">Gratis starten · veilige verificatie · jij bepaalt wat je deelt</p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Kernwaarden eerst", "Ontdek gedeelde waarden en passies vóór oppervlakkige filters."],
          ["Gesprekken met intentie", "Depth-prompts helpen je een gesprek te starten dat ergens over gaat."],
          ["Privacy by design", "Foto’s blijven afgeschermd totdat jullie allebei klaar zijn om ze te openen."],
        ].map(([title, body]) => (
          <Card key={title}>
            <h2 className="font-semibold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">{body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
