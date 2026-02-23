import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import ChatView from "@/components/ChatView";
import { ensureArchivedIfInactive } from "@/lib/chat/archive";

const DEPTH_QUESTIONS = [
  "Wat maakt een weekend écht goed voor jou?",
  "Wat is voor jou het belangrijkste in een relatie?",
  "Wat wil je dit jaar graag meer doen of leren?",
  "Welke kleine gewoonte maakt jouw leven beter?",
  "Wat zien mensen vaak verkeerd aan jou?",
] as const;

const UNLOCK_ALTERNATIONS_TOTAL = 5;

function safeJsonArray(raw: any): string[] {
  if (!raw) return [];
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ChatMatchPage({ params }: { params: { matchId: string } }) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const matchId = params.matchId;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, userAId: true, userBId: true, isUnlocked: true, unlockedAt: true, isArchived: true, archivedAt: true },
  });

  if (!match) redirect("/chat");
  if (match.userAId !== userId && match.userBId !== userId) redirect("/chat");

  // Auto-archive if inactive (15 days)
  const archivedState = await ensureArchivedIfInactive(matchId);
  const isArchived = match.isArchived || archivedState.isArchived;

  const otherUserId = match.userAId === userId ? match.userBId : match.userAId;

  const other = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: {
      id: true,
      name: true,
      city: true,
      profile: {
        select: {
          intent: true,
          religion: true,
          values: true,
          passions: true,
          q1: true,
          q2: true,
          q3: true,
          q4: true,
          q5: true,
        },
      },
      photos: { orderBy: { slot: "asc" }, select: { id: true, slot: true } },
    },
  });
  if (!other) redirect("/chat");

  // Load only latest messages (pagination happens client-side)
  const latest = await prisma.message.findMany({
    where: { matchId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 60,
    select: { id: true, fromUserId: true, toUserId: true, text: true, createdAt: true, isRead: true, readAt: true },
  });

  const initialMessages = [...latest].reverse(); // chronological

  // Unlock progress (remaining)
  const allForUnlock = await prisma.message.findMany({
    where: { matchId },
    orderBy: { createdAt: "asc" },
    select: { fromUserId: true, text: true },
  });

  const meaningfulSenderIds = allForUnlock
    .filter((m) => {
      const t = (m.text || "").trim();
      if (t.length < 3) return false;
      return /[A-Za-z0-9À-ÖØ-öø-ÿ]/.test(t);
    })
    .map((m) => m.fromUserId);

  let alternations = 0;
  for (let i = 1; i < meaningfulSenderIds.length; i++) {
    if (meaningfulSenderIds[i] !== meaningfulSenderIds[i - 1]) alternations++;
  }

  const remaining = Math.max(0, UNLOCK_ALTERNATIONS_TOTAL - alternations);

  const otherValues = safeJsonArray(other.profile?.values);
  const otherPassions = safeJsonArray(other.profile?.passions);

  const answersRaw = [other.profile?.q1, other.profile?.q2, other.profile?.q3, other.profile?.q4, other.profile?.q5].map((x) => String(x || "").trim());

  const qa = DEPTH_QUESTIONS.map((q, idx) => {
    const a = answersRaw[idx] || "";
    return { q, a };
  }).filter((x) => x.a);

  // Least-leak: only provide photo ids when unlocked
  const unlockedPhotoIds = match.isUnlocked ? other.photos.map((p) => p.id) : [];

  return (
    <ChatView
      match={{
        id: matchId,
        isUnlocked: match.isUnlocked,
        isArchived,
        archivedAt: (match.archivedAt ?? archivedState.archivedAt) ? (match.archivedAt ?? archivedState.archivedAt)!.toISOString() : null,
      }}
      meId={userId}
      other={{
        id: other.id,
        name: other.name || "Onbekend",
        city: other.city || "",
        intent: other.profile?.intent || null,
        religion: other.profile?.religion || null,
        values: otherValues,
        passions: otherPassions,
        qa,
        photoIds: unlockedPhotoIds,
        avatar: match.isUnlocked && other.photos?.[0]?.id ? `/api/photo/${other.photos[0].id}` : "/logo.png",
      }}
      initial={{
        messages: initialMessages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
          readAt: m.readAt ? m.readAt.toISOString() : null,
        })),
        isUnlocked: match.isUnlocked,
        remaining,
        unlockTotal: UNLOCK_ALTERNATIONS_TOTAL,
      }}
    />
  );
}