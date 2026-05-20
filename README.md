# Journaling Coach

紙の手帳やノートでジャーナリングする人向けの、スマホ補助PWAです。本文は保存せず、プロンプト、タイマー、気分スコア、紙ノートのページコードだけをローカルに残します。

## 目的

- 初心者が白紙で止まらないように、状態別の問いを出す
- 三日坊主を防ぐために、30秒レスキューと「二日空けない」ガードを置く
- 紙ノート運用を崩さないように、記録本文は保存しない
- 週一回だけ見返す流れを作り、反すうを避ける
- 今日 / 型 / 習慣 / 設定の4タブで、スマホ片手操作に寄せる

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

## 参照した主な根拠

- 厚生労働省「今の気持ちを書いてみる」
- NHS Every Mind Matters「Thought record」
- Lally et al. 2010「How are habits formed」
- Apple「UI Design Dos and Don'ts」
- W3C「WCAG 2.2」
- 添付4ファイルの初心者向けテンプレート、習慣化、注意点
