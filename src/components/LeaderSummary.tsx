import type { NormalizedStats } from "@/lib/metatft";
import { MASTER_RATING } from "@/lib/players";
import { tierColorClass, tierFromText } from "@/lib/rank";

type Props = {
  players: NormalizedStats[];
};

export function LeaderSummary({ players }: Props) {
  const sorted = [...players].sort(
    (a, b) => b.ratingNumeric - a.ratingNumeric,
  );
  const leader = sorted[0];
  const highestPeak = players.reduce(
    (best, p) => (p.peakRatingNumeric > best.peakRatingNumeric ? p : best),
    players[0],
  );
  const bestAvg = players
    .filter((p) => p.avgPlacement !== null)
    .reduce<NormalizedStats | null>(
      (best, p) =>
        !best || (p.avgPlacement ?? 99) < (best.avgPlacement ?? 99) ? p : best,
      null,
    );
  const remainingToMaster = Math.max(
    0,
    MASTER_RATING - leader.ratingNumeric,
  );

  return (
    <section className="rounded-2xl border border-surface-border/60 bg-surface-raised/70 p-6 shadow-lg backdrop-blur">
      <h2 className="text-xs uppercase tracking-wider text-neutral-400">
        スクワッド サマリー
      </h2>
      <div className="mt-3 grid gap-4 md:grid-cols-4">
        <SummaryTile
          label="現在のトップ"
          primary={leader.riotId}
          secondary={leader.ratingText}
          color={tierColorClass[tierFromText(leader.ratingText)]}
        />
        <SummaryTile
          label="Master到達まで (トップ)"
          primary={
            remainingToMaster === 0
              ? "達成"
              : `${remainingToMaster.toLocaleString("ja-JP")} LP`
          }
          secondary={`現在 ${leader.ratingNumeric.toLocaleString("ja-JP")} / ${MASTER_RATING.toLocaleString("ja-JP")}`}
          color="text-tier-master"
        />
        <SummaryTile
          label="今シーズン最高到達"
          primary={highestPeak.riotId}
          secondary={highestPeak.peakRatingText}
          color={tierColorClass[tierFromText(highestPeak.peakRatingText)]}
        />
        <SummaryTile
          label="最良 平均順位"
          primary={bestAvg ? bestAvg.riotId : "–"}
          secondary={bestAvg?.avgPlacement ? bestAvg.avgPlacement.toFixed(2) : "–"}
          color="text-tier-emerald"
        />
      </div>
    </section>
  );
}

function SummaryTile({
  label,
  primary,
  secondary,
  color,
}: {
  label: string;
  primary: string;
  secondary: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-surface-border/60 bg-surface-elevated/60 px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-neutral-500">
        {label}
      </p>
      <p className="mt-1 truncate text-base font-semibold text-neutral-50">
        {primary}
      </p>
      <p className={`mt-0.5 text-sm font-semibold ${color}`}>{secondary}</p>
    </div>
  );
}
