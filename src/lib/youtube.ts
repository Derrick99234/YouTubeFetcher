type YouTubeApiErrorResponse = {
  error?: {
    code?: number;
    message?: string;
    errors?: Array<{ reason?: string; message?: string }>;
  };
};

type YouTubeSearchListResponse = {
  items?: Array<{
    id?: { channelId?: string };
    snippet?: { channelTitle?: string };
  }>;
} & YouTubeApiErrorResponse;

type YouTubeChannelsListResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      description?: string;
      customUrl?: string;
      publishedAt?: string;
      thumbnails?: Record<string, { url?: string; width?: number; height?: number }>;
    };
    statistics?: {
      viewCount?: string;
      subscriberCount?: string;
      videoCount?: string;
    };
    contentDetails?: {
      relatedPlaylists?: { uploads?: string };
    };
  }>;
} & YouTubeApiErrorResponse;

type YouTubePlaylistItemsListResponse = {
  nextPageToken?: string;
  items?: Array<{
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
      thumbnails?: Record<string, { url?: string; width?: number; height?: number }>;
      channelTitle?: string;
    };
    contentDetails?: { videoId?: string };
  }>;
} & YouTubeApiErrorResponse;

type YouTubeVideosListResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
      thumbnails?: Record<string, { url?: string; width?: number; height?: number }>;
      channelTitle?: string;
    };
    statistics?: {
      viewCount?: string;
      likeCount?: string;
      commentCount?: string;
    };
    contentDetails?: {
      duration?: string;
    };
  }>;
} & YouTubeApiErrorResponse;

export type ResolvedChannel = {
  channelId: string;
  inputType:
    | "channel_id"
    | "studio_channel_url"
    | "channel_url"
    | "handle_url"
    | "handle"
    | "user_url"
    | "custom_url"
    | "search";
  normalizedQuery: string;
};

export type ChannelInfo = {
  id: string;
  title: string;
  description: string;
  customUrl?: string;
  publishedAt?: string;
  thumbnails: Record<string, { url?: string; width?: number; height?: number }>;
  statistics?: {
    viewCount?: number;
    subscriberCount?: number;
    videoCount?: number;
  };
  uploadsPlaylistId?: string;
};

export type VideoInfo = {
  id: string;
  title: string;
  description: string;
  publishedAt?: string;
  channelTitle?: string;
  thumbnails: Record<string, { url?: string; width?: number; height?: number }>;
  watchUrl: string;
  duration?: string;
  statistics?: {
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
  };
};

