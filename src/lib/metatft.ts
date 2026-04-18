import { PlayerConfig, TFT_SET, RANKED_QUEUE_ID, metatftProfileUrl } from "./players";
import { computeTags, type PlayerTag } from "./tags";

const API_BASE = "https://api.metatft.com/public/profile/lookup_by_riotid";

export type RankedSummary = {
  num_games: number;
  rating_text: string;
  rating_numeric: number;
  peak_rating: string;
  peak_rating_numeric: number;
  timestamp: string;
};

export type ServerRank = {
  rank: number;
  total: number;
};

export type RankedSeasonStats = {
  total: number;
  placements: number[];
};

export type Match = {
  placement: number;
  riot_match_id: string;
  match_timestamp: number;
  queue_id: number;
  rating_queue_id: number;
  tft_set: string;
  avg_rating: string | null;
  avg_rating_numeric: number | null;
};

export type ProfileResponse = {
  summoner: {
    id: number;
    puuid: string;
    summoner_region: string;
    profile_icon_id: number;
    summoner_level: number;
    riot_id: string;
    last_refreshed?: string;
  };
  ranked: RankedSummary | null;
  server_rank: ServerRank | null;
  matches: Match[];
  rating_history: Record<string, Record<string, RankedSummary>>;
  ranked_season_stats: Record<string, RankedSeasonStats>;
  ranked_rating_changes: Array<{
    num_games: number;
    rating_numeric: number;
    rating_text: string;
    created_timestamp: string;
    tft_set_name: string;
    queue_id: number;
  }>;
};

const buildUrl = (p: PlayerConfig): string => {
  const name = encodeURIComponent(p.gameName);
  const tag = encodeURIComponent(p.tagLine);
  return `${API_BASE}/${p.region}/${name}/${tag}?source=full_profile&tft_set=${TFT_SET}`;
};

export async function fetchProfile(
  p: PlayerConfig,
  opts: { revalidate?: number | false } = {},
): Promise<ProfileResponse> {
  const url = buildUrl(p);
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
      Accept: "application/json",
      Origin: "https://www.metatft.com",
      Referer: "https://www.metatft.com/",
    },
    next:
      opts.revalidate === undefined
        ? { revalidate: 300 }
        : opts.revalidate === false
          ? { revalidate: 0 }
          : { revalidate: opts.revalidate },
  });

  if (!res.ok) {
    throw new Error(
      `MetaTFT API ${res.status} for ${p.gameName}#${p.tagLine}`,
    );
  }
  return (await res.json()) as ProfileResponse;
}

export type NormalizedStats = {
  riotId: string;
  profileIconUrl: string;
  metatftUrl: string;
  summonerLevel: number;
  ratingText: string;
  ratingNumeric: number;
  peakRatingText: string;
  peakRatingNumeric: number;
  numGames: number;
  wins: number;
  top4: number;
  avgPlacement: number | null;
  winRate: number;
  top4Rate: number;
  serverRank: ServerRank | null;
  placementCounts: number[];
  recentMatches: Array<{
    placement: number;
    timestamp: number;
    queueId: number;
  }>;
  ratingHistory: Array<{
    timestamp: string;
    ratingNumeric: number;
    ratingText: string;
  }>;
  tags: PlayerTag[];
};

const UNRANKED: RankedSummary = {
  num_games: 0,
  rating_text: "UNRANKED",
  rating_numeric: 0,
  peak_rating: "UNRANKED",
  peak_rating_numeric: 0,
  timestamp: "",
};

export function normalize(raw: ProfileResponse, player: PlayerConfig): NormalizedStats {
  const summoner = raw.summoner;
  const rankedSetEntry =
    raw.rating_history?.[TFT_SET]?.[RANKED_QUEUE_ID] ??
    (raw.ranked && raw.ranked.num_games > 0 ? raw.ranked : UNRANKED);

  const seasonStats = raw.ranked_season_stats?.[RANKED_QUEUE_ID];
  const placements = seasonStats?.placements ?? [];
  const totalGames = placements.reduce((a, b) => a + b, 0);
  const wins = placements[0] ?? 0;
  const top4 = placements.slice(0, 4).reduce((a, b) => a + b, 0);
  const sumPlacements = placements.reduce(
    (acc, count, idx) => acc + count * (idx + 1),
    0,
  );
  const avgPlacement = totalGames > 0 ? sumPlacements / totalGames : null;

  const profileIconUrl = `https://cdn.metatft.com/file/metatft/profileicons/profileicon${summoner.profile_icon_id}.png`;

  const recentMatches = (raw.matches ?? [])
    .filter((m) => m.tft_set === TFT_SET)
    .slice(0, 10)
    .map((m) => ({
      placement: m.placement,
      timestamp: m.match_timestamp,
      queueId: m.queue_id,
    }));

  const ratingHistory = (raw.ranked_rating_changes ?? [])
    .filter(
      (r) =>
        r.tft_set_name === TFT_SET &&
        r.queue_id === Number(RANKED_QUEUE_ID),
    )
    .sort(
      (a, b) =>
        new Date(a.created_timestamp).getTime() -
        new Date(b.created_timestamp).getTime(),
    )
    .map((r) => ({
      timestamp: r.created_timestamp,
      ratingNumeric: r.rating_numeric,
      ratingText: r.rating_text,
    }));

  return {
    riotId: summoner.riot_id,
    profileIconUrl,
    metatftUrl: metatftProfileUrl(player),
    summonerLevel: summoner.summoner_level,
    ratingText: rankedSetEntry.rating_text,
    ratingNumeric: rankedSetEntry.rating_numeric,
    peakRatingText: rankedSetEntry.peak_rating,
    peakRatingNumeric: rankedSetEntry.peak_rating_numeric,
    numGames: rankedSetEntry.num_games ?? totalGames,
    wins,
    top4,
    avgPlacement,
    winRate: totalGames > 0 ? wins / totalGames : 0,
    top4Rate: totalGames > 0 ? top4 / totalGames : 0,
    serverRank: raw.server_rank ?? null,
    placementCounts: placements,
    recentMatches,
    ratingHistory,
    tags: computeTags(raw.matches ?? []),
  };
}
