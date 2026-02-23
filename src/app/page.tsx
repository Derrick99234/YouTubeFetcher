"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Divider } from "@/components/ui/Divider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export default function Home() {
  const [q, setQ] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unwatched" | "watched">("all");
  const [yearFrom, setYearFrom] = useState<number | "all">("all");
  const [yearTo, setYearTo] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [watchedById, setWatchedById] = useState<Record<string, true>>({});
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
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

  const availableYears = useMemo(() => {
    if (!data) return [];
    const years = new Set<number>();
    for (const v of data.videos) {
      if (!v.publishedAt) continue;
      const d = new Date(v.publishedAt);
      const y = d.getUTCFullYear();
      if (Number.isFinite(y)) years.add(y);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [data]);

  const yearRange = useMemo(() => {
    if (!availableYears.length) return null;
    if (yearFrom === "all" && yearTo === "all") return null;
    const minYear = Math.min(...availableYears);
    const maxYear = Math.max(...availableYears);

    const from = yearFrom === "all" ? minYear : yearFrom;
    const to = yearTo === "all" ? maxYear : yearTo;

    const low = Math.min(from, to);
    const high = Math.max(from, to);
    return { low, high };
  }, [availableYears, yearFrom, yearTo]);

  const filteredVideos = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    const byFilters = data.videos.filter((v) => {
      const isWatched = Boolean(watchedById[v.id]);
      if (filter === "watched" && !isWatched) return false;
      if (filter === "unwatched" && isWatched) return false;
      if (yearRange) {
        if (!v.publishedAt) return false;
        const y = new Date(v.publishedAt).getUTCFullYear();
        if (y < yearRange.low || y > yearRange.high) return false;
      }
      if (term) {
        const title = v.title.toLowerCase();
        if (!title.includes(term)) return false;
      }
      return true;
    });
    const dir = sortOrder === "asc" ? 1 : -1;
    return [...byFilters].sort((a, b) => {
      const ta = a.publishedAt ? Date.parse(a.publishedAt) : NaN;
      const tb = b.publishedAt ? Date.parse(b.publishedAt) : NaN;
      const aOk = Number.isFinite(ta);
      const bOk = Number.isFinite(tb);
      if (!aOk && !bOk) return 0;
      if (!aOk) return 1;
      if (!bOk) return -1;
      return (ta - tb) * dir;
    });
  }, [data, filter, search, watchedById, yearRange, sortOrder]);

  useEffect(() => {
    setPageIndex(0);
  }, [filter, search, yearFrom, yearTo, pageSize, sortOrder, data?.channel.id]);

  const pageCount = useMemo(() => {
    if (!filteredVideos.length) return 1;
    return Math.max(1, Math.ceil(filteredVideos.length / pageSize));
  }, [filteredVideos.length, pageSize]);

  const clampedPageIndex = Math.min(Math.max(pageIndex, 0), pageCount - 1);

  const pagedVideos = useMemo(() => {
    const start = clampedPageIndex * pageSize;
    return filteredVideos.slice(start, start + pageSize);
  }, [clampedPageIndex, filteredVideos, pageSize]);

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
      const res = await fetch(`/api/youtube/videos?q=${encodeURIComponent(query)}`);
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error?.message || "Request failed");
        return;
      }
      setData(json);
      setFilter("all");
      setYearFrom("all");
      setYearTo("all");
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

  const pageStart = clampedPageIndex * pageSize + 1;
  const pageEnd = Math.min((clampedPageIndex + 1) * pageSize, filteredVideos.length);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[calc(var(--radius)-6px)] focus:bg-[rgb(var(--card))] focus:px-3 focus:py-2 focus:text-sm focus:shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg))]"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-[rgb(var(--border))] bg-[rgba(var(--bg),0.85)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[calc(var(--radius)-6px)] bg-[rgba(var(--primary),0.10)] text-[rgb(var(--fg))]">
              <span className="text-sm font-semibold">YF</span>
            </div>
            <div className="flex flex-col">
              <div className="text-base font-semibold tracking-[-0.01em]">YouTubeFetcher</div>
              <div className="text-sm text-[rgb(var(--muted))]">
                Track watched videos across years, without endless scrolling
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setQ("");
                setData(null);
                setError(null);
                setSearch("");
                setFilter("all");
                setYearFrom("all");
                setYearTo("all");
                setPageIndex(0);
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </header>

      <main id="content" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Channel input</CardTitle>
                <CardDescription>Paste a channel link, @handle, or channel name.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium" htmlFor="channel">
                      Channel
                    </label>
                    <Input
                      id="channel"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="https://www.youtube.com/@SeoulK-Clip"
                      autoComplete="off"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium" htmlFor="pagesize">
                        Page size
                      </label>
                      <Select
                        id="pagesize"
                        value={String(pageSize)}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                      >
                        {[10, 20, 50, 100].map((n) => (
                          <option key={n} value={String(n)}>
                            {n}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">Order</label>
                      <Button
                        variant="secondary"
                        disabled={!data}
                        onClick={() => setSortOrder((o) => (o === "desc" ? "asc" : "desc"))}
                        aria-label="Toggle sort order"
                      >
                        {sortOrder === "desc" ? "Newest first ↓" : "Oldest first ↑"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium" htmlFor="yearFrom">
                        Year from
                      </label>
                      <Select
                        id="yearFrom"
                        value={yearFrom === "all" ? "all" : String(yearFrom)}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "all") setYearFrom("all");
                          else setYearFrom(Number(v));
                        }}
                        disabled={!data}
                      >
                        <option value="all">All</option>
                        {[...availableYears].reverse().map((y) => (
                          <option key={y} value={String(y)}>
                            {y}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium" htmlFor="yearTo">
                        Year to
                      </label>
                      <Select
                        id="yearTo"
                        value={yearTo === "all" ? "all" : String(yearTo)}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "all") setYearTo("all");
                          else setYearTo(Number(v));
                        }}
                        disabled={!data}
                      >
                        <option value="all">All</option>
                        {[...availableYears].reverse().map((y) => (
                          <option key={y} value={String(y)}>
                            {y}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <Divider />

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium" htmlFor="title">
                      Search titles
                    </label>
                    <Input
                      id="title"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="e.g. episode, interview, kpop..."
                      disabled={!data}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading}
                      className="w-full sm:w-auto"
                    >
                      {loading ? "Fetching…" : "Fetch videos"}
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={loading || !q.trim()}
                      onClick={() => fetchVideos(q.trim())}
                    >
                      Refetch
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Control what you see and what you’ve watched.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filter === "all" ? "primary" : "secondary"}
                    onClick={() => setFilter("all")}
                    disabled={!data}
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === "unwatched" ? "primary" : "secondary"}
                    onClick={() => setFilter("unwatched")}
                    disabled={!data}
                  >
                    Unwatched
                  </Button>
                  <Button
                    variant={filter === "watched" ? "primary" : "secondary"}
                    onClick={() => setFilter("watched")}
                    disabled={!data}
                  >
                    Watched
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => markMany(pagedVideos.map((v) => v.id), true)}
                    disabled={!data || !pagedVideos.length}
                  >
                    Mark page watched
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => markMany(pagedVideos.map((v) => v.id), false)}
                    disabled={!data || !pagedVideos.length}
                  >
                    Mark page unwatched
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>

          <section className="flex flex-col gap-6">
            {error ? (
              <Card>
                <CardHeader>
                  <CardTitle>Request failed</CardTitle>
                  <CardDescription>{error}</CardDescription>
                </CardHeader>
              </Card>
            ) : null}

            {!data ? (
              <Card>
                <CardHeader>
                  <CardTitle>Ready when you are</CardTitle>
                  <CardDescription>
                    Paste a channel URL, @handle, or name. The app fetches every video and lets you
                    filter by year, search, and track what you’ve watched.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[calc(var(--radius)-6px)] border border-[rgb(var(--border))] bg-[rgba(var(--fg),0.02)] p-4">
                    <div className="text-sm font-semibold">Examples</div>
                    <div className="mt-2 text-sm text-[rgb(var(--muted))]">
                      https://studio.youtube.com/channel/UC…
                      <br />
                      https://www.youtube.com/@SeoulK-Clip
                      <br />
                      The Diary Of A CEO
                    </div>
                  </div>
                  <div className="rounded-[calc(var(--radius)-6px)] border border-[rgb(var(--border))] bg-[rgba(var(--fg),0.02)] p-4">
                    <div className="text-sm font-semibold">Watched tracking</div>
                    <div className="mt-2 text-sm text-[rgb(var(--muted))]">
                      Your watched state is stored per channel in this browser, so you can keep
                      coming back without losing progress.
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 overflow-hidden rounded-[calc(var(--radius)-6px)] border border-[rgb(var(--border))] bg-[rgba(var(--fg),0.04)]">
                        {data.channel.thumbnails?.default?.url ? (
                          <Image
                            src={data.channel.thumbnails.default.url}
                            alt={data.channel.title}
                            width={56}
                            height={56}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex min-w-0 flex-col gap-1">
                        <div className="truncate text-lg font-semibold tracking-[-0.01em]">
                          {data.channel.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-[rgb(var(--muted))]">
                          {data.channel.statistics?.subscriberCount ? (
                            <span>
                              {data.channel.statistics.subscriberCount.toLocaleString()} subscribers
                            </span>
                          ) : null}
                          {data.channel.statistics?.videoCount ? (
                            <span>· {data.channel.statistics.videoCount.toLocaleString()} videos</span>
                          ) : null}
                          <span>· {watchedCount.toLocaleString()} watched</span>
                        </div>
                        <div className="text-xs text-[rgb(var(--muted-2))]">
                          {data.resolved.inputType} → {data.resolved.channelId}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={filter === "watched" ? "success" : "neutral"}>
                        {filter === "all" ? "All videos" : filter === "unwatched" ? "Unwatched" : "Watched"}
                      </Badge>
                      <Badge variant={yearRange ? "success" : "neutral"}>
                        {yearRange ? `${yearRange.low}–${yearRange.high}` : "All years"}
                      </Badge>
                      <Badge variant="neutral">{filteredVideos.length.toLocaleString()} results</Badge>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-[rgb(var(--muted))]">
                    Showing {filteredVideos.length ? pageStart.toLocaleString() : "0"}–{pageEnd.toLocaleString()}{" "}
                    of {filteredVideos.length.toLocaleString()}
                  </div>
                  <div className="text-sm text-[rgb(var(--muted))]">
                    Page {(clampedPageIndex + 1).toLocaleString()} / {pageCount.toLocaleString()}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {pagedVideos.map((v) => {
                    const thumb =
                      v.thumbnails?.medium?.url ||
                      v.thumbnails?.default?.url ||
                      v.thumbnails?.high?.url;
                    const isWatched = Boolean(watchedById[v.id]);
                    return (
                      <Card
                        key={v.id}
                        className="transition-[border-color,box-shadow,transform] duration-150 hover:shadow-md"
                      >
                        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <a
                            href={v.watchUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex min-w-0 flex-1 gap-4 rounded-[calc(var(--radius)-6px)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg))]"
                          >
                            <div className="h-20 w-36 flex-none overflow-hidden rounded-[calc(var(--radius)-6px)] border border-[rgb(var(--border))] bg-[rgba(var(--fg),0.04)]">
                              {thumb ? (
                                <Image
                                  src={thumb}
                                  alt={v.title}
                                  width={320}
                                  height={180}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                />
                              ) : null}
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                              <div
                                className={`truncate text-base font-semibold tracking-[-0.01em] ${isWatched ? "opacity-60" : ""
                                  }`}
                              >
                                {v.title}
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-[rgb(var(--muted))]">
                                {v.statistics?.viewCount ? (
                                  <span>{v.statistics.viewCount.toLocaleString()} views</span>
                                ) : null}
                                {v.statistics?.likeCount ? (
                                  <span>{v.statistics.likeCount.toLocaleString()} likes</span>
                                ) : null}
                                {v.duration ? <span>{v.duration}</span> : null}
                                {v.publishedAt ? (
                                  <span>{new Date(v.publishedAt).toLocaleDateString()}</span>
                                ) : null}
                              </div>
                            </div>
                          </a>

                          <div className="flex items-center gap-2">
                            {isWatched ? <Badge variant="success">Watched</Badge> : <Badge>Unwatched</Badge>}
                            <Button
                              variant={isWatched ? "primary" : "secondary"}
                              onClick={() => toggleWatched(v.id)}
                            >
                              {isWatched ? "Watched" : "Mark watched"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <Card>
                  <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-[rgb(var(--muted))]">
                      Use arrow keys + Tab to navigate controls. All actions are keyboard accessible.
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                        disabled={clampedPageIndex === 0}
                        variant="secondary"
                      >
                        Prev
                      </Button>
                      <Button
                        onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
                        disabled={clampedPageIndex >= pageCount - 1}
                        variant="secondary"
                      >
                        Next
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
