"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { NormalizedStats } from "@/lib/metatft";

type RatingPoint = {
  timestamp: string;
  ratingNumeric: number;
  ratingText: string;
};

type Props = {
  players: NormalizedStats[];
};

const PLAYER_COLORS = ["#9aa3ab", "#dcb94b", "#5b8cf3"] as const;

const TIER_TICKS = [
  { value: 0, label: "I IV" },
  { value: 100, label: "I III" },
  { value: 200, label: "I II" },
  { value: 300, label: "I I" },
  { value: 400, label: "B IV" },
  { value: 500, label: "B III" },
  { value: 600, label: "B II" },
  { value: 700, label: "B I" },
  { value: 800, label: "S IV" },
  { value: 900, label: "S III" },
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

const TIER_BOUNDARIES = [400, 800, 1200, 1600, 2000, 2400, 2800];

type MergedPoint = {
  ts: number;
  [key: string]: number | undefined;
};

const MA_WINDOW = 5;

function movingAverage(values: number[], window: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < window - 1) return null;
    const slice = values.slice(i - window + 1, i + 1);
    return Math.round(slice.reduce((a, b) => a + b, 0) / window);
  });
}

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

  const sorted = Array.from(allTs).sort((a, b) => a - b);

  // pre-compute per-player MA over their own chronological points
  const playerMaValues: Map<number, number | null>[] = players.map((p) => {
    const maMap = new Map<number, number | null>();
    const pts = p.ratingHistory
      .map((r) => ({ ts: new Date(r.timestamp).getTime(), v: r.ratingNumeric }))
      .sort((a, b) => a.ts - b.ts);
    const ma = movingAverage(pts.map((x) => x.v), MA_WINDOW);
    pts.forEach(({ ts }, i) => maMap.set(ts, ma[i]));
    return maMap;
  });

  return sorted.map((ts) => {
    const point: MergedPoint = { ts };
    players.forEach((p, i) => {
      const v = playerMaps[i].get(ts);
      if (v !== undefined) point[p.riotId] = v;
      const ma = playerMaValues[i].get(ts);
      if (ma !== null && ma !== undefined) point[`${p.riotId}_ma`] = ma;
    });
    return point;
  });
}

function domainFromHistory(players: NormalizedStats[]): [number, number] {
  const all = players.flatMap((p) => p.ratingHistory.map((r) => r.ratingNumeric));
  if (all.length === 0) return [0, 1200];
  const minV = Math.min(...all);
  const maxV = Math.max(...all);
  const floorTier = TIER_TICKS.filter((t) => t.value <= minV).at(-1)?.value ?? 0;
  const ceilTier = TIER_TICKS.find((t) => t.value > maxV)?.value ?? maxV + 100;
  return [floorTier, ceilTier];
}

function visibleTicks(domain: [number, number]): number[] {
  return TIER_TICKS.filter(
    (t) => t.value >= domain[0] && t.value <= domain[1],
  ).map((t) => t.value);
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
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
  const d = new Date(label ?? 0);
  const dateStr = d.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });

  return (
    <div className="rounded-lg border border-neutral-700 bg-[#15181d]/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="mb-1.5 text-neutral-400">{dateStr}</p>
      {payload
        .filter((p) => !p.name.endsWith("_ma"))
        .map((p) => {
          const tick = [...TIER_TICKS].reverse().find((t) => t.value <= p.value);
          const lpInDiv = p.value - (tick?.value ?? 0);
          const maEntry = payload.find((x) => x.name === `${p.name}_ma`);
          return (
            <p key={p.name} className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: p.color }}
              />
              <span className="text-neutral-200">{p.name}</span>
              <span className="ml-auto pl-4 font-semibold tabular-nums text-neutral-50">
                {tick?.label} {lpInDiv} LP
              </span>
              {maEntry && (
                <span className="tabular-nums text-neutral-500">
                  ({MA_WINDOW}MA: {maEntry.value})
                </span>
              )}
            </p>
          );
        })}
    </div>
  );
}

export function LpHistoryChart({ players }: Props) {
  const withHistory = players.filter((p) => p.ratingHistory.length > 0);
  if (withHistory.length === 0) {
    return (
      <p className="text-sm text-neutral-500">LP履歴データなし</p>
    );
  }

  const data = buildChartData(withHistory);
  const domain = domainFromHistory(withHistory);
  const ticks = visibleTicks(domain);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 16, bottom: 4, left: 8 }}
      >
        <CartesianGrid
          strokeDasharray="4 4"
          stroke="rgba(255,255,255,0.05)"
          vertical={false}
        />

        {TIER_BOUNDARIES.filter(
          (b) => b > domain[0] && b <= domain[1],
        ).map((b) => (
          <ReferenceLine
            key={b}
            y={b}
            stroke="rgba(255,255,255,0.12)"
            strokeDasharray="6 3"
          />
        ))}

        <XAxis
          dataKey="ts"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickFormatter={formatDate}
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          minTickGap={60}
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
          width={44}
        />

        <Tooltip content={<CustomTooltip />} />

        {withHistory.map((p, i) => {
          const color = PLAYER_COLORS[i % PLAYER_COLORS.length];
          return [
            <Line
              key={p.riotId}
              type="monotone"
              dataKey={p.riotId}
              stroke={color}
              strokeWidth={1.5}
              strokeOpacity={0.5}
              dot={{ r: 2.5, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 4, strokeWidth: 0 }}
              connectNulls={false}
            />,
            <Line
              key={`${p.riotId}_ma`}
              type="monotone"
              dataKey={`${p.riotId}_ma`}
              stroke={color}
              strokeWidth={2.5}
              dot={false}
              activeDot={false}
              connectNulls={true}
              legendType="none"
            />,
          ];
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}
