"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoSection, VideoResource } from "@/app/api/video-sections/route";

const FALLBACK_SECTIONS: VideoSection[] = [
  {
    id: "a1000000-0000-0000-0000-000000000001",
    title: "Fostering Dogs",
    display_order: 1,
    resources: [
      { id: "1", resource_type: "video", title: "How to Greet a Dog So You'll Become Friends", youtube_id: "4ugWXnbMoIo", start_seconds: null, href: null, required: true, display_order: 1 },
      { id: "2", resource_type: "video", title: "Dog Training With Positive Reinforcement", youtube_id: "c-GW0zi7nmk", start_seconds: null, href: null, required: true, display_order: 2 },
      { id: "3", resource_type: "video", title: "Meeting New Dogs", youtube_id: "qD4M9gpHkNI", start_seconds: null, href: null, required: true, display_order: 3 },
      { id: "4", resource_type: "video", title: "Keeping Interactions between Foster Dogs and Children Safe", youtube_id: "m5RbwhhzlNo", start_seconds: 3, href: null, required: true, display_order: 4 },
      { id: "5", resource_type: "video", title: "Introducing Your Foster Dog to Cats", youtube_id: "BRlxhvQ8I9g", start_seconds: null, href: null, required: true, display_order: 5 },
      { id: "6", resource_type: "article", title: "How to Successfully Introduce Two Dogs", youtube_id: null, start_seconds: null, href: "https://www.animalhumanesociety.org/resource/how-successfully-introduce-two-dogs", required: true, display_order: 6 },
    ],
  },
  {
    id: "a1000000-0000-0000-0000-000000000002",
    title: "Fostering Cats",
    display_order: 2,
    resources: [
      { id: "7",  resource_type: "video", title: "How To Properly Greet Cats", youtube_id: "00ZUeW-6wBI", start_seconds: null, href: null, required: true, display_order: 1 },
      { id: "8",  resource_type: "video", title: "Bringing Your Foster Cat Home", youtube_id: "d-ZcYXmkvjY", start_seconds: null, href: null, required: true, display_order: 2 },
      { id: "9",  resource_type: "video", title: "Low Stress Cat Transport Best", youtube_id: "b_M-AuwrDY8", start_seconds: null, href: null, required: true, display_order: 3 },
      { id: "10", resource_type: "video", title: "The Do's & Don'ts of Introducing Cats", youtube_id: "lSDI5diNu4Y", start_seconds: 5, href: null, required: true, display_order: 4 },
      { id: "11", resource_type: "video", title: "Cat Introductions: Good First Impressions are a must!", youtube_id: "ojS7XwtoXtw", start_seconds: null, href: null, required: false, display_order: 5 },
      { id: "12", resource_type: "article", title: "The Do's & Don'ts of Introducing Cats", youtube_id: null, start_seconds: null, href: "https://www.jacksongalaxy.com/blogs/news/the-dos-and-donts-of-introducing-cats", required: false, display_order: 6 },
    ],
  },
];

