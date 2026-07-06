# 東海4県 花火大会マップ 2026

公開URL: https://koya864.github.io/tokai-hanabi-map/

React + Vite の静的サイト。GitHub Pages（`gh-pages` ブランチ）で配信しています。

---

## 大会情報の更新方法（オーナー専用）

編集するのは **`src/festivals.js`** の1ファイルだけです。閲覧者は画面から編集できません（GitHub に push できる人＝オーナーだけが更新できます）。

### 手順

1. `src/festivals.js` の `FESTIVALS` 配列を編集する
   - 追加: ファイル冒頭のテンプレートをコピーして1ブロック足す
   - 変更: 該当大会のフィールドを書き換える
   - 削除: そのブロックを消す
2. main ブランチにコミット＆push する
3. 公開サイトへ反映する（下記いずれか）
   - `npm run deploy` を実行（ローカル）
   - もしくは自動デプロイ（有効化済みなら push だけで反映。下記参照）

> PC がなくても、GitHub の Web 画面で `src/festivals.js` を直接編集できます。
> 自動デプロイを有効にしておけば、Web 編集だけで公開まで完結します。

### 別のAIに更新を頼むとき

「このリポジトリの `src/festivals.js` に次の大会を追加して、push して」と伝えれば、
ファイルが小さく自己完結しているので安全に編集できます。スキーマはファイル冒頭のコメント参照。

### チケット状況について

`tickets` に受付期間（`start` / `end`）を入れると、当日の日付から「販売中／受付終了」などを自動判定します。
完売のように日付で判定できない状態は `statusOverride` で上書きします:

```js
statusOverride: { kind: "soldout", label: "完売" }
// kind: sale / soldout / lottery / upcoming / closed / none / check
```

---

## 開発

```bash
npm install      # 初回のみ
npm run dev      # ローカルプレビュー（http://localhost:5175/tokai-hanabi-map/）
npm run build    # 本番ビルド
npm run deploy   # dist を gh-pages ブランチへ公開
```

## 地図データの再生成

県境界は `src/mapData.js`（実データを簡略化してSVG化）。作り直す場合は `scripts/gen-map.mjs` を参照。

## アイコン・OGP画像の再生成

ファビコンと共有プレビュー画像は `public/` に生成済み（`favicon.svg` / `favicon-32.png` / `apple-touch-icon.png` / `og.png`）。
デザインを変えたいときは `scripts/gen-assets.mjs` を編集して `node scripts/gen-assets.mjs` で再生成（sharp が必要: `npm install`）。
`<head>` のタイトル・説明文・OGPタグは `index.html` にあります。
