import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * ✅ Known credentials after seed:
 * Email: gilles+1@depth.local (and +2, +3, +4)
 * Password: DepthTest123!
 */
const TEST_PASSWORD = "DepthTest123!";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function upsertUserByEmail(data: {
  email: string;
  name: string;
  city?: string;
  gender: string;
  lookingFor: string;
  birthdate: Date;
  phone: string;
  verified?: boolean;
  lat?: number | null;
  lng?: number | null;
  placeId?: string | null;
}) {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: data.email },
    update: {
      // ✅ force known password for test accounts
      passwordHash,
      name: data.name,
      city: data.city ?? "",
      gender: data.gender,
      lookingFor: data.lookingFor,
      birthdate: data.birthdate,
      phone: data.phone,
      verified: !!data.verified,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      placeId: data.placeId ?? null,
      isBlocked: false,
    },
    create: {
      email: data.email,
      passwordHash,
      name: data.name,
      city: data.city ?? "",
      gender: data.gender,
      lookingFor: data.lookingFor,
      birthdate: data.birthdate,
      phone: data.phone,
      verified: !!data.verified,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      placeId: data.placeId ?? null,
      isBlocked: false,
    },
    select: { id: true },
  });

  return user.id;
}

async function upsertProfile(userId: string, data: any) {
  await prisma.profile.upsert({
    where: { userId },
    update: {
      intent: data.intent ?? "RELATIONSHIP",
      religion: data.religion ?? null,
      values: data.values ?? "[]",
      passions: data.passions ?? "[]",
      q1: data.q1 ?? null,
      q2: data.q2 ?? null,
      q3: data.q3 ?? null,
      q4: data.q4 ?? null,
      q5: data.q5 ?? null,
    },
    create: {
      userId,
      intent: data.intent ?? "RELATIONSHIP",
      religion: data.religion ?? null,
      values: data.values ?? "[]",
      passions: data.passions ?? "[]",
      q1: data.q1 ?? null,
      q2: data.q2 ?? null,
      q3: data.q3 ?? null,
      q4: data.q4 ?? null,
      q5: data.q5 ?? null,
    },
  });
}

async function upsertPreferences(userId: string, data: any) {
  // ✅ Work around stale Prisma typings in TS server (verifiedOnly)
  const pAny = (prisma as any).preferences;

  await pAny.upsert({
    where: { userId },
    update: {
      minAge: clamp(Number(data.minAge ?? 20), 18, 99),
      maxAge: clamp(Number(data.maxAge ?? 35), 18, 99),
      maxDistanceKm: clamp(Number(data.maxDistanceKm ?? 50), 1, 500),
      genders: data.genders ?? JSON.stringify(["Vrouw", "Man"]),
      intentFilter: data.intentFilter ?? null,
      religionFilter: data.religionFilter ?? null,
      valuesFilter: data.valuesFilter ?? null,
      verifiedOnly: !!data.verifiedOnly,
    },
    create: {
      userId,
      minAge: clamp(Number(data.minAge ?? 20), 18, 99),
      maxAge: clamp(Number(data.maxAge ?? 35), 18, 99),
      maxDistanceKm: clamp(Number(data.maxDistanceKm ?? 50), 1, 500),
      genders: data.genders ?? JSON.stringify(["Vrouw", "Man"]),
      intentFilter: data.intentFilter ?? null,
      religionFilter: data.religionFilter ?? null,
      valuesFilter: data.valuesFilter ?? null,
      verifiedOnly: !!data.verifiedOnly,
    },
  });
}

async function likeOnce(fromUserId: string, toUserId: string, type: "LIKE" | "SUPERLIKE" = "LIKE") {
  if (fromUserId === toUserId) return;

  await prisma.like.upsert({
    where: { fromUserId_toUserId: { fromUserId, toUserId } },
    update: { type },
    create: { fromUserId, toUserId, type },
  });
}

async function matchOnce(userAId: string, userBId: string, superlikeFromId: string | null = null) {
  if (userAId === userBId) return;

  const [a, b] = userAId < userBId ? [userAId, userBId] : [userBId, userAId];

  const existing = await prisma.match.findFirst({
    where: { userAId: a, userBId: b },
    select: { id: true },
  });
  if (existing) return existing.id;

  const m = await prisma.match.create({
    data: { userAId: a, userBId: b, isUnlocked: false, superlikeFromId },
    select: { id: true },
  });
  return m.id;
}

async function messageOnce(matchId: string, fromUserId: string, toUserId: string, text: string) {
  await prisma.message.create({ data: { matchId, fromUserId, toUserId, text } });
}

