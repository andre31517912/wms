import { redirect } from "next/navigation";
import { requireUser, homePathFor } from "@/lib/auth";
import { PendingContent } from "./PendingContent";

export default async function PendingPage() {
  const user = await requireUser();
  if (user.accountStatus !== "PENDING") redirect(homePathFor(user));

  return <PendingContent name={user.name} />;
}
