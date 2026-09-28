"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1e1b27] px-6 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-black/20 p-8 text-center">
        <h1 className="text-2xl font-semibold">Er ging iets mis</h1>
        <p className="mt-3 text-white/70">Probeer de pagina opnieuw te laden.</p>
        <button className="mt-6 rounded-xl bg-white px-4 py-2 font-medium text-zinc-900" onClick={() => reset()}>
          Opnieuw proberen
        </button>
      </section>
    </main>
  );
}
