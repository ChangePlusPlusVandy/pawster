import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getVideoProgress() {
  const supabase = await createSupabaseServerClient();

  const [{ count: total }, { data: progress }] = await Promise.all([
    supabase.from("video_resources").select("*", { count: "exact", head: true }),
    supabase.rpc("get_resource_progress"),
  ]);

  return { total: total ?? 0, completed: progress?.length ?? 0 };
}

export default async function DashboardPage() {
  await connection();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const { total, completed } = await getVideoProgress();

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone = total > 0 && completed === total;

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-gray-500 mb-8">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}.
        </p>

        <Link
          href="/videos"
          className="block bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Training Videos</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Watch required videos and read articles before your first foster placement.
              </p>
            </div>
            {allDone ? (
              <span className="shrink-0 text-xs font-semibold text-green-700 bg-green-50 border border-green-300 rounded-full px-2.5 py-1">
                Complete
              </span>
            ) : (
              <span className="shrink-0 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1">
                In progress
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">Your progress</span>
            <span className="text-xs font-semibold text-gray-700">
              {completed} / {total} completed
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          <p className="text-sm text-blue-600 font-medium mt-4">
            {allDone ? "Review videos →" : "Continue →"}
          </p>
        </Link>
      </div>
    </main>
  );
}
