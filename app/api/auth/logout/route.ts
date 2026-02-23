import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function doLogout(req: Request) {
  // Redirect to login and clear auth cookie
  const res = NextResponse.redirect(new URL("/login", req.url), 303);
  clearSession(res, req.url);
  return res;
}

// ✅ Your /logout page triggers a GET → we must support GET
export async function GET(req: Request) {
  return doLogout(req);
}

// ✅ Keep POST too (useful if you later call it from fetch())
export async function POST(req: Request) {
  return doLogout(req);
}