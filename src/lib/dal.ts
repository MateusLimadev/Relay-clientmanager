import "server-only";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";

export async function requireSession() {
  const authenticated = await verifySession();
  if (!authenticated) redirect("/login");
}
