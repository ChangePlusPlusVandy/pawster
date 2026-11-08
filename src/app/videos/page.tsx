"use client";

import { useEffect, useRef, useState } from "react";

const sections = [
  {
    title: "Fostering Dogs",
    videos: [
      { id: "4ugWXnbMoIo", title: "How to Greet a Dog So You'll Become Friends", required: true },
      { id: "c-GW0zi7nmk", title: "Dog Training With Positive Reinforcement", required: true },
      { id: "qD4M9gpHkNI", title: "Meeting New Dogs", required: true },
      { id: "m5RbwhhzlNo", title: "Keeping Interactions between Foster Dogs and Children Safe", required: true, start: 3 },
      { id: "BRlxhvQ8I9g", title: "Introducing Your Foster Dog to Cats", required: true },
    ],
    article: {
      href: "https://www.animalhumanesociety.org/resource/how-successfully-introduce-two-dogs",
      title: "How to Successfully Introduce Two Dogs",
      required: true,
    },
  },
  {
    title: "Fostering Cats",
    videos: [
      { id: "00ZUeW-6wBI", title: "How To Properly Greet Cats", required: true },
      { id: "d-ZcYXmkvjY", title: "Bringing Your Foster Cat Home", required: true },
      { id: "b_M-AuwrDY8", title: "Low Stress Cat Transport Best", required: true },
      { id: "lSDI5diNu4Y", title: "The Do's & Don'ts of Introducing Cats", required: true, start: 5 },
      { id: "ojS7XwtoXtw", title: "Cat Introductions: Good First Impressions are a must!", required: false },
    ],
    article: {
      href: "https://www.jacksongalaxy.com/blogs/news/the-dos-and-donts-of-introducing-cats",
      title: "The Do's & Don'ts of Introducing Cats",
      required: false,
    },
  },
];

type Video = (typeof sections)[number]["videos"][number];
const allVideos: Video[] = sections.flatMap((s) => s.videos);

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

export default function VideosPage() {
  const [completedVideos, setCompletedVideos] = useState<Record<string, boolean>>({});
  const [completedArticles, setCompletedArticles] = useState<Record<string, boolean>>({});
  const playersRef = useRef<Record<string, { destroy: () => void }>>({});

  useEffect(() => {
    const initPlayers = () => {
      allVideos.forEach((video) => {
        playersRef.current[video.id] = new window.YT.Player(`yt-${video.id}`, {
          videoId: video.id,
          playerVars: (video as Video & { start?: number }).start
            ? { start: (video as Video & { start?: number }).start }
            : undefined,
          events: {
            onStateChange: (e) => {
              if (e.data === 0) {
                setCompletedVideos((prev) => ({ ...prev, [video.id]: true }));
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
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Videos</h1>
        <p className="text-gray-500 mb-10">
          Resources and guides for foster caregivers.
        </p>

        <div className="space-y-14">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-3">
                {section.title}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {section.videos.map((video) => {
                  const done = completedVideos[video.id] ?? false;
                  return (
                    <div
                      key={video.id}
                      className={`bg-white rounded-xl shadow-sm overflow-hidden border transition-colors ${
                        done ? "border-green-400" : "border-gray-200"
                      }`}
                    >
                      {/* YT API replaces this div with an iframe */}
                      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                        <div
                          id={`yt-${video.id}`}
                          className="absolute inset-0 w-full h-full"
                        />
                      </div>
                      <div className="p-4 flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-800">{video.title}</p>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {done && (
                            <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-300 rounded px-1.5 py-0.5">
                              Completed
                            </span>
                          )}
                          {video.required && !done && (
                            <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
                              Required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {(() => {
                const articleDone = completedArticles[section.article.href] ?? false;
                return (
                  <a
                    href={section.article.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      setCompletedArticles((prev) => ({
                        ...prev,
                        [section.article.href]: true,
                      }))
                    }
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
                    {section.article.title}
                    {articleDone && (
                      <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-300 rounded px-1.5 py-0.5">
                        Completed
                      </span>
                    )}
                    {section.article.required && !articleDone && (
                      <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
                        Required
                      </span>
                    )}
                  </a>
                );
              })()}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
