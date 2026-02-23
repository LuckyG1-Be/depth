import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import ChatListClient from "@/components/ChatListClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ChatPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Chat</h1>
        <p className="mt-1 text-sm opacity-70">Je matches en gesprekken.</p>
      </div>

      <div className="mt-8">
        <ChatListClient />
      </div>
    </main>
  );
}