function toNumber(value: string | undefined) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function safeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function parseChannelIdFromText(text: string) {
  const trimmed = text.trim();
  if (/^UC[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return trimmed;
  return null;
}

function tryParseUrl(raw: string) {
  try {
    const input = raw.trim();
    if (!input) return null;
    if (!/^https?:\/\//i.test(input)) return null;
    return new URL(input);
  } catch {
    return null;
  }
}

function extractChannelIdFromPath(pathname: string) {
  const match = pathname.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

function extractHandleFromPath(pathname: string) {
  const match = pathname.match(/\/@([^/]+)/);
  return match?.[1] ?? null;
}

function extractUserFromPath(pathname: string) {
  const match = pathname.match(/\/user\/([^/]+)/);
  return match?.[1] ?? null;
}

function extractCustomFromPath(pathname: string) {
  const match = pathname.match(/\/c\/([^/]+)/);
  return match?.[1] ?? null;
}

async function youtubeGetJson<T>(
  requestUrl: string
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string; reason?: string }> {
  const res = await fetch(requestUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown = undefined;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined;
  }

  const details = (() => {
    const err = data as YouTubeApiErrorResponse | undefined;
    const message = safeString(err?.error?.message) || undefined;
    const reason = safeString(err?.error?.errors?.[0]?.reason) || undefined;
    return { message, reason };
  })();

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      message: details.message || `YouTube API request failed (${res.status})`,
      reason: details.reason,
    };
  }

  if (details.message) {
    return {
      ok: false,
      status: 502,
      message: details.message || "YouTube API error",
      reason: details.reason,
    };
  }

  return { ok: true, data: data as T };
}

async function searchFirstChannelId(term: string, apiKey: string) {
  const idsRes = await searchChannelIds(term, apiKey);
  if (!idsRes.ok) return idsRes;
  const channelId = idsRes.data[0];
  if (!channelId) return { ok: false as const, status: 404, message: "Channel not found" };
  return { ok: true as const, data: channelId };
}

async function searchChannelIds(term: string, apiKey: string) {
  const requestUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  requestUrl.searchParams.set("part", "snippet");
  requestUrl.searchParams.set("type", "channel");
  requestUrl.searchParams.set("maxResults", "5");
  requestUrl.searchParams.set("q", term);
  requestUrl.searchParams.set("key", apiKey);

  const res = await youtubeGetJson<YouTubeSearchListResponse>(requestUrl.toString());
  if (!res.ok) return res;

  const ids =
    res.data.items
      ?.map((i) => i.id?.channelId)
      .filter((id): id is string => Boolean(id)) ?? [];

  if (!ids.length) return { ok: false as const, status: 404, message: "Channel not found" };
  return { ok: true as const, data: Array.from(new Set(ids)) };
}

async function pickChannelForHandle(handle: string, channelIds: string[], apiKey: string) {
  const ids = Array.from(new Set(channelIds)).slice(0, 50);
  if (!ids.length) return { ok: false as const, status: 404, message: "Channel not found" };

  const requestUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  requestUrl.searchParams.set("part", "snippet,contentDetails");
  requestUrl.searchParams.set("id", ids.join(","));
  requestUrl.searchParams.set("key", apiKey);

  const res = await youtubeGetJson<YouTubeChannelsListResponse>(requestUrl.toString());
  if (!res.ok) return res;

  const items = res.data.items ?? [];

  const desiredRaw = handle.trim();
  const desiredLower = desiredRaw.toLowerCase();

  const normalize = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/^@/, "")
      .replace(/[\s\-_]+/g, "");

  const desiredNorm = normalize(desiredRaw);
  const desiredWithAtLower = `@${desiredLower}`;

  let best: { id: string; score: number } | null = null;
  for (const c of items) {
    const id = c.id;
    if (!id) continue;

    const title = safeString(c.snippet?.title);
    const titleLower = title.trim().toLowerCase();
    const titleNorm = normalize(title);
    const customUrl = safeString(c.snippet?.customUrl);
    const customLower = customUrl.trim().toLowerCase();
    const customNorm = normalize(customUrl);
    const hasUploads = Boolean(c.contentDetails?.relatedPlaylists?.uploads);

    let score = 0;
    if (customLower === desiredWithAtLower) score += 100;
    if (customNorm && customNorm === desiredNorm) score += 90;
    if (titleLower === desiredLower) score += 80;
    if (titleNorm && titleNorm === desiredNorm) score += 70;
    if (titleNorm && desiredNorm && (titleNorm.includes(desiredNorm) || desiredNorm.includes(titleNorm)))
      score += 40;
    if (customNorm && desiredNorm && (customNorm.includes(desiredNorm) || desiredNorm.includes(customNorm)))
      score += 30;
    if (hasUploads) score += 10;

    if (!best || score > best.score) best = { id, score };
  }

  if (best?.score && best.id) return { ok: true as const, data: best.id };

  const withUploads = items.find((c) => Boolean(c.contentDetails?.relatedPlaylists?.uploads));
  if (withUploads?.id) return { ok: true as const, data: withUploads.id };

  const first = items[0]?.id;
  if (first) return { ok: true as const, data: first };
  return { ok: false as const, status: 404, message: "Channel not found" };
}

export async function resolveChannel(input: string, apiKey: string): Promise<
  { ok: true; resolved: ResolvedChannel } | { ok: false; status: number; message: string; reason?: string }
> {
  const raw = input.trim();
  const directId = parseChannelIdFromText(raw);
  if (directId) {
    return {
      ok: true,
      resolved: { channelId: directId, inputType: "channel_id", normalizedQuery: directId },
    };
  }

  const url = tryParseUrl(raw);
  if (url) {
    const pathname = url.pathname || "";
    const channelId = extractChannelIdFromPath(pathname);
    if (channelId) {
      const inputType = url.hostname.includes("studio.youtube.com")
        ? "studio_channel_url"
        : "channel_url";
      return {
        ok: true,
        resolved: { channelId, inputType, normalizedQuery: channelId },
      };
    }

    const handle = extractHandleFromPath(pathname);
    if (handle) {
      const ids1 = await searchChannelIds(`@${handle}`, apiKey);
      const ids2 = await searchChannelIds(handle, apiKey);
      const merged = [
        ...(ids1.ok ? ids1.data : []),
        ...(ids2.ok ? ids2.data : []),
      ];
      const picked = await pickChannelForHandle(handle, merged, apiKey);
      if (!picked.ok) return picked;
      return {
        ok: true,
        resolved: {
          channelId: picked.data,
          inputType: "handle_url",
          normalizedQuery: `@${handle}`,
        },
      };
    }

    const username = extractUserFromPath(pathname);
    if (username) {
      const requestUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
      requestUrl.searchParams.set("part", "id");
      requestUrl.searchParams.set("forUsername", username);
      requestUrl.searchParams.set("key", apiKey);
      const res = await youtubeGetJson<YouTubeChannelsListResponse>(requestUrl.toString());
      if (res.ok) {
        const id = res.data.items?.[0]?.id;
        if (id) {
          return {
            ok: true,
            resolved: { channelId: id, inputType: "user_url", normalizedQuery: username },
          };
        }
      }
      const fallback = await searchFirstChannelId(username, apiKey);
      if (!fallback.ok) return fallback;
      return {
        ok: true,
        resolved: {
          channelId: fallback.data,
          inputType: "user_url",
          normalizedQuery: username,
        },
      };
    }

    const custom = extractCustomFromPath(pathname);
    if (custom) {
      const found = await searchFirstChannelId(custom, apiKey);
      if (!found.ok) return found;
      return {
        ok: true,
        resolved: {
          channelId: found.data,
          inputType: "custom_url",
          normalizedQuery: custom,
        },
      };
    }

    const maybeCustom = pathname.replace(/^\/+/, "").split("/")[0];
    if (maybeCustom) {
      const found = await searchFirstChannelId(maybeCustom, apiKey);
      if (!found.ok) return found;
      return {
        ok: true,
        resolved: {
          channelId: found.data,
          inputType: "custom_url",
          normalizedQuery: maybeCustom,
        },
      };
    }
  }

  if (raw.startsWith("@")) {
    const handle = raw.slice(1).trim();
    const ids1 = await searchChannelIds(`@${handle}`, apiKey);
    const ids2 = await searchChannelIds(handle, apiKey);
    const merged = [
      ...(ids1.ok ? ids1.data : []),
      ...(ids2.ok ? ids2.data : []),
    ];
    const picked = await pickChannelForHandle(handle, merged, apiKey);
    if (!picked.ok) return picked;
    return {
      ok: true,
      resolved: { channelId: picked.data, inputType: "handle", normalizedQuery: `@${handle}` },
    };
  }

  const found = await searchFirstChannelId(raw, apiKey);
  if (!found.ok) return found;
  return {
    ok: true,
    resolved: { channelId: found.data, inputType: "search", normalizedQuery: raw },
  };
}

export async function fetchChannelAndVideos(params: {
  channelId: string;
  apiKey: string;
  limit: number;
}): Promise<
  | { ok: true; channel: ChannelInfo; videos: VideoInfo[] }
  | { ok: false; status: number; message: string; reason?: string }
> {
  const { channelId, apiKey, limit } = params;

  const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  channelUrl.searchParams.set("part", "snippet,contentDetails,statistics");
  channelUrl.searchParams.set("id", channelId);
  channelUrl.searchParams.set("key", apiKey);
  const channelRes = await youtubeGetJson<YouTubeChannelsListResponse>(channelUrl.toString());
  if (!channelRes.ok) return channelRes;

  const c = channelRes.data.items?.[0];
  if (!c?.id) return { ok: false, status: 404, message: "Channel not found" };

  const uploadsPlaylistId = c.contentDetails?.relatedPlaylists?.uploads;
  const channel: ChannelInfo = {
    id: c.id,
    title: safeString(c.snippet?.title),
    description: safeString(c.snippet?.description),
    customUrl: c.snippet?.customUrl,
    publishedAt: c.snippet?.publishedAt,
    thumbnails: c.snippet?.thumbnails ?? {},
    statistics: {
      viewCount: toNumber(c.statistics?.viewCount),
      subscriberCount: toNumber(c.statistics?.subscriberCount),
      videoCount: toNumber(c.statistics?.videoCount),
    },
    uploadsPlaylistId,
  };

  if (!uploadsPlaylistId) {
    return { ok: false, status: 502, message: "Uploads playlist not available for channel" };
  }

  const playlistItems: Array<{
    videoId: string;
    fallback: {
      title?: string;
      description?: string;
      publishedAt?: string;
      channelTitle?: string;
      thumbnails?: Record<string, { url?: string; width?: number; height?: number }>;
    };
  }> = [];

  let pageToken: string | undefined = undefined;
  while (playlistItems.length < limit) {
    const remaining = limit - playlistItems.length;
    const pageSize = Math.min(50, remaining);
    const playlistItemsUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    playlistItemsUrl.searchParams.set("part", "snippet,contentDetails");
    playlistItemsUrl.searchParams.set("playlistId", uploadsPlaylistId);
    playlistItemsUrl.searchParams.set("maxResults", String(pageSize));
    if (pageToken) playlistItemsUrl.searchParams.set("pageToken", pageToken);
    playlistItemsUrl.searchParams.set("key", apiKey);
    const res = await youtubeGetJson<YouTubePlaylistItemsListResponse>(playlistItemsUrl.toString());
    if (!res.ok) return res;

    for (const item of res.data.items ?? []) {
      const videoId = item.contentDetails?.videoId;
      if (!videoId) continue;
      playlistItems.push({
        videoId,
        fallback: {
          title: item.snippet?.title,
          description: item.snippet?.description,
          publishedAt: item.snippet?.publishedAt,
          channelTitle: item.snippet?.channelTitle,
          thumbnails: item.snippet?.thumbnails,
        },
      });
      if (playlistItems.length >= limit) break;
    }

    if (!res.data.nextPageToken) break;
    pageToken = res.data.nextPageToken;
  }

  const videoIds = playlistItems.map((p) => p.videoId);
  const videoById = new Map<string, VideoInfo>();

  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videosUrl.searchParams.set("part", "snippet,statistics,contentDetails");
    videosUrl.searchParams.set("id", chunk.join(","));
    videosUrl.searchParams.set("key", apiKey);
    const res = await youtubeGetJson<YouTubeVideosListResponse>(videosUrl.toString());
    if (!res.ok) return res;

    for (const v of res.data.items ?? []) {
      const id = v.id;
      if (!id) continue;
      videoById.set(id, {
        id,
        title: safeString(v.snippet?.title),
        description: safeString(v.snippet?.description),
        publishedAt: v.snippet?.publishedAt,
        channelTitle: v.snippet?.channelTitle,
        thumbnails: v.snippet?.thumbnails ?? {},
        watchUrl: `https://www.youtube.com/watch?v=${id}`,
        duration: v.contentDetails?.duration,
        statistics: {
          viewCount: toNumber(v.statistics?.viewCount),
          likeCount: toNumber(v.statistics?.likeCount),
          commentCount: toNumber(v.statistics?.commentCount),
        },
      });
    }
  }

  const videos: VideoInfo[] = playlistItems.map((p) => {
    const apiVideo = videoById.get(p.videoId);
    if (apiVideo) return apiVideo;
    const thumbnails = p.fallback.thumbnails ?? {};
    return {
      id: p.videoId,
      title: safeString(p.fallback.title),
      description: safeString(p.fallback.description),
      publishedAt: p.fallback.publishedAt,
      channelTitle: p.fallback.channelTitle,
      thumbnails,
      watchUrl: `https://www.youtube.com/watch?v=${p.videoId}`,
    };
  });

  return { ok: true, channel, videos };
}
