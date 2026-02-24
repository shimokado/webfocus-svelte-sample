---
name: webfocus-rest-workflow
description: WebFOCUS REST API 連携の改修・調査向けワークフロー。signOn/get/describeFex/run の影響調査、Svelte UIとStoreの責務分離確認、README/docs追従更新が必要なときに使用する。context7で現状把握し、awesome-copilotでinstructionを選定して進める。
license: Apache-2.0
---

# WebFOCUS REST Workflow Skill

WebFOCUS Svelte サンプルを安全に改修するための実務手順。

## When to Use This Skill

- API エンドポイント実装を変更する
- describeFex のパラメータ抽出ロジックを変更する
- CORS / HTTP メソッド方針の見直しを行う
- UI と Store の責務境界にまたがる修正を行う

## Step-by-Step Workflows

1. `context7` で対象ファイルの関連範囲を調査する。
2. `awesome-copilot` で instruction を検索し、必要なものを読み込む。
3. `src/api/webfocus.js` の変更有無を先に確定する。
4. 必要な UI/Store 変更のみ最小差分で実装する。
5. `npm run deploy` 実行後に `http://localhost/approot/svelte/index.htm` で動作確認する。
6. `README.md` と `docs/` の差分を更新する。

## Verification Tool Selection

- 第一選択: MCP Chrome + DevTools
	- 実レスポンス解析（Network）
	- JavaScript エラー確認（Console）
	- 画面操作と通信結果の突合
- 第二選択: MCP Playwright
	- 回帰テストの反復確認
	- 複数シナリオの自動化

## References

- [チェックリスト](./references/checklist.md)
- [Repository Copilot Instructions](../../copilot-instructions.md)
- [Project Instructions](../../instructions.md)
