import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET /api/resource-progress
// Returns all completed resources for the authenticated user.
export async function GET() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("get_resource_progress");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ progress: data ?? [] });
}

// POST /api/resource-progress
// Marks a resource as complete for the authenticated user (idempotent).
// Body: { resource_type: "video" | "article", resource_id: string }
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { resource_type, resource_id } = body as {
    resource_type?: string;
    resource_id?: string;
  };

  if (
    (resource_type !== "video" && resource_type !== "article") ||
    !resource_id
  ) {
    return NextResponse.json(
      { error: "resource_type ('video' | 'article') and resource_id are required" },
      { status: 400 }
    );
  }

  const { error } = await supabase.rpc("mark_resource_complete", {
    p_type: resource_type,
    p_id: resource_id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
