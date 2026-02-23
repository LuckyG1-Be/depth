import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { computeMatchScore } from "@/lib/matching";
import DiscoverDeck, { type DiscoverCandidate } from "@/components/DiscoverDeck";
import DiscoverPreferencesOverlay from "@/components/DiscoverPreferencesOverlay";
import { haversineDistanceKm } from "@/lib/distance";
import { ensureDailyQuota, consumeSeen, pruneSeenProfiles, DAILY_SEEN_LIMIT } from "@/lib/quota";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NEW_DAYS = 7;
const MIN_PHOTOS = 3;
const REQUIRED_VALUES = 3;
const REQUIRED_PASSIONS = 4;
const DEPTH_MIN_CHARS = 25;

const db: any = prisma;

function safeJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function ageFromBirthdate(d: Date | null): number | null {
  if (!d) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function isWithinAge(age: number | null, minAge: number, maxAge: number) {
  if (age == null) return false;
  return age >= minAge && age <= maxAge;
}

function completenessChecklist(me: {
  name: string;
  gender: string;
  placeId: string | null;
  lat: number | null;
  lng: number | null;
  photosCount: number;
  profile: {
    intent: string | null;
    values: string | null;
    passions: string | null;
    q1: string | null;
    q2: string | null;
    q3: string | null;
    q4: string | null;
    q5: string | null;
  } | null;
}) {
  const items: Array<{ title: string; hint: string }> = [];

  if (!me.name?.trim()) items.push({ title: "Voornaam", hint: "Vul je voornaam in." });
  if (!me.gender?.trim()) items.push({ title: "Gender", hint: "Kies je gender." });

  const hasCity = !!me.placeId && typeof me.lat === "number" && typeof me.lng === "number";
  if (!hasCity) items.push({ title: "Stad", hint: "Kies je stad uit de lijst (zodat afstand werkt)." });

  if (me.photosCount < MIN_PHOTOS) items.push({ title: "Foto’s", hint: `Upload min. ${MIN_PHOTOS} foto’s.` });

  if (!me.profile) {
    items.push({ title: "Profiel", hint: "Vul je profiel aan." });
    return items;
  }

  if (!String(me.profile.intent || "").trim()) items.push({ title: "Intentie", hint: "Kies je intentie." });

  const values = safeJsonArray(me.profile.values);
  const passions = safeJsonArray(me.profile.passions);

  if (values.length !== REQUIRED_VALUES) items.push({ title: "Waarden", hint: `Selecteer exact ${REQUIRED_VALUES} waarden.` });
  if (passions.length !== REQUIRED_PASSIONS) items.push({ title: "Passies", hint: `Selecteer exact ${REQUIRED_PASSIONS} passies.` });

  const qs = [me.profile.q1, me.profile.q2, me.profile.q3, me.profile.q4, me.profile.q5].map((x) => String(x || "").trim());
  if (!qs.every((x) => x.length >= DEPTH_MIN_CHARS)) {
    items.push({ title: "Depth-vragen", hint: `Beantwoord alle 5 vragen (min. ${DEPTH_MIN_CHARS} tekens).` });
  }

  return items;
}

function jaccard(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0;
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union ? inter / union : 0;
}

function distanceBucket(km: number | null | undefined) {
  if (km == null || !Number.isFinite(km)) return "na";
  if (km <= 5) return "0-5";
  if (km <= 15) return "5-15";
  if (km <= 35) return "15-35";
  if (km <= 75) return "35-75";
  return "75+";
}

function diversifyCandidates(userId: string, baseSorted: DiscoverCandidate[], take: number) {
  if (take <= 0) return [];
  if (baseSorted.length <= take) return baseSorted.slice(0, take);

  const selected: DiscoverCandidate[] = [];
  const remaining = baseSorted.slice();

  selected.push(remaining.shift()!);

  while (selected.length < take && remaining.length) {
    const last = selected[selected.length - 1];

    let bestIdx = 0;
    let bestScore = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const c = remaining[i];

      let s = c.score;

      if (c.city && last.city && c.city === last.city) s -= 1.25;
      if (c.intent && last.intent && c.intent === last.intent) s -= 0.9;
      if (c.religion && last.religion && c.religion === last.religion) s -= 0.55;

      const sim = 0.6 * jaccard(c.values, last.values) + 0.4 * jaccard(c.passions, last.passions);
      s -= sim * 1.8;

      if (distanceBucket(c.distanceKm) === distanceBucket(last.distanceKm)) s -= 0.35;

      const prefix = selected.slice(-4);
      let sameCityHits = 0;
      let sameIntentHits = 0;
      for (const p of prefix) {
        if (c.city && p.city && c.city === p.city) sameCityHits++;
        if (c.intent && p.intent && c.intent === p.intent) sameIntentHits++;
      }
      if (sameCityHits >= 2) s -= 0.9;
      if (sameIntentHits >= 2) s -= 0.7;

      if (s > bestScore) {
        bestScore = s;
        bestIdx = i;
      }
    }

    selected.push(remaining.splice(bestIdx, 1)[0]);
  }

  return selected;
}

