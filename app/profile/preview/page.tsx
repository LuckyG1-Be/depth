import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

function list(raw: string | null | undefined) {
  try {
    const value = JSON.parse(raw || "[]");
    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export const dynamic = "force-dynamic";

export default async function ProfilePreviewPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true, city: true, gender: true, verified: true,
      profile: { select: { intent: true, religion: true, values: true, passions: true, q1: true, q2: true, q3: true, q4: true, q5: true } },
      photos: { orderBy: { slot: "asc" }, take: 3, select: { id: true } },
    },
  });
  if (!user) redirect("/login");

  const profile = user.profile;
  const answers = [profile?.q1, profile?.q2, profile?.q3, profile?.q4, profile?.q5].filter((answer): answer is string => Boolean(answer?.trim()));

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Zo ziet iemand jou</p><h1 className="mt-2 text-3xl font-semibold">Profielpreview</h1></div>
        <Link href="/profile/me" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10">Profiel bewerken</Link>
      </div>

      <section className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
        <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-6">
          {user.photos.length ? user.photos.map((photo) => <img key={photo.id} src={`/api/photo/${photo.id}`} alt="" className="h-64 w-full rounded-3xl object-cover" />) : <div className="grid h-64 place-items-center rounded-3xl border border-dashed border-white/15 text-sm text-white/45 sm:col-span-3">Voeg foto’s toe om je profiel sterker te maken.</div>}
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2"><h2 className="text-3xl font-semibold">{user.name}</h2>{user.verified ? <span className="rounded-full border border-blue-300/25 bg-blue-400/10 px-3 py-1 text-xs text-blue-100">Geverifieerd</span> : null}</div>
          <p className="mt-2 text-white/60">{user.city || "Locatie nog niet ingevuld"}{user.gender ? ` · ${user.gender}` : ""}</p>
          {profile?.intent ? <p className="mt-5 text-sm text-emerald-100">{profile.intent}</p> : null}
          <div className="mt-6 flex flex-wrap gap-2">{list(profile?.values).map((item) => <span key={item} className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-50">{item}</span>)}{list(profile?.passions).map((item) => <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/75">{item}</span>)}</div>
          {answers.length ? <div className="mt-8 grid gap-3">{answers.map((answer, index) => <blockquote key={`${answer}-${index}`} className="rounded-2xl border border-white/10 bg-black/15 p-4 text-sm leading-6 text-white/80">{answer}</blockquote>)}</div> : <p className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">Beantwoord enkele Depth-vragen om meer van jezelf te laten zien.</p>}
        </div>
      </section>
    </main>
  );
}
