"use client";

import { useState, useTransition } from "react";
import { refreshSTierComps } from "@/app/actions";
import { TFT_SET } from "@/lib/players";
import type { Composition } from "@/lib/metatft-comps";

function formatPct(v: number) {
  return v > 0 ? `${(v * 100).toFixed(1)}%` : "—";
}

function formatPlacement(v: number) {
  return v > 0 ? v.toFixed(2) : "—";
}

function UnitTag({ name }: { name: string }) {
  const display = name
    .replace(/^TFT\d+_/, "")
    .replace(/^TFT_/, "")
    .replace(/([A-Z])/g, " $1")
    .trim();
  return (
    <span className="rounded-md bg-surface-elevated px-2 py-0.5 text-[11px] text-neutral-400 border border-surface-border/50">
      {display}
    </span>
  );
}

function TraitTag({ name }: { name: string }) {
  return (
    <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11px] text-amber-400/90">
      {name}
    </span>
  );
}

function CompCard({ comp }: { comp: Composition }) {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-surface-raised/80 p-4 flex flex-col gap-3 hover:border-amber-500/40 transition-colors">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-sm font-bold text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
          S
        </span>
        <span className="font-semibold text-neutral-100 text-sm leading-snug mt-1">
          {comp.name}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1 border-t border-surface-border/40 pt-3">
        {[
          { label: "平均順位", value: formatPlacement(comp.avg_placement) },
          { label: "勝率", value: formatPct(comp.win_rate) },
          { label: "TOP4率", value: formatPct(comp.top4_rate) },
          { label: "試合数", value: comp.num_games > 0 ? comp.num_games.toLocaleString("ja-JP") : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center text-center">
            <span className="text-[9px] sm:text-[10px] text-neutral-500 uppercase tracking-wide leading-tight">
              {label}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-neutral-200 mt-0.5">
              {value}
            </span>
          </div>
        ))}
      </div>

      {comp.key_traits.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {comp.key_traits.slice(0, 5).map((t) => (
            <TraitTag key={t} name={t} />
          ))}
        </div>
      )}

      {comp.key_units.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {comp.key_units.slice(0, 7).map((u) => (
            <UnitTag key={u} name={u} />
          ))}
        </div>
      )}
    </div>
  );
}

type Props = {
  initialComps: Composition[];
  initialError?: string;
};

export function STierList({ initialComps, initialError }: Props) {
  const [comps, setComps] = useState(initialComps);
  const [error, setError] = useState(initialError);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await refreshSTierComps();
      if (result.ok) {
        setComps(result.comps);
        setError(undefined);
      } else {
        setError(result.error);
      }
      setLastRefreshed(
        new Date().toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo" }),
      );
    });
  };

  const setLabel = TFT_SET.replace("TFTSet", "Set ");

  return (
    <section className="mt-8 rounded-2xl border border-surface-border/60 bg-surface-raised/70 p-3 sm:p-6 shadow-lg backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 mb-5">
        <div>
          <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-amber-500/15 text-[11px] font-bold text-amber-400 border border-amber-500/30">
              S
            </span>
            S Tier 構成一覧
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            MetaTFT · {setLabel} · ランク戦
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-xs text-neutral-500">更新: {lastRefreshed}</span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg border border-surface-border/80 bg-surface-elevated/80 px-3 py-1.5 text-xs font-medium text-neutral-300 transition hover:border-neutral-500 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
            {isPending ? "更新中…" : "Tier取得・更新"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <p className="font-semibold">構成データの取得に失敗しました</p>
          <p className="mt-1 font-mono text-xs text-red-300/70 break-all">{error}</p>
          <p className="mt-2 text-xs text-red-300/60">
            更新ボタンで再試行するか、
            <a
              href="https://www.metatft.com/comps"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-red-200"
            >
              MetaTFT
            </a>
            を直接ご確認ください。
          </p>
        </div>
      ) : comps.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-neutral-400">S Tier の構成が見つかりませんでした</p>
          <p className="text-xs text-neutral-600 mt-1">「Tier取得・更新」ボタンで最新データを取得できます</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {comps.map((comp) => (
            <CompCard key={comp.name} comp={comp} />
          ))}
        </div>
      )}
    </section>
  );
}
