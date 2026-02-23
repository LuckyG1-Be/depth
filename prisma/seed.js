const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const prisma = new PrismaClient();

const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), "uploads");

const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/6X1lGQAAAAASUVORK5CYII=";

function ensureDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function writeTinyPng(filename) {
  ensureDir();
  const disk = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(disk, Buffer.from(TINY_PNG_BASE64, "base64"));
  return `/uploads/${filename}`;
}

function randHex(n = 4) {
  return crypto.randomBytes(n).toString("hex");
}

function dayKey(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function createUser(i, overrides = {}) {
  const email = overrides.email || `demo${i}@depth.test`;
  const password = overrides.password || "Test1234!";
  const passwordHash = await bcrypt.hash(password, 10);

  // remove if exists
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: overrides.name || `Demo ${i}`,
      city: overrides.city || (i % 2 === 0 ? "Affligem" : "Gent"),
      gender: overrides.gender || (i % 2 === 0 ? "Man" : "Vrouw"),
      lookingFor: overrides.lookingFor || (i % 2 === 0 ? "Vrouw" : "Man"),
      birthdate: new Date(`199${i % 10}-0${(i % 9) + 1}-1${i % 9}T00:00:00.000Z`),
      phone: overrides.phone || `+3247000${String(1000 + i)}`,
      phoneVerifiedAt: new Date(),
      verified: true,
      isBlocked: false,

      profile: {
        create: {
          intent: overrides.intent || (i % 3 === 0 ? "Langetermijn" : i % 3 === 1 ? "Casual" : "Open relatie"),
          religion: overrides.religion || (i % 4 === 0 ? "Geen" : i % 4 === 1 ? "Christelijk" : i % 4 === 2 ? "Islam" : "Anders"),
          minAge: 18,
          maxAge: 99,
          values: JSON.stringify(["Eerlijkheid", "Humor", "Vertrouwen", "Respect", "Groei"].slice(0, 3 + (i % 3))),
          passions: JSON.stringify(["Reizen", "Sport", "Koken", "Muziek", "Natuur"].slice(0, 3 + (i % 3))),
          q1: "Ik waardeer eerlijkheid en rust.",
          q2: "Als iemand echt luistert zonder oordeel.",
          q3: "Kwetsbaarheid en échte gesprekken.",
          q4: "Ochtendwandeling of sporten.",
          q5: "Ik heb graag duidelijke intenties en respect.",
        },
      },
    },
    include: { profile: true },
  });

  // Photos (4)
  for (let slot = 0; slot < 4; slot++) {
    const filename = `seed-${user.id}-${slot}-${randHex(3)}.png`;
    const p = writeTinyPng(filename);

    await prisma.photo.upsert({
      where: { userId_slot: { userId: user.id, slot } },
      create: {
        userId: user.id,
        slot,
        path: p,
        mime: "image/png",
        sizeBytes: 67,
      },
      update: {
        path: p,
        mime: "image/png",
        sizeBytes: 67,
      },
    });
  }

  return user;
}

async function createMatchWithMessages({ a, b, messageCount, unlocked, archived }) {
  const userAId = a.id < b.id ? a.id : b.id;
  const userBId = a.id < b.id ? b.id : a.id;

  // wipe old match
  await prisma.match.deleteMany({
    where: {
      OR: [
        { userAId, userBId },
        { userAId: userBId, userBId: userAId },
      ],
    },
  });

  const match = await prisma.match.create({
    data: {
      userAId,
      userBId,
      isUnlocked: !!unlocked,
      unlockedAt: unlocked ? new Date(Date.now() - 60 * 60 * 1000) : null,
      isArchived: !!archived,
      archivedAt: archived ? new Date(Date.now() - 24 * 60 * 60 * 1000) : null,
      superlikeFromId: null,
    },
  });

  // alternating messages
  let sender = userAId;
  for (let i = 0; i < messageCount; i++) {
    await prisma.message.create({
      data: {
        matchId: match.id,
        fromUserId: sender,
        text:
          i === 0 ? "Hey! 👋" :
          i === 1 ? "Hi! Hoe gaat het?" :
          i === 2 ? "Goed! Weekendplannen?" :
          i === 3 ? "Wandeling + eten. Jij?" :
          i === 4 ? "Zin om eens af te spreken?" :
          `Bericht ${i + 1}`,
      },
    });
    sender = sender === userAId ? userBId : userAId;
  }

  return match;
}

async function main() {
  console.log("🌱 Seeding demo users...");

  // Cleanup key tables
  await prisma.message.deleteMany();
  await prisma.match.deleteMany();
  await prisma.like.deleteMany();
  await prisma.seenProfile.deleteMany();
  await prisma.dailyQuota.deleteMany();
  await prisma.accountFlag.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const users = [];
  for (let i = 1; i <= 10; i++) {
    users.push(await createUser(i));
  }

  // Simuleer likes + matches
  const [u1, u2, u3, u4, u5] = users;

  await prisma.like.create({ data: { fromUserId: u1.id, toUserId: u2.id, type: "LIKE" } });
  await prisma.like.create({ data: { fromUserId: u2.id, toUserId: u1.id, type: "LIKE" } });
  await createMatchWithMessages({ a: u1, b: u2, messageCount: 0, unlocked: false, archived: false }); // stage: match, nog locked

  await prisma.like.create({ data: { fromUserId: u1.id, toUserId: u3.id, type: "LIKE" } });
  await prisma.like.create({ data: { fromUserId: u3.id, toUserId: u1.id, type: "LIKE" } });
  await createMatchWithMessages({ a: u1, b: u3, messageCount: 3, unlocked: false, archived: false }); // stage: 3 berichten

  await prisma.like.create({ data: { fromUserId: u1.id, toUserId: u4.id, type: "SUPERLIKE" } });
  await prisma.like.create({ data: { fromUserId: u4.id, toUserId: u1.id, type: "LIKE" } });
  await createMatchWithMessages({ a: u1, b: u4, messageCount: 5, unlocked: true, archived: false }); // stage: unlocked (5)

  await prisma.like.create({ data: { fromUserId: u5.id, toUserId: u1.id, type: "LIKE" } });
  await prisma.like.create({ data: { fromUserId: u1.id, toUserId: u5.id, type: "LIKE" } });
  await createMatchWithMessages({ a: u1, b: u5, messageCount: 6, unlocked: true, archived: true }); // archived

  // Quota sample
  await prisma.dailyQuota.create({
    data: {
      userId: u1.id,
      dayKey: dayKey(new Date()),
      likesUsed: 0,
      seenUsed: 0,
      superlikeUsedAt: null,
    },
  });

  console.log("✅ Seed complete.");
  console.log("Login demo:");
  console.log(" - email: demo1@depth.test");
  console.log(" - pass : Test1234!");
}

main()
  .catch((e) => {
    console.error("SEED_ERROR", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

