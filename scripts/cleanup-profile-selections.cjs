/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const VALUES = [
  "Eerlijkheid",
  "Loyaliteit",
  "Humor",
  "Ambitie",
  "Rust",
  "Avontuur",
  "Familie",
  "Gezondheid",
  "Creativiteit",
  "Spiritualiteit",
  "Vrijheid",
  "Respect",
];

const PASSIONS = [
  "Reizen",
  "Sport",
  "Koken",
  "Muziek",
  "Kunst",
  "Boeken",
  "Natuur",
  "Gaming",
  "Film",
  "Tech",
  "Wandelen",
  "Fotografie",
];

const INCOMPLETE_FLAG_TYPE = "PROFILE_INCOMPLETE";

function norm(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function parseToArray(input) {
  if (input == null) return [];
  const s = String(input).trim();
  if (!s) return [];

  // JSON array?
  if (s.startsWith("[")) {
    try {
      const x = JSON.parse(s);
      if (Array.isArray(x)) return x.map(norm).filter(Boolean);
    } catch {
      // fall through
    }
  }

  // CSV fallback
  return s
    .split(",")
    .map(norm)
    .filter(Boolean);
}

function sanitize(inputArr, allowedArr, max) {
  const allowedSet = new Set(allowedArr.map(norm));
  const uniq = Array.from(new Set((inputArr || []).map(norm))).filter(Boolean);
  return uniq.filter((x) => allowedSet.has(x)).slice(0, max);
}

async function upsertIncompleteFlag(userId, reason) {
  // idempotent: als er al een flag bestaat, laten we die staan (optioneel updaten we reason)
  const existing = await prisma.accountFlag.findFirst({
    where: { userId, type: INCOMPLETE_FLAG_TYPE },
    select: { id: true, reason: true },
  });

  if (existing) {
    if ((existing.reason || "") !== reason) {
      await prisma.accountFlag.update({
        where: { id: existing.id },
        data: { reason },
      });
    }
    return { created: false };
  }

  await prisma.accountFlag.create({
    data: { userId, type: INCOMPLETE_FLAG_TYPE, reason },
  });
  return { created: true };
}

async function clearIncompleteFlag(userId) {
  await prisma.accountFlag.deleteMany({
    where: { userId, type: INCOMPLETE_FLAG_TYPE },
  });
}

async function main() {
  const profiles = await prisma.profile.findMany({
    select: { id: true, userId: true, values: true, passions: true },
  });

  let updatedProfiles = 0;
  let flagged = 0;
  let unflagged = 0;

  for (const p of profiles) {
    const beforeValuesArr = parseToArray(p.values);
    const beforePassionsArr = parseToArray(p.passions);

    const afterValuesArr = sanitize(beforeValuesArr, VALUES, 5);
    const afterPassionsArr = sanitize(beforePassionsArr, PASSIONS, 3);

    const beforeValuesStr = JSON.stringify(beforeValuesArr);
    const beforePassionsStr = JSON.stringify(beforePassionsArr);

    const afterValuesStr = JSON.stringify(afterValuesArr);
    const afterPassionsStr = JSON.stringify(afterPassionsArr);

    const needsUpdate = beforeValuesStr !== afterValuesStr || beforePassionsStr !== afterPassionsStr;

    if (needsUpdate) {
      await prisma.profile.update({
        where: { id: p.id },
        data: {
          values: JSON.stringify(afterValuesArr),
          passions: JSON.stringify(afterPassionsArr),
        },
      });

      updatedProfiles++;
      console.log(
        `✓ Updated profile ${p.id} (user ${p.userId}) | values ${beforeValuesArr.length}→${afterValuesArr.length} | passions ${beforePassionsArr.length}→${afterPassionsArr.length}`
      );
    }

    // ✅ Flag logic
    const isIncomplete = afterValuesArr.length < 5 || afterPassionsArr.length < 3;
    if (isIncomplete) {
      const reason = `Profile incomplete after cleanup: values=${afterValuesArr.length}/5, passions=${afterPassionsArr.length}/3`;
      const res = await upsertIncompleteFlag(p.userId, reason);
      if (res.created) flagged++;
    } else {
      // als compleet: verwijder eventuele bestaande incomplete flags
      const before = await prisma.accountFlag.count({
        where: { userId: p.userId, type: INCOMPLETE_FLAG_TYPE },
      });
      if (before > 0) {
        await clearIncompleteFlag(p.userId);
        unflagged++;
      }
    }
  }

  console.log(`\nDone.`);
  console.log(`Profiles updated: ${updatedProfiles} / ${profiles.length}`);
  console.log(`Users flagged (${INCOMPLETE_FLAG_TYPE}) created: ${flagged}`);
  console.log(`Users unflagged (${INCOMPLETE_FLAG_TYPE}) removed: ${unflagged}`);
}

main()
  .catch((e) => {
    console.error("Cleanup failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

