export type PlayerConfig = {
  readonly gameName: string;
  readonly tagLine: string;
  readonly region: string;
};

export const PLAYERS: readonly PlayerConfig[] = [
  { gameName: "yyyyy", tagLine: "chill", region: "jp1" },
  { gameName: "Adder", tagLine: "3406", region: "jp1" },
  { gameName: "油淋鶏定食", tagLine: "4562", region: "jp1" },
] as const;

export const metatftProfileUrl = (p: PlayerConfig): string => {
  const shortRegion = p.region.replace(/\d+$/, "");
  const slug = encodeURIComponent(`${p.gameName} -${p.tagLine}`);
  return `https://www.metatft.com/player/${shortRegion}/${slug}`;
};

export const PLAYER_COLORS = ["#9aa3ab", "#e8954a", "#5b8cf3"] as const;

export const TFT_SET = "TFTSet17";
export const RANKED_QUEUE_ID = "1100";
export const MASTER_RATING = 2800;
