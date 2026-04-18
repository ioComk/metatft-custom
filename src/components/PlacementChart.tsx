type Props = {
  placements: number[];
};

const PLACEMENT_COLORS = [
  "bg-tier-challenger", // 1st
  "bg-tier-gold",
  "bg-tier-emerald",
  "bg-tier-platinum",
  "bg-tier-silver", // 5th — cutoff
  "bg-tier-bronze/70",
  "bg-tier-iron/80",
  "bg-red-500/70", // 8th
];

export function PlacementChart({ placements }: Props) {
  const total = placements.reduce((a, b) => a + b, 0);
  if (total === 0) {
    return (
      <p className="text-xs text-neutral-500">まだこのセットのデータなし</p>
    );
  }
  const maxCount = Math.max(...placements);

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1.5 h-20">
        {placements.map((count, idx) => {
          const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <div key={idx} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] tabular-nums text-neutral-400">
                {count}
              </span>
              <div className="relative flex h-full w-full items-end">
                <div
                  className={`w-full rounded-t ${PLACEMENT_COLORS[idx]} transition-all duration-500`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5">
        {placements.map((_, idx) => (
          <span
            key={idx}
            className={`flex-1 text-center text-[10px] tabular-nums ${
              idx === 0
                ? "font-bold text-tier-challenger"
                : idx < 4
                  ? "text-neutral-300"
                  : "text-neutral-500"
            }`}
          >
            {idx + 1}
          </span>
        ))}
      </div>
    </div>
  );
}
