import { fetchProfile, normalize, type NormalizedStats } from "@/lib/metatft";
import { PLAYERS, TFT_SET } from "@/lib/players";
import { PlayerCard } from "@/components/PlayerCard";
import { LeaderSummary } from "@/components/LeaderSummary";

export const revalidate = 300;

type LoadedPlayer =
  | { ok: true; stats: NormalizedStats }
  | { ok: false; label: string; error: string };

async function loadAll(): Promise<LoadedPlayer[]> {
  return Promise.all(
    PLAYERS.map(async (p): Promise<LoadedPlayer> => {
      try {
        const raw = await fetchProfile(p);
        return { ok: true, stats: normalize(raw) };
      } catch (err) {
        return {
          ok: false,
          label: `${p.gameName}#${p.tagLine}`,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }),
  );
}

export default async function Page() {
  const results = await loadAll();
  const loadedStats = results.flatMap((r) => (r.ok ? [r.stats] : []));
  const errors = results.flatMap((r) => (!r.ok ? [r] : []));
  const lastUpdated = new Date().toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4 pb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-tier-master/80">
            Road to Master · {TFT_SET.replace("TFTSet", "Set ")}
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            友人3人の<span className="text-tier-master">マスター到達</span>トラッカー
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-400">
            MetaTFTの公開プロフィールAPIから3人の統計を取得して横並びで比較します。
            ページは5分ごとに再生成されます。最新化したい場合はリロードしてください。
          </p>
        </div>
        <div className="text-right text-xs text-neutral-500">
          <p>最終取得 (JST)</p>
          <p className="font-mono text-neutral-300">{lastUpdated}</p>
        </div>
      </header>

      {loadedStats.length > 0 && <LeaderSummary players={loadedStats} />}

      {errors.length > 0 && (
        <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <p className="font-semibold">取得に失敗したプレイヤーがいます</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {errors.map((e) => (
              <li key={e.label}>
                <span className="font-mono">{e.label}</span> — {e.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loadedStats.map((stats, idx) => {
          const sorted = [...loadedStats].sort(
            (a, b) => b.ratingNumeric - a.ratingNumeric,
          );
          const rank = sorted.findIndex((s) => s.riotId === stats.riotId) + 1;
          return (
            <PlayerCard key={stats.riotId + idx} stats={stats} rank={rank} />
          );
        })}
      </div>

      <footer className="mt-12 flex flex-wrap items-center justify-between gap-2 border-t border-surface-border/60 pt-6 text-xs text-neutral-500">
        <p>
          Data source:{" "}
          <a
            href="https://www.metatft.com"
            className="underline hover:text-neutral-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            metatft.com
          </a>
          . 非公式クライアント。レートリミットに注意。
        </p>
        <p>
          <a
            href="https://github.com/"
            className="underline hover:text-neutral-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source
          </a>
        </p>
      </footer>
    </main>
  );
}
