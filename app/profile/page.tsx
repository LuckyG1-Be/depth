import { redirect } from "next/navigation";

export default function ProfileRootRedirect() {
  redirect("/profile/me");
}