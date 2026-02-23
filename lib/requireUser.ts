import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export async function requireUser() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}