// ✅ Block model has NO `reason`
async function createBlockOnce(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) return;

  const existing = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    select: { id: true },
  });
  if (existing) return existing.id;

  const b = await prisma.block.create({
    data: { blockerId, blockedId },
    select: { id: true },
  });

  return b.id;
}

async function main() {
  const u1 = await upsertUserByEmail({
    email: "gilles+1@depth.local",
    name: "Lina",
    city: "Antwerpen",
    gender: "Vrouw",
    lookingFor: "Man",
    birthdate: new Date("1999-05-04"),
    phone: "+32000000001",
    verified: true,
    lat: 51.2194,
    lng: 4.4025,
    placeId: "place_antwerp",
  });

  const u2 = await upsertUserByEmail({
    email: "gilles+2@depth.local",
    name: "Noor",
    city: "Gent",
    gender: "Vrouw",
    lookingFor: "Man",
    birthdate: new Date("1998-11-12"),
    phone: "+32000000002",
    verified: false,
    lat: 51.0543,
    lng: 3.7174,
    placeId: "place_ghent",
  });

  const u3 = await upsertUserByEmail({
    email: "gilles+3@depth.local",
    name: "Mats",
    city: "Brussel",
    gender: "Man",
    lookingFor: "Vrouw",
    birthdate: new Date("1996-02-18"),
    phone: "+32000000003",
    verified: true,
    lat: 50.8503,
    lng: 4.3517,
    placeId: "place_brussels",
  });

  const u4 = await upsertUserByEmail({
    email: "gilles+4@depth.local",
    name: "Arne",
    city: "Leuven",
    gender: "Man",
    lookingFor: "Vrouw",
    birthdate: new Date("1997-09-21"),
    phone: "+32000000004",
    verified: false,
    lat: 50.8798,
    lng: 4.7005,
    placeId: "place_leuven",
  });

  const sampleValues = ["Eerlijkheid", "Ambitie", "Humor", "Rust", "Familie", "Vrijheid"];
  const samplePassions = ["Reizen", "Sport", "Koken", "Muziek", "Boeken", "Kunst"];

  async function seedProfile(userId: string, intent: string, religion: string | null) {
    const values = JSON.stringify([pick(sampleValues), pick(sampleValues), pick(sampleValues)]);
    const passions = JSON.stringify([pick(samplePassions), pick(samplePassions), pick(samplePassions), pick(samplePassions)]);
    await upsertProfile(userId, {
      intent,
      religion,
      values,
      passions,
      q1: "Een rustige ochtend, sporten, koffie en later spontaan iets doen.",
      q2: "Eerlijkheid en emotionele maturiteit.",
      q3: "Een grote trip plannen en iets nieuws leren.",
      q4: "Elke dag even wandelen zonder telefoon.",
      q5: "Dat ik oprecht ben en graag diep praat, maar ook veel kan lachen.",
    });
  }

  await seedProfile(u1, "RELATIONSHIP", null);
  await seedProfile(u2, "RELATIONSHIP", "CHRISTIAN");
  await seedProfile(u3, "RELATIONSHIP", null);
  await seedProfile(u4, "RELATIONSHIP", null);

  await upsertPreferences(u3, {
    minAge: 20,
    maxAge: 32,
    maxDistanceKm: 50,
    genders: JSON.stringify(["Vrouw"]),
    verifiedOnly: false,
  });

  await upsertPreferences(u4, {
    minAge: 20,
    maxAge: 35,
    maxDistanceKm: 60,
    genders: JSON.stringify(["Vrouw"]),
    verifiedOnly: true,
  });

  await likeOnce(u1, u3, "LIKE");
  await likeOnce(u2, u3, "SUPERLIKE");

  const m1 = await matchOnce(u1, u3, null);
  const m2 = await matchOnce(u2, u3, u2);

  if (m1) {
    await messageOnce(m1, u3, u1, "Hey Lina 🙂");
    await messageOnce(m1, u1, u3, "Hey! Hoe gaat het?");
  }

  if (m2) {
    await messageOnce(m2, u2, u3, "Superlike, dus ik moest gewoon hallo zeggen 😄");
    await messageOnce(m2, u3, u2, "Haha, nice. Vertel eens iets verrassends over jou.");
  }

  await createBlockOnce(u4, u2);

  console.log("✅ Seed complete");
  console.log("✅ Test login:");
  console.log("   Email: gilles+1@depth.local (or +2/+3/+4)");
  console.log("   Password: DepthTest123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });