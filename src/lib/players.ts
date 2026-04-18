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

export const TFT_SET = "TFTSet17";
export const RANKED_QUEUE_ID = "1100";
export const MASTER_RATING = 2800;
