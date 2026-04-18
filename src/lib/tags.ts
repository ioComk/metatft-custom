import type { Match } from "./metatft";
import { TFT_SET, RANKED_QUEUE_ID } from "./players";

export type TagType = "positive" | "negative" | "neutral" | "unit";

export type PlayerTag = {
  key: string;
  name: string;
  description: string;
  type: TagType;
};

type MatchWithSummary = Match & {
  summary?: {
    players_eliminated?: number;
    player_rating_numeric?: number;
    units?: Array<{ character_id: string; itemNames?: string[] }>;
  };
};

const AD_ITEMS = new Set([
  "TFT_Item_InfinityEdge",
  "TFT_Item_Bloodthirster",
  "TFT_Item_GuinsoosRageblade",
  "TFT_Item_HextechGunblade",
  "TFT_Item_KrakenSlayer",
  "TFT_Item_LastWhisper",
  "TFT_Item_GiantSlayer",
  "TFT_Item_BowOfShazin",
  "TFT_Item_StatikkShiv",
  "TFT_Item_RunaansHurricane",
  "TFT_Item_RapidFireCannon",
  "TFT_Item_TitanicHydra",
]);

const AP_ITEMS = new Set([
  "TFT_Item_Deathblade",
  "TFT_Item_JeweledGauntlet",
  "TFT_Item_SpearOfShojin",
  "TFT_Item_HextechGunblade",
  "TFT_Item_NightHarvester",
  "TFT_Item_Shadowflame",
  "TFT_Item_MortalReminder",
  "TFT_Item_ArchangelsStaff",
  "TFT_Item_BlueGleamingSword",
  "TFT_Item_Rabadon",
  "TFT_Item_LudensTempestCompanion",
  "TFT_Item_LudensTempestCompanionRO",
]);

