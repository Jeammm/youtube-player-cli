import { Innertube, YTNodes } from "youtubei.js";
import type { Video } from "../types/video.js";

let yt: Innertube | null = null;

async function getYT() {
  if (!yt) {
    yt = await Innertube.create({ lang: "th", location: "TH" });
  }
  return yt;
}

type CandidateNode = YTNodes.CompactVideo | YTNodes.Video;

function nodeToAppVideo(node: CandidateNode): Video {
  return {
    videoId: node.video_id,
    title: node.title.toString(),
    author: node.author?.name ?? "",
    duration: node.duration?.text ?? String(node.duration?.seconds ?? ""),
    thumbnail: node.best_thumbnail?.url ?? "",
  };
}

function pickFromWatchNext(
  info: any,
  exclude: Set<string>
): CandidateNode | null {
  const feed = info.watch_next_feed;
  if (!feed) return null;

  // These node types have `video_id`, `title`, `author`, `duration`, thumbnails, etc.
  const candidates = feed.filterType(YTNodes.CompactVideo, YTNodes.Video);

  for (const v of candidates) {
    if (!v.video_id) continue;
    if (exclude.has(v.video_id)) continue;

    // If you're logged in, YouTube may mark already-watched items here:
    if (typeof (v as any).is_watched === "boolean" && (v as any).is_watched)
      continue;

    return v;
  }

  return null;
}

/**
 * @param videoId current video
 * @param playedVideoIds your app’s memory of “already played recently”
 */
export async function fetchRecommendedVideo(
  videoId: string,
  playedVideoIds: Iterable<string> = []
): Promise<Video | null> {
  const yt = await getYT();

  const exclude = new Set<string>(playedVideoIds);
  exclude.add(videoId); // never recommend the one that's ending

  let info = await yt.getInfo(videoId);

  // 1) Prefer list-based recommendations (more variety than a single autoplay endpoint)
  let picked = pickFromWatchNext(info, exclude);

  // 2) If we ran out, try loading more watch-next items (continuation)
  if (!picked && info.wn_has_continuation) {
    info = await info.getWatchNextContinuation();
    picked = pickFromWatchNext(info, exclude);
  }

  if (picked) {
    return nodeToAppVideo(picked);
  }

  // 3) Last resort: autoplay endpoint (can repeat, so still exclude-check it)
  const ep = info.autoplay_video_endpoint;
  if (ep) {
    // getInfo accepts NavigationEndpoint directly
    const nextInfo = await yt.getInfo(ep);
    const nextId = nextInfo.basic_info.id;
    if (nextId && !exclude.has(nextId)) {
      // nextInfo.title is a string on VideoInfo
      return {
        videoId: nextId,
        title: nextInfo.basic_info.title ?? "",
        author: nextInfo.secondary_info?.owner?.author?.name ?? "",
        duration: nextInfo.basic_info.duration?.toLocaleString() ?? "",
        thumbnail: nextInfo.basic_info.thumbnail?.[0]?.url ?? "",
      };
    }
  }

  return null;
}
