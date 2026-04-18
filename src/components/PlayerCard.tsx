import Image from "next/image";
import type { NormalizedStats } from "@/lib/metatft";
import {
  tierColorClass,
  tierFromText,
  tierGradient,
} from "@/lib/rank";
import { MasterProgress } from "./MasterProgress";
import { PlacementChart } from "./PlacementChart";
import { RecentMatches } from "./RecentMatches";

type Props = {
  stats: NormalizedStats;
  rank: number;
};

const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;

export function PlayerCard({ stats, rank }: Props) {
  const tier = tierFromText(stats.ratingText);
  const peakTier = tierFromText(stats.peakRatingText);

  return (
    <article className="relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-surface-border/80 bg-surface-raised/80 p-6 shadow-xl backdrop-blur">
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${tierGradient[tier]} opacity-80`}
        aria-hidden
      />
      <header className="relative flex items-start gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-2 ring-surface-border">
          <Image
            src={stats.profileIconUrl}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-400">
            <span className="rounded bg-surface-border/70 px-1.5 py-0.5 text-[10px] text-neutral-200">
              #{rank}
            </span>
            <span>Lv {stats.summonerLevel}</span>
          </div>
          <h2 className="mt-1 truncate text-xl font-bold text-neutral-50">
            {stats.riotId}
          </h2>
        </div>
      </header>

      <section className="relative">
        <p className="text-[11px] uppercase tracking-wider text-neutral-500">
          Current (Set17 Ranked)
        </p>
        <p
          className={`mt-1 font-display text-3xl font-extrabold tracking-tight ${tierColorClass[tier]}`}
        >
          {stats.ratingText}
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          <span className="tabular-nums">{stats.ratingNumeric.toLocaleString("ja-JP")}</span>
          <span> · Peak </span>
          <span className={tierColorClass[peakTier]}>
            {stats.peakRatingText}
          </span>
        </p>
      </section>

      <MasterProgress rating={stats.ratingNumeric} />

      <section className="grid grid-cols-3 gap-3">
        <Stat label="試合数" value={stats.numGames.toLocaleString("ja-JP")} />
        <Stat label="平均順位" value={stats.avgPlacement ? stats.avgPlacement.toFixed(2) : "–"} />
        <Stat label="TOP4率" value={fmtPct(stats.top4Rate)} emphasis />
        <Stat label="勝率 (1位)" value={fmtPct(stats.winRate)} />
        <Stat label="1位回数" value={stats.wins.toLocaleString("ja-JP")} />
        <Stat
          label="サーバー順位"
          value={
            stats.serverRank
              ? `${stats.serverRank.rank.toLocaleString("ja-JP")} / ${stats.serverRank.total.toLocaleString("ja-JP")}`
              : "–"
          }
          mono
        />
      </section>

      <section className="space-y-2">
        <p className="text-[11px] uppercase tracking-wider text-neutral-500">
          順位分布
        </p>
        <PlacementChart placements={stats.placementCounts} />
      </section>

      <section className="space-y-2">
        <p className="text-[11px] uppercase tracking-wider text-neutral-500">
          最近の試合
        </p>
        <RecentMatches matches={stats.recentMatches} />
      </section>
    </article>
  );
}

function Stat({
  label,
  value,
  emphasis = false,
  mono = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-surface-border/60 bg-surface-elevated/60 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-neutral-500">
        {label}
      </p>
      <p
        className={`mt-0.5 font-semibold tabular-nums ${
          emphasis
            ? "text-tier-master text-base"
            : mono
              ? "text-[11px] text-neutral-200"
              : "text-neutral-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
