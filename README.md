# Road to Master — TFT Squad Tracker

友人3人のTFTランクマッチ進捗を[MetaTFT](https://www.metatft.com)から取得し、マスター到達までの道のりを横並びで比較するサイト。

## 機能

- Set 17 ランクドキュー (Queue 1100) の統計
- 現在/ピークLP、勝率、TOP4率、平均順位、サーバー順位
- 順位分布グラフと直近10試合のヒストリー
- マスター到達までのLP可視化プログレスバー
- サマリー: 現在トップ・最高到達・最良平均順位
- ISRで5分キャッシュ (リロードで最新化)

## プレイヤーの変更

[`src/lib/players.ts`](src/lib/players.ts) の `PLAYERS` 配列を編集。

```ts
export const PLAYERS = [
  { gameName: "yyyyy", tagLine: "chill", region: "jp1" },
  { gameName: "Adder", tagLine: "3406", region: "jp1" },
  { gameName: "油淋鶏定食", tagLine: "4562", region: "jp1" },
];
```

リージョンコードは MetaTFT API の値 (`jp1`, `kr`, `na1`, `euw1`, ...) を使用。

## 開発

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run typecheck
```

## Vercelへのデプロイ

1. このリポジトリをGitHubにpush
2. [Vercel Dashboard](https://vercel.com/new) でImport
3. フレームワークは自動検出 (Next.js)。環境変数不要
4. Deploy

`next.config.mjs` はデフォルトのまま。APIキーもサーバー環境変数も不要。

## データソース

- `https://api.metatft.com/public/profile/lookup_by_riotid/{region}/{name}/{tag}?source=full_profile&tft_set=TFTSet17`
- 非公式クライアントです。レートリミットに注意してください (本サイトはServer Componentから5分に1回取得)。
