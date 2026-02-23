import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyAuthToken } from "@/lib/auth/jwt";

export const AUTH_COOKIE = "depth_token";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role?: string | null;
};

export type Session = { user: SessionUser };

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyAuthToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) return null;
  return { user };
}

