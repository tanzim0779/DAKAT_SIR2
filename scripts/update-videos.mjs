
import { mkdirSync, writeFileSync } from "node:fs";

const API_KEY = process.env.YT_API_KEY;

const CHANNELS = [
  { id: "UCjvXTW3qG91V7-LVdoxUcsg" },
  { handle: "dhaka_highlights" },
  { handle: "3blue1brown" },
  { handle: "bigganpic" },
  { handle: "jaredowen" },
  { handle: "lostsunjed" },
  { handle: "manochaacademy" },
  { handle: "mitocw" }
];

if (!API_KEY) {
  throw new Error("YT_API_KEY secret পাওয়া যায়নি");
}

async function youtube(endpoint, params) {
  const url = new URL(
    `https://www.googleapis.com/youtube/v3/${endpoint}`
  );

  for (const [key, value] of Object.entries({
    ...params,
    key: API_KEY
  })) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `${endpoint}: ${data.error?.message || response.status}`
    );
  }

  return data;
}

async function getChannel(channel) {
  const params = channel.id
    ? { id: channel.id, part: "snippet,contentDetails" }
    : { forHandle: channel.handle, part: "snippet,contentDetails" };

  const data = await youtube("channels", params);
  const item = data.items?.[0];

  if (!item) {
    console.log("Channel পাওয়া যায়নি:", JSON.stringify(channel));
    return null;
  }

  return {
    id: item.id,
    name: item.snippet.title,
    playlistId: item.contentDetails.relatedPlaylists.uploads
  };
}

async function getVideos(channel) {
  const videos = [];
  let pageToken = "";

  while (videos.length < 200) {
    const params = {
      part: "snippet",
      playlistId: channel.playlistId,
      maxResults: "50"
    };

    if (pageToken) params.pageToken = pageToken;

    const data = await youtube("playlistItems", params);

    for (const item of data.items || []) {
      const videoId = item.snippet?.resourceId?.videoId;
      if (!videoId) continue;

      videos.push({
        id: videoId,
        t: item.snippet.title || "",
        c: channel.id,
        d: item.snippet.publishedAt || ""
      });

      if (videos.length >= 200) break;
    }

    pageToken = data.nextPageToken || "";
    if (!pageToken) break;
  }

  console.log(`${channel.name}: ${videos.length} videos`);
  return videos;
}

const channels = [];
const videos = [];

for (const source of CHANNELS) {
  try {
    const channel = await getChannel(source);
    if (!channel) continue;

    channels.push({ id: channel.id, name: channel.name });

    const items = await getVideos(channel);
    videos.push(...items);
  } catch (error) {
    console.error(
      "Channel processing failed:",
      JSON.stringify(source),
      error.message
    );
  }
}

if (channels.length === 0) {
  throw new Error(
    "কোনো channel পাওয়া যায়নি। API Key ও channel IDs/handles পরীক্ষা করো।"
  );
}

const uniqueVideos = [
  ...new Map(videos.map(video => [video.id, video])).values()
];

uniqueVideos.sort((a, b) => b.d.localeCompare(a.d));

mkdirSync("data", { recursive: true });

writeFileSync(
  "data/videos.json",
  JSON.stringify({
    updated: new Date().toISOString(),
    channels,
    videos: uniqueVideos
  }, null, 2) + "\n"
);

console.log(
  `সম্পন্ন: ${channels.length} channels, ${uniqueVideos.length} videos`
);
