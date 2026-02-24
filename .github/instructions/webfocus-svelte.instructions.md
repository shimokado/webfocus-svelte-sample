---
description: 'WebFOCUS + Svelte プロジェクト向けの実装・保守ルール。REST API連携、責務分離、ドキュメント更新を統一する。'
applyTo: '**/*.svelte, **/*.js, **/*.md, docs/**/*.md'
---

# WebFOCUS Svelte 実装ルール

## 実装前チェック

- `context7` を使い、対象変更に関係する `src/api`, `src/components`, `src/stores`, `docs` を確認する。
- API 仕様に関わる変更は `docs/01_REST_API_GUIDE.md` と `README.md` を先に確認する。

## API 層

- WebFOCUS REST API 呼び出しは `src/api/webfocus.js` に集約する。
- `IBIRS_action` ごとの HTTP メソッドは `ACTION_METHODS` を更新して管理する。
- サインインや CSRF トークン処理の既存フローを壊さない。

## UI / Store 層

- UI ロジックは `src/components/*.svelte` に限定する。
- 状態管理は `src/stores/index.js` を中心に行い、API 呼び出しを UI へ直接散在させない。

## 変更後チェック

- 実装後に `context7` で関連箇所を再確認し、副作用がないかを確認する。
- 必要に応じて `awesome-copilot` で `markdown.instructions.md` や `update-docs-on-code-change.instructions.md` を読み込み、ドキュメント反映を行う。
- `npm run deploy` 実行後に `http://localhost/approot/svelte/index.htm` で動作確認する。
- 動作確認ツールは MCP Chrome + DevTools を第一選択とし、回帰自動確認では MCP Playwright も利用可能とする。