export default async function DiscoverPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  await pruneSeenProfiles(prisma, userId).catch(() => null);
  const quota = await ensureDailyQuota(prisma, userId);

  const canSuperlike =
    !quota.superlikeUsedAt || Date.now() - new Date(quota.superlikeUsedAt).getTime() >= 7 * 24 * 60 * 60 * 1000;

  const me = (await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      city: true,
      placeId: true,
      lat: true,
      lng: true,
      gender: true,
      createdAt: true,
      birthdate: true,
      photos: { select: { id: true } },
      profile: {
        select: {
          values: true,
          passions: true,
          intent: true,
          religion: true,
          q1: true,
          q2: true,
          q3: true,
          q4: true,
          q5: true,
        },
      },
      preferences: { select: { minAge: true, maxAge: true, maxDistanceKm: true, genders: true, verifiedOnly: true } },
    },
  })) as any;

  if (!me) redirect("/login");

  if (!me.profile || !me.preferences) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Discover</h1>
            <p className="mt-1 text-sm opacity-70">Maak je profiel compleet om matches te zien.</p>
          </div>
          <DiscoverPreferencesOverlay />
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-lg font-semibold">Nog niet klaar</div>
          <p className="mt-2 text-sm opacity-75">Vul eerst je profiel in en stel daarna je datingvoorkeuren in.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/profile/me" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
              Naar mijn profiel
            </Link>
            <Link
              href="/profile/preferences"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Naar datingvoorkeuren
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const checklist = completenessChecklist({
    name: me.name,
    gender: me.gender,
    placeId: me.placeId ?? null,
    lat: (me.lat as number | null) ?? null,
    lng: (me.lng as number | null) ?? null,
    photosCount: me.photos?.length ?? 0,
    profile: me.profile
      ? {
          intent: me.profile.intent,
          values: me.profile.values,
          passions: me.profile.passions,
          q1: me.profile.q1,
          q2: me.profile.q2,
          q3: me.profile.q3,
          q4: me.profile.q4,
          q5: me.profile.q5,
        }
      : null,
  });

  if (checklist.length > 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Discover</h1>
            <p className="mt-1 text-sm opacity-70">Vul je profiel volledig aan om profielen te kunnen ontdekken.</p>
          </div>
          <DiscoverPreferencesOverlay />
        </div>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-400/10 p-6">
          <div className="text-lg font-semibold text-amber-50">Checklist</div>
          <div className="mt-4 grid gap-2">
            {checklist.map((it, i) => (
              <div key={i} className="rounded-2xl border border-amber-200/10 bg-black/10 px-4 py-3">
                <div className="text-sm font-semibold text-amber-50">{it.title}</div>
                <div className="mt-1 text-sm text-amber-50/80">{it.hint}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/profile/me" className="rounded-2xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300">
              Profiel aanvullen
            </Link>
            <Link
              href="/profile/preferences"
              className="rounded-2xl border border-amber-200/20 bg-white/5 px-4 py-2 text-sm text-amber-50 hover:bg-white/10"
            >
              Datingvoorkeuren
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const prefs = me.preferences;
  const minAge = Number(prefs.minAge ?? 18);
  const maxAge = Number(prefs.maxAge ?? 99);
  const maxDistanceKm = Number(prefs.maxDistanceKm ?? 50);
  const genders: string[] = safeJsonArray(prefs.genders);
  const verifiedOnly = !!prefs.verifiedOnly;

  const hasMyCoords = typeof me.lat === "number" && typeof me.lng === "number";

  const myValues = safeJsonArray(me.profile.values);
  const myPassions = safeJsonArray(me.profile.passions);
  const myIntent = String(me.profile.intent || "");
  const myReligion = me.profile.religion ? String(me.profile.religion) : null;

  // Exclusions
  const seen = (await db.seenProfile.findMany({
    where: { userId },
    select: { seenUserId: true },
  })) as Array<{ seenUserId: string }>;

  const likes = (await db.like.findMany({
    where: { fromUserId: userId },
    select: { toUserId: true },
  })) as Array<{ toUserId: string }>;

  const matches = (await db.match.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    select: { userAId: true, userBId: true },
  })) as Array<{ userAId: string; userBId: string }>;

  const blocked = (await db.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  })) as Array<{ blockerId: string; blockedId: string }>;

  const exclude = new Set<string>();
  exclude.add(userId);
  for (const s of seen) exclude.add(s.seenUserId);
  for (const l of likes) exclude.add(l.toUserId);
  for (const m of matches) {
    exclude.add(m.userAId);
    exclude.add(m.userBId);
  }
  for (const b of blocked) {
    exclude.add(b.blockerId);
    exclude.add(b.blockedId);
  }

  const seenUsed = Math.max(0, Math.min(DAILY_SEEN_LIMIT, quota.seenUsed));
  const remaining = Math.max(0, DAILY_SEEN_LIMIT - seenUsed);

  if (remaining <= 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Discover</h1>
            <p className="mt-1 text-sm opacity-70">Je hebt je limiet voor vandaag bereikt.</p>
          </div>
          <DiscoverPreferencesOverlay />
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-lg font-semibold">Daglimiet bereikt</div>
          <p className="mt-2 text-sm opacity-75">Kom morgen terug voor nieuwe profielen.</p>
          <div className="mt-5">
            <Link href="/chat" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
              Naar chats
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const bufferTake = Math.min(60, Math.max(remaining * 3, 20));

  const candidatesRaw = (await db.user.findMany({
    where: {
      id: { notIn: Array.from(exclude) },
      ...(genders.length ? { gender: { in: genders } } : {}),
      ...(hasMyCoords ? { lat: { not: null }, lng: { not: null } } : {}),
      ...(verifiedOnly ? { verified: true } : {}),
      isBlocked: false,
    },
    take: bufferTake,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      city: true,
      lat: true,
      lng: true,
      createdAt: true,
      birthdate: true,
      verified: true,
      photos: { orderBy: { slot: "asc" }, take: 1, select: { id: true } },
      profile: { select: { values: true, passions: true, intent: true, religion: true, q1: true, q2: true, q3: true, q4: true, q5: true } },
    },
  })) as any[];

  const now = Date.now();
  const newCutoff = now - NEW_DAYS * 24 * 60 * 60 * 1000;

  const VERIFIED_BOOST = 0.85;

  const candidatesAll: DiscoverCandidate[] = candidatesRaw
    .filter((u) => !!u.profile)
    .map((u) => {
      const age = ageFromBirthdate(u.birthdate);

      const otherValues = safeJsonArray(u.profile!.values);
      const otherPassions = safeJsonArray(u.profile!.passions);
      const otherIntent = String(u.profile!.intent || "");
      const otherReligion = u.profile!.religion ? String(u.profile!.religion) : null;

      const scoreBreakdown = computeMatchScore({
        myValues,
        myPassions,
        otherValues,
        otherPassions,
        myCity: me.city,
        otherCity: u.city,
        myIntent,
        otherIntent,
        myReligion,
        otherReligion,
      });

      const distanceKm =
        hasMyCoords && typeof u.lat === "number" && typeof u.lng === "number"
          ? haversineDistanceKm({ lat: me.lat as number, lng: me.lng as number }, { lat: u.lat, lng: u.lng })
          : null;

      return {
        id: u.id,
        name: u.name || "",
        age,
        city: u.city || "",
        intent: otherIntent || "",
        religion: otherReligion || null,
        values: otherValues,
        passions: otherPassions,
        q: [
          { question: "Wat is voor jou een perfecte zaterdag?", answer: u.profile!.q1 || "" },
          { question: "Wat waardeer jij het meest in een relatie?", answer: u.profile!.q2 || "" },
          { question: "Waar kijk je het meest naar uit dit jaar?", answer: u.profile!.q3 || "" },
          { question: "Wat is een kleine gewoonte die je leven beter maakt?", answer: u.profile!.q4 || "" },
          { question: "Wat wil je dat iemand over jou begrijpt vanaf het begin?", answer: u.profile!.q5 || "" },
        ],
        photoId: u.photos?.[0]?.id || null,
        verified: !!u.verified,
        score: scoreBreakdown.score + (u.verified ? VERIFIED_BOOST : 0),
        scoreBreakdown: {
          baseScore: scoreBreakdown.baseScore,
          valuesHit: scoreBreakdown.valuesHit,
          passionsHit: scoreBreakdown.passionsHit,
          sameCity: scoreBreakdown.sameCity,
          cityBoost: scoreBreakdown.cityBoost,
          intentHit: scoreBreakdown.intentHit,
          religionHit: scoreBreakdown.religionHit,
          intentBoost: scoreBreakdown.intentBoost,
          religionBoost: scoreBreakdown.religionBoost,
          intentPenalty: scoreBreakdown.intentPenalty,
          religionPenalty: scoreBreakdown.religionPenalty,
        },
        distanceKm,
        isNew: u.createdAt ? new Date(u.createdAt).getTime() >= newCutoff : false,
      };
    })
    .filter((c) => isWithinAge(c.age, minAge, maxAge))
    .filter((c) => {
      if (!hasMyCoords) return true;
      if (c.distanceKm == null) return false;
      return c.distanceKm <= maxDistanceKm;
    })
    .sort((a, b) => b.score - a.score);

  const diversified = diversifyCandidates(userId, candidatesAll, remaining);

  const uniqueDiversified = (() => {
    const seenIds = new Set<string>();
    const out: DiscoverCandidate[] = [];
    for (const c of diversified) {
      if (seenIds.has(c.id)) continue;
      seenIds.add(c.id);
      out.push(c);
    }
    return out;
  })();

  let newlyCount = 0;

  if (uniqueDiversified.length > 0) {
    await db
      .$transaction(async (tx: any) => {
        const res = await tx.seenProfile.createMany({
          data: uniqueDiversified.map((c) => ({ userId, seenUserId: c.id, dayKey: quota.dk })),
          skipDuplicates: true,
        });

        newlyCount = res?.count ?? 0;

        if (newlyCount > 0) {
          await consumeSeen(tx, userId, newlyCount);
        }
      })
      .catch(() => {
        // never crash Discover
      });
  }

  const seenUsedAfter = Math.min(DAILY_SEEN_LIMIT, seenUsed + newlyCount);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Discover</h1>
          <p className="mt-1 text-sm opacity-70">Kies wie bij je past.</p>
        </div>
        <DiscoverPreferencesOverlay />
      </div>

      <div className="mt-8">
        <DiscoverDeck
          candidates={uniqueDiversified}
          canSuperlike={canSuperlike}
          seenUsedInitial={seenUsedAfter}
          dailyLimit={DAILY_SEEN_LIMIT}
          verifiedOnlyActive={verifiedOnly}
        />
      </div>
    </div>
  );
}