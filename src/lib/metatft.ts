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
  playstyle: {
    forcer: number;
    tank: number;
    ad: number;
    tempo: number;
  };
};

const TANK_ITEMS = new Set([
  "TFT_Item_Redemption","TFT_Item_Warmogs","TFT_Item_Sunfirecape",
  "TFT_Item_FrozenHeart","TFT_Item_GargoyleStoneplate","TFT_Item_DragonsClaw",
  "TFT_Item_BrambleVest","TFT_Item_AdaptiveHelm","TFT_Item_TitanicHydra",
  "TFT_Item_NaturalForce","TFT17_Item_Artifact_SorakaArtifact",
]);
const AD_ITEMS_SET = new Set([
  "TFT_Item_InfinityEdge","TFT_Item_Bloodthirster","TFT_Item_GuinsoosRageblade",
  "TFT_Item_KrakenSlayer","TFT_Item_LastWhisper","TFT_Item_GiantSlayer",
  "TFT_Item_StatikkShiv","TFT_Item_RunaansHurricane","TFT_Item_RapidFireCannon",
]);
const AP_ITEMS_SET = new Set([
  "TFT_Item_JeweledGauntlet","TFT_Item_SpearOfShojin","TFT_Item_NightHarvester",
  "TFT_Item_ArchangelsStaff","TFT_Item_Rabadon","TFT_Item_LudensTempestCompanion",
  "TFT_Item_Shadowflame","TFT_Item_BlueBuff",
]);

function computePlaystyle(matches: Match[]): { forcer: number; tank: number; ad: number; tempo: number } {
  const recent = matches
    .filter((m) => m.tft_set === TFT_SET && (m as { summary?: unknown }).summary)
    .slice(0, 20) as Array<Match & { summary: { units?: Array<{ character_id: string; itemNames?: string[] }>; last_round?: number } }>;

  if (recent.length < 3) return { forcer: 50, tank: 50, ad: 50, tempo: 50 };

  // Forcer: unit repetition across games (0=flexible, 100=forcer)
  const unitFreqs = new Map<string, number>();
  let gamesWithUnits = 0;
  recent.forEach((m) => {
    const units = m.summary?.units ?? [];
    if (!units.length) return;
    gamesWithUnits++;
    new Set(units.map((u) => u.character_id)).forEach((uid) =>
      unitFreqs.set(uid, (unitFreqs.get(uid) ?? 0) + 1),
    );
  });
  const maxFreq = gamesWithUnits > 0 ? Math.max(...unitFreqs.values()) / gamesWithUnits : 0;
  const forcer = Math.round(Math.min(100, maxFreq * 120));

  // Tank vs Damage items
  let tankCount = 0, dmgCount = 0;
  recent.forEach((m) =>
    m.summary?.units?.forEach((u) =>
      u.itemNames?.forEach((item) => {
        if (TANK_ITEMS.has(item)) tankCount++;
        else dmgCount++;
      }),
    ),
  );
  const totalItems = tankCount + dmgCount;
  const tank = totalItems > 0 ? Math.round((tankCount / totalItems) * 100) : 50;

  // AD vs AP
  let adCount = 0, apCount = 0;
  recent.forEach((m) =>
    m.summary?.units?.forEach((u) =>
      u.itemNames?.forEach((item) => {
        if (AD_ITEMS_SET.has(item)) adCount++;
        if (AP_ITEMS_SET.has(item)) apCount++;
      }),
    ),
  );
  const offTotal = adCount + apCount;
  const ad = offTotal > 0 ? Math.round((adCount / offTotal) * 100) : 50;

  // Tempo: approximated by avg last_round (earlier end = faster/tempo, later = economy)
  const rounds = recent.map((m) => m.summary?.last_round ?? 25).filter(Boolean);
  const avgRound = rounds.reduce((a, b) => a + b, 0) / (rounds.length || 1);
  const tempo = Math.round(Math.max(0, Math.min(100, ((35 - avgRound) / 20) * 100)));

  return { forcer, tank, ad, tempo };
}

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

  const playstyle = computePlaystyle(raw.matches ?? []);

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
    playstyle,
  };
}
