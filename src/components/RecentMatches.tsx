type Match = {
  placement: number;
  timestamp: number;
  queueId: number;
};

const RANKED_QUEUE_IDS = new Set([1100, 1090]);

const placementStyle = (placement: number) => {
  if (placement === 1) return "bg-tier-challenger/20 text-tier-challenger ring-tier-challenger/40";
  if (placement <= 4)
    return "bg-tier-emerald/15 text-tier-emerald ring-tier-emerald/30";
  if (placement <= 6)
    return "bg-tier-silver/15 text-neutral-300 ring-neutral-600";
  return "bg-red-500/15 text-red-300 ring-red-500/30";
};

type Props = {
  matches: Match[];
};

export function RecentMatches({ matches }: Props) {
  if (matches.length === 0) {
    return <p className="text-xs text-neutral-500">直近の試合なし</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {matches.map((m) => {
        const isRanked = RANKED_QUEUE_IDS.has(m.queueId);
        return (
          <span
            key={`${m.timestamp}-${m.placement}`}
            className={`inline-flex h-7 w-7 items-center justify-center rounded text-xs font-semibold tabular-nums ring-1 ${placementStyle(m.placement)} ${isRanked ? "" : "opacity-50"}`}
            title={`${new Date(m.timestamp).toLocaleString("ja-JP")} — Queue ${m.queueId}${isRanked ? "" : "（非ランク）"}`}
          >
            {m.placement}
          </span>
        );
      })}
    </div>
  );
}
