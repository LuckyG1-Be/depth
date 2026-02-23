import { Card } from "@/components/Card";
import Link from "next/link";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const error = searchParams?.error;

  const message =
    error === "invalid"
      ? "Onjuiste logingegevens. Controleer je e-mailadres en wachtwoord."
      : error === "blocked"
      ? "Je account is geblokkeerd."
      : null;

  return (
    <main className="min-h-screen w-full bg-black px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-start justify-center sm:items-center">
        <Card className="w-full max-w-md">
          <h1 className="text-xl font-semibold text-zinc-50">Login</h1>

          {message && (
            <div className="mt-4 rounded-xl border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-200">
              {message}
            </div>
          )}

          <form action="/api/auth/login" method="post" className="mt-4 grid gap-3">
            <input
              type="email"
              name="email"
              placeholder="E-mailadres"
              required
              autoComplete="email"
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
            />

            <input
              type="password"
              name="password"
              placeholder="Wachtwoord"
              required
              autoComplete="current-password"
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
            />

            <button
              type="submit"
              className="rounded-xl bg-white px-4 py-2 font-medium text-zinc-900 hover:bg-zinc-200"
            >
              Inloggen
            </button>
          </form>

          <p className="mt-4 text-sm text-zinc-400">
            Nog geen account?{" "}
            <Link href="/register" className="underline text-zinc-100">
              Registreer hier
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}



