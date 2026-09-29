import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const error = (await searchParams)?.error;

  const message =
    error === "invalid"
      ? "Onjuiste logingegevens. Controleer je e-mailadres en wachtwoord."
      : error === "blocked"
      ? "Je account is geblokkeerd."
      : null;

  return (
    <main className="min-h-screen w-full bg-[#1e1b27] px-4 py-[max(24px,env(safe-area-inset-top))] sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100svh-3rem)] max-w-6xl items-center justify-center">
        <Card className="w-full max-w-md p-5 sm:p-6">
          <div className="mb-6 text-center"><img src="/depth-logo.svg" alt="Depth" className="mx-auto h-14 w-auto" /><p className="mt-4 text-sm font-medium text-emerald-100/85">Diepere matches. Foto’s pas na echte connectie.</p></div>

          {message && (
            <div className="mb-4 rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm text-red-50">
              {message}
            </div>
          )}

          <form action="/api/auth/login" method="post" className="grid gap-3">
            <input
              type="email"
              name="email"
              placeholder="E-mailadres"
              required
              autoComplete="email"
              className="depth-input w-full px-4 py-3 text-sm placeholder:text-white/30"
            />

            <input
              type="password"
              name="password"
              placeholder="Wachtwoord"
              required
              autoComplete="current-password"
              className="depth-input w-full px-4 py-3 text-sm placeholder:text-white/30"
            />

            <Button type="submit" className="w-full">Inloggen</Button>
          </form>

          <div className="mt-5 flex flex-col gap-2 text-center text-sm text-white/50">
            Nog geen account?{" "}
            <Link href="/register" className="font-semibold text-white underline decoration-white/25 underline-offset-4">
              Registreer
            </Link>
            <p className="text-xs text-white/35">Depth is bij de lancering gratis te gebruiken.</p>
          </div>
        </Card>
      </div>
    </main>
  );
}

