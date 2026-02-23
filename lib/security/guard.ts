import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { logSecurityEvent } from "./risk";
import type { SecurityEventType } from "./types";

const prisma = new PrismaClient();

export async function guardUserAction(req: Request, userId: string, action: SecurityEventType) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "no_user" }, { status: 401 }),
    };
  }

  if (user.isBlocked) {
    await logSecurityEvent({
      userId,
      type: "BLOCKED_ACTION",
      severity: 6,
      scoreDelta: 4,
      req,
      meta: { action },
    });

    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "blocked" }, { status: 403 }),
    };
  }

  // soft friction: log only (no hard block)
  if (user.riskLevel === "HIGH" || user.riskLevel === "CRITICAL") {
    await logSecurityEvent({
      userId,
      type: "SUSPICIOUS_PATTERN",
      severity: 5,
      scoreDelta: 0,
      req,
      meta: { action, reason: "high_risk_user", riskScore: user.riskScore, riskLevel: user.riskLevel },
    });
  }

  // always log action
  await logSecurityEvent({
    userId,
    type: action,
    severity: 2,
    scoreDelta: 0,
    req,
  });

  return { ok: true as const, user };
}
