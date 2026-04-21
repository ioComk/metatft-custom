"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import type { NormalizedStats } from "@/lib/metatft";
import { PLAYER_COLORS } from "@/lib/players";

type Props = {
  players: NormalizedStats[];
};

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

const TIER_BOUNDARIES = new Set([400, 800, 1200, 1600, 2000, 2400, 2800]);

const TIER_BANDS = [
  { y1: 0,    y2: 400,  fill: "rgba(90,  60,  40,  0.18)" },
  { y1: 400,  y2: 800,  fill: "rgba(160,  90,  50,  0.20)" },
  { y1: 800,  y2: 1200, fill: "rgba(140, 150, 165, 0.18)" },
  { y1: 1200, y2: 1600, fill: "rgba(200, 160,  40,  0.18)" },
  { y1: 1600, y2: 2000, fill: "rgba(50,  180, 160, 0.15)" },
  { y1: 2000, y2: 2400, fill: "rgba(50,  180,  90,  0.15)" },
  { y1: 2400, y2: 2800, fill: "rgba(80,  130, 220, 0.15)" },
  { y1: 2800, y2: 9999, fill: "rgba(180,  80, 220, 0.15)" },
];

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

const TIME_RANGES: { label: string; days: number | null }[] = [
  { label: "5時間", days: 5 / 24 },
  { label: "1日", days: 1 },
  { label: "3日", days: 3 },
  { label: "7日", days: 7 },
  { label: "全期間", days: null },
];
type RangeDays = number | null;
type ViewMode = "combined" | "individual";

type ChartBodyProps = {
  data: MergedPoint[];
  players: NormalizedStats[];
  domain: [number, number];
  xMin: number;
  height?: number;
};

function ChartBody({ data, players, domain, xMin, height = 300 }: ChartBodyProps) {
  const ticks = visibleTicks(domain);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 24, bottom: 0, left: 0 }}
      >
        {TIER_BANDS.filter((b) => b.y2 > domain[0] && b.y1 < domain[1]).map((b) => (
          <ReferenceArea
            key={b.y1}
            y1={Math.max(b.y1, domain[0])}
            y2={Math.min(b.y2, domain[1])}
            fill={b.fill}
            stroke="none"
          />
        ))}

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
          domain={[xMin, "dataMax"]}
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

        {players.map((p, i) => (
          <Line
            key={p.riotId}
            type="monotone"
            dataKey={p.riotId}
            stroke={PLAYER_COLORS[i % PLAYER_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 2, strokeWidth: 0, fill: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
            activeDot={{ r: 4, strokeWidth: 0, fill: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
            connectNulls={true}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function LpHistoryChart({ players }: Props) {
  const [showToMaster, setShowToMaster] = React.useState(false);
  const [rangeDays, setRangeDays] = React.useState<RangeDays>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>("combined");

  const withHistory = players.filter((p) => p.ratingHistory.length > 0);
  if (withHistory.length === 0) {
    return <p style={{ color: "#6b7280", fontSize: 14 }}>LP履歴データなし</p>;
  }

  const CONNECTED_GAP_MS = 6 * 60 * 60 * 1000;
  const firstLineStart = (p: NormalizedStats): number => {
    const times = [...p.ratingHistory]
      .map((r) => new Date(r.timestamp).getTime())
      .sort((a, b) => a - b);
    for (let i = 0; i + 1 < times.length; i++) {
      if (times[i + 1] - times[i] <= CONNECTED_GAP_MS) return times[i];
    }
    return times[0] ?? 0;
  };
  const baseXMin = Math.max(...withHistory.map(firstLineStart));

  const allData = buildChartData(withHistory).filter((d) => d.ts >= baseXMin);
  const dataMax = allData.length > 0 ? allData[allData.length - 1].ts : Date.now();
  const xMin = rangeDays !== null
    ? Math.max(baseXMin, dataMax - rangeDays * 24 * 60 * 60 * 1000)
    : baseXMin;
  const data = allData.filter((d) => d.ts >= xMin);

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: "2px 10px",
    fontSize: 11,
    borderRadius: 6,
    border: "1px solid",
    cursor: "pointer",
    borderColor: active ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.12)",
    background: active ? "rgba(255,255,255,0.10)" : "transparent",
    color: active ? "#f9fafb" : "#6b7280",
    transition: "all 0.15s",
  });

  const controls = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {TIME_RANGES.map((r) => (
          <button key={r.label} style={btnStyle(rangeDays === r.days)} onClick={() => setRangeDays(r.days)}>
            {r.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <button style={btnStyle(viewMode === "combined")} onClick={() => setViewMode("combined")}>全員</button>
        <button style={btnStyle(viewMode === "individual")} onClick={() => setViewMode("individual")}>個人</button>
        <span style={{ width: 1, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
        <button style={btnStyle(!showToMaster)} onClick={() => setShowToMaster(false)}>フィット</button>
        <button style={btnStyle(showToMaster)} onClick={() => setShowToMaster(true)}>Masterまで</button>
      </div>
    </div>
  );

  if (viewMode === "individual") {
    return (
      <div>
        {controls}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {withHistory.map((p, i) => {
            const playerData = data.map((d) => ({ ts: d.ts, [p.riotId]: d[p.riotId] }));
            const filteredHistory = p.ratingHistory.filter(
              (r) => new Date(r.timestamp).getTime() >= xMin,
            );
            const singleFitDomain = filteredHistory.length > 0
              ? domainFromHistory([{ ...p, ratingHistory: filteredHistory }])
              : domainFromHistory([p]);
            const domain: [number, number] = showToMaster
              ? [singleFitDomain[0], 2800]
              : singleFitDomain;
            const color = PLAYER_COLORS[i % PLAYER_COLORS.length];

            return (
              <div
                key={p.riotId}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.07)",
                  padding: "12px 8px 8px",
                }}
              >
                <p style={{ fontSize: 12, fontWeight: 600, color, marginBottom: 8, paddingLeft: 8 }}>
                  {p.riotId}
                </p>
                <ChartBody
                  data={playerData}
                  players={[p]}
                  domain={domain}
                  xMin={xMin}
                  height={220}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // combined view
  const visiblePlayers = withHistory.filter((p) =>
    data.some((d) => d[p.riotId] !== undefined),
  );
  const fitDomain = visiblePlayers.length > 0
    ? domainFromHistory(visiblePlayers.map((p) => ({
        ...p,
        ratingHistory: p.ratingHistory.filter(
          (r) => new Date(r.timestamp).getTime() >= xMin,
        ),
      })))
    : domainFromHistory(withHistory);
  const domain: [number, number] = showToMaster
    ? [fitDomain[0], 2800]
    : fitDomain;

  return (
    <div>
      {controls}
      <ChartBody
        key={`${rangeDays}-${showToMaster}`}
        data={data}
        players={withHistory}
        domain={domain}
        xMin={xMin}
        height={300}
      />
    </div>
  );
}
