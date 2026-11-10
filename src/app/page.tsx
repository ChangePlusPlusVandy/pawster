import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { LogoutButton } from "@/components/logout-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function UserSessionStatus() {
  // Auth depends on the incoming request and must not run during prerendering.
  await connection();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? (
    <div className="flex flex-col items-start gap-3">
      <p role="status">You’re logged in as {user.email}.</p>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex flex-col items-start gap-3">
      <p>You’re not logged in.</p>
      <Link className="underline" href="/login">
        Log in with email
      </Link>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between px-16 py-32 bg-white dark:bg-black sm:items-start">
        <h1 className="text-2xl font-semibold">Pawster</h1>
        <Suspense fallback={<p role="status">Checking login status…</p>}>
          <UserSessionStatus />
        </Suspense>
      </main>
    </div>
  );
}
