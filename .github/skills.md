# 推奨 Skills 構成（webfocus-svelte-sample）

このプロジェクトで GitHub Copilot を使って開発・保守する際の推奨 Skills 構成です。

## 1) 必須（常用）

### context7
- 用途: 実装前のコンテキスト収集（関連ファイル探索、既存仕様確認、影響範囲把握）
- 使いどころ:
  - `src/api/webfocus.js` の API 実装方針を変更する前
  - `docs/*.md` と実装差分を確認する前
  - 不具合調査で「どこが入口か」を特定したい時
- 運用ルール:
  - 変更前に必ず context7 で現状を確認する
  - 変更後に再度 context7 で関連箇所を見直し、意図しない影響がないか確認する

### awesome-copilot
- 用途: 再利用可能な instruction / prompt / agent を検索して、作業品質と一貫性を上げる
- 使いどころ:
  - 新機能着手時に、類似タスク用の instruction を探す
  - 長い改修の途中で、レビュー観点や手順テンプレートを取り込む
  - ドキュメント整備時に、記述フォーマットを標準化する
- 運用ルール:
  - まず `search_instructions` で候補を絞る
  - 採用する instruction は `load_instruction` で読み込んでから実装する

#### このプロジェクト向けに優先度が高い instruction 候補
- `svelte.instructions.md`（Svelte コンポーネント実装・保守）
- `markdown.instructions.md`（README / docs の記述品質統一）
- `update-docs-on-code-change.instructions.md`（コード変更時のドキュメント追従）
- `github-actions-ci-cd-best-practices.instructions.md`（GitHub Actions 導入時）
- `nodejs-javascript-vitest.instructions.md`（Vitest 導入・拡張時）

## 2) 任意（Azure を使う場合のみ）

このリポジトリは WebFOCUS 連携が主目的ですが、Azure へ展開・監視する場合のみ以下を推奨します。

### azure-deploy
- 用途: Azure へのデプロイ手順整理、構成検討

### azure-diagnostics
- 用途: デプロイ後の障害調査、ログ観点の整理

### azure-observability
- 用途: Azure Monitor / Application Insights を使った可観測性の設計

### appinsights-instrumentation
- 用途: フロントエンド/アプリの計測ポイント設計、テレメトリ導入

## 3) 推奨ワークフロー（実作業時）

1. context7 で現状把握（対象ファイル、依存、仕様差分）
2. awesome-copilot で最適な instruction / agent を探索して取り込む
3. 実装・修正
4. テスト実行（必要に応じて E2E）
5. `npm run deploy` 実行後、`http://localhost/approot/svelte/index.htm` で動作確認
6. ドキュメント更新（README / docs / .github/instructions.md）

## 3.1) 動作確認ツールの選択基準

- 推奨（既定）: MCP Chrome + DevTools
  - REST API レスポンスの実体確認
  - Console エラーと Network の追跡
  - UI 操作と通信結果を同時に検証
- 利用可能（補助）: MCP Playwright
  - 回帰確認の自動化
  - 複数手順の繰り返し検証
  - テストシナリオ化が必要なケース

## 4) このプロジェクト向け最小セット

- 常時有効化推奨: `context7`, `awesome-copilot`
- Azure 利用時のみ追加: `azure-deploy`, `azure-diagnostics`, `azure-observability`, `appinsights-instrumentation`

## 5) 推奨初期設定（そのまま使える形）

- Day 1 で有効化:
  - `context7`
  - `awesome-copilot`（上記 3 instruction を優先適用）
- Azure 展開を開始するタイミングで追加:
  - `azure-deploy`
  - `azure-diagnostics`
  - `azure-observability`
  - `appinsights-instrumentation`

## 6) 任意追加（Svelte / Tailwind）

UI 変更が増える場合に限って、以下の instruction / skill を段階的に追加します。

### Svelte を追加する目安

- `src/components/*.svelte` の改修頻度が高い
- コンポーネント分割・状態連携・イベント設計の見直しが多い
- UI バグ修正よりも構造改善（再利用性、保守性）が主目的

### Tailwind を追加する目安

- `src/app.css` とユーティリティクラス設計を継続的に調整する
- レイアウト崩れ対応やクラス重複整理が頻発する
- デザイン調整の比率が API 改修より高い

### 運用ルール

- まず `context7` で影響範囲（コンポーネント / スタイル / docs）を確認する
- 次に `awesome-copilot` で Svelte / CSS / Tailwind 系 instruction を検索し、必要なものだけ読み込む
- 常時有効化は避け、UI 改修期間だけ有効化する
