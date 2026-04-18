import type { NormalizedStats } from "@/lib/metatft";

type Props = {
  stats: NormalizedStats;
};

const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;

const PLACEMENT_COLORS = [
  "#f3e07a", // 1st — challenger gold
  "#dcb94b", // 2nd
  "#2fbf71", // 3rd
  "#4ec2b0", // 4th — top4 cutoff
  "#9aa3ab", // 5th
  "#8c6239", // 6th
  "#574d45", // 7th
  "#ff5d5d", // 8th
] as const;

function placementStyle(p: number) {
  if (p === 1) return "bg-[#f3e07a]/20 text-[#f3e07a] ring-[#f3e07a]/30";
  if (p <= 4) return "bg-[#2fbf71]/15 text-[#2fbf71] ring-[#2fbf71]/25";
  if (p <= 6) return "bg-neutral-700/40 text-neutral-300 ring-neutral-600/30";
  return "bg-red-500/15 text-red-300 ring-red-500/25";
}

function Axis({
  leftLabel,
  rightLabel,
  value,
  leftIcon,
  rightIcon,
}: {
  leftLabel: string;
  rightLabel: string;
  value: number;
  leftIcon?: string;
  rightIcon?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-right text-xs text-neutral-400">
        {leftIcon && <span className="mr-0.5">{leftIcon}</span>}
        {leftLabel}
      </span>
      <div className="relative flex-1 h-1.5 rounded-full bg-surface-border/70">
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-neutral-200 shadow ring-2 ring-neutral-600"
          style={{ left: `calc(${value}% - 6px)` }}
        />
      </div>
      <span className="w-20 shrink-0 text-xs text-neutral-400">
        {rightIcon && <span className="mr-0.5">{rightIcon}</span>}
        {rightLabel}
      </span>
    </div>
  );
}

export function PlaystylePanel({ stats }: Props) {
  const { placementCounts, recentMatches, avgPlacement, top4Rate, winRate, playstyle } = stats;
  const total = placementCounts.reduce((a, b) => a + b, 0);
  const maxCount = Math.max(...placementCounts, 1);

  return (
    <div className="space-y-4">
      {/* ── Recent matches ── */}
      <div className="space-y-1">
        {[recentMatches.slice(0, 10), recentMatches.slice(10, 20)].map(
          (row, ri) =>
            row.length > 0 && (
              <div key={ri} className="flex gap-1">
                {row.map((m, i) => (
                  <span
                    key={`${ri}-${i}`}
                    className={`inline-flex h-6 w-6 items-center justify-center rounded text-[11px] font-semibold tabular-nums ring-1 ${placementStyle(m.placement)}`}
                  >
                    {m.placement}
                  </span>
                ))}
              </div>
            ),
        )}
      </div>

      {/* ── Bar chart + stats ── */}
      <div className="flex items-end gap-3">
        {/* Bar chart */}
        <div className="flex flex-1 items-end gap-1.5 h-24">
          {placementCounts.map((count, idx) => {
            const heightPct = (count / maxCount) * 100;
            const color = PLACEMENT_COLORS[idx];
            return (
              <div key={idx} className="flex flex-1 flex-col items-center gap-0.5">
                <span className="text-[10px] tabular-nums text-neutral-400 leading-none">
                  {count > 0 ? count : ""}
                </span>
                <div className="w-full flex items-end" style={{ height: 64 }}>
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height: count > 0 ? `${Math.max(heightPct, 6)}%` : 0,
                      background: color,
                      opacity: idx < 4 ? 0.85 : 0.45,
                    }}
                  />
                </div>
                <span className="text-[10px] text-neutral-500 leading-none">
                  {idx + 1}
                </span>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-2 text-right w-20 shrink-0">
          <div className="rounded-lg border border-surface-border/60 bg-surface-elevated/60 px-2 py-1.5">
            <p className="text-lg font-bold tabular-nums text-neutral-50 leading-none">
              {avgPlacement ? avgPlacement.toFixed(2) : "–"}
            </p>
            <p className="text-[10px] text-neutral-500 mt-0.5">平均順位</p>
          </div>
          <div className="rounded-lg border border-surface-border/60 bg-surface-elevated/60 px-2 py-1.5">
            <p className="text-lg font-bold tabular-nums text-tier-master leading-none">
              {fmtPct(top4Rate)}
            </p>
            <p className="text-[10px] text-neutral-500 mt-0.5">4位以内率</p>
          </div>
          <div className="rounded-lg border border-surface-border/60 bg-surface-elevated/60 px-2 py-1.5">
            <p className="text-lg font-bold tabular-nums text-[#f3e07a] leading-none">
              {fmtPct(winRate)}
            </p>
            <p className="text-[10px] text-neutral-500 mt-0.5">勝率</p>
          </div>
        </div>
      </div>

      {/* ── Playstyle ── */}
      {total >= 5 && (
        <div className="space-y-2.5 pt-1">
          <p className="text-center text-[11px] uppercase tracking-widest text-neutral-500">
            プレイスタイル
          </p>
          <div className="space-y-2.5">
            <Axis leftLabel="柔軟性" rightLabel="フォーサー" value={playstyle.forcer} />
            <Axis leftLabel="エコノミー" rightLabel="テンポ" value={playstyle.tempo} />
            <Axis leftLabel="タンク" rightLabel="ダメージ" value={100 - playstyle.tank} />
            <Axis leftLabel="AD" rightLabel="AP" value={100 - playstyle.ad} leftIcon="⚔️" rightIcon="✨" />
          </div>
        </div>
      )}
    </div>
  );
}
