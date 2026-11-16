export const instant = false;

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { requireStaff } from "@/lib/auth/require-staff";

export default async function AdminPage() {
  await connection();

  const auth = await requireStaff();

  if (!auth.authorized) {
    if (auth.reason === "unauthenticated") {
      redirect("/login");
    }

    redirect("/access-denied");
  }

  return (
    <main>
      <h1>Staff Portal</h1>
      <p>Logged in as {auth.profile.email}</p>
    </main>
  );
}