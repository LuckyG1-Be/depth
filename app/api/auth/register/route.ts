import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { touchDevice } from "@/lib/device";
import { logSecurityEvent } from "@/lib/security/risk";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { EMAIL_VERIFY_COOKIE, readEmailToken } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readBody(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    return Object.fromEntries(form.entries());
  }
  return {};
}

function boolEnv(name: string, fallback: boolean) {
  const v = (process.env[name] ?? "").toLowerCase().trim();
  if (!v) return fallback;
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

// Heel basic email check (later kan strenger)
function isValidEmail(email: string) {
  const e = email.trim().toLowerCase();
  return e.includes("@") && e.includes(".");
}

export async function POST(req: Request) {
  try {
    const body = (await readBody(req)) as {
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

    // E-mail verification is required in production; development keeps the local seed flow usable.
    const requireOtp = boolEnv("REQUIRE_EMAIL_VERIFICATION", true);
    const isDev = process.env.NODE_ENV !== "production";

    if (requireOtp && !isDev) {
      const emailToken = await readEmailToken((await cookies()).get(EMAIL_VERIFY_COOKIE)?.value ?? null);
      if (!emailToken || emailToken.email !== email || emailToken.purpose !== "REGISTER") {
        return NextResponse.json({ ok: false, error: "EMAIL_VERIFICATION_REQUIRED" }, { status: 400 });
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
    // The current schema keeps phone unique/non-null for backwards compatibility.
    // It is no longer a registration requirement; users can add it later in profile settings.
    const phone = phoneRaw || `email-only-${randomUUID()}`;

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

        // A verified e-mail is the account-level verification signal.
        verified: true,
        phoneVerifiedAt: null,

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

    const response = NextResponse.json({ ok: true, user });
    response.cookies.set(EMAIL_VERIFY_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
    return response;
  } catch (e: any) {
    console.error("POST /api/auth/register failed:", e);
    return NextResponse.json({ ok: false, error: e?.message || "REGISTER_FAILED" }, { status: 500 });
  }
}
