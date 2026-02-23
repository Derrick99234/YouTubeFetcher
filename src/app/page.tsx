"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

export default function Home() {
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unwatched" | "watched">("all");
  const [search, setSearch] = useState("");
  const [watchedById, setWatchedById] = useState<Record<string, true>>({});
  const [data, setData] = useState<{
    ok: true;
    resolved: { channelId: string; inputType: string; normalizedQuery: string };
    channel: {
      id: string;
      title: string;
      description: string;
      customUrl?: string;
      thumbnails: Record<string, { url?: string }>;
      statistics?: { subscriberCount?: number; videoCount?: number; viewCount?: number };
    };
    videos: Array<{
      id: string;
      title: string;
      watchUrl: string;
      publishedAt?: string;
      thumbnails: Record<string, { url?: string }>;
      statistics?: { viewCount?: number; likeCount?: number; commentCount?: number };
      duration?: string;
    }>;
  } | null>(null);

  const watchedStorageKey = data ? `ytfetcher:watched:${data.channel.id}` : null;

  useEffect(() => {
    if (!watchedStorageKey) return;
    try {
      const raw = localStorage.getItem(watchedStorageKey);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      const ids = Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
      const next: Record<string, true> = {};
      for (const id of ids) next[id] = true;
      setWatchedById(next);
    } catch {
      setWatchedById({});
    }
  }, [watchedStorageKey]);

  function persistWatched(next: Record<string, true>) {
    if (!watchedStorageKey) return;
    try {
      localStorage.setItem(watchedStorageKey, JSON.stringify(Object.keys(next)));
    } catch { }
  }

  function toggleWatched(videoId: string) {
    setWatchedById((prev) => {
      const next: Record<string, true> = { ...prev };
      if (next[videoId]) {
        delete next[videoId];
      } else {
        next[videoId] = true;
      }
      persistWatched(next);
      return next;
    });
  }

  function markMany(videoIds: string[], watched: boolean) {
    setWatchedById((prev) => {
      const next: Record<string, true> = { ...prev };
      if (watched) {
        for (const id of videoIds) next[id] = true;
      } else {
        for (const id of videoIds) delete next[id];
      }
      persistWatched(next);
      return next;
    });
  }

  const filteredVideos = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    return data.videos.filter((v) => {
      const isWatched = Boolean(watchedById[v.id]);
      if (filter === "watched" && !isWatched) return false;
      if (filter === "unwatched" && isWatched) return false;
      if (term) {
        const title = v.title.toLowerCase();
        if (!title.includes(term)) return false;
      }
      return true;
    });
  }, [data, filter, search, watchedById]);

  const watchedCount = useMemo(() => {
    if (!data) return 0;
    let count = 0;
    for (const v of data.videos) if (watchedById[v.id]) count += 1;
    return count;
  }, [data, watchedById]);

  async function fetchVideos(query: string) {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(
        `/api/youtube/videos?q=${encodeURIComponent(query)}&limit=${encodeURIComponent(String(limit))}`
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error?.message || "Request failed");
        return;
      }
      setData(json);
      setFilter("all");
      setSearch("");
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) {
      setError("Enter a channel link, handle, or name.");
      return;
    }

    await fetchVideos(query);
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans ">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">YouTube Detail Fetcher</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Paste a channel link, handle, or name to fetch all videos.
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="https://www.youtube.com/@SeoulK-Clip or @SeoulK-Clip or The Diary Of A CEO"
              className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-base outline-none focus:border-zinc-400"
            />
            <input
              value={String(limit)}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (!Number.isFinite(n)) return;
                setLimit(Math.min(Math.max(Math.floor(n), 1), 2000));
              }}
              inputMode="numeric"
              className="h-12 w-16 rounded-xl border border-zinc-200 bg-white px-4 text-base outline-none focus:border-zinc-400"
              aria-label="Video limit"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-12 cursor-pointer w-full rounded-xl bg-zinc-950 px-5 text-base font-medium text-white disabled:opacity-60"
            >
              {loading ? "Fetching..." : "Fetch videos"}
            </button>
          </div>

          {/* <div className="flex flex-wrap gap-2">
            {[200, 500, 1000, 2000].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setLimit(n)}
                className={`h-9 rounded-full px-4 text-sm font-medium transition-colors ${limit === n
                  ? "bg-zinc-950 text-white"
                  : "border border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300"
                  }`}
              >
                {n.toLocaleString()}
              </button>
            ))}
            <div className="h-9 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium leading-9 text-zinc-700">
              Limit
            </div>
          </div> */}
        </form>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-900 dark:border-red-500/30">
            {error}
          </div>
        ) : null}

        {data ? (
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-white/10">
                  {data.channel.thumbnails?.default?.url ? (
                    <Image
                      src={data.channel.thumbnails.default.url}
                      alt={data.channel.title}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="text-lg font-semibold">{data.channel.title}</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {data.channel.statistics?.subscriberCount
                      ? `${data.channel.statistics.subscriberCount.toLocaleString()} subscribers`
                      : null}
                    {data.channel.statistics?.videoCount
                      ? ` · ${data.channel.statistics.videoCount.toLocaleString()} videos`
                      : null}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500">
                    Resolved as {data.resolved.inputType} → {data.resolved.channelId}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {watchedCount.toLocaleString()} / {data.videos.length.toLocaleString()} watched
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => fetchVideos(q.trim())}
                    className="h-9 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium hover:border-zinc-300 disabled:opacity-60"
                  >
                    Refetch
                  </button>
                  {(["all", "unwatched", "watched"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setFilter(k)}
                      className={`h-9 rounded-full px-4 text-sm font-medium transition-colors ${filter === k
                        ? "bg-zinc-950 text-white"
                        : "border border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 dark:border-white/15"
                        }`}
                    >
                      {k === "all" ? "All" : k === "unwatched" ? "Unwatched" : "Watched"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search titles..."
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-white/15"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => markMany(filteredVideos.map((v) => v.id), true)}
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium hover:border-zinc-300 dark:border-white/15"
                  >
                    Mark shown watched
                  </button>
                  <button
                    type="button"
                    onClick={() => markMany(filteredVideos.map((v) => v.id), false)}
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium hover:border-zinc-300"
                  >
                    Mark shown unwatched
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredVideos.map((v) => {
                const thumb =
                  v.thumbnails?.medium?.url ||
                  v.thumbnails?.default?.url ||
                  v.thumbnails?.high?.url;
                const isWatched = Boolean(watchedById[v.id]);
                return (
                  <div
                    key={v.id}
                    className={`flex flex-col gap-3 rounded-2xl border bg-white p-4 transition-colors sm:flex-row sm:items-center ${isWatched
                      ? "border-zinc-200/70"
                      : "border-zinc-200 hover:border-zinc-300"
                      }`}
                  >
                    <a
                      href={v.watchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex gap-4 sm:flex-1"
                    >
                      <div className="h-20 w-36 flex-none overflow-hidden rounded-xl bg-zinc-100 dark:bg-white/10">
                        {thumb ? (
                          <Image
                            src={thumb}
                            alt={v.title}
                            width={320}
                            height={180}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className={`truncate text-base font-medium ${isWatched ? "opacity-60" : ""}`}>
                          {v.title}
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                          {v.statistics?.viewCount
                            ? `${v.statistics.viewCount.toLocaleString()} views`
                            : null}
                          {v.statistics?.likeCount
                            ? ` · ${v.statistics.likeCount.toLocaleString()} likes`
                            : null}
                          {v.duration ? ` · ${v.duration}` : null}
                        </div>
                        {v.publishedAt ? (
                          <div className="text-xs text-zinc-500 dark:text-zinc-500">
                            {new Date(v.publishedAt).toLocaleDateString()}
                          </div>
                        ) : null}
                      </div>
                    </a>
                    <button
                      type="button"
                      onClick={() => toggleWatched(v.id)}
                      className={`h-10 rounded-xl px-4 text-sm font-medium transition-colors ${isWatched
                        ? "bg-zinc-950 text-white"
                        : "border border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 dark:border-white/15"
                        }`}
                    >
                      {isWatched ? "Watched" : "Mark watched"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