export function computeTags(matches: MatchWithSummary[]): PlayerTag[] {
  const ranked = matches.filter(
    (m) =>
      m.tft_set === TFT_SET &&
      (m.queue_id === Number(RANKED_QUEUE_ID) ||
        m.rating_queue_id === Number(RANKED_QUEUE_ID)),
  );

  if (ranked.length < 5) return [];

  const recent = ranked.slice(0, 20);
  const tags: PlayerTag[] = [];

  // ── CHAIN_WINS / CHAIN_LOSSES ──────────────────────────────────────
  let top4AfterTop4 = 0, top4AfterBot4 = 0;
  let bot4AfterBot4 = 0, bot4AfterTop4 = 0;
  for (let i = 0; i < recent.length - 1; i++) {
    const curr = recent[i];
    const next = recent[i + 1];
    const currTop = curr.placement <= 4;
    const nextTop = next.placement <= 4;
    if (currTop && nextTop) top4AfterTop4++;
    else if (currTop && !nextTop) top4AfterBot4++;
    else if (!currTop && nextTop) bot4AfterTop4++;
    else bot4AfterBot4++;
  }

  const chainWinRate =
    top4AfterTop4 + top4AfterBot4 > 1
      ? top4AfterTop4 / (top4AfterTop4 + top4AfterBot4)
      : 0;
  const chainLossRate =
    bot4AfterBot4 + bot4AfterTop4 > 1
      ? bot4AfterBot4 / (bot4AfterBot4 + bot4AfterTop4)
      : 0;

  if (chainWinRate > 0.6 && top4AfterTop4 + top4AfterBot4 > 1) {
    tags.push({
      key: "CHAIN_WINS",
      name: "連勝チェーン",
      description: `TOP4後に再びTOP4に入る確率: ${(chainWinRate * 100).toFixed(0)}%`,
      type: "positive",
    });
  }
  if (chainLossRate > 0.6 && bot4AfterBot4 + bot4AfterTop4 > 1) {
    tags.push({
      key: "CHAIN_LOSSES",
      name: "連敗チェーン",
      description: `BOT4後に再びBOT4に入る確率: ${(chainLossRate * 100).toFixed(0)}%`,
      type: "negative",
    });
  }

  // ── ELIMINATIONS ───────────────────────────────────────────────────
  const elims = recent
    .map((m) => m.summary?.players_eliminated ?? 0);
  const avgElim = elims.reduce((a, b) => a + b, 0) / elims.length;

  if (avgElim < 0.8) {
    tags.push({
      key: "PACIFIST",
      name: "パッシブ",
      description: `1試合あたりの撃破数: ${avgElim.toFixed(1)}`,
      type: "neutral",
    });
  } else if (avgElim > 1.5) {
    tags.push({
      key: "ASSASSIN",
      name: "アグレッシブ",
      description: `1試合あたりの撃破数: ${avgElim.toFixed(1)}`,
      type: "positive",
    });
  }

  // ── GOOD_MMR / BAD_MMR ─────────────────────────────────────────────
  const mmrPairs = recent.filter(
    (m) => m.avg_rating_numeric && m.summary?.player_rating_numeric,
  ).map((m) => ({
    opp: m.avg_rating_numeric!,
    self: m.summary!.player_rating_numeric!,
  }));

  if (mmrPairs.length > 5) {
    const avgOpp = mmrPairs.reduce((a, b) => a + b.opp, 0) / mmrPairs.length;
    const avgSelf = mmrPairs.reduce((a, b) => a + b.self, 0) / mmrPairs.length;
    const diff = avgOpp - avgSelf;

    if (diff >= 50 && avgSelf < 3200) {
      tags.push({
        key: "GOOD_MMR",
        name: "良いMMR",
        description: `対戦相手の平均ランクが自分より ${diff.toFixed(0)} LP高い`,
        type: "positive",
      });
    } else if (diff <= -50 && avgSelf < 3200) {
      tags.push({
        key: "BAD_MMR",
        name: "悪いMMR",
        description: `対戦相手の平均ランクが自分より ${Math.abs(diff).toFixed(0)} LP低い`,
        type: "negative",
      });
    }
  }

  // ── UNIT FORCER ────────────────────────────────────────────────────
  const unitCounts = new Map<string, number>();
  let gamesWithUnits = 0;
  recent.forEach((m) => {
    const units = m.summary?.units ?? [];
    if (units.length === 0) return;
    gamesWithUnits++;
    const seen = new Set<string>();
    units.forEach((u) => {
      const name = u.character_id.replace(/^TFT\d+_/, "");
      if (!seen.has(name)) {
        seen.add(name);
        unitCounts.set(name, (unitCounts.get(name) ?? 0) + 1);
      }
    });
  });

  if (gamesWithUnits >= 5) {
    const sorted = Array.from(unitCounts.entries()).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      const [topUnit, topCount] = sorted[0];
      const pct = topCount / gamesWithUnits;
      if (pct >= 0.7) {
        tags.push({
          key: "ONE_TRICK",
          name: `${topUnit}使い`,
          description: `${(pct * 100).toFixed(0)}% の試合で ${topUnit} を使用`,
          type: "unit",
        });
      } else if (pct >= 0.5) {
        tags.push({
          key: "FORCER",
          name: `${topUnit}好き`,
          description: `${(pct * 100).toFixed(0)}% の試合で ${topUnit} を使用`,
          type: "neutral",
        });
      }
    }
  }

  // ── AD / AP PREFERENCE ─────────────────────────────────────────────
  let adCount = 0, apCount = 0;
  recent.forEach((m) => {
    m.summary?.units?.forEach((u) => {
      u.itemNames?.forEach((item) => {
        if (AD_ITEMS.has(item)) adCount++;
        if (AP_ITEMS.has(item)) apCount++;
      });
    });
  });
  const totalItems = adCount + apCount;
  if (totalItems > 5) {
    const adPct = adCount / totalItems;
    if (adPct >= 0.65) {
      tags.push({
        key: "LIKES_AD",
        name: "AD好み",
        description: `攻撃アイテムの ${(adPct * 100).toFixed(0)}% がADアイテム`,
        type: "neutral",
      });
    } else if (adPct <= 0.35) {
      tags.push({
        key: "LIKES_AP",
        name: "AP好み",
        description: `攻撃アイテムの ${((1 - adPct) * 100).toFixed(0)}% がAPアイテム`,
        type: "neutral",
      });
    }
  }

  // ── FIRST OR LAST ──────────────────────────────────────────────────
  const firstOrLast = recent.filter(
    (m) => m.placement === 1 || m.placement === 8,
  ).length;
  if (firstOrLast >= 5 && recent.length >= 10) {
    tags.push({
      key: "FIRST_OR_LAST",
      name: "1位か8位",
      description: `直近${recent.length}試合で${firstOrLast}回 1位か8位`,
      type: "neutral",
    });
  }

  return tags;
}
