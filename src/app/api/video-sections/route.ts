import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type VideoResource = {
  id: string;
  resource_type: "video" | "article";
  title: string;
  youtube_id: string | null;
  start_seconds: number | null;
  href: string | null;
  required: boolean;
  display_order: number;
};

export type VideoSection = {
  id: string;
  title: string;
  display_order: number;
  resources: VideoResource[];
};

// GET /api/video-sections
// Returns all sections with their ordered resources.
export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data: sections, error: sectionsError } = await supabase
    .from("video_sections")
    .select("id, title, display_order")
    .order("display_order");

  if (sectionsError) {
    return NextResponse.json({ error: sectionsError.message }, { status: 500 });
  }

  const { data: resources, error: resourcesError } = await supabase
    .from("video_resources")
    .select("id, section_id, resource_type, title, youtube_id, start_seconds, href, required, display_order")
    .order("display_order");

  if (resourcesError) {
    return NextResponse.json({ error: resourcesError.message }, { status: 500 });
  }

  const result: VideoSection[] = sections.map((section) => ({
    ...section,
    resources: resources
      .filter((r) => r.section_id === section.id)
      .map(({ section_id: _section_id, ...r }) => r) as VideoResource[],
  }));

  return NextResponse.json({ sections: result });
}
