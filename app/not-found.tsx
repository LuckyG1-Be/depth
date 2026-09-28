import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1e1b27] px-6 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-black/20 p-8 text-center">
        <h1 className="text-2xl font-semibold">Pagina niet gevonden</h1>
        <p className="mt-3 text-white/70">Deze pagina bestaat niet of is verplaatst.</p>
        <Link className="mt-6 inline-block rounded-xl bg-white px-4 py-2 font-medium text-zinc-900" href="/">
          Naar home
        </Link>
      </section>
    </main>
  );
}