declare global {
  interface Window {
    YT: {
      Player: new (
        id: string,
        options: {
          videoId: string;
          playerVars?: { start?: number };
          events?: { onStateChange?: (e: { data: number }) => void };
        }
      ) => { destroy: () => void };
      PlayerState: { ENDED: number };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

async function markComplete(resource_type: "video" | "article", resource_id: string) {
  try {
    const res = await fetch("/api/resource-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource_type, resource_id }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error("Failed to save progress:", res.status, body);
    }
  } catch (err) {
    console.error("Failed to save progress:", err);
  }
}

export default function VideosPage() {
  const [sections, setSections] = useState<VideoSection[]>([]);
  const [completedVideos, setCompletedVideos] = useState<Record<string, boolean>>({});
  const [completedArticles, setCompletedArticles] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const playersRef = useRef<Record<string, { destroy: () => void }>>({});
  const ytReadyRef = useRef(false);

  // Load sections from DB
  useEffect(() => {
    fetch("/api/video-sections")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(({ sections }: { sections: VideoSection[] }) => {
        setSections(sections.length > 0 ? sections : FALLBACK_SECTIONS);
      })
      .catch(() => setSections(FALLBACK_SECTIONS))
      .finally(() => setLoading(false));
  }, []);

  // Load saved progress
  useEffect(() => {
    fetch("/api/resource-progress")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(({ progress }: { progress: { resource_type: string; resource_id: string }[] }) => {
        if (!Array.isArray(progress)) return;
        const videos: Record<string, boolean> = {};
        const articles: Record<string, boolean> = {};
        for (const row of progress) {
          if (row.resource_type === "video") videos[row.resource_id] = true;
          if (row.resource_type === "article") articles[row.resource_id] = true;
        }
        setCompletedVideos((prev) => ({ ...prev, ...videos }));
        setCompletedArticles((prev) => ({ ...prev, ...articles }));
      })
      .catch(() => {});
  }, []);

  // Init YouTube players once sections are loaded AND the divs are in the DOM
  useEffect(() => {
    if (sections.length === 0 || loading) return;

    const allVideos = sections
      .flatMap((s) => s.resources)
      .filter((r): r is VideoResource & { resource_type: "video" } => r.resource_type === "video");

    const initPlayers = () => {
      ytReadyRef.current = true;
      allVideos.forEach((video) => {
        playersRef.current[video.youtube_id!] = new window.YT.Player(`yt-${video.youtube_id}`, {
          videoId: video.youtube_id!,
          playerVars: video.start_seconds ? { start: video.start_seconds } : undefined,
          events: {
            onStateChange: (e) => {
              if (e.data === 0) {
                setCompletedVideos((prev) => ({ ...prev, [video.youtube_id!]: true }));
                markComplete("video", video.youtube_id!);
              }
            },
          },
        });
      });
    };

    if (window.YT?.Player) {
      initPlayers();
    } else {
      window.onYouTubeIframeAPIReady = initPlayers;
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
    }

    return () => {
      Object.values(playersRef.current).forEach((p) => p?.destroy());
      playersRef.current = {};
    };
  }, [sections, loading]);

  const allResources = sections.flatMap((s) => s.resources);
  const totalResources = allResources.length;
  const completedCount =
    Object.values(completedVideos).filter(Boolean).length +
    Object.values(completedArticles).filter(Boolean).length;
  const progressPct = totalResources > 0 ? Math.round((completedCount / totalResources) * 100) : 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Videos</h1>
          <p className="text-gray-400 mt-6">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Videos</h1>
        <p className="text-gray-500 mb-6">Resources and guides for foster caregivers.</p>

        {/* Progress bar */}
        <div className="mb-10 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Your progress</span>
            <span className="text-sm font-semibold text-gray-900">
              {completedCount} / {totalResources} completed
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="space-y-14">
          {sections.map((section) => {
            const videos = section.resources.filter((r) => r.resource_type === "video");
            const article = section.resources.find((r) => r.resource_type === "article");

            return (
              <section key={section.id}>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-3">
                  {section.title}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {videos.map((video) => {
                    const done = completedVideos[video.youtube_id!] ?? false;
                    return (
                      <div
                        key={video.id}
                        className={`bg-white rounded-xl shadow-sm overflow-hidden border transition-colors ${
                          done ? "border-green-400" : "border-gray-200"
                        }`}
                      >
                        <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                          <div
                            id={`yt-${video.youtube_id}`}
                            className="absolute inset-0 w-full h-full"
                          />
                        </div>
                        <div className="p-4 flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-800">{video.title}</p>
                          <div className="flex shrink-0 items-center gap-1.5">
                            {done ? (
                              <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-300 rounded px-1.5 py-0.5">
                                Completed
                              </span>
                            ) : video.required ? (
                              <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
                                Required
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {article && (
                  <a
                    href={article.href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      setCompletedArticles((prev) => ({ ...prev, [article.href!]: true }));
                      markComplete("article", article.href!);
                    }}
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    {article.title}
                    {completedArticles[article.href!] ? (
                      <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-300 rounded px-1.5 py-0.5">
                        Completed
                      </span>
                    ) : article.required ? (
                      <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
                        Required
                      </span>
                    ) : null}
                  </a>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
