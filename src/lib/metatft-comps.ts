import { TFT_SET, RANKED_QUEUE_ID } from "./players";

const COMPS_STATS_URL = `https://api.metatft.com/public/comps_stats?set=${TFT_SET}&queue_id=${RANKED_QUEUE_ID}`;

const METATFT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json",
  Origin: "https://www.metatft.com",
  Referer: "https://www.metatft.com/comps",
};

export type CompTier = "S" | "A" | "B" | "C" | "D";

export type Composition = {
  name: string;
  tier: CompTier;
  avg_placement: number;
  win_rate: number;
  top4_rate: number;
  play_rate: number;
  num_games: number;
  key_units: string[];
  key_traits: string[];
};

function toTier(raw: unknown): CompTier {
  const s = String(raw ?? "").toUpperCase().trim();
  if (s === "S" || s === "1") return "S";
  if (s === "A" || s === "2") return "A";
  if (s === "B" || s === "3") return "B";
  if (s === "C" || s === "4") return "C";
  return "D";
}

function extractUnits(raw: Record<string, unknown>): string[] {
  for (const key of ["key_units", "units", "champions"]) {
    const val = raw[key];
    if (!Array.isArray(val)) continue;
    return val
      .map((u: unknown) => {
        if (typeof u === "string") return u;
        if (typeof u === "object" && u !== null) {
          const obj = u as Record<string, unknown>;
          return String(obj.character_id ?? obj.name ?? obj.id ?? "");
        }
        return String(u);
      })
      .filter(Boolean);
  }
  return [];
}

function extractTraits(raw: Record<string, unknown>): string[] {
  for (const key of ["key_traits", "traits", "synergies"]) {
    const val = raw[key];
    if (Array.isArray(val)) return val.map(String);
  }
  return [];
}

function normalizeComp(raw: Record<string, unknown>): Composition {
  return {
    name: String(raw.name ?? raw.comp_name ?? raw.title ?? "Unknown Comp"),
    tier: toTier(raw.tier ?? raw.tier_score ?? raw.rank),
    avg_placement: Number(raw.avg_placement ?? raw.average_placement ?? 0),
    win_rate: Number(raw.win_rate ?? raw.winrate ?? 0),
    top4_rate: Number(raw.top4_rate ?? raw.top4rate ?? 0),
    play_rate: Number(raw.play_rate ?? raw.playrate ?? 0),
    num_games: Number(raw.num_games ?? raw.games ?? 0),
    key_units: extractUnits(raw),
    key_traits: extractTraits(raw),
  };
}

export async function fetchCompsStats(
  opts: { revalidate?: number | false } = {},
): Promise<Composition[]> {
  const res = await fetch(COMPS_STATS_URL, {
    headers: METATFT_HEADERS,
    next:
      opts.revalidate === undefined
        ? { revalidate: 300 }
        : opts.revalidate === false
          ? { revalidate: 0 }
          : { revalidate: opts.revalidate },
  });

  if (!res.ok) {
    throw new Error(`MetaTFT Comps API ${res.status}: ${res.statusText}`);
  }

  const data: unknown = await res.json();
  const rawList: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray((data as Record<string, unknown>)?.comps)
      ? ((data as Record<string, unknown>).comps as unknown[])
      : Array.isArray((data as Record<string, unknown>)?.data)
        ? ((data as Record<string, unknown>).data as unknown[])
        : [];

  return rawList
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .map(normalizeComp);
}

export function filterByTier(
  comps: Composition[],
  tier: CompTier,
): Composition[] {
  return comps.filter((c) => c.tier === tier);
}
