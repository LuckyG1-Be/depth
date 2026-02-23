import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function VerifyPage() {
  const session = await getSession();

  // Als je al ingelogd bent, ga door naar discover
  if (session?.user?.id) {
    redirect("/discover");
  }

  // Anders naar login (verify is enkel nodig tijdens onboarding)
  redirect("/login");
}
