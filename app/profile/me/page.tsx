import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import ProfileMeForm from "@/components/ProfileMeForm";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function safeJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function VerifiedCheck({ size = 16 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full border"
      style={{
        width: size + 10,
        height: size + 10,
        borderColor: "rgba(79,125,255,0.45)",
        background: "rgba(79,125,255,0.14)",
      }}
      title="Geverifieerd"
      aria-label="Geverifieerd"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#4f7dff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

export default async function ProfileMePage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  let me = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      city: true,
      gender: true,
      lat: true,
      lng: true,
      placeId: true,
      verified: true,
      isPaused: true,
      profile: {
        select: {
          intent: true,
          religion: true,
          values: true,
          passions: true,
          q1: true,
          q2: true,
          q3: true,
          q4: true,
          q5: true,
        },
      },
      photos: { orderBy: { slot: "asc" }, select: { id: true, slot: true } },
      verificationRequests: {
        where: { status: "PENDING" },
        take: 1,
        select: { id: true },
      },
    },
  });

  if (!me) redirect("/login");

  if (!me.profile) {
    await prisma.profile.create({
      data: {
        userId,
        intent: "Serieuze relatie",
        religion: null,
        values: "[]",
        passions: "[]",
        q1: "",
        q2: "",
        q3: "",
        q4: "",
        q5: "",
      },
    });

    me = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        city: true,
        gender: true,
        lat: true,
        lng: true,
        placeId: true,
        verified: true,
        isPaused: true,
        profile: {
          select: {
            intent: true,
            religion: true,
            values: true,
            passions: true,
            q1: true,
            q2: true,
            q3: true,
            q4: true,
            q5: true,
          },
        },
        photos: { orderBy: { slot: "asc" }, select: { id: true, slot: true } },
        verificationRequests: {
          where: { status: "PENDING" },
          take: 1,
          select: { id: true },
        },
      },
    });

    if (!me?.profile) redirect("/profile/me");
  }

  const photos = (me.photos || []).map((p) => ({
    id: p.id,
    slot: p.slot,
    url: `/api/photo/${p.id}`,
  }));

  const hasPending = !!me.verificationRequests?.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold text-white">Mijn profiel</div>
          <div className="mt-1 text-sm text-white/65">Maak je profiel sterk en volledig.</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
            {me.verified ? (
              <>
                <VerifiedCheck size={16} />
                <div className="text-sm font-semibold text-white/90">Geverifieerd</div>
              </>
            ) : hasPending ? (
              <div className="text-sm font-semibold text-white/80">Verificatie in review</div>
            ) : (
              <div className="text-sm font-semibold text-white/70">Niet geverifieerd</div>
            )}
          </div>

          {!me.verified && !hasPending && (
            <Link
              href="/verify/selfie"
              className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-50 hover:bg-emerald-400/15"
              title="Selfie verificatie"
            >
              Verifieer
            </Link>
          )}
        </div>
      </div>

      <ProfileMeForm
        initial={{
          user: {
            name: me.name || "",
            city: me.city || "",
            gender: me.gender || "",
            isPaused: me.isPaused,
            lat: me.lat ?? null,
            lng: me.lng ?? null,
            placeId: me.placeId ?? null,
          },
          profile: {
            intent: me.profile!.intent ?? "",
            religion: me.profile!.religion ?? "",
            values: safeJsonArray(me.profile!.values),
            passions: safeJsonArray(me.profile!.passions),
            q1: me.profile!.q1 ?? "",
            q2: me.profile!.q2 ?? "",
            q3: me.profile!.q3 ?? "",
            q4: me.profile!.q4 ?? "",
            q5: me.profile!.q5 ?? "",
          },
          photos,
        }}
      />
    </div>
  );
}
