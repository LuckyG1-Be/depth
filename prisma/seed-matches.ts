import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "test1234";

// accepteert zowel string[] als readonly string[]
const j = (arr: readonly string[]) => JSON.stringify(Array.from(arr));

function orderedPair(a: string, b: string) {
  return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
}

async function wipe() {
  await prisma.message.deleteMany();
  await prisma.match.deleteMany();
  await prisma.like.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.preferences.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
}

type SeedUser = {
  email: string;
  name: string;
  city: string;
  gender: string;
  lookingFor: string;
  birthdate: Date;
  profile: {
    intent: string;
    religion: string | null;
    values: string[];
    passions: string[];
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    q5: string;
  };
  prefs: {
    minAge: number;
    maxAge: number;
    maxDistanceKm: number;
    genders: string[];
    intentFilter?: string;
    valuesFilter?: string[];
  };
};

async function main() {
  console.log("🧹 Reset DB (seed-matches)...");
  await wipe();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const users: SeedUser[] = [
    {
      email: "alex.gent@example.com",
      name: "Alex",
      city: "Gent",
      gender: "Man",
      lookingFor: "Vrouw",
      birthdate: new Date("1994-05-14"),
      profile: {
        intent: "Relatie",
        religion: "Geen",
        values: ["Eerlijkheid", "Humor", "Communicatie"],
        passions: ["Reizen", "Koken", "Fitness", "Tech"],
        q1: "Ik word echt blij van een goede koffie en een lange wandeling.",
        q2: "In een relatie vind ik eerlijkheid en duidelijke communicatie belangrijk.",
        q3: "Ik kijk uit naar reizen en meer tijd maken voor vrienden.",
        q4: "Een kleine gewoonte: elke ochtend kort plannen en bewegen.",
        q5: "Wat je moet weten: ik ben rustig, maar heel loyaal.",
      },
      prefs: {
        minAge: 24,
        maxAge: 34,
        maxDistanceKm: 50,
        genders: ["Vrouw"],
        intentFilter: "Relatie",
        valuesFilter: ["Eerlijkheid", "Communicatie"],
      },
    },
    {
      email: "sara.antwerp@example.com",
      name: "Sara",
      city: "Antwerpen",
      gender: "Vrouw",
      lookingFor: "Man",
      birthdate: new Date("1997-09-02"),
      profile: {
        intent: "Relatie",
        religion: "Geen",
        values: ["Loyaliteit", "Eerlijkheid", "Groei"],
        passions: ["Kunst", "Boeken", "Yoga", "Brunch"],
        q1: "Perfect: museum, lunch en daarna gezellig koken met muziek.",
        q2: "Stabiliteit en loyaliteit: samen bouwen zonder spelletjes.",
        q3: "Ik wil meer creativiteit en nieuwe hobby’s ontdekken.",
        q4: "Ik schrijf elke avond 3 dingen op waar ik dankbaar voor ben.",
        q5: "Ik ben warm en direct, ik hou van eerlijkheid.",
      },
      prefs: {
        minAge: 26,
        maxAge: 36,
        maxDistanceKm: 80,
        genders: ["Man"],
        intentFilter: "Relatie",
        valuesFilter: ["Eerlijkheid", "Groei"],
      },
    },
    {
      email: "milan.leuven@example.com",
      name: "Milan",
      city: "Leuven",
      gender: "Man",
      lookingFor: "Vrouw",
      birthdate: new Date("1992-11-11"),
      profile: {
        intent: "Open",
        religion: "Christelijk",
        values: ["Respect", "Stabiliteit", "Eerlijkheid"],
        passions: ["Wandelen", "Cycling", "Podcasts", "Restaurants"],
        q1: "Zaterdag: sport en daarna rustig lunchen met vrienden.",
        q2: "Respect en eerlijkheid zijn voor mij de basis.",
        q3: "Meer balans tussen werk en vrije tijd.",
        q4: "Elke dag één spontaan moment plannen.",
        q5: "Ik ben betrouwbaar en hou van duidelijkheid.",
      },
      prefs: {
        minAge: 24,
        maxAge: 35,
        maxDistanceKm: 40,
        genders: ["Vrouw"],
      },
    },
    {
      email: "lena.brussels@example.com",
      name: "Lena",
      city: "Brussel",
      gender: "Vrouw",
      lookingFor: "Man",
      birthdate: new Date("1995-03-08"),
      profile: {
        intent: "Casual",
        religion: null,
        values: ["Avontuur", "Vrijheid", "Humor"],
        passions: ["Stedentrips", "Cocktails", "Dansen", "Festivals"],
        q1: "Zaterdag: brunch, stad in, en ‘s avonds een cocktailbar.",
        q2: "Licht en fun, maar wel eerlijk en respectvol.",
        q3: "Meer reizen en nieuwe mensen leren kennen zonder druk.",
        q4: "Elke week één nieuw ding proberen.",
        q5: "Sociaal en spontaan, ik hou van grenzen én fun.",
      },
      prefs: {
        minAge: 25,
        maxAge: 38,
        maxDistanceKm: 25,
        genders: ["Man"],
        intentFilter: "Casual",
      },
    },
  ];

  console.log("👤 Create users + profile + preferences...");
  const created: Record<string, string> = {};

  for (const u of users) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash,
        name: u.name,
        city: u.city,
        gender: u.gender,
        lookingFor: u.lookingFor,
        birthdate: u.birthdate,

        verified: true,
        phone: "+32470000000",
        phoneVerifiedAt: new Date(),

        profile: {
          create: {
            intent: u.profile.intent,
            religion: u.profile.religion,
            values: j(u.profile.values),
            passions: j(u.profile.passions),
            q1: u.profile.q1,
            q2: u.profile.q2,
            q3: u.profile.q3,
            q4: u.profile.q4,
            q5: u.profile.q5,
          },
        },

        preferences: {
          create: {
            minAge: u.prefs.minAge,
            maxAge: u.prefs.maxAge,
            maxDistanceKm: u.prefs.maxDistanceKm,
            genders: j(u.prefs.genders),
            intentFilter: u.prefs.intentFilter ?? null,
            religionFilter: null,
            valuesFilter: u.prefs.valuesFilter ? j(u.prefs.valuesFilter) : null,
          },
        },
      },
      select: { id: true, email: true },
    });

    created[u.email] = user.id;
  }

  const Alex = created["alex.gent@example.com"];
  const Sara = created["sara.antwerp@example.com"];
  const Milan = created["milan.leuven@example.com"];
  const Lena = created["lena.brussels@example.com"];

  console.log("❤️ Likes...");
  await prisma.like.createMany({
    data: [
      { fromUserId: Alex, toUserId: Sara, type: "LIKE" },
      { fromUserId: Sara, toUserId: Alex, type: "LIKE" }, // mutual

      { fromUserId: Milan, toUserId: Lena, type: "SUPERLIKE" },
      { fromUserId: Lena, toUserId: Milan, type: "LIKE" }, // mutual
    ],
  });

  console.log("🤝 Matches...");
  const pairs = [
    { a: Alex, b: Sara },
    { a: Milan, b: Lena },
  ];

  for (const p of pairs) {
    const { userAId, userBId } = orderedPair(p.a, p.b);

    const aLike = await prisma.like.findUnique({
      where: { fromUserId_toUserId: { fromUserId: p.a, toUserId: p.b } },
      select: { type: true },
    });
    const bLike = await prisma.like.findUnique({
      where: { fromUserId_toUserId: { fromUserId: p.b, toUserId: p.a } },
      select: { type: true },
    });

    const superlikeFromId =
      aLike?.type === "SUPERLIKE" ? p.a : bLike?.type === "SUPERLIKE" ? p.b : null;

    await prisma.match.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      create: {
        userAId,
        userBId,
        isUnlocked: false,
        unlockedAt: null,
        superlikeFromId,
        isArchived: false,
        archivedAt: null,
      },
      update: { superlikeFromId },
    });
  }

  console.log("\n✅ Seed matches klaar!");
  console.log("Login accounts (password = " + PASSWORD + "):");
  console.log("- Alex: alex.gent@example.com");
  console.log("- Sara: sara.antwerp@example.com");
  console.log("- Milan: milan.leuven@example.com");
  console.log("- Lena: lena.brussels@example.com");
}

main()
  .catch((e) => {
    console.error("❌ seed-matches failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });