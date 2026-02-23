import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withTx } from "@/lib/dbTx";
import { getSession } from "@/lib/auth";
import { enforceMaxBodyBytes, rateLimitOrNull } from "@/lib/security";
import { redactForEvidence } from "@/lib/safety/chatModeration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Reason =
  | "HARASSMENT"
  | "SEXUAL_CONTENT"
  | "SCAM"
  | "IMPERSONATION"
  | "UNDERAGE"
  | "HATE"
  | "VIOLENCE"
  | "OTHER";

function priorityFor(reason: Reason) {
  if (reason === "UNDERAGE") return 10;
  if (reason === "HATE" || reason === "VIOLENCE") return 8;
  if (reason === "SEXUAL_CONTENT") return 7;
  if (reason === "SCAM") return 6;
  return 3;
}

type EvidenceMsg = { id: string; createdAt: string; fromUserId: string; toUserId: string; text: string };

export async function POST(req: Request) {
  const tooBig = await enforceMaxBodyBytes(req, 20_000);
  if (tooBig) return tooBig;

  const rl = await rateLimitOrNull({ key: "matches_report", limit: 20, windowMs: 60_000 });
  if (rl) return rl;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as null | {
    otherUserId?: string;
    reasonCode?: Reason;
    details?: string;
    blockImmediately?: boolean;
    includeLastMessages?: boolean;
  };

  const reporterId = session.user.id;
  const reportedId = (body?.otherUserId || "").trim();
  const reasonCode = (body?.reasonCode || "OTHER") as Reason;
  const details = (body?.details || "").trim().slice(0, 600);

  const blockImmediately = body?.blockImmediately !== false;
  const includeLastMessages = body?.includeLastMessages !== false;

  if (!reportedId) return NextResponse.json({ ok: false, error: "MISSING_OTHER" }, { status: 400 });
  if (reportedId === reporterId) return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });

  const a = reporterId < reportedId ? reporterId : reportedId;
  const b = reporterId < reportedId ? reportedId : reporterId;

  const match = await prisma.match.findFirst({
    where: { userAId: a, userBId: b },
    select: { id: true },
  });

  let evidenceJson = "[]";

  if (includeLastMessages && match?.id) {
    const msgs = await prisma.message.findMany({
      where: { matchId: match.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, createdAt: true, fromUserId: true, toUserId: true, text: true },
    });

    const evidence: EvidenceMsg[] = msgs
      .reverse()
      .map((m: { id: string; createdAt: Date; fromUserId: string; toUserId: string; text: string }) => ({
        id: m.id,
        createdAt: m.createdAt.toISOString(),
        fromUserId: m.fromUserId,
        toUserId: m.toUserId,
        text: redactForEvidence(m.text),
      }));

    evidenceJson = JSON.stringify(evidence);
  }

  await withTx(async (tx) => {
    await tx.report.create({
      data: {
        reporterId,
        reportedId,
        matchId: match?.id ?? null,
        reasonCode,
        details: details || null,
        includeLastMessages,
        blockImmediately,
        evidence: evidenceJson,
        priority: priorityFor(reasonCode),
        status: "OPEN",
      },
    });

    await tx.accountFlag.create({
      data: {
        userId: reporterId,
        code: "REPORT_CREATE",
        reason: `reported:${reportedId}:${reasonCode}${details ? `:${details.slice(0, 60)}` : ""}`,
      },
    });

    if (blockImmediately) {
      await tx.block.upsert({
        where: { blockerId_blockedId: { blockerId: reporterId, blockedId: reportedId } },
        update: {},
        create: { blockerId: reporterId, blockedId: reportedId, reason: `report:${reasonCode}` },
      });

      await tx.like.deleteMany({
        where: {
          OR: [
            { fromUserId: reporterId, toUserId: reportedId },
            { fromUserId: reportedId, toUserId: reporterId },
          ],
        },
      });

      if (match?.id) {
        await tx.match.update({
          where: { id: match.id },
          data: { isArchived: true, archivedAt: new Date() },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}