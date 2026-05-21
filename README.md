# 余白ノート

紙の手帳やノートでジャーナリングする人向けの、スマホ補助PWAです。本文は保存せず、今日の一言、プロンプト、タイマー、実行日、紙ノート用コードだけを扱います。

## 目的

- アクセス直後にクッション画面を置き、いきなり情報量の多いTopを見せない
- 初心者が白紙で止まらないように、今日の一言と状態別の問いを出す
- 三日坊主を防ぐために、1分レスキューと「二日空けない」ガードを置く
- 紙ノート運用を崩さないように、記録本文は保存しない
- 今日画面の入力欄をなくし、選択と完了ボタンに絞る
- 週一回だけ見返す流れを作り、反すうを避ける
- 今日 / 型 / 習慣 / 設定の4タブで、スマホ片手操作に寄せる
- 設定からライト / ダーク / システム追従を切り替えられる
- 今日の一言は400件の出典つきデータから選び、365日で重複しない

## 実行

```bash
python3 -m http.server 4173
```

ブラウザで `http://localhost:4173/journaling-support-tool/` を開きます。

## PWAとして使う

- Android / Chrome: 右上メニューまたは画面上の追加ボタンから「ホーム画面に追加」を選びます。
- iPhone / Safari: 共有ボタンから「ホーム画面に追加」を選びます。
- インストール後は `standalone` 表示になり、Service Workerにより一度開いた後はオフラインでもアプリシェルが開きます。

PWA用に `manifest.webmanifest`、`sw.js`、PNGアイコン、maskableアイコン、Apple touch iconを含めています。

## テスト

```bash
/Users/yuh_y/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/core.test.mjs
```

ブラウザ操作のスモークテストは、ローカルサーバー起動中に実行します。

```bash
/Users/yuh_y/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/smoke-playwright.mjs
```

## 今日の一言

`js/quotes.js` に400件を収録しています。初期データは公開ドメインまたは権利上扱いやすい原典を中心にし、漫画や現代作品の台詞は権利確認済みデータとして追加できる設計にしています。
