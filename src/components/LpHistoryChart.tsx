"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { NormalizedStats } from "@/lib/metatft";

type Props = {
  players: NormalizedStats[];
};

const PLAYER_COLORS = ["#9aa3ab", "#e8954a", "#5b8cf3"] as const;

const TIER_TICKS = [
  { value: 0,    label: "I" },
  { value: 100,  label: "I III" },
  { value: 200,  label: "I II" },
  { value: 300,  label: "I I" },
  { value: 400,  label: "B IV" },
  { value: 500,  label: "B III" },
  { value: 600,  label: "B II" },
  { value: 700,  label: "B I" },
  { value: 800,  label: "S IV" },
  { value: 900,  label: "S III" },
  { value: 1000, label: "S II" },
  { value: 1100, label: "S I" },
  { value: 1200, label: "G IV" },
  { value: 1300, label: "G III" },
  { value: 1400, label: "G II" },
  { value: 1500, label: "G I" },
  { value: 1600, label: "P IV" },
  { value: 1700, label: "P III" },
  { value: 1800, label: "P II" },
  { value: 1900, label: "P I" },
  { value: 2000, label: "E IV" },
  { value: 2100, label: "E III" },
  { value: 2200, label: "E II" },
  { value: 2300, label: "E I" },
  { value: 2400, label: "D IV" },
  { value: 2500, label: "D III" },
  { value: 2600, label: "D II" },
  { value: 2700, label: "D I" },
  { value: 2800, label: "Master" },
];

// ティア境界（ドット線で強調）
const TIER_BOUNDARIES = new Set([400, 800, 1200, 1600, 2000, 2400, 2800]);

type MergedPoint = {
  ts: number;
  [key: string]: number | undefined;
};

function buildChartData(players: NormalizedStats[]): MergedPoint[] {
  const allTs = new Set<number>();
  const playerMaps: Map<number, number>[] = players.map((p) => {
    const m = new Map<number, number>();
    p.ratingHistory.forEach((r) => {
      const ts = new Date(r.timestamp).getTime();
      allTs.add(ts);
      m.set(ts, r.ratingNumeric);
    });
    return m;
  });

  return Array.from(allTs)
    .sort((a, b) => a - b)
    .map((ts) => {
      const point: MergedPoint = { ts };
      players.forEach((p, i) => {
        const v = playerMaps[i].get(ts);
        if (v !== undefined) point[p.riotId] = v;
      });
      return point;
    });
}

function domainFromHistory(players: NormalizedStats[]): [number, number] {
  const all = players.flatMap((p) =>
    p.ratingHistory.map((r) => r.ratingNumeric),
  );
  if (all.length === 0) return [0, 1200];
  const minV = Math.min(...all);
  const maxV = Math.max(...all);
  const floorTier = TIER_TICKS.filter((t) => t.value <= minV).at(-1)?.value ?? 0;
  const ceilTier =
    TIER_TICKS.find((t) => t.value > maxV)?.value ?? maxV + 100;
  return [floorTier, ceilTier];
}

function visibleTicks(domain: [number, number]): number[] {
  return TIER_TICKS.filter(
    (t) => t.value >= domain[0] && t.value <= domain[1],
  ).map((t) => t.value);
}

function formatXDate(ts: number): string {
  const d = new Date(ts);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return `${jst.getUTCDate()}日`;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  const jst = new Date((label ?? 0) + 9 * 60 * 60 * 1000);
  const dateStr = `${jst.getUTCMonth() + 1}月${jst.getUTCDate()}日 ${String(jst.getUTCHours()).padStart(2, "0")}:${String(jst.getUTCMinutes()).padStart(2, "0")}`;

  return (
    <div
      style={{
        background: "rgba(13,15,18,0.95)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
      }}
    >
      <p style={{ color: "#6b7280", marginBottom: 6 }}>{dateStr}</p>
      {payload.map((p) => {
        const tick = [...TIER_TICKS]
          .reverse()
          .find((t) => t.value <= p.value);
        const lpInDiv = p.value - (tick?.value ?? 0);
        return (
          <p
            key={p.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#e5e7eb",
              marginBottom: 2,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: p.color,
                flexShrink: 0,
              }}
            />
            <span style={{ color: "#9ca3af" }}>{p.name}</span>
            <span style={{ marginLeft: "auto", paddingLeft: 16, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "#f9fafb" }}>
              {tick?.label} {lpInDiv} LP
            </span>
          </p>
        );
      })}
    </div>
  );
}

export function LpHistoryChart({ players }: Props) {
  const withHistory = players.filter((p) => p.ratingHistory.length > 0);
  if (withHistory.length === 0) {
    return <p style={{ color: "#6b7280", fontSize: 14 }}>LP履歴データなし</p>;
  }

  const data = buildChartData(withHistory);
  const domain = domainFromHistory(withHistory);
  const ticks = visibleTicks(domain);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 24, bottom: 0, left: 0 }}
      >
        {/* 各ディビジョンの横線 */}
        {ticks.map((v) => (
          <ReferenceLine
            key={v}
            y={v}
            stroke={
              TIER_BOUNDARIES.has(v)
                ? "rgba(255,255,255,0.18)"
                : "rgba(255,255,255,0.06)"
            }
            strokeDasharray={TIER_BOUNDARIES.has(v) ? "6 4" : undefined}
            strokeWidth={TIER_BOUNDARIES.has(v) ? 1.5 : 1}
          />
        ))}

        <XAxis
          dataKey="ts"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickFormatter={formatXDate}
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
          tickLine={false}
          minTickGap={80}
          dy={6}
        />

        <YAxis
          domain={domain}
          ticks={ticks}
          tickFormatter={(v: number) =>
            TIER_TICKS.find((t) => t.value === v)?.label ?? ""
          }
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />

        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.12)", strokeWidth: 1 }} />

        {withHistory.map((p, i) => (
          <Line
            key={p.riotId}
            type="monotone"
            dataKey={p.riotId}
            stroke={PLAYER_COLORS[i % PLAYER_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
            connectNulls={true}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
