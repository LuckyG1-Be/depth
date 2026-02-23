import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { touchDevice } from "@/lib/device";
import { logSecurityEvent } from "@/lib/security/risk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function boolEnv(name: string, fallback: boolean) {
  const v = (process.env[name] ?? "").toLowerCase().trim();
  if (!v) return fallback;
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Heel basic email check (later kan strenger)
function isValidEmail(email: string) {
  const e = email.trim().toLowerCase();
  return e.includes("@") && e.includes(".");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as null | {
      email?: string;
      password?: string;
      name?: string;
      phone?: string; // mag voorlopig leeg/optioneel blijven
      birthdate?: string; // ISO string
      gender?: string;
      lookingFor?: string;
      city?: string;

      // Optioneel: wanneer je later OTP bouwt kan je hier bv. otpToken/verified opnemen
      otpVerified?: boolean;
    };

    const email = (body?.email || "").trim().toLowerCase();
    const password = (body?.password || "").trim();
    const name = (body?.name || "").trim();
    const city = (body?.city || "").trim();

    const gender = (body?.gender || "OTHER").trim();
    const lookingFor = (body?.lookingFor || "ANY").trim();

    const birthdateStr = (body?.birthdate || "").trim();
    const birthdate = birthdateStr ? new Date(birthdateStr) : null;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "INVALID_EMAIL" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ ok: false, error: "WEAK_PASSWORD" }, { status: 400 });
    }
    if (!name || name.length < 2) {
      return NextResponse.json({ ok: false, error: "INVALID_NAME" }, { status: 400 });
    }
    if (!birthdate || Number.isNaN(birthdate.getTime())) {
      return NextResponse.json({ ok: false, error: "INVALID_BIRTHDATE" }, { status: 400 });
    }

    // Leeftijd check (optioneel, maar handig)
    const now = new Date();
    const age = Math.floor((now.getTime() - birthdate.getTime()) / (365.25 * 24 * 3600 * 1000));
    if (age < 18) {
      return NextResponse.json({ ok: false, error: "UNDERAGE" }, { status: 400 });
    }

    // ✅ DEV bypass: in development of wanneer REQUIRE_OTP_VERIFICATION=0
    const requireOtp = boolEnv("REQUIRE_OTP_VERIFICATION", false);
    const isDev = process.env.NODE_ENV !== "production";

    if (requireOtp && !isDev) {
      // Later: hier check je email OTP / phone OTP status.
      // Voor nu blokkeren we in prod wanneer de flag aan staat.
      if (!body?.otpVerified) {
        return NextResponse.json({ ok: false, error: "OTP_REQUIRED" }, { status: 400 });
      }
    }

    // Bestaat email al?
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ ok: false, error: "EMAIL_EXISTS" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Phone is bij jou schema vaak @unique; in dev wil je niet verplichten
    // => we vullen een dev-telefoon in wanneer leeg
    const phoneRaw = (body?.phone || "").trim();
    const phone =
      phoneRaw ||
      (isDev
        ? `dev-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        : ""); // prod: later verplicht maken met OTP flow

    // Als je phone in schema @unique is en niet nullable, moet hij niet leeg zijn in prod.
    if (!phone) {
      // zolang je OTP nog niet finaliseert, zet REQUIRE_OTP_VERIFICATION=0 ook op prod test
      return NextResponse.json({ ok: false, error: "PHONE_REQUIRED" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        city,
        gender,
        lookingFor,
        birthdate,
        phone,

        // ✅ voorlopig: meteen verified in dev-bypass scenario
        verified: !requireOtp || isDev ? true : false,
        phoneVerifiedAt: !requireOtp || isDev ? new Date() : null,

        profile: {
          create: {
            intent: "RELATIONSHIP",
            religion: null,
            values: "[]",
            passions: "[]",
          },
        },
        preferences: {
          create: {
            minAge: 18,
            maxAge: 99,
            maxDistanceKm: 50,
            genders: "[]",
          },
        },
        dailyQuota: {
          create: {
            dayKey: "",
            likesUsed: 0,
            seenUsed: 0,
          },
        },
      },
      select: { id: true, email: true, name: true },
    });

    // Device trust + security logging (mag falen zonder registratie te breken)
    await touchDevice(req, user.id, true).catch(() => {});
    await logSecurityEvent({
      req,
      userId: user.id,
      type: "REGISTER_SUCCESS",
      severity: 1,
      scoreDelta: -1,
      meta: { devBypass: !requireOtp || isDev },
    }).catch(() => {});

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    console.error("POST /api/auth/register failed:", e);
    return NextResponse.json({ ok: false, error: e?.message || "REGISTER_FAILED" }, { status: 500 });
  }
}