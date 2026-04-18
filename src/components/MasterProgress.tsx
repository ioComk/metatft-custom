import { MASTER_RATING } from "@/lib/players";

type Props = {
  rating: number;
};

export function MasterProgress({ rating }: Props) {
  const pct = Math.max(0, Math.min(100, (rating / MASTER_RATING) * 100));
  const remaining = Math.max(0, MASTER_RATING - rating);
  const achieved = rating >= MASTER_RATING;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between text-xs uppercase tracking-wider text-neutral-400">
        <span>Master到達まで</span>
        <span className="tabular-nums text-neutral-200">
          {achieved ? "達成" : `残り ${remaining.toLocaleString("ja-JP")} LP`}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-border/70">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-tier-silver via-tier-gold to-tier-master transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute inset-y-0 w-px bg-tier-master/70"
          style={{ left: "87.5%" }}
          aria-label="Masterしきい値"
        />
      </div>
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-neutral-500">
        <span>Iron</span>
        <span>Silver</span>
        <span>Gold</span>
        <span>Plat</span>
        <span>Emerald</span>
        <span>Diamond</span>
        <span className="text-tier-master">Master</span>
      </div>
    </div>
  );
}
