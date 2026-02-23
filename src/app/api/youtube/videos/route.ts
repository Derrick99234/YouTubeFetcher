import { NextRequest } from "next/server";
import { fetchChannelAndVideos, resolveChannel } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q") || "";
  const maxRaw = searchParams.get("max");
  const maxParsed = maxRaw ? Number(maxRaw) : undefined;
  const maxVideos =
    typeof maxParsed === "number" && Number.isFinite(maxParsed)
      ? Math.min(Math.max(Math.floor(maxParsed), 0), 20000)
      : undefined;

  if (!query) {
    return Response.json(
      { ok: false, error: { message: "Query parameter 'q' is required" } },
      { status: 400 }
    );
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        ok: false,
        error: {
          message:
            "Missing YOUTUBE_API_KEY. Add it to your server env (for local dev: .env.local).",
        },
      },
      { status: 500 }
    );
  }

  const resolved = await resolveChannel(query, apiKey);
  if (!resolved.ok) {
    return Response.json(
      { ok: false, error: { message: resolved.message, reason: resolved.reason } },
      { status: resolved.status }
    );
  }

  const data = await fetchChannelAndVideos({
    channelId: resolved.resolved.channelId,
    apiKey,
    maxVideos,
  });
  if (!data.ok) {
    return Response.json(
      {
        ok: false,
        resolved: resolved.resolved,
        error: { message: data.message, reason: data.reason },
      },
      { status: data.status }
    );
  }

  return Response.json({
    ok: true,
    resolved: resolved.resolved,
    channel: data.channel,
    videos: data.videos,
  });
}
