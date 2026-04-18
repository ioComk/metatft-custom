export type TierKey =
  | "iron"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "emerald"
  | "diamond"
  | "master"
  | "grandmaster"
  | "challenger"
  | "unranked";

const TIER_BANDS: ReadonlyArray<{ tier: TierKey; min: number; max: number }> =
  [
    { tier: "iron", min: 0, max: 400 },
    { tier: "bronze", min: 400, max: 800 },
    { tier: "silver", min: 800, max: 1200 },
    { tier: "gold", min: 1200, max: 1600 },
    { tier: "platinum", min: 1600, max: 2000 },
    { tier: "emerald", min: 2000, max: 2400 },
    { tier: "diamond", min: 2400, max: 2800 },
    { tier: "master", min: 2800, max: 3200 },
    { tier: "grandmaster", min: 3200, max: 3500 },
    { tier: "challenger", min: 3500, max: Number.POSITIVE_INFINITY },
  ];

export const tierFromRating = (rating: number): TierKey => {
  if (rating <= 0) return "unranked";
  for (const band of TIER_BANDS) {
    if (rating >= band.min && rating < band.max) return band.tier;
  }
  return "challenger";
};

export const tierFromText = (text: string): TierKey => {
  const up = text.toUpperCase();
  if (up.startsWith("IRON")) return "iron";
  if (up.startsWith("BRONZE")) return "bronze";
  if (up.startsWith("SILVER")) return "silver";
  if (up.startsWith("GOLD")) return "gold";
  if (up.startsWith("PLATINUM") || up.startsWith("PLAT")) return "platinum";
  if (up.startsWith("EMERALD")) return "emerald";
  if (up.startsWith("DIAMOND")) return "diamond";
  if (up.startsWith("MASTER")) return "master";
  if (up.startsWith("GRANDMASTER")) return "grandmaster";
  if (up.startsWith("CHALLENGER")) return "challenger";
  return "unranked";
};

export const tierColorClass: Record<TierKey, string> = {
  iron: "text-tier-iron",
  bronze: "text-tier-bronze",
  silver: "text-tier-silver",
  gold: "text-tier-gold",
  platinum: "text-tier-platinum",
  emerald: "text-tier-emerald",
  diamond: "text-tier-diamond",
  master: "text-tier-master",
  grandmaster: "text-tier-grandmaster",
  challenger: "text-tier-challenger",
  unranked: "text-neutral-500",
};

export const tierGradient: Record<TierKey, string> = {
  iron: "from-tier-iron/40 to-transparent",
  bronze: "from-tier-bronze/40 to-transparent",
  silver: "from-tier-silver/30 to-transparent",
  gold: "from-tier-gold/40 to-transparent",
  platinum: "from-tier-platinum/40 to-transparent",
  emerald: "from-tier-emerald/40 to-transparent",
  diamond: "from-tier-diamond/40 to-transparent",
  master: "from-tier-master/50 to-transparent",
  grandmaster: "from-tier-grandmaster/50 to-transparent",
  challenger: "from-tier-challenger/50 to-transparent",
  unranked: "from-neutral-700/40 to-transparent",
};

export const formatRating = (rating: number): string => {
  if (rating <= 0) return "UNRANKED";
  return `${rating.toLocaleString("ja-JP")} LP`;
};
