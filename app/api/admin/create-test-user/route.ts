import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  email?: string;
  phone?: string;
  password?: string;
  name?: string;
  city?: string;
  gender?: string;
  lookingFor?: string;
  birthdate?: string; // ISO
};

function yearsAgo(n: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d;
}

export async function POST(req: Request) {
  const secret = process.env.ADMIN_SEED_SECRET;
  const headerSecret = req.headers.get("x-admin-seed-secret");

  if (!secret || !headerSecret || headerSecret !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const email = body.email ?? "qa@depth.local";
  const phone = body.phone ?? "+32470009999";
  const password = body.password ?? "Password123!";
  const name = body.name ?? "QA Tester";
  const city = body.city ?? "Gent";
  const gender = body.gender ?? "Man";
  const lookingFor = body.lookingFor ?? "Vrouw";
  const birthdate = body.birthdate ? new Date(body.birthdate) : yearsAgo(26);

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      city,
      gender,
      lookingFor,
      birthdate,
      phone,
      verified: true,
      phoneVerifiedAt: new Date(),
    },
    create: {
      email,
      passwordHash,
      name,
      city,
      gender,
      lookingFor,
      birthdate,
      phone,
      verified: true,
      phoneVerifiedAt: new Date(),
      role: "USER",
    },
    select: { id: true, email: true, phone: true },
  });

  // Ensure profile exists
  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      intent: "Serieuze relatie",
      religion: "Geen",
      values: JSON.stringify(["Eerlijkheid", "Ambitie", "Humor"]),
      passions: JSON.stringify(["Koken", "Fitness", "Reizen", "Muziek"]),
      q1: "Een rustige ochtend, koffietje, en iets actiefs in de namiddag.",
      q2: "Dat we eerlijk kunnen praten, ook als het moeilijk is.",
      q3: "Een trip plannen en iets nieuws leren.",
      q4: "Een korte wandeling zonder telefoon.",
      q5: "Ik ben rustig van buiten, maar ik voel veel vanbinnen.",
    },
    create: {
      userId: user.id,
      intent: "Serieuze relatie",
      religion: "Geen",
      values: JSON.stringify(["Eerlijkheid", "Ambitie", "Humor"]),
      passions: JSON.stringify(["Koken", "Fitness", "Reizen", "Muziek"]),
      q1: "Een rustige ochtend, koffietje, en iets actiefs in de namiddag.",
      q2: "Dat we eerlijk kunnen praten, ook als het moeilijk is.",
      q3: "Een trip plannen en iets nieuws leren.",
      q4: "Een korte wandeling zonder telefoon.",
      q5: "Ik ben rustig van buiten, maar ik voel veel vanbinnen.",
    },
  });

  // Ensure preferences exist
  await prisma.preferences.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      minAge: 20,
      maxAge: 35,
      maxDistanceKm: 50,
      genders: JSON.stringify([lookingFor]),
    },
  });

  return NextResponse.json({
    ok: true,
    credentials: {
      email,
      password,
    },
    note: "Upload 4 foto's om Discover volledig te testen.",
  });
}