import type { NormalizedStats } from "@/lib/metatft";
import { PLAYER_COLORS } from "@/lib/players";
import { tierColorClass, tierFromText } from "@/lib/rank";

const MASTER_LP = 2800;

const ZONES = [
  { from: 0,    to: 400,  label: "I", bg: "rgba(90,60,40,0.55)" },
  { from: 400,  to: 800,  label: "B", bg: "rgba(160,90,50,0.55)" },
  { from: 800,  to: 1200, label: "S", bg: "rgba(140,150,165,0.45)" },
  { from: 1200, to: 1600, label: "G", bg: "rgba(200,160,40,0.45)" },
  { from: 1600, to: 2000, label: "P", bg: "rgba(50,180,160,0.40)" },
  { from: 2000, to: 2400, label: "E", bg: "rgba(50,180,90,0.40)" },
  { from: 2400, to: 2800, label: "D", bg: "rgba(80,130,220,0.45)" },
];

type Props = {
  players: NormalizedStats[];
};

export function Leaderboard({ players }: Props) {
  const sorted = [...players].sort((a, b) => b.ratingNumeric - a.ratingNumeric);

  return (
    <div className="space-y-3">
      {/* ティア区分ラベル */}
      <div className="ml-[calc(1.5rem+5rem+0.5rem)] sm:ml-[calc(1.5rem+8rem+0.75rem)] flex pr-14 sm:pr-28 text-[10px] text-neutral-600 select-none">
        {ZONES.map((z) => (
          <div
            key={z.from}
            style={{ width: `${((z.to - z.from) / MASTER_LP) * 100}%` }}
            className="text-center"
          >
            {z.label}
          </div>
        ))}
        <div className="pl-1">M</div>
      </div>

      {sorted.map((p, rank) => {
        const originalIdx = players.findIndex((pl) => pl.riotId === p.riotId);
        const color = PLAYER_COLORS[originalIdx % PLAYER_COLORS.length];
        const lp = Math.max(0, Math.min(p.ratingNumeric, MASTER_LP));
        const pct = (lp / MASTER_LP) * 100;
        const tier = tierFromText(p.ratingText);

        return (
          <div key={p.riotId} className="flex items-center gap-2 sm:gap-3">
            {/* ランクバッジ */}
            <span className="w-6 shrink-0 text-center text-xs font-bold text-neutral-500">
              #{rank + 1}
            </span>

            {/* プレイヤー名 */}
            <span
              className="w-20 sm:w-32 shrink-0 truncate text-xs sm:text-sm font-semibold"
              style={{ color }}
            >
              {p.riotId.split("#")[0]}
            </span>

            {/* プログレスバー */}
            <div className="relative flex-1 h-5 rounded-md overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
              {/* ティアゾーン背景 */}
              <div className="absolute inset-0 flex">
                {ZONES.map((z) => (
                  <div
                    key={z.from}
                    style={{ width: `${((z.to - z.from) / MASTER_LP) * 100}%`, background: z.bg }}
                  />
                ))}
              </div>

              {/* 区切り線 */}
              {ZONES.slice(1).map((z) => (
                <div
                  key={z.from}
                  className="absolute inset-y-0 w-px bg-black/20"
                  style={{ left: `${(z.from / MASTER_LP) * 100}%` }}
                />
              ))}

              {/* 塗り進捗 */}
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, transparent, ${color}55)`,
                }}
              />

              {/* 現在地マーカー */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-1 rounded-full shadow-lg"
                style={{ left: `${pct}%`, background: color }}
              />
            </div>

            {/* LP表示 */}
            <span className={`w-14 sm:w-28 shrink-0 text-right text-[11px] sm:text-xs font-semibold tabular-nums ${tierColorClass[tier]}`}>
              {p.ratingText}
            </span>
          </div>
        );
      })}
    </div>
  );
}
