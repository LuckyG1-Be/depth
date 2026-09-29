import type { ReactNode } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import EmptyStateCard from "@/components/EmptyStateCard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const GREEN = "#66b96c";
const BLUE = "#4f7dff";

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3 7 7 .6-5.3 4.6 1.7 7.8L12 18l-6.4 3 1.7-7.8L2 9.6 9 9l3-7z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

function SectionHeader({ icon, title, count, color }: { icon: ReactNode; title: string; count: number; color: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border" style={{ borderColor: `${color}66`, background: `${color}18`, color }}>
          {icon}
        </div>
        <h2 className="text-base font-semibold text-white/90">{title}</h2>
      </div>
      <span className="rounded-full border border-white/10 bg-black/18 px-2.5 py-1 text-xs font-semibold text-white/58">{count}</span>
    </div>
  );
}

function LikePreviewCard({ photoId, label, borderColor, icon }: { photoId: string; label: string; borderColor: string; icon: ReactNode }) {
  const src = `/api/photo/preview/${photoId}?w=520&blur=18`;
  return (
    <div className="overflow-hidden rounded-[24px] border bg-black/20" style={{ borderColor }}>
      <div className="relative h-44 overflow-hidden sm:h-56">
        <img
          src={src}
          alt=""
          className="h-full w-full scale-110 object-cover"
          style={{ filter: "blur(16px) saturate(0.96) contrast(1.04)" }}
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/42 px-3 py-1 text-[11px] font-semibold text-white/78 backdrop-blur">
          Verborgen
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-black/28 px-3 py-3 text-xs">
        <div className="flex min-w-0 items-center gap-2 text-white/82">
          <span className="shrink-0">{icon}</span>
          <span className="truncate font-semibold">{label}</span>
        </div>
        <span className="shrink-0 text-white/45">Match nodig</span>
      </div>
    </div>
  );
}

export default async function LikesPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  const meId = session.user.id;

  const [blocks, matches] = await Promise.all([
    prisma.block.findMany({
      where: { OR: [{ blockerId: meId }, { blockedId: meId }] },
      select: { blockerId: true, blockedId: true },
    }),
    prisma.match.findMany({
      where: { OR: [{ userAId: meId }, { userBId: meId }] },
      select: { userAId: true, userBId: true },
    }),
  ]);

  const blockedIds = new Set<string>();
  for (const b of blocks) {
    blockedIds.add(b.blockerId);
    blockedIds.add(b.blockedId);
  }
  blockedIds.delete(meId);

  const matchedIds = new Set<string>();
  for (const m of matches) matchedIds.add(m.userAId === meId ? m.userBId : m.userAId);

  const exclude = Array.from(new Set([...matchedIds, ...blockedIds]));
  const baseWhere = {
    toUserId: meId,
    ...(exclude.length ? { fromUserId: { notIn: exclude } } : {}),
  } as const;

  const [totalCount, superCount, likesRaw] = await Promise.all([
    prisma.like.count({ where: baseWhere }),
    prisma.like.count({ where: { ...baseWhere, type: "SUPERLIKE" } }),
    prisma.like.findMany({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        type: true,
        fromUser: { select: { photos: { orderBy: { slot: "asc" }, take: 1, select: { id: true } } } },
      },
    }),
  ]);

  const likeCount = Math.max(0, totalCount - superCount);
  const items = likesRaw
    .map((l) => ({ id: l.id, type: (l.type || "LIKE").toString(), photoId: l.fromUser.photos[0]?.id || null }))
    .filter((x) => !!x.photoId) as Array<{ id: string; type: string; photoId: string }>;

  const superDisplay = items.filter((x) => x.type === "SUPERLIKE");
  const likeDisplay = items.filter((x) => x.type !== "SUPERLIKE");

  return (
    <main className="mx-auto max-w-6xl px-3 py-3 pb-28 sm:px-6 sm:py-8">
      <div className="mb-3 flex items-end justify-between gap-4 sm:mb-5">
        <div>
          <div className="depth-eyebrow">Connecties</div>
          <h1 className="mt-0.5 text-[1.42rem] font-semibold tracking-[-0.02em] text-white sm:mt-1 sm:text-3xl">Likes</h1>
          <p className="mt-0.5 max-w-xl text-[13px] text-white/55 sm:mt-1 sm:text-sm">Signalen en matches op één plek.</p>
        </div>
        <Link href="/profile/me" className="hidden rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/[0.075] sm:inline-flex">
          Profiel verbeteren
        </Link>
      </div>

      <div className="mt-3 space-y-6 sm:mt-6 sm:space-y-9">
        {totalCount === 0 ? (
          <EmptyStateCard
            eyebrow="Nog geen likes"
            title="Nog geen likes"
            description="Start in Discover en like gericht. Zo vergroot je de kans op wederzijdse matches."
            tips={["4 duidelijke foto’s", "Persoonlijke antwoorden", "Like gericht"]}
            actions={[
              { href: "/discover", label: "Naar Discover", primary: true },
              { href: "/profile/me", label: "Profiel verfijnen" },
            ]}
          />
        ) : null}

        {totalCount > 0 && items.length === 0 ? (
          <EmptyStateCard
            eyebrow="Likes zonder preview"
            title="Er zijn likes, maar nog geen veilige preview"
            description="Ze tellen mee. Start in Discover om matches te maken."
            actions={[{ href: "/discover", label: "Verder ontdekken", primary: true }]}
          />
        ) : null}

        {superDisplay.length > 0 ? (
          <section>
            <SectionHeader icon={<StarIcon />} title="Dieptesignalen" count={superCount} color={BLUE} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {superDisplay.map((it) => (
                <LikePreviewCard key={it.id} photoId={it.photoId} label="Dieptesignaal" borderColor={`${BLUE}55`} icon={<StarIcon />} />
              ))}
            </div>
          </section>
        ) : null}

        {likeDisplay.length > 0 ? (
          <section>
            <SectionHeader icon={<HeartIcon />} title="Likes" count={likeCount} color={GREEN} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {likeDisplay.map((it) => (
                <LikePreviewCard key={it.id} photoId={it.photoId} label="Like ontvangen" borderColor={`${GREEN}55`} icon={<HeartIcon />} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
